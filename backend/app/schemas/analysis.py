# backend/app/schemas/analysis.py
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from app.schemas.enums import TaskType, Modality  # <-- IMPORT FROM HERE
from app.schemas.evidence import ConfidenceScore, EvidenceItem
from app.schemas.models import ModelInfo
from app.schemas.execution import ExecutionTrace

# (Remove the TaskType and Modality classes from here)

class ImageMetadata(BaseModel):
    image_id: str
    filename: str
    modality: Modality = Modality.UNKNOWN
    width: int
    height: int
    bands: int
    crs: Optional[str] = None
    bounds: Optional[List[float]] = None
    resolution: Optional[float] = None
    size_mb: float

class ImagePair(BaseModel):
    image_1: ImageMetadata
    image_2: ImageMetadata
    relationship: str
    spatially_aligned: bool

class AnalysisRequest(BaseModel):
    query: str
    image_ids: List[str] = Field(..., min_length=1, max_length=2)
    
class ErrorResponse(BaseModel):
    error_type: str
    message: str
    code: int = 400
    details: Optional[Any] = None

class AnalysisResponse(BaseModel):
    query: str
    task_type: TaskType
    answer: str
    confidence: ConfidenceScore
    evidence: List[EvidenceItem] = Field(default_factory=list)
    visual_artifacts: List[str] = Field(default_factory=list)
    model_info: List[ModelInfo] = Field(default_factory=list)
    execution_trace: ExecutionTrace
    warnings: List[str] = Field(default_factory=list)
    errors: List[ErrorResponse] = Field(default_factory=list)