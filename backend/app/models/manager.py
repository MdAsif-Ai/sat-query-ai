import asyncio
import time
import torch
from typing import Dict, List, Optional
from loguru import logger

from app.core.config import settings
from app.core.exceptions import ModelUnavailableError, GPUMemoryError
from app.models.base import BaseRemoteSensingModel, clear_gpu_memory
from app.schemas.models import ModelInfo, ModelStatus

# Import concrete model classes (to be implemented in subsequent files)
from app.models.geochat import GeoChatModel
from app.models.grounding_dino import GroundingDinoModel
from app.models.sam2 import SAM2Model
from app.models.change_model import ChangeModel
from app.models.fusion_model import FusionModel
from app.models.external_vlm import ExternalVLM

class ModelManager:
    """
    Manages the lifecycle of all AI models.
    Enforces lazy loading, mutual exclusion during loading, and LRU-based VRAM management.
    """
    
    def __init__(self):
        # Instantiate wrappers without loading weights
        self._registry: Dict[str, BaseRemoteSensingModel] = {
            "geochat": GeoChatModel(),
            "grounding_dino": GroundingDinoModel(),
            "sam2": SAM2Model(),
            "change_model": ChangeModel(),
            "fusion_model": FusionModel(),
            "external_vlm": ExternalVLM()
        }
        
        # Asynchronous locks to prevent concurrent loading of the same model
        self._locks: Dict[str, asyncio.Lock] = {name: asyncio.Lock() for name in self._registry.keys()}
        
        # Track last access time for LRU eviction
        self._last_used: Dict[str, float] = {name: 0.0 for name in self._registry.keys()}
        
        logger.info("ModelManager initialized. Models are registered but not yet loaded.")

    def get_gpu_status(self) -> Dict[str, float]:
        """Returns current GPU memory statistics in MB."""
        if not torch.cuda.is_available():
            return {"total_mb": 0.0, "used_mb": 0.0, "free_mb": 0.0, "utilization_pct": 0.0}
            
        props = torch.cuda.get_device_properties(0)
        total_mb = props.total_memory / (1024 ** 2)
        allocated_mb = torch.cuda.memory_allocated() / (1024 ** 2)
        reserved_mb = torch.cuda.memory_reserved() / (1024 ** 2)
        free_mb = total_mb - allocated_mb
        
        return {
            "total_mb": total_mb,
            "used_mb": allocated_mb,
            "reserved_mb": reserved_mb,
            "free_mb": free_mb,
            "utilization_pct": (allocated_mb / total_mb) * 100 if total_mb > 0 else 0.0
        }

    def _free_up_vram(self, target_model_name: str) -> bool:
        """
        LRU Strategy: Unloads the least recently used model to free up VRAM.
        Skips the target model we are trying to load.
        """
        # Find loaded models excluding the target
        loaded_models = [
            name for name, model in self._registry.items() 
            if model.is_loaded() and name != target_model_name
        ]
        
        if not loaded_models:
            logger.warning("No models available to unload for VRAM cleanup.")
            return False
            
        # Sort by last used time (oldest first)
        loaded_models.sort(key=lambda name: self._last_used[name])
        
        # Unload the oldest one
        victim = loaded_models[0]
        logger.warning(f"VRAM low. Unloading LRU model: '{victim}' to make space for '{target_model_name}'.")
        self._registry[victim].unload()
        return True

    async def load_model(self, name: str):
        """Explicitly loads a model into VRAM with OOM handling and retry logic."""
        if name not in self._registry:
            raise ModelUnavailableError(f"Model '{name}' is not registered in the ModelManager.")
            
        model = self._registry[name]
        
        if model.is_loaded():
            self._last_used[name] = time.time()
            return

        async with self._locks[name]:
            # Double check after acquiring lock
            if model.is_loaded():
                model.status = ModelStatus.LOADED
                self._last_used[name] = time.time()
                return
                 
            logger.info(f"Acquired lock. Loading model: {name}")
            model.status = ModelStatus.LOADING
            model.error_message = None
            
            # Estimate memory and check if we need to free up space
            required_mb = model.estimate_memory()
            gpu_status = self.get_gpu_status()
            available_mb = gpu_status["free_mb"]
            
            if available_mb < required_mb:
                logger.warning(f"Insufficient VRAM ({available_mb:.2f}MB < {required_mb:.2f}MB). Initiating cleanup.")
                freed = self._free_up_vram(name)
                
                if not freed:
                    model.status = ModelStatus.UNAVAILABLE
                    model.error_message = f"Insufficient VRAM. Required: {required_mb}MB, Available: {available_mb}MB"
                    raise GPUMemoryError(f"Cannot load {name}. No models available to unload. Required: {required_mb}MB, Available: {available_mb}MB")
                    
                # Recheck memory after cleanup
                clear_gpu_memory()
                gpu_status = self.get_gpu_status()
                available_mb = gpu_status["free_mb"]
                if available_mb < required_mb:
                    model.status = ModelStatus.UNAVAILABLE
                    model.error_message = f"Insufficient VRAM after cleanup. Required: {required_mb}MB, Available: {available_mb}MB"
                    raise GPUMemoryError(f"Still insufficient VRAM after cleanup for {name}. Required: {required_mb}MB, Available: {available_mb}MB")
 
            # Attempt to load
            try:
                model.load()
                model.status = ModelStatus.LOADED
                self._last_used[name] = time.time()
                logger.success(f"Successfully loaded model: {name}")
            except torch.cuda.OutOfMemoryError as e:
                logger.error(f"CUDA OOM during explicit load of {name}: {e}")
                clear_gpu_memory()
                # Try one more desperate cleanup and fail gracefully
                self._free_up_vram(name)
                try:
                    model.load()
                    model.status = ModelStatus.LOADED
                    self._last_used[name] = time.time()
                    logger.success(f"Successfully loaded model: {name} after OOM retry")
                except Exception as e2:
                    model.status = ModelStatus.FAILED
                    model.error_message = f"CUDA OOM: {str(e2)}"
                    raise GPUMemoryError(f"Failed to load {name} even after aggressive cleanup: {e2}") from e2
            except Exception as e:
                model.status = ModelStatus.FAILED
                model.error_message = str(e)
                logger.error(f"Failed to load model {name}: {e}")
                raise ModelUnavailableError(name) from e

    async def get_model(self, name: str) -> BaseRemoteSensingModel:
        """
        Retrieves a model, ensuring it is loaded.
        This is the primary method used by the Agent during execution.
        """
        await self.load_model(name)
        return self._registry[name]

    def release_model(self, name: str):
        """Manually unloads a specific model."""
        if name in self._registry and self._registry[name].is_loaded():
            self._registry[name].unload()

    def release_all(self):
        """Unloads all models (e.g., on application shutdown)."""
        logger.info("Releasing all models from VRAM...")
        for model in self._registry.values():
            if model.is_loaded():
                model.unload()
        clear_gpu_memory()

    def health(self) -> Dict[str, ModelStatus]:
        """Reports the health/status of all registered models."""
        return {name: model.health() for name, model in self._registry.items()}

    def list_models(self) -> List[str]:
        """Returns a list of available model names."""
        return list(self._registry.keys())

# Singleton instance
model_manager = ModelManager()