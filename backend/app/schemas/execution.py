from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.schemas.models import ModelExecution
from app.schemas.analysis import TaskType

class AgentDecision(BaseModel):
    step_id: int
    task_type: TaskType
    tools_selected: List[str]
    parameters: Dict[str, Any]
    timestamp: str

class ExecutionStep(BaseModel):
    step_id: int
    agent_decision: Optional[AgentDecision] = None
    model_execution: Optional[ModelExecution] = None
    status: str  # e.g., "planning", "executing", "success", "failed"
    message: str
    timestamp: str

class ExecutionTrace(BaseModel):
    request_id: str
    steps: List[ExecutionStep] = Field(default_factory=list)
    total_duration_ms: Optional[float] = None