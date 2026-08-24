import sys
from loguru import logger
from app.core.config import settings

def setup_logging():
    """
    Configures structured application logging using Loguru.
    """
    logger.remove() # Remove default handler
    
    log_level = "DEBUG" if settings.DEBUG else "INFO"
    
    # Structured format for hackathon readability and future parsing
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    
    logger.add(
        sys.stdout,
        level=log_level,
        format=log_format,
        colorize=True,
        backtrace=settings.DEBUG,
        diagnose=settings.DEBUG,
    )
    
    # Optionally add file logging here if needed for hackathon audit logs
    # logger.add("logs/satquery_{time}.log", rotation="10 MB", level="INFO", format=log_format)

    logger.info(f"Logging initialized. Environment: {settings.APP_ENV}, Debug: {settings.DEBUG}")
    return logger

# Export the configured logger
logger = setup_logging()