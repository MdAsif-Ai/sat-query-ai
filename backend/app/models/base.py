import gc
import torch
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from loguru import logger

from app.core.config import settings
from app.core.exceptions import ModelUnavailableError, ModelInferenceFailureError, GPUMemoryError
from app.schemas.models import ModelInfo, ModelStatus

def clear_gpu_memory():
    """Aggressively clears Python garbage collector and CUDA caches."""
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()
        logger.debug("Cleared GPU memory cache.")

class BaseRemoteSensingModel(ABC):
    """
    Abstract base class for all remote sensing specialist models.
    Enforces lazy loading, structured metadata, and safe VRAM management.
    """
    
    def __init__(self, model_name: str, model_id: str, device: str = "cuda"):
        self.model_name = model_name
        self.model_id = model_id
        self.device = device
        self.loaded = False
        self.model: Optional[Any] = None
        self.processor: Optional[Any] = None
        
    @abstractmethod
    def load(self):
        """
        Explicitly loads the model and processor into memory.
        Must set self.loaded = True upon success.
        """
        raise NotImplementedError

    def unload(self):
        """
        Moves the model off the GPU and aggressively clears VRAM.
        """
        if not self.loaded:
            return
            
        logger.info(f"Unloading model '{self.model_name}' from {self.device}...")
        
        # Delete references
        if self.model is not None:
            del self.model
        if self.processor is not None:
            del self.processor
            
        self.model = None
        self.processor = None
        self.loaded = False
        
        # Force memory release
        clear_gpu_memory()
        logger.info(f"Model '{self.model_name}' unloaded successfully.")

    def is_loaded(self) -> bool:
        """Returns whether the model is currently loaded in memory."""
        return self.loaded

    @abstractmethod
    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Concrete implementation of the inference logic.
        Must be implemented by subclasses.
        """
        raise NotImplementedError

    def infer(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Safely wraps the _run_inference method with exception handling.
        Ensures no tensors are left on GPU upon failure.
        """
        if not self.loaded or self.model is None:
            raise ModelUnavailableError(self.model_name)
            
        try:
            logger.debug(f"Running inference with '{self.model_name}'...")
            outputs = self._run_inference(inputs)
            return outputs
            
        except torch.cuda.OutOfMemoryError as e:
            logger.error(f"GPU VRAM exhausted during '{self.model_name}' inference: {e}")
            # Attempt emergency cleanup
            self.unload()
            raise GPUMemoryError(f"Insufficient VRAM for {self.model_name}. Consider reducing image size.") from e
            
        except Exception as e:
            logger.error(f"Inference failed for '{self.model_name}': {e}")
            # Clean up any partial tensors
            clear_gpu_memory()
            raise ModelInferenceFailureError(model_name=self.model_name, detail=str(e)) from e

    @abstractmethod
    def estimate_memory(self) -> float:
        """Estimates the VRAM (in MB) required to run this model."""
        raise NotImplementedError

    def health(self) -> ModelStatus:
        """Reports the current health/status of the model."""
        if self.loaded:
            return ModelStatus.LOADED
        return ModelStatus.UNLOADED

    def get_metadata(self) -> ModelInfo:
        """Returns structured metadata about the model."""
        return ModelInfo(
            model_name=self.model_name,
            task_type=self.__class__.__name__.replace("Model", ""),
            device=self.device,
            quantized=getattr(self, 'quantized', False)
        )