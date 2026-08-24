from fastapi import APIRouter, HTTPException
from app.models.manager import model_manager

router = APIRouter()

@router.get("/")
async def list_models():
    """Lists all registered models in the system."""
    return {"models": model_manager.list_models()}

@router.get("/{model_name}/health")
async def model_health(model_name: str):
    """Returns the loading status of a specific model."""
    if model_name not in model_manager.list_models():
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found.")
    
    health_status = model_manager.health().get(model_name)
    return {"model": model_name, "status": health_status.value if health_status else "UNKNOWN"}