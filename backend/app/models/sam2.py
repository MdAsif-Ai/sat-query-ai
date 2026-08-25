import torch
import numpy as np
from typing import Dict, Any, List
from PIL import Image
from loguru import logger
from transformers import Sam2Model, Sam2Processor

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings

class SAM2Model(BaseRemoteSensingModel):
    def __init__(self):
        super().__init__(
            model_name="sam2",
            model_id="facebook/sam2-hiera-tiny",
            device=settings.DEVICE
        )
        self.quantized = False
        
    def load(self):
        if self.loaded:
            return
        logger.info(f"Loading {self.model_id} using HuggingFace Transformers...")
        try:
            self.processor = Sam2Processor.from_pretrained(self.model_id)
            self.model = Sam2Model.from_pretrained(self.model_id, torch_dtype=torch.float16, device_map="auto").eval()
            self.loaded = True
            logger.success("SAM 2 model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load SAM 2: {e}")
            raise

    def unload(self):
        if hasattr(self, 'processor'):
            del self.processor
        super().unload()

    def estimate_memory(self) -> float:
        return 500.0

    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        image: Image.Image = inputs["image"]
        prompt_type: str = inputs["prompt_type"]
        
        if prompt_type == "box":
            box: List[float] = inputs["box"]
            sam_inputs = self.processor(images=image, input_boxes=[[box]], return_tensors="pt").to(device=self.device, dtype=torch.float16)
        elif prompt_type == "point":
            point: List[float] = inputs["point"]
            sam_inputs = self.processor(images=image, input_points=[[point]], return_tensors="pt").to(device=self.device, dtype=torch.float16)
        else:
            raise ValueError("Invalid prompt type")
            
        with torch.no_grad():
            outputs = self.model(**sam_inputs)
            
        masks = self.processor.image_processor.post_process_masks(
            outputs.pred_masks.cpu(), sam_inputs["original_sizes"].cpu(), sam_inputs["reshaped_input_sizes"].cpu()
        )
        
        mask_tensor = masks[0][0, 0, :, :].numpy().astype(bool)
        rows, cols = np.where(mask_tensor)
        if len(rows) == 0 or len(cols) == 0:
            area_pixels = 0
            bbox = None
        else:
            area_pixels = int(len(rows))
            x1, x2 = int(cols.min()), int(cols.max())
            y1, y2 = int(rows.min()), int(rows.max())
            bbox = [x1, y1, x2, y2]
            
        return {
            "binary_mask": mask_tensor, "mask_dimensions": mask_tensor.shape,
            "area_pixels": area_pixels, "bounding_box": bbox,
            "confidence": None
        }

    def segment_from_box(self, image: Image.Image, box: List[float]) -> Dict[str, Any]:
        inputs = {"image": image, "prompt_type": "box", "box": box}
        return super().infer(inputs)

    def segment_from_point(self, image: Image.Image, point: List[float]) -> Dict[str, Any]:
        inputs = {"image": image, "prompt_type": "point", "point": point}
        return super().infer(inputs)