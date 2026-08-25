from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from loguru import logger

class Base(DeclarativeBase):
    pass

# Create async engine
# Fallback to SQLite if DATABASE_URL is not provided (for local testing without Docker/Supabase)
import sys
db_url = settings.DATABASE_URL or "sqlite+aiosqlite:///./satquery.db"
if "pytest" in sys.modules:
    db_url = "sqlite+aiosqlite:///./test.db"

if db_url.startswith("sqlite"):
    engine = create_async_engine(db_url, echo=settings.DEBUG)
else:
    engine = create_async_engine(
        db_url, 
        echo=settings.DEBUG, 
        pool_size=5, 
        max_overflow=10,
        pool_pre_ping=True
    )

# Create session factory
async_session_factory = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI routes to get a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            import traceback
            traceback.print_exc()
            print(f"COMMIT EXCEPTION: {e}")
            raise
        finally:
            await session.close()

async def init_db():
    """Creates tables if they don't exist. Useful for hackathon prototyping."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized (tables created if missing).")