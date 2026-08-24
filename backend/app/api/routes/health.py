from fastapi import APIRouter
from app.models.manager import model_manager

router = APIRouter()

@router.get("/")
async def health_check():
    """Basic health check."""
    return {"status": "healthy", "service": "SatQuery AI"}

@router.get("/gpu")
async def gpu_health():
    """Returns GPU memory and utilization statistics."""
    return model_manager.get_gpu_status()