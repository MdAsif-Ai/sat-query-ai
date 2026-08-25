from typing import List, Dict, Any
from loguru import logger

from app.schemas.analysis import ImageMetadata
from app.schemas.enums import Modality, TaskType
from app.core.exceptions import (
    IncompatibleImagePairError, 
    InvalidImageError, 
    UnsupportedFormatError
)

class ValidationAgent:
    """
    Validates uploaded image metadata against the required task constraints.
    Does NOT perform model inference. Only checks deterministic geospatial and structural rules.
    """
    
    def validate(self, images: List[ImageMetadata], task_type: TaskType) -> Dict[str, Any]:
        """
        Validates the list of images based on the determined task type.
        
        Args:
            images: List of ImageMetadata objects extracted by the ImageService.
            task_type: The task type determined by the QueryAgent.
            
        Returns:
            A structured dictionary containing validation status, errors, and relationship info.
        """
        errors = []
        is_valid = True
        relationship = "unknown"

        # 1. Validate Image Count
        if task_type in [TaskType.SINGLE_VQA, TaskType.CAPTION, TaskType.GROUNDING, TaskType.SEGMENTATION]:
            if len(images) != 1:
                errors.append(f"Task '{task_type.value}' requires exactly 1 image, but received {len(images)}.")
                is_valid = False
            else:
                relationship = "single_image"
                
        elif task_type in [TaskType.CHANGE_DETECTION, TaskType.CHANGE_VQA, TaskType.OPTICAL_SAR_ANALYSIS]:
            if len(images) != 2:
                errors.append(f"Task '{task_type.value}' requires exactly 2 images, but received {len(images)}.")
                is_valid = False
            else:
                # 2. Validate Pairs (Spatial and Modality)
                img1, img2 = images[0], images[1]
                
                # Check dimensions
                if img1.width != img2.width or img1.height != img2.height:
                    errors.append(f"Spatial dimensions mismatch: Image 1 is {img1.width}x{img1.height}, Image 2 is {img2.width}x{img2.height}.")
                    is_valid = False
                    
                # Check CRS and Bounds (if GeoTIFF metadata is available)
                if img1.crs and img2.crs:
                    if img1.crs != img2.crs:
                        errors.append(f"CRS mismatch: Image 1 is '{img1.crs}', Image 2 is '{img2.crs}'.")
                        is_valid = False
                    if img1.bounds and img2.bounds and img1.bounds != img2.bounds:
                        errors.append(f"Geographic bounds mismatch. Images must cover the exact same area.")
                        is_valid = False
                        
                # Check Modality Compatibility based on Task
                if task_type == TaskType.OPTICAL_SAR_ANALYSIS:
                    relationship = "cross_modal"
                    # One must be Optical/Multispectral, the other must be SAR
                    modalities = {img1.modality, img2.modality}
                    valid_optical = Modality.OPTICAL in modalities or Modality.MULTISPECTRAL in modalities
                    valid_sar = Modality.SAR in modalities
                    
                    if not (valid_optical and valid_sar):
                        errors.append(f"Optical+SAR analysis requires one Optical/Multispectral image and one SAR image. Received: {[img1.modality.value, img2.modality.value]}")
                        is_valid = False
                        
                elif task_type in [TaskType.CHANGE_DETECTION, TaskType.CHANGE_VQA]:
                    relationship = "bi_temporal"
                    # Modalities should match (e.g., Optical + Optical, or SAR + SAR)
                    if img1.modality != img2.modality:
                        errors.append(f"Bi-temporal analysis requires images of the same modality. Received: {img1.modality.value} and {img2.modality.value}.")
                        is_valid = False

        else:
            errors.append(f"Unknown or unsupported task type: {task_type}")
            is_valid = False

        if not is_valid:
            logger.warning(f"Validation failed for task '{task_type.value}': {errors}")
        else:
            logger.success(f"Validation passed for task '{task_type.value}'. Relationship: {relationship}.")

        return {
            "is_valid": is_valid,
            "errors": errors,
            "relationship": relationship if is_valid else "invalid",
            "task_type": task_type
        }

# Singleton instance
validation_agent = ValidationAgent()