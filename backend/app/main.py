from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import torch
import os

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import SatQueryException
from app.api.router import api_router
from app.models.manager import model_manager, clear_gpu_memory
from app.db.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown logic.
    """
    # --- STARTUP ---
    # 1. Initialize structured logging
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode...")
    
    # 2. Initialize Database (create tables if they don't exist)
    try:
        await init_db()
    except Exception as e:
        logger.error(f"Database initialization failed: {e}. Continuing without DB persistence.")
        
    # 3. Initialize Model Manager
    # Note: This ONLY instantiates the registry. It does NOT load models into VRAM.
    # Models will lazy-load on-demand when a user queries them.
    app.state.model_manager = model_manager
    logger.info("Model Manager initialized. Models will lazy-load upon request.")
    
    # 4. Verify CUDA availability
    if settings.DEVICE == "cuda" and not torch.cuda.is_available():
        logger.warning("CUDA is set as preferred device but is not available. Falling back to CPU.")
        settings.DEVICE = "cpu"
    else:
        logger.info(f"GPU Device detected: {torch.cuda.get_device_name(0)}")
        
    logger.success("SatQuery AI Backend is up and running!")

    yield  # Application runs here

    # --- SHUTDOWN ---
    logger.info("Graceful shutdown initiated...")
    
    # 1. Unload all models and clear VRAM
    try:
        app.state.model_manager.release_all()
        clear_gpu_memory()
    except Exception as e:
        logger.error(f"Error during model unloading: {e}")
        
    logger.success("SatQuery AI Backend shut down successfully.")


# Create FastAPI app instance
app = FastAPI(
    title=settings.APP_NAME,
    description="Agentic Vision-Language Assistant for Multimodal Remote Sensing Image Analysis",
    version="1.0.0",
    lifespan=lifespan
)

# --- MIDDLEWARE ---
# CORS: Allow your Next.js frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domains (e.g., "http://localhost:3000")
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- EXCEPTION HANDLERS ---
@app.exception_handler(SatQueryException)
async def satquery_exception_handler(request: Request, exc: SatQueryException):
    """
    Handles all custom application exceptions gracefully, returning a structured error response.
    """
    logger.error(f"SatQuery Exception: {exc.message} | Path: {request.url.path}")
    return JSONResponse(
        status_code=400,
        content={
            "error_type": exc.__class__.__name__,
            "message": exc.message,
            "code": 400
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled exceptions to prevent stack traces from leaking to the UI.
    """
    logger.exception(f"Unhandled Internal Server Error | Path: {request.url.path} | Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error_type": "UnhandledInternalError",
            "message": "An unexpected internal server error occurred.",
            "code": 500
        }
    )

# --- ROUTES ---
# Include all API endpoints defined in the router
app.include_router(api_router, prefix="/api")

# Root Health Check (in addition to the /api/health route)
@app.get("/", tags=["root"])
async def root():
    """Root endpoint to verify the server is live."""
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "documentation": "/docs"
    }

# Entry point for direct execution (e.g., python -m app.main)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(
#         "app.main:app",
#         host=settings.HOST,
#         port=settings.PORT,
#         reload=settings.DEBUG
#     )