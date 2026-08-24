import os
import math
import mimetypes
from typing import List, Tuple, Optional, Generator
from PIL import Image
import rasterio
from rasterio.windows import Window
import numpy as np
from loguru import logger
from pydantic import BaseModel

from app.core.config import settings
from app.core.exceptions import InvalidImageError, UnsupportedFormatError
from app.schemas.analysis import ImageMetadata, Modality

class ProcessedImage(BaseModel):
    """
    Structured object holding the model-ready image and its original geospatial metadata.
    """
    pil_image: Image.Image  # The model-ready RGB PIL image
    metadata: ImageMetadata
    file_path: str          # Path to the original file on disk

class ImageService:
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}
    ALLOWED_MIMETYPES = {"image/jpeg", "image/png", "image/tiff"}

    def validate_image(self, file_path: str, filename: str) -> bool:
        """Validates file extension, MIME type, size, and corruption."""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise UnsupportedFormatError(f"File extension '{ext}' is not supported.")

        mimetype, _ = mimetypes.guess_type(filename)
        if mimetype and mimetype not in self.ALLOWED_MIMETYPES:
            raise UnsupportedFormatError(f"MIME type '{mimetype}' is not supported.")

        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if file_size_mb > settings.MAX_IMAGE_SIZE_MB:
            raise InvalidImageError(f"File size {file_size_mb:.2f}MB exceeds limit of {settings.MAX_IMAGE_SIZE_MB}MB.")

        try:
            if ext in [".tif", ".tiff"]:
                with rasterio.open(file_path) as src:
                    if src.width == 0 or src.height == 0:
                        raise InvalidImageError("Image has zero dimensions.")
            else:
                with Image.open(file_path) as img:
                    img.verify()  # Check for corruption
        except Exception as e:
            raise InvalidImageError(f"Corrupted or invalid image file: {str(e)}")

        logger.info(f"Image '{filename}' validated successfully.")
        return True

    def extract_metadata(self, file_path: str, filename: str) -> ImageMetadata:
        """Extracts geospatial and structural metadata from the image."""
        ext = os.path.splitext(filename)[1].lower()
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        image_id = os.path.splitext(filename)[0]

        if ext in [".tif", ".tiff"]:
            try:
                with rasterio.open(file_path) as src:
                    bounds = list(src.bounds)
                    resolution = src.res[0] if src.res else None
                    modality = self.detect_modality(src.count, src.dtypes[0] if src.dtypes else None)
                    
                    return ImageMetadata(
                        image_id=image_id,
                        filename=filename,
                        modality=modality,
                        width=src.width,
                        height=src.height,
                        bands=src.count,
                        crs=src.crs.to_string() if src.crs else None,
                        bounds=bounds,
                        resolution=resolution,
                        size_mb=file_size_mb
                    )
            except Exception as e:
                logger.warning(f"Failed to read GeoTIFF metadata as raster, falling back to PIL: {e}")

        # Fallback for JPEG/PNG or corrupted TIFFs
        with Image.open(file_path) as img:
            bands = len(img.getbands())
            return ImageMetadata(
                image_id=image_id,
                filename=filename,
                modality=Modality.OPTICAL if bands >= 3 else Modality.UNKNOWN,
                width=img.width,
                height=img.height,
                bands=bands,
                crs=None,
                bounds=None,
                resolution=None,
                size_mb=file_size_mb
            )

    def detect_modality(self, band_count: int, dtype: str) -> Modality:
        """Heuristic to detect modality based on bands and dtype."""
        if band_count == 1 and dtype and 'float' in dtype.lower():
            return Modality.SAR  # SAR is often single-band float32 backscatter
        elif band_count >= 4:
            return Modality.MULTISPECTRAL  # e.g., R,G,B,NIR
        elif band_count == 3:
            return Modality.OPTICAL
        return Modality.UNKNOWN

    def prepare_rgb(self, file_path: str, metadata: ImageMetadata) -> Image.Image:
        """
        Converts any supported image to a standard RGB PIL Image for VLMs.
        For GeoTIFFs, extracts the first 3 bands (assuming R,G,B) and normalizes.
        """
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext in [".tif", ".tiff"]:
            try:
                with rasterio.open(file_path) as src:
                    # Read first 3 bands (or fewer if not available)
                    bands_to_read = min(src.count, 3)
                    data = []
                    for i in range(1, bands_to_read + 1):
                        band = src.read(i)
                        # Normalize to 0-255 for PIL
                        band = ((band - band.min()) / (band.max() - band.min() + 1e-6) * 255).astype(np.uint8)
                        data.append(band)
                    
                    if bands_to_read == 1:
                        # If single band (like SAR), duplicate to make RGB
                        data = [data[0], data[0], data[0]]
                    elif bands_to_read == 2:
                        data.append(data[1]) # Fallback
                    
                    rgb_array = np.dstack(data)
                    pil_image = Image.fromarray(rgb_array, 'RGB')
                    logger.info("Successfully converted GeoTIFF to RGB PIL Image.")
                    return pil_image
            except Exception as e:
                logger.warning(f"Failed to process GeoTIFF with rasterio, trying PIL: {e}")
        
        # Standard PIL fallback
        with Image.open(file_path) as img:
            return img.convert("RGB")

    def resize_for_model(self, pil_image: Image.Image) -> Image.Image:
        """Resizes image while preserving aspect ratio if it exceeds MAX_IMAGE_DIMENSION."""
        max_dim = settings.MAX_IMAGE_DIMENSION
        w, h = pil_image.size
        
        if max(w, h) <= max_dim:
            return pil_image
            
        if w >= h:
            new_w = max_dim
            new_h = int(h * (max_dim / w))
        else:
            new_h = max_dim
            new_w = int(w * (max_dim / h))
            
        resized_img = pil_image.resize((new_w, new_h), Image.Resampling.LANCZOS)
        logger.info(f"Resized image from {w}x{h} to {new_w}x{new_h} for model input.")
        return resized_img

    def create_tiles(self, pil_image: Image.Image, tile_size: int = 1024, overlap: int = 64) -> List[Image.Image]:
        """Creates overlapping tiles for large images to feed into models piece-by-piece."""
        w, h = pil_image.size
        if w <= tile_size and h <= tile_size:
            return [pil_image]

        tiles = []
        step = tile_size - overlap
        
        for y in range(0, h, step):
            for x in range(0, w, step):
                # Ensure we don't exceed bounds
                right = min(x + tile_size, w)
                bottom = min(y + tile_size, h)
                # Adjust crop box
                box = (x, y, right, bottom)
                tile = pil_image.crop(box)
                tiles.append(tile)
                
        logger.info(f"Image split into {len(tiles)} tiles of max {tile_size}x{tile_size}.")
        return tiles

    def prepare_multiband(self, file_path: str) -> np.ndarray:
        """Loads raw multiband data for models that require it (e.g., AnySat fusion)."""
        try:
            with rasterio.open(file_path) as src:
                # Read all bands
                data = src.read()  # Shape: (Bands, H, W)
                logger.info(f"Loaded multiband array of shape {data.shape}.")
                return data
        except Exception as e:
            raise InvalidImageError(f"Failed to load multiband array from {file_path}: {str(e)}")

    def process_image(self, file_path: str, filename: str) -> ProcessedImage:
        """End-to-end pipeline to validate, extract metadata, and prepare RGB for models."""
        self.validate_image(file_path, filename)
        metadata = self.extract_metadata(file_path, filename)
        
        pil_image = self.prepare_rgb(file_path, metadata)
        pil_image = self.resize_for_model(pil_image)
        
        return ProcessedImage(
            pil_image=pil_image,
            metadata=metadata,
            file_path=file_path
        )

# Singleton instance
image_service = ImageService()