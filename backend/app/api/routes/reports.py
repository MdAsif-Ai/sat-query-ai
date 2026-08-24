from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.db.database import get_db
from app.db.repositories import ResultRepository, RequestRepository
from app.services.report_service import report_service
from app.schemas.analysis import AnalysisResponse, TaskType
from app.schemas.evidence import ConfidenceScore, ConfidenceLevel, EvidenceItem
from app.schemas.execution import ExecutionTrace
from app.core.config import settings

router = APIRouter()

@router.get("/{analysis_id}")
async def download_report(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Generates and downloads a PDF report for a given analysis."""
    result_repo = ResultRepository(db)
    req_repo = RequestRepository(db)
    
    # Fetch result and request
    result = await result_repo.get_result_by_request(analysis_id)
    request = await req_repo.get_request_by_id(analysis_id)
    
    if not result or not request:
        raise HTTPException(status_code=404, detail="Analysis not found.")
        
    # Reconstruct a mock AnalysisResponse to feed into the ReportService
    # In a full app, you'd reconstruct the full schema from the DB relations.
    response = AnalysisResponse(
        query=request.query,
        task_type=TaskType.SINGLE_VQA,
        answer=result.answer,
        confidence=ConfidenceScore(score=result.confidence_score, level=ConfidenceLevel(result.confidence_level), rationale=""),
        evidence=[EvidenceItem(type=e.type, description="", data=e.data or {}) for e in result.evidence],
        visual_artifacts=[e.file_path.replace("/storage", settings.STORAGE_DIR) for e in result.evidence if e.file_path],
        execution_trace=ExecutionTrace(request_id=analysis_id, steps=[]),
        warnings=result.warnings or []
    )
    
    try:
        # Check if report already exists
        if result.report:
            filepath = result.report.file_path
            if os.path.exists(filepath):
                return FileResponse(filepath, media_type='application/pdf', filename=f"satquery_report_{analysis_id}.pdf")
                
        # Generate new report
        filepath = report_service.generate_pdf(response)
        
        # Save report path to DB
        await result_repo.save_report(result.id, filepath)
        await db.commit()
        
        return FileResponse(filepath, media_type='application/pdf', filename=f"satquery_report_{analysis_id}.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")