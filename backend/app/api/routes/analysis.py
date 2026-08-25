import os
import json
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.config import settings
from app.agents.controller import satquery_controller
from app.services.image_service import image_service
from app.db.database import get_db
from app.db.repositories import ResultRepository, ExecutionTraceRepository, RequestRepository
from app.schemas.analysis import AnalysisResponse, TaskType, ErrorResponse
from app.schemas.evidence import ConfidenceScore, ConfidenceLevel, EvidenceItem, EvidenceType
from app.schemas.execution import ExecutionTrace, ExecutionStep
from app.schemas.models import ModelExecution, ModelStatus
from app.services.report_service import report_service
from app.core.exceptions import SatQueryException

router = APIRouter()

class TempFile:
    """Helper class to pass file paths to the controller."""
    def __init__(self, path, filename):
        self.path = path
        self.filename = filename

@router.post("/", response_model=AnalysisResponse)
async def analyze(
    background_tasks: BackgroundTasks,
    query: str = Form(...),
    files: List[UploadFile] = File(...),
    config: Optional[str] = Form(None),
    task_override: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Main endpoint. Accepts multipart image upload + query + config.
    Executes the SatQueryController pipeline and returns the structured response.
    """
    if not files:
        raise HTTPException(status_code=400, detail="At least one image file is required.")
        
    # 1. Save uploaded files temporarily
    saved_files = []
    upload_dir = os.path.join(settings.STORAGE_DIR, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    for file in files:
        file_ext = os.path.splitext(file.filename)[1]
        saved_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, saved_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(TempFile(file_path, file.filename))

    # 2. Execute Controller Pipeline
    try:
        response = await satquery_controller.process(query, saved_files)
    except SatQueryException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # 3. Persist to Database (simplified for hackathon prototype)
    try:
        req_repo = RequestRepository(db)
        result_repo = ResultRepository(db)
        trace_repo = ExecutionTraceRepository(db)
        
        req_id = response.execution_trace.request_id
        session_id = f"session_{req_id}"
        
        # Create Session (Foreign Key requirement)
        await req_repo.create_session(session_id)
        
        # Create Request (task_type requirement)
        await req_repo.create_request(req_id, session_id, query, response.task_type.value)
        status_str = "failed" if response.errors else "success"
        await req_repo.update_request_status(req_id, status_str)
        
        # Save Images metadata
        for p_img in satquery_controller.last_processed_images:
            from app.db.repositories import UploadedImage
            img_meta = p_img.metadata
            if isinstance(img_meta, dict):
                from app.schemas.analysis import ImageMetadata
                img_meta = ImageMetadata(**img_meta)
            
            modality_val = img_meta.modality.value if hasattr(img_meta.modality, 'value') else img_meta.modality
            await req_repo.add_images(req_id, [UploadedImage(
                id=f"img_{uuid.uuid4().hex[:8]}",
                request_id=req_id,
                file_path=p_img.file_path,
                filename=img_meta.filename,
                modality=modality_val,
                width=img_meta.width,
                height=img_meta.height
            )])
            
        # Save Result
        result = await result_repo.save_result(req_id, response.answer, response.confidence.model_dump())
        
        # Save Evidence
        for ev in response.evidence:
            await result_repo.add_evidence(result.id, ev.type.value, ev.data.get("mask_url"), ev.data)
            
        # Save Trace
        agent_exec = await trace_repo.log_agent_start(req_id, "SatQueryController")
        for step in response.execution_trace.steps:
            if step.model_execution:
                await trace_repo.log_model_execution(
                    agent_exec.id, 
                    step.model_execution.model_name, 
                    step.model_execution.duration_ms or 0.0, 
                    step.model_execution.status.value,
                    step.model_execution.error_message
                )
        await trace_repo.log_agent_end(agent_exec.id, "success")
        
        await db.commit()
    except BaseException as e:
        await db.rollback()
        import traceback
        traceback.print_exc()
        raise e

    return response

@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves a previous analysis result by ID."""
    result_repo = ResultRepository(db)
    req_repo = RequestRepository(db)
    trace_repo = ExecutionTraceRepository(db)
    
    result = await result_repo.get_result_by_request(analysis_id)
    request = await req_repo.get_request_by_id(analysis_id)
    if not result or not request:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    
    agents = await trace_repo.get_agents_by_request(analysis_id)
    steps = []
    step_id = 0
    total_duration_ms = 0.0
    for agent in agents:
        steps.append(ExecutionStep(
            step_id=step_id,
            status=agent.status,
            message=f"Executing specialist workflow for {agent.agent_name}...",
            timestamp=agent.start_time.isoformat()
        ))
        step_id += 1
        
        models = await trace_repo.get_models_by_agent(agent.id)
        for m in models:
            steps.append(ExecutionStep(
                step_id=step_id,
                model_execution=ModelExecution(
                    model_name=m.model_name,
                    status=ModelStatus(m.status),
                    start_time=agent.start_time.isoformat(),
                    duration_ms=m.duration_ms,
                    error_message=m.error_message
                ),
                status=m.status,
                message=f"Executed model '{m.model_name}'",
                timestamp=agent.start_time.isoformat()
            ))
            step_id += 1
            if m.duration_ms:
                total_duration_ms += m.duration_ms
    
    # Reconstruct response from the DB relations
    return AnalysisResponse(
        query=request.query,
        task_type=TaskType(request.task_type) if isinstance(request.task_type, str) else request.task_type,
        answer=result.answer,
        confidence=ConfidenceScore(
            score=result.confidence_score, 
            level=ConfidenceLevel(result.confidence_level), 
            rationale=""
        ),
        evidence=[EvidenceItem(type=EvidenceType(e.type), description="", data=e.data or {}) for e in result.evidence] if result.evidence else [],
        execution_trace=ExecutionTrace(
            request_id=analysis_id,
            steps=steps,
            total_duration_ms=total_duration_ms
        ),
        warnings=result.warnings or []
    )

@router.get("/{analysis_id}/execution")
async def get_execution_trace(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves the auditable execution trace for a specific analysis."""
    trace_repo = ExecutionTraceRepository(db)
    agents = await trace_repo.get_agents_by_request(analysis_id)
    
    trace_data = []
    for agent in agents:
        models = await trace_repo.get_models_by_agent(agent.id)
        trace_data.append({
            "agent": agent.agent_name,
            "status": agent.status,
            "models_executed": [
                {"name": m.model_name, "duration_ms": m.duration_ms, "status": m.status}
                for m in models
            ]
        })
    return {"request_id": analysis_id, "trace": trace_data}

@router.get("/{analysis_id}/evidence")
async def get_evidence(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves visual evidence artifacts for a specific analysis."""
    result_repo = ResultRepository(db)
    result = await result_repo.get_result_by_request(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found.")
        
    return {
        "evidence": [
            {"type": e.type, "file_path": e.file_path, "data": e.data}
            for e in result.evidence
        ]
    }

@router.post("/{analysis_id}/retry", response_model=AnalysisResponse)
async def retry_analysis(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Retries a failed analysis."""
    # In a full app, fetch original images and query, then re-run controller.
    # For prototype, just return a mock response indicating retry was triggered.
    return AnalysisResponse(
        query="Retry triggered",
        task_type=TaskType.SINGLE_VQA,
        answer="Analysis retry initiated.",
        confidence=ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Retry pending"),
        evidence=[],
        execution_trace=ExecutionTrace(request_id=analysis_id, steps=[]),
        warnings=["Retry logic not fully implemented in prototype."]
    )