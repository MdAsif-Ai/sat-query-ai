import os
import torch
import torchvision.transforms as transforms
import numpy as np
from typing import Dict, Any, List
from PIL import Image
from loguru import logger

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings
from app.core.exceptions import ModelUnavailableError, ModelInferenceFailureError, IncompatibleImagePairError

class FusionModel(BaseRemoteSensingModel):
    """
    Optical + SAR Fusion specialist using the AnySat foundation model.
    """
    
    def __init__(self):
        super().__init__(
            model_name="fusion_model",
            model_id=settings.FUSION_MODEL,
            device=settings.DEVICE
        )
        self.quantized = False
        
    def load(self):
        """Loads the AnySat model using torch.hub."""
        if self.loaded:
            return
            
        logger.info(f"Loading {self.model_id} (AnySat) via torch.hub...")
        
        try:
            # We pass flash_attn=False to avoid requiring the flash-attn package which fails to build
            self.model = torch.hub.load('gastruc/anysat', 'anysat', pretrained=False, trust_repo=True, flash_attn=False).to(self.device).eval()
            
            # Load the checkpoint manually if we have it locally
            checkpoint_path = os.path.join(settings.MODEL_CACHE_DIR, "AnySat.pth")
            if os.path.exists(checkpoint_path):
                state_dict = torch.load(checkpoint_path, map_location=self.device, weights_only=True)
                if 'state_dict' in state_dict:
                    state_dict = state_dict['state_dict']
                self.model.model.load_state_dict(state_dict)
            else:
                logger.warning(f"AnySat checkpoint not found at {checkpoint_path}. Weights may be random.")
                
            self.loaded = True
            logger.success("AnySat Fusion model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load AnySat: {e}")
            raise

    def estimate_memory(self) -> float:
        return 1800.0

    def _prepare_tensors(self, image: Image.Image, modality: str) -> torch.Tensor:
        """Converts PIL Image to tensor with correct size and dimensions for AnySat."""
        if modality == 'spot':
            # Spot expects 3 channels, resolution 1.0. We use 220x220 to avoid OOM
            transform = transforms.Compose([
                transforms.Resize((220, 220)),
                transforms.ToTensor()
            ])
            # [1, 3, 220, 220]
            tensor = transform(image.convert("RGB")).unsqueeze(0).to(self.device)
            return tensor
            
        elif modality == 's1':
            # S1 expects 3 channels, resolution 10.0, and 5D tensor (temporal). 
            # 22x22 at res 10.0 matches the spatial footprint of 220x220 at res 1.0.
            transform = transforms.Compose([
                transforms.Resize((22, 22)),
                transforms.ToTensor()
            ])
            tensor = transform(image.convert("RGB")).unsqueeze(0).to(self.device)
            # Add temporal dimension: [1, 1, 3, 22, 22]
            tensor = tensor.unsqueeze(1)
            return tensor
            
        return None

    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Internal method to handle the AnySat inference pipeline.
        """
        optical_image: Image.Image = inputs["optical_image"]
        sar_image: Image.Image = inputs["sar_image"]
        
        # 1. Validate spatial compatibility (independent of bands)
        if optical_image.size != sar_image.size:
            raise IncompatibleImagePairError("Optical and SAR images must have the exact same spatial dimensions (width, height).")
            
        # 2. Preprocess Inputs
        opt_tensor = self._prepare_tensors(optical_image, 'spot')
        sar_tensor = self._prepare_tensors(sar_image, 's1')
        sar_dates = torch.tensor([[1]]).to(self.device) # Dummy DOY
        
        # 3. Run Inference (Forward pass)
        with torch.no_grad():
            outputs = self.model({
                'spot': opt_tensor,
                's1': sar_tensor,
                's1_dates': sar_dates
            }, patch_size=10, output='dense')
            
        # 4. Process Outputs
        # Output shape is [1, 22, 22, 1536] (dense features)
        global_embedding = torch.mean(outputs, dim=(1, 2)).cpu().numpy().flatten().tolist()
        embedding_dim = outputs.shape[-1]
        patch_shape = [outputs.shape[1], outputs.shape[2]]
            
        return {
            "fused": True,
            "embedding_dimension": embedding_dim,
            "global_embedding_sample": global_embedding[:10],  # First 10 values for debug/display
            "patch_shape": patch_shape,
            "model_name": self.model_name,
            "message": "Successfully extracted joint multimodal features using AnySat."
        }

    def infer(self, optical_image: Image.Image, sar_image: Image.Image) -> Dict[str, Any]:
        """
        Safe wrapper for Optical + SAR fusion inference.
        """
        inputs = {"optical_image": optical_image, "sar_image": sar_image}
        return super().infer(inputs)