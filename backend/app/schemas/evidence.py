from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class EvidenceType(str, Enum):
    BBOX = "BOUNDING_BOX"
    MASK = "SEGMENTATION_MASK"
    CHANGE_MAP = "CHANGE_MAP"
    TEXT = "TEXT"
    GEO_STATS = "GEOSPATIAL_STATISTICS"

class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: Optional[float] = None

class SegmentationResult(BaseModel):
    mask_url: str
    area_ha: Optional[float] = None
    bbox: Optional[BoundingBox] = None

class ChangeResult(BaseModel):
    change_mask_url: str
    changed_area_ha: float
    change_percentage: float

class ConfidenceScore(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    level: ConfidenceLevel
    rationale: str

class EvidenceItem(BaseModel):
    type: EvidenceType
    description: str
    data: dict  # Flexible dict to hold BoundingBox, SegmentationResult, or ChangeResult schema