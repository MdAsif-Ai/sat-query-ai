import os
import torch
import torchvision.transforms as transforms
import numpy as np
import cv2
from typing import Dict, Any, List
from PIL import Image
from loguru import logger

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings
from app.core.exceptions import ModelUnavailableError, ModelInferenceFailureError, InvalidImageError

# Attempt to import Open-CD components
try:
    from mmengine.config import Config
    from mmengine.runner import load_checkpoint
    from opencd.models import build_model
    MMENGINE_AVAILABLE = True
except ImportError:
    MMENGINE_AVAILABLE = False
    logger.warning("Open-CD or mmengine is not installed. Change detection will fail.")

class ChangeModel(BaseRemoteSensingModel):
    """
    Bi-temporal Change Detection specialist using BIT (Bitemporal Image Transformer).
    """
    
    def __init__(self):
        super().__init__(
            model_name="change_model",
            model_id=settings.CHANGE_MODEL,
            device=settings.DEVICE
        )
        self.quantized = False
        self.config_path = os.path.join(settings.MODEL_CACHE_DIR, "bit_levircd.py")
        self.checkpoint_path = os.path.join(settings.MODEL_CACHE_DIR, "bit_levircd.pth")
        
    def load(self):
        """Loads the ChangeFormer/BIT model and processor."""
        if self.loaded:
            return
            
        if not MMENGINE_AVAILABLE:
            raise ModelUnavailableError("Open-CD is not installed. Please run `pip install opencd mmengine mmcv`.")
            
        if not os.path.exists(self.config_path) or not os.path.exists(self.checkpoint_path):
            raise ModelUnavailableError(
                f"BIT model files missing in {settings.MODEL_CACHE_DIR}. "
                "Please download bit_levircd.py and bit_levircd.pth from the Open-CD GitHub repository."
            )
            
        logger.info(f"Loading {self.model_id} (BIT)...")
        
        try:
            cfg = Config.fromfile(self.config_path)
            cfg.model.pretrained = None # Avoid downloading backbone weights separately
            self.model = build_model(cfg.model)
            
            load_checkpoint(self.model, self.checkpoint_path, map_location="cpu")
            self.model = self.model.to(self.device).eval()
            
            self.loaded = True
            logger.success("BIT Change Detection model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load BIT model: {e}")
            raise

    def estimate_memory(self) -> float:
        # BIT is relatively small, ~150MB on disk, ~500MB in VRAM
        return 600.0

    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Internal method to handle the actual change detection pipeline.
        """
        image_t1: Image.Image = inputs["image_t1"]
        image_t2: Image.Image = inputs["image_t2"]
        
        # 1. Validate and align images
        if image_t1.size != image_t2.size:
            logger.warning("T1 and T2 have different spatial dimensions. Resizing T2 to match T1.")
            image_t2 = image_t2.resize(image_t1.size, Image.Resampling.LANCZOS)
            
        original_w, original_h = image_t1.size
        
        # 2. Preprocess (Resize to 256x256, ToTensor, Normalize)
        transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        img_t1 = transform(image_t1).unsqueeze(0).to(self.device)
        img_t2 = transform(image_t2).unsqueeze(0).to(self.device)
        
        # 3. Run Inference
        with torch.no_grad():
            # Open-CD models expect a list of two images [T1, T2]
            outputs = self.model([img_t1, img_t2], mode='predict')
            
        # 4. Post-process outputs
        # outputs[0] typically contains the logits of shape [1, 2, H, W] (change vs no change)
        logits = outputs[0]
        
        if logits.dim() == 4 and logits.shape[1] == 2:
            # Take the "change" channel (index 1)
            change_prob_map = torch.softmax(logits, dim=1)[0, 1, :, :].cpu().numpy()
        else:
            # Fallback if output is already a probability map
            change_prob_map = torch.sigmoid(logits).squeeze().cpu().numpy()
            
        # 5. Resize mask back to original image size
        # Convert to uint8 for OpenCV resize
        change_prob_resized = cv2.resize(change_prob_map, (original_w, original_h), interpolation=cv2.INTER_LINEAR)
        
        binary_mask = (change_prob_resized > 0.5).astype(bool)
        
        # Calculate statistics
        changed_area_ratio = float(np.sum(binary_mask) / binary_mask.size)
        
        # Mean probability of the changed pixels (confidence)
        if np.any(binary_mask):
            change_probability = float(np.mean(change_prob_resized[binary_mask]))
        else:
            change_probability = 0.0
            
        return {
            "change_mask": binary_mask,
            "change_probability": change_probability,
            "changed_area_ratio": changed_area_ratio,
            "image_size": (original_w, original_h),
            "model_name": self.model_name
        }

    def infer(self, image_t1: Image.Image, image_t2: Image.Image) -> Dict[str, Any]:
        """
        Safe wrapper for change detection inference.
        Expects two PIL Images. Returns a binary change mask and statistics.
        """
        if not isinstance(image_t1, Image.Image) or not isinstance(image_t2, Image.Image):
            raise InvalidImageError("Both inputs must be valid PIL Images.")
            
        inputs = {"image_t1": image_t1, "image_t2": image_t2}
        return super().infer(inputs)