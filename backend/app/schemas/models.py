from enum import Enum
from typing import Optional
from pydantic import BaseModel

class ModelStatus(str, Enum):
    LOADED = "LOADED"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    UNLOADED = "UNLOADED"

class ModelInfo(BaseModel):
    model_name: str
    task_type: str
    version: Optional[str] = None
    device: str = "cuda"
    quantized: bool = False

class ModelExecution(BaseModel):
    model_name: str
    status: ModelStatus
    start_time: str
    end_time: Optional[str] = None
    duration_ms: Optional[float] = None
    vram_usage_mb: Optional[float] = None
    error_message: Optional[str] = None