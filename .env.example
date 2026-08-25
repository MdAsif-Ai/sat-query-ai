from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    Safe defaults are provided for local development.
    """
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True, 
        extra="ignore"
    )

    # App Config
    APP_NAME: str = "SatQuery AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database & Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    DATABASE_URL: Optional[str] = None

    # External APIs (Keys must be provided in .env)
    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # Hugging Face & Model Cache
    HF_HOME: str = "./models/hf_cache"
    MODEL_CACHE_DIR: str = "./models/checkpoints"
    
    # Storage Paths (Relative to backend directory) - FIXED TYPE HINTS HERE
    STORAGE_DIR: str = "./storage"
    MODEL_DIR: str = "./models"

    # Hardware & Processing Limits
    DEVICE: str = "cuda"  # or "cpu"
    MAX_IMAGE_SIZE_MB: int = 50
    MAX_IMAGE_DIMENSION: int = 8192
    GPU_MEMORY_LIMIT: float = 11.0  # Target limit for 12GB VRAM cards

    # Model Identifiers
    GEOCHAT_MODEL: str = "MBZUAI/GeoChat-7B"
    GROUNDING_DINO_MODEL: str = "IDEA-Research/grounding-dino-base"
    SAM2_MODEL: str = "facebook/sam2-hiera-tiny"
    CHANGE_MODEL: str = "bit_levircd"  # Identifier for Open-CD checkpoint
    FUSION_MODEL: str = "anysat"       # Identifier for AnySat checkpoint

    # Timeouts (in seconds)
    MODEL_LOAD_TIMEOUT: int = 120
    MODEL_IDLE_TIMEOUT: int = 300

# Instantiate settings singleton
settings = Settings()