from datetime import datetime
from typing import List, Optional, Dict, Any
import uuid
from sqlalchemy import String, DateTime, Text, Integer, Float, ForeignKey, JSON, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import Base

# ==========================================
# ORM MODELS
# ==========================================

class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    requests: Mapped[List["AnalysisRequest"]] = relationship(back_populates="session")

class AnalysisRequest(Base):
    __tablename__ = "analysis_requests"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("analysis_sessions.id"))
    query: Mapped[str] = mapped_column(Text)
    task_type: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String, default="pending") # pending, running, success, failed
    
    session: Mapped["AnalysisSession"] = relationship(back_populates="requests")
    images: Mapped[List["UploadedImage"]] = relationship(back_populates="request")
    result: Mapped[Optional["AnalysisResult"]] = relationship(back_populates="request", uselist=False)
    agent_executions: Mapped[List["AgentExecution"]] = relationship(back_populates="request")

class UploadedImage(Base):
    __tablename__ = "uploaded_images"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    request_id: Mapped[str] = mapped_column(ForeignKey("analysis_requests.id"))
    file_path: Mapped[str] = mapped_column(String)  # Relative path or Supabase URL
    filename: Mapped[str] = mapped_column(String)
    modality: Mapped[str] = mapped_column(String)
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    
    request: Mapped["AnalysisRequest"] = relationship(back_populates="images")

class AgentExecution(Base):
    __tablename__ = "agent_executions"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    request_id: Mapped[str] = mapped_column(ForeignKey("analysis_requests.id"))
    agent_name: Mapped[str] = mapped_column(String)
    start_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String)
    
    request: Mapped["AnalysisRequest"] = relationship(back_populates="agent_executions")
    model_executions: Mapped[List["ModelExecutionLog"]] = relationship(back_populates="agent_execution")

class ModelExecutionLog(Base):
    __tablename__ = "model_executions"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    agent_execution_id: Mapped[str] = mapped_column(ForeignKey("agent_executions.id"))
    model_name: Mapped[str] = mapped_column(String)
    duration_ms: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    agent_execution: Mapped["AgentExecution"] = relationship(back_populates="model_executions")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    request_id: Mapped[str] = mapped_column(ForeignKey("analysis_requests.id"), unique=True)
    answer: Mapped[str] = mapped_column(Text)
    confidence_score: Mapped[float] = mapped_column(Float)
    confidence_level: Mapped[str] = mapped_column(String)
    warnings: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    
    request: Mapped["AnalysisRequest"] = relationship(back_populates="result")
    evidence: Mapped[List["EvidenceArtifact"]] = relationship(back_populates="result")
    report: Mapped[Optional["Report"]] = relationship(back_populates="result", uselist=False)

class EvidenceArtifact(Base):
    __tablename__ = "evidence_artifacts"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    result_id: Mapped[str] = mapped_column(ForeignKey("analysis_results.id"))
    type: Mapped[str] = mapped_column(String)
    file_path: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Path to generated mask/image
    data: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True) # Structured data like BBox coords
    
    result: Mapped["AnalysisResult"] = relationship(back_populates="evidence")

class Report(Base):
    __tablename__ = "reports"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    result_id: Mapped[str] = mapped_column(ForeignKey("analysis_results.id"))
    file_path: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    result: Mapped["AnalysisResult"] = relationship(back_populates="report")


# ==========================================
# REPOSITORIES (Data Access Layer)
# ==========================================

class RequestRepository:
    """Handles database operations for AnalysisRequests without coupling to agent logic."""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_request(self, request_id: str, session_id: str, query: str) -> AnalysisRequest:
        req = AnalysisRequest(id=request_id, session_id=session_id, query=query)
        self.session.add(req)
        await self.session.flush()
        return req

    async def update_request_status(self, request_id: str, status: str):
        req = await self.session.get(AnalysisRequest, request_id)
        if req:
            req.status = status
            await self.session.flush()

    async def add_images(self, request_id: str, images: List[UploadedImage]):
        req = await self.session.get(AnalysisRequest, request_id)
        if req:
            req.images.extend(images)
            await self.session.flush()

    async def get_request_by_id(self, request_id: str) -> Optional[AnalysisRequest]:
        stmt = select(AnalysisRequest).where(AnalysisRequest.id == request_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

class ResultRepository:
    """Handles database operations for AnalysisResults and Evidence."""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_result(self, request_id: str, answer: str, confidence: Dict[str, Any]) -> AnalysisResult:
        result = AnalysisResult(
            request_id=request_id,
            answer=answer,
            confidence_score=confidence.get("score", 0.0),
            confidence_level=confidence.get("level", "LOW"),
            warnings=confidence.get("warnings", [])
        )
        self.session.add(result)
        await self.session.flush()
        return result

    async def add_evidence(self, result_id: str, evidence_type: str, file_path: Optional[str] = None, data: Optional[Dict] = None):
        ev = EvidenceArtifact(result_id=result_id, type=evidence_type, file_path=file_path, data=data)
        self.session.add(ev)
        await self.session.flush()
        return ev

    async def save_report(self, result_id: str, file_path: str) -> Report:
        report = Report(result_id=result_id, file_path=file_path)
        self.session.add(report)
        await self.session.flush()
        return report

    async def get_result_by_request(self, request_id: str) -> Optional[AnalysisResult]:
        stmt = select(AnalysisResult).where(AnalysisResult.request_id == request_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

class ExecutionTraceRepository:
    """Handles database operations for Agent and Model executions."""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def log_agent_start(self, request_id: str, agent_name: str) -> AgentExecution:
        agent_exec = AgentExecution(id=str(uuid.uuid4()), request_id=request_id, agent_name=agent_name, status="running")
        self.session.add(agent_exec)
        await self.session.flush()
        return agent_exec

    async def log_agent_end(self, agent_exec_id: str, status: str):
        agent_exec = await self.session.get(AgentExecution, agent_exec_id)
        if agent_exec:
            agent_exec.status = status
            agent_exec.end_time = datetime.utcnow()
            await self.session.flush()

    async def log_model_execution(self, agent_exec_id: str, model_name: str, duration_ms: float, status: str, error: Optional[str] = None):
        model_exec = ModelExecutionLog(
            id=str(uuid.uuid4()),
            agent_execution_id=agent_exec_id,
            model_name=model_name,
            duration_ms=duration_ms,
            status=status,
            error_message=error
        )
        self.session.add(model_exec)
        await self.session.flush()

    async def get_agents_by_request(self, request_id: str) -> List[AgentExecution]:
        stmt = select(AgentExecution).where(AgentExecution.request_id == request_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_models_by_agent(self, agent_exec_id: str) -> List[ModelExecutionLog]:
        stmt = select(ModelExecutionLog).where(ModelExecutionLog.agent_execution_id == agent_exec_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()