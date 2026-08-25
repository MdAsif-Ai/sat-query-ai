import pytest
import asyncio
from PIL import Image
import io
import os
from unittest.mock import AsyncMock, patch

# Ensure testing environment variables are set
os.environ["DEBUG"] = "True"
os.environ["GROQ_API_KEY"] = "mock_groq_key"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db" # Use local SQLite for tests

from app.main import app
from app.db.database import init_db, engine, Base
import app.db.repositories # Import to register models with Base.metadata

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

import pytest_asyncio

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Create database tables before tests and drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    if os.path.exists("./test.db"):
        os.remove("./test.db")

@pytest.fixture
def dummy_image_bytes():
    """Returns a valid PNG image as bytes."""
    img = Image.new('RGB', (256, 256), color = (73, 109, 137))
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    return img_io.getvalue()

@pytest.fixture
def mock_geochat():
    """Mocks the GeoChat model to avoid VRAM usage during E2E tests."""
    with patch("app.models.geochat.GeoChatModel.load", return_value=None), \
         patch("app.models.geochat.GeoChatModel.is_loaded", return_value=True), \
         patch("app.models.geochat.GeoChatModel.answer_vqa", return_value="A river and a forest."), \
         patch("app.models.geochat.GeoChatModel.caption", return_value="The image shows a river and a forest."):
        yield

@pytest.fixture
def mock_dino_sam():
    """Mocks DINO and SAM2 models."""
    with patch("app.models.grounding_dino.GroundingDinoModel.load", return_value=None), \
         patch("app.models.grounding_dino.GroundingDinoModel.is_loaded", return_value=True), \
         patch("app.models.grounding_dino.GroundingDinoModel.infer", return_value={
             "boxes": [[10.0, 10.0, 100.0, 100.0]],
             "scores": [0.95],
             "labels": ["water body"],
             "image_size": (256, 256),
             "model_name": "grounding_dino",
             "confidence": 0.95
         }), \
         patch("app.models.sam2.SAM2Model.load", return_value=None), \
         patch("app.models.sam2.SAM2Model.is_loaded", return_value=True), \
         patch("app.models.sam2.SAM2Model.segment_from_box", return_value={
             "binary_mask": None,
             "mask_dimensions": (256, 256),
             "area_pixels": 5000,
             "bounding_box": [10, 10, 100, 100],
             "confidence": None
         }):
        yield

@pytest.fixture
def mock_change_model():
    """Mocks the bi-temporal change model."""
    with patch("app.models.change_model.ChangeModel.load", return_value=None), \
         patch("app.models.change_model.ChangeModel.is_loaded", return_value=True), \
         patch("app.models.change_model.ChangeModel.infer", return_value={
             "change_mask": None,
             "change_probability": 0.88,
             "changed_area_ratio": 0.15,
             "image_size": (256, 256),
             "model_name": "change_model"
         }):
        yield

@pytest.fixture
def mock_fusion_model():
    """Mocks the AnySat fusion model."""
    with patch("app.models.fusion_model.FusionModel.load", return_value=None), \
         patch("app.models.fusion_model.FusionModel.is_loaded", return_value=True), \
         patch("app.models.fusion_model.FusionModel.infer", return_value={
             "fused": True,
             "embedding_dimension": 768,
             "global_embedding_sample": [0.1, 0.2],
             "patch_shape": [16, 16],
             "model_name": "fusion_model",
             "message": "Mocked fusion successful."
         }):
        yield

@pytest.fixture
def mock_external_vlm():
    """Mocks the Groq/Gemini external API calls."""
    with patch("app.models.external_vlm.ExternalVLM.synthesize", new_callable=AsyncMock, return_value={
        "text": "External VLM synthesized fallback answer.",
        "provider": "groq",
        "model": "mock-model",
        "fallback": True
    }):
        yield