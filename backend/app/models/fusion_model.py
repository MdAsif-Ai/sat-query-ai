import os
import sys
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
import numpy as np
from typing import Dict, Any, List
from PIL import Image
from loguru import logger

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings
from app.core.exceptions import ModelUnavailableError, ModelInferenceFailureError, IncompatibleImagePairError

# Add AnySat directory to sys path (Assumes AnySat repo is cloned into the models directory)
ANYSAT_REPO_PATH = os.path.join(settings.MODEL_CACHE_DIR, "AnySat")
if ANYSAT_REPO_PATH not in sys.path:
    sys.path.append(ANYSAT_REPO_PATH)

# Attempt to import AnySat
try:
    from model import AnySat
    ANYSAT_AVAILABLE = True
except ImportError:
    ANYSAT_AVAILABLE = False
    logger.warning("AnySat repository not found or failed to import. Please clone https://github.com/gastruc/AnySat into the models directory.")

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
        """Loads the AnySat model."""
        if self.loaded:
            return
            
        if not ANYSAT_AVAILABLE:
            raise ModelUnavailableError("AnySat code is not available. Please clone the repository.")
            
        logger.info(f"Loading {self.model_id} (AnySat)...")
        
        try:
            # AnySat provides a builder method
            self.model = AnySat.build_model().to(self.device).eval()
            self.loaded = True
            logger.success("AnySat Fusion model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load AnySat: {e}")
            raise

    def estimate_memory(self) -> float:
        return 1800.0

    def _prepare_tensors(self, image: Image.Image, target_bands: int) -> torch.Tensor:
        """Converts PIL Image to tensor and ensures it has the correct number of bands."""
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])
        
        # PIL Image opened as RGB has 3 bands.
        tensor = transform(image).unsqueeze(0).to(self.device) # Shape: [1, 3, 224, 224]
        
        # AnySat Optical expects 4 bands (R,G,B,NIR). We duplicate the Red band as a dummy NIR band.
        if target_bands == 4 and tensor.shape[1] == 3:
            dummy_nir = tensor[:, 0:1, :, :] 
            tensor = torch.cat([tensor, dummy_nir], dim=1)
            
        # AnySat SAR expects 2 bands (VV, VH). We duplicate the single band if we only have 1, or take first 2.
        elif target_bands == 2 and tensor.shape[1] == 3:
            tensor = tensor[:, 0:2, :, :]
            
        return tensor

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
        # Optical: Expects 4 bands (R,G,B,NIR)
        opt_tensor = self._prepare_tensors(optical_image, target_bands=4)
        # SAR: Expects 2 bands (VV, VH)
        sar_tensor = self._prepare_tensors(sar_image, target_bands=2)
        
        # 3. Run Inference (Forward pass)
        with torch.no_grad():
            # AnySat's forward_features returns a dictionary of embeddings
            outputs = self.model.forward_features({"optical": opt_tensor, "sar": sar_tensor})
            
        # 4. Process Outputs
        # AnySat provides a global representation (embedding) and patch-level features
        # We extract these to provide structured evidence for downstream LLM reasoning.
        fused_embeddings = outputs.get("x", None) # Patch tokens
        cls_token = outputs.get("cls_token", None) # Global representation
        
        if fused_embeddings is not None:
            # Calculate mean embedding for a condensed global representation
            global_embedding = torch.mean(fused_embeddings, dim=1).cpu().numpy().flatten().tolist()
            embedding_dim = fused_embeddings.shape[-1]
            patch_shape = fused_embeddings.shape[1:3] if fused_embeddings.dim() == 4 else None
        else:
            global_embedding = []
            embedding_dim = 0
            patch_shape = None
            
        return {
            "fused": True,
            "embedding_dimension": embedding_dim,
            "global_embedding_sample": global_embedding[:10],  # First 10 values for debug/display
            "patch_shape": list(patch_shape) if patch_shape else None,
            "model_name": self.model_name,
            "message": "Successfully extracted joint multimodal features. Semantic classification requires a downstream task head not present in the base foundation model."
        }

    def infer(self, optical_image: Image.Image, sar_image: Image.Image) -> Dict[str, Any]:
        """
        Safe wrapper for Optical + SAR fusion inference.
        """
        inputs = {"optical_image": optical_image, "sar_image": sar_image}
        return super().infer(inputs)