import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import patch

pytestmark = pytest.mark.asyncio

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

# 1. Health
@pytest.mark.gpu
async def test_1_health(client):
    response = await client.get("/api/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

# 2. GPU Health
@pytest.mark.gpu
async def test_2_gpu_health(client):
    response = await client.get("/api/health/gpu")
    assert response.status_code == 200
    assert "total_mb" in response.json()

# 3. Image Upload
async def test_3_image_upload(client, dummy_image_bytes):
    files = {"file": ("test.png", dummy_image_bytes, "image/png")}
    response = await client.post("/api/upload/", files=files)
    assert response.status_code == 200
    assert "image_id" in response.json()

# 4. Single-image VQA
async def test_4_single_vqa(client, dummy_image_bytes, mock_geochat):
    files = [("files", ("test.png", dummy_image_bytes, "image/png"))]
    data = {"query": "Is there a river in this image?", "task_override": "SINGLE_VQA"}
    response = await client.post("/api/analysis/", files=files, data=data)
    assert response.status_code == 200
    assert "river" in response.json()["answer"]
    assert response.json()["task_type"] == "SINGLE_VQA"

# 5. Caption
async def test_5_caption(client, dummy_image_bytes, mock_geochat):
    files = [("files", ("test.png", dummy_image_bytes, "image/png"))]
    data = {"query": "Describe this image."}
    response = await client.post("/api/analysis/", files=files, data=data)
    assert response.status_code == 200
    assert "forest" in response.json()["answer"]
    assert response.json()["task_type"] == "CAPTION"

# 6. Grounding
async def test_6_grounding(client, dummy_image_bytes, mock_dino_sam):
    files = [("files", ("test.png", dummy_image_bytes, "image/png"))]
    data = {"query": "Find water body."}
    response = await client.post("/api/analysis/", files=files, data=data)
    assert response.status_code == 200
    assert "Found 1 instance(s)" in response.json()["answer"]
    assert any(e["type"] == "BOUNDING_BOX" for e in response.json()["evidence"])

# 7. Segmentation (Implicitly tested via Grounding pipeline, but verified here)
async def test_7_segmentation_evidence(client, dummy_image_bytes, mock_dino_sam):
    files = [("files", ("test.png", dummy_image_bytes, "image/png"))]
    data = {"query": "Highlight water body"}
    response = await client.post("/api/analysis/", files=files, data=data)
    assert response.status_code == 200
    assert any(e["type"] == "SEGMENTATION_MASK" for e in response.json()["evidence"])

# 8. Bi-temporal Change
async def test_8_change_detection(client, dummy_image_bytes, mock_change_model, mock_geochat):
    files = [
        ("files", ("t1.png", dummy_image_bytes, "image/png")),
        ("files", ("t2.png", dummy_image_bytes, "image/png"))
    ]
    data = {"query": "What changed?"}
    response = await client.post("/api/analysis/", files=files, data=data)
    assert response.status_code == 200
    assert response.json()["task_type"] == "CHANGE_VQA"
    assert any(e["type"] == "CHANGE_MAP" for e in response.json()["evidence"])

# 9. Optical/SAR Workflow
async def test_9_optical_sar_fusion(client, dummy_image_bytes, mock_fusion_model, mock_external_vlm):
    files = [
        ("files", ("optical.png", dummy_image_bytes, "image/png")),
        ("files", ("sar.png", dummy_image_bytes, "image/png"))
    ]
    data = {"query": "Use both images to identify built-up areas."}
    
    # Hack to force modality detection for the test
    with patch("app.services.image_service.ImageService.extract_metadata", side_effect=[
        {"image_id":"1", "filename":"optical.png", "modality": "OPTICAL", "width":256, "height":256, "bands":3, "crs":None, "bounds":None, "resolution":None, "size_mb":0.1},
        {"image_id":"2", "filename":"sar.png", "modality": "SAR", "width":256, "height":256, "bands":1, "crs":None, "bounds":None, "resolution":None, "size_mb":0.1}
    ]):
        response = await client.post("/api/analysis/", files=files, data=data)
        
    assert response.status_code == 200
    assert response.json()["task_type"] == "OPTICAL_SAR_ANALYSIS"

# 10. Model Failure Fallback
async def test_10_fallback(client, dummy_image_bytes, mock_external_vlm):
    # Do NOT mock geochat, causing it to fail and trigger the external VLM fallback
    # We force the task type to VQA to ensure it tries to load geochat
    files = [("files", ("test.png", dummy_image_bytes, "image/png"))]
    data = {"query": "What is here?", "task_override": "SINGLE_VQA"}
    
    # Mock the model load to simulate a failure
    with patch("app.models.geochat.GeoChatModel.load", side_effect=Exception("VRAM OOM")):
        response = await client.post("/api/analysis/", files=files, data=data)
        
    assert response.status_code == 200
    print("Fallback response:", response.json())
    assert "External VLM synthesized fallback answer." in response.json()["answer"]
    assert "fallback" in str(response.json()["warnings"]).lower()

# 11. Execution Trace
async def test_11_execution_trace(client, dummy_image_bytes, mock_geochat):
    files = [("files", ("test.png", dummy_image_bytes, "image/png"))]
    data = {"query": "What is here?"}
    response = await client.post("/api/analysis/", files=files, data=data)
    assert response.status_code == 200
    trace = response.json()["execution_trace"]
    print("Execution trace:", trace)
    assert trace["steps"][0]["status"] == "success"
    assert any("GeoChat" in step.get("message", "") for step in trace["steps"])

# 12. Evidence Generation
async def test_12_evidence_generation(client, dummy_image_bytes, mock_dino_sam):
    files = [("files", ("test.png", dummy_image_bytes, "image/png"))]
    data = {"query": "Find water body"}
    response = await client.post("/api/analysis/", files=files, data=data)
    assert response.status_code == 200
    evidence = response.json()["evidence"]
    assert len(evidence) >= 2  # BBox + Mask
    assert evidence[0]["data"]["x1"] == 10.0

# 13. Report Generation
async def test_13_report_generation(client, dummy_image_bytes, mock_geochat):
    files = [("files", ("test.png", dummy_image_bytes, "image/png"))]
    data = {"query": "What is here?"}
    response = await client.post("/api/analysis/", files=files, data=data)
    analysis_id = response.json()["execution_trace"]["request_id"]
    
    report_response = await client.get(f"/api/reports/{analysis_id}")
    assert report_response.status_code == 200
    assert report_response.headers["content-type"] == "application/pdf"