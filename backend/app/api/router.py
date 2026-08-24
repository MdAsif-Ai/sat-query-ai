from fastapi import APIRouter
from app.api.routes import health, upload, analysis, models, reports

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])