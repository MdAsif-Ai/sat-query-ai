import torch
import numpy as np
from typing import Dict, Any, List, Optional
from PIL import Image
from loguru import logger
from transformers import Sam2Model, Sam2Processor

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings

class SAM2Model(BaseRemoteSensingModel):
    """
    SAM 2 (Segment Anything Model 2) specialist for promptable segmentation.
    Used to generate precise pixel masks from bounding boxes or points.
    """
    
    def __init__(self):
        super().__init__(
            model_name="sam2",
            model_id=settings.SAM2_MODEL,
            device=settings.DEVICE
        )
        self.quantized = False
        
    def load(self):
        """Loads the SAM 2 model and processor in float16."""
        if self.loaded:
            return
            
        logger.info(f"Loading {self.model_id} in float16...")
        
        try:
            self.processor = Sam2Processor.from_pretrained(self.model_id)
            self.model = Sam2Model.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16,
                device_map="auto"
            ).to(self.device)
            
            self.model.eval()
            self.loaded = True
            logger.success("SAM 2 model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load SAM 2: {e}")
            raise

    def estimate_memory(self) -> float:
        # Tiny model is ~150MB on disk, ~400MB in VRAM with overhead
        return 500.0

    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Internal method to handle the actual SAM 2 inference pipeline.
        """
        image: Image.Image = inputs["image"]
        prompt_type: str = inputs["prompt_type"]  # "box" or "point"
        
        # 1. Preprocess inputs based on prompt type
        if prompt_type == "box":
            box: List[float] = inputs["box"]
            # SAM processor expects boxes in the format [[[x1, y1, x2, y2]]]
            sam_inputs = self.processor(
                images=image,
                input_boxes=[[box]],
                return_tensors="pt"
            ).to(device=self.device, dtype=torch.float16)
            
        elif prompt_type == "point":
            point: List[float] = inputs["point"]
            # SAM processor expects points in the format [[[x, y]]] and labels [[[1]]] (1 for foreground)
            sam_inputs = self.processor(
                images=image,
                input_points=[[point]],
                return_tensors="pt"
            ).to(device=self.device, dtype=torch.float16)
        else:
            raise ValueError("Invalid prompt type for SAM 2. Must be 'box' or 'point'.")
            
        # 2. Run Inference
        with torch.no_grad():
            outputs = self.model(**sam_inputs)
            
        # 3. Post-process outputs
        # post_process_masks restores the mask to the original image size
        masks = self.processor.image_processor.post_process_masks(
            outputs.pred_masks.cpu(),
            sam_inputs["original_sizes"].cpu(),
            sam_inputs["reshaped_input_sizes"].cpu()
        )
        
        # masks is a list of tensors. We take the first image's masks.
        # Shape: [num_prompts, 1, H, W] (usually 3 mask candidates per prompt, we take the highest confidence one if available)
        # For simplicity and determinism, we take the first mask candidate.
        if not masks or len(masks) == 0:
            return {
                "binary_mask": np.zeros((image.size[1], image.size[0]), dtype=bool),
                "mask_dimensions": (image.size[1], image.size[0]),
                "area_pixels": 0,
                "bounding_box": None,
                "confidence": None
            }
            
        mask_tensor = masks[0][0, 0, :, :].numpy().astype(bool) # [H, W]
        
        # 4. Calculate Spatial Metadata
        # Find coordinates of True values
        rows, cols = np.where(mask_tensor)
        
        if len(rows) == 0 or len(cols) == 0:
            area_pixels = 0
            bbox = None
        else:
            area_pixels = int(len(rows))
            # Calculate tight bounding box [x1, y1, x2, y2]
            x1, x2 = int(cols.min()), int(cols.max())
            y1, y2 = int(rows.min()), int(rows.max())
            bbox = [x1, y1, x2, y2]
            
        return {
            "binary_mask": mask_tensor,
            "mask_dimensions": mask_tensor.shape,  # (Height, Width)
            "area_pixels": area_pixels,
            "bounding_box": bbox,
            "confidence": None  # SAM does not natively output a 0-1 confidence score in HF API
        }

    def segment_from_box(self, image: Image.Image, box: List[float]) -> Dict[str, Any]:
        """
        Generates a segmentation mask from a bounding box prompt.
        Box format: [x1, y1, x2, y2] in original image pixel coordinates.
        """
        inputs = {"image": image, "prompt_type": "box", "box": box}
        return super().infer(inputs)

    def segment_from_point(self, image: Image.Image, point: List[float]) -> Dict[str, Any]:
        """
        Generates a segmentation mask from a single point prompt.
        Point format: [x, y] in original image pixel coordinates.
        """
        inputs = {"image": image, "prompt_type": "point", "point": point}
        return super().infer(inputs)