import torch
from typing import Dict, Any, List
from PIL import Image
from loguru import logger
from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings
from app.core.exceptions import ModelInferenceFailureError

class GroundingDinoModel(BaseRemoteSensingModel):
    """
    Grounding DINO specialist model for open-set text-guided object localization.
    """
    
    def __init__(self):
        super().__init__(
            model_name="grounding_dino",
            model_id=settings.GROUNDING_DINO_MODEL,
            device=settings.DEVICE
        )
        self.quantized = False
        self.default_box_threshold = 0.25
        self.default_text_threshold = 0.25
        
    def load(self):
        """Loads the Grounding DINO model and processor."""
        if self.loaded:
            return
            
        logger.info(f"Loading {self.model_id}...")
        
        try:
            self.processor = AutoProcessor.from_pretrained(self.model_id)
            self.model = AutoModelForZeroShotObjectDetection.from_pretrained(
                self.model_id
            ).to(self.device)
            
            self.model.eval()
            self.loaded = True
            logger.success("Grounding DINO model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Grounding DINO: {e}")
            raise

    def estimate_memory(self) -> float:
        # Base model is ~750MB in FP16, plus overhead for image tensors
        return 1200.0

    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Internal method to handle the actual Grounding DINO inference pipeline.
        """
        image: Image.Image = inputs["image"]
        text_prompt: str = inputs["text_prompt"]
        box_threshold: float = inputs.get("box_threshold", self.default_box_threshold)
        text_threshold: float = inputs.get("text_threshold", self.default_text_threshold)
        
        if not text_prompt or not isinstance(text_prompt, str):
            raise ModelInferenceFailureError(
                model_name=self.model_name, 
                detail="Invalid or empty text prompt provided."
            )
            
        # 1. Preprocess inputs
        dino_inputs = self.processor(
            images=image, 
            text=text_prompt, 
            return_tensors="pt"
        )
        dino_inputs = {k: v.to(self.device) for k, v in dino_inputs.items()}
        
        # 2. Run Inference
        with torch.no_grad():
            outputs = self.model(**dino_inputs)
            
        # 3. Post-process — transformers 5.x changed box_threshold → threshold
        target_sizes = [image.size[::-1]]
        try:
            results = self.processor.post_process_grounded_object_detection(
                outputs=outputs,
                input_ids=dino_inputs["input_ids"],
                threshold=box_threshold,
                target_sizes=target_sizes
            )[0]
        except TypeError:
            results = self.processor.post_process_grounded_object_detection(
                outputs=outputs,
                input_ids=dino_inputs["input_ids"],
                box_threshold=box_threshold,
                text_threshold=text_threshold,
                target_sizes=target_sizes
            )[0]

        # 4. Format Output
        boxes = results["boxes"].cpu().numpy().tolist()
        scores = results["scores"].cpu().numpy().tolist()
        raw_labels = results["labels"]
        labels = raw_labels if isinstance(raw_labels, list) else raw_labels.cpu().numpy().tolist()

        # Secondary filter by text_threshold
        if text_threshold < box_threshold:
            filtered = [(b, s, l) for b, s, l in zip(boxes, scores, labels) if s >= text_threshold]
            boxes = [x[0] for x in filtered]
            scores = [x[1] for x in filtered]
            labels = [x[2] for x in filtered]

        overall_confidence = max(scores) if scores else 0.0
        
        return {
            "boxes": boxes,
            "scores": scores,
            "labels": labels,
            "image_size": image.size,  # (width, height)
            "model_name": self.model_name,
            "confidence": overall_confidence
        }

    def infer(
        self, 
        image: Image.Image, 
        text_prompt: str, 
        box_threshold: float = 0.25, 
        text_threshold: float = 0.25
    ) -> Dict[str, Any]:
        """
        Safe wrapper for Grounding DINO inference.
        Returns bounding boxes in original image pixel coordinates.
        """
        inputs = {
            "image": image,
            "text_prompt": text_prompt,
            "box_threshold": box_threshold,
            "text_threshold": text_threshold
        }
        return super().infer(inputs)