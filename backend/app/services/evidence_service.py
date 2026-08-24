import os
import uuid
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from typing import List, Tuple, Optional, Dict, Any
from loguru import logger

from app.core.config import settings

class EvidenceService:
    """
    Generates visual evidence artifacts (overlays, masks, comparisons) for the UI.
    Preserves original images and saves artifacts to a configured directory.
    """

    def __init__(self):
        self.output_dir = os.path.join(settings.STORAGE_DIR, "evidence")
        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f"EvidenceService initialized. Output dir: {self.output_dir}")

    def _get_font(self, size: int = 20):
        """Helper to safely load a font, falling back to default if necessary."""
        try:
            # Common Linux/Colab font path
            return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
        except IOError:
            try:
                # Common macOS font path
                return ImageFont.truetype("/Library/Fonts/Arial Bold.ttf", size)
            except IOError:
                return ImageFont.load_default()

    def _save_artifact(self, image: Image.Image, prefix: str = "artifact") -> str:
        """Saves a PIL image to the output directory and returns the relative URL path."""
        filename = f"{prefix}_{uuid.uuid4().hex}.png"
        filepath = os.path.join(self.output_dir, filename)
        image.save(filepath)
        # Return a URL-friendly relative path for the FastAPI backend to serve
        return f"/storage/evidence/{filename}"

    def draw_bounding_boxes(
        self, 
        image: Image.Image, 
        boxes: List[Tuple[float, float, float, float]], 
        labels: Optional[List[str]] = None, 
        scores: Optional[List[float]] = None
    ) -> str:
        """Overlays bounding boxes on a copy of the image."""
        img_copy = image.convert("RGB").copy()
        draw = ImageDraw.Draw(img_copy)
        font = self._get_font(size=15)

        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = map(int, box)
            
            # Draw rectangle
            draw.rectangle([x1, y1, x2, y2], outline=(255, 0, 0), width=3)
            
            # Prepare label text
            label = labels[i] if labels else "Object"
            if scores and i < len(scores):
                label += f" ({scores[i]:.2f})"
            
            # Draw text background and text
            text_bbox = draw.textbbox((x1, y1), label, font=font)
            draw.rectangle([text_bbox[0], text_bbox[1], text_bbox[2], text_bbox[3]], fill=(255, 0, 0))
            draw.text((x1, y1), label, fill=(255, 255, 255), font=font)

        return self._save_artifact(img_copy, "bbox_overlay")

    def overlay_segmentation_mask(
        self, 
        image: Image.Image, 
        mask: np.ndarray, 
        color: Tuple[int, int, int] = (0, 255, 0), 
        alpha: float = 0.5
    ) -> str:
        """Blends a binary segmentation mask over a copy of the image."""
        img_array = np.array(image.convert("RGB"))
        
        # Ensure mask is boolean or 0/1
        binary_mask = mask.astype(bool)
        
        # Create an RGB mask
        colored_mask = np.zeros_like(img_array)
        colored_mask[binary_mask] = color
        
        # Blend using OpenCV
        blended = cv2.addWeighted(img_array, 1 - alpha, colored_mask, alpha, 0)
        blended_pil = Image.fromarray(blended)
        
        return self._save_artifact(blended_pil, "mask_overlay")

    def visualize_change(
        self, 
        image_t1: Image.Image, 
        image_t2: Image.Image, 
        change_mask: np.ndarray, 
        color: Tuple[int, int, int] = (255, 0, 0), 
        alpha: float = 0.6
    ) -> str:
        """Creates a before/after comparison with the change mask overlaid on the T2 image."""
        t1_array = np.array(image_t1.convert("RGB"))
        t2_array = np.array(image_t2.convert("RGB"))
        binary_mask = change_mask.astype(bool)
        
        # Overlay mask on T2
        colored_mask = np.zeros_like(t2_array)
        colored_mask[binary_mask] = color
        t2_highlighted = cv2.addWeighted(t2_array, 1 - alpha, colored_mask, alpha, 0)
        
        # Concatenate T1 and highlighted T2 side-by-side
        combined = np.hstack((t1_array, t2_highlighted))
        combined_pil = Image.fromarray(combined)
        
        return self._save_artifact(combined_pil, "change_comparison")

    def create_side_by_side(
        self, 
        image_1: Image.Image, 
        image_2: Image.Image, 
        label1: str = "Optical", 
        label2: str = "SAR"
    ) -> str:
        """Creates a side-by-side comparison image with labels (e.g., Optical vs SAR)."""
        img1 = image_1.convert("RGB").copy()
        img2 = image_2.convert("RGB").copy()
        
        # Ensure both are same size for clean concatenation
        h1, w1 = img1.size[::-1]
        h2, w2 = img2.size[::-1]
        if h1 != h2 or w1 != w2:
            img2 = img2.resize((w1, h1), Image.Resampling.LANCZOS)

        draw1 = ImageDraw.Draw(img1)
        draw2 = ImageDraw.Draw(img2)
        font = self._get_font(size=25)
        
        draw1.text((10, 10), label1, fill=(255, 255, 0), font=font)
        draw2.text((10, 10), label2, fill=(255, 255, 0), font=font)
        
        combined = np.hstack((np.array(img1), np.array(img2)))
        combined_pil = Image.fromarray(combined)
        
        return self._save_artifact(combined_pil, "side_by_side")

    def annotate_confidence(self, image: Image.Image, confidence: float, task: str = "Task") -> str:
        """Adds a confidence watermark/annotation to the top corner of the image."""
        img_copy = image.convert("RGB").copy()
        draw = ImageDraw.Draw(img_copy)
        font = self._get_font(size=20)
        
        text = f"{task} | Confidence: {confidence:.2%}"
        draw.text((10, 10), text, fill=(0, 255, 0), font=font)
        
        return self._save_artifact(img_copy, "confidence_annotated")

# Singleton instance
evidence_service = EvidenceService()