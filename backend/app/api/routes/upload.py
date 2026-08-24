import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.image_service import image_service
from app.db.database import get_db
from app.db.repositories import RequestRepository
from app.core.exceptions import InvalidImageError, UnsupportedFormatError

router = APIRouter()

@router.post("/")
async def upload_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Uploads and validates a single satellite image (GeoTIFF/TIFF/JPEG/PNG)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")
        
    # Save file to local storage
    file_ext = os.path.splitext(file.filename)[1]
    saved_filename = f"{uuid.uuid4()}{file_ext}"
    upload_dir = os.path.join(settings.STORAGE_DIR, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, saved_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    try:
        # Validate and extract metadata
        image_service.validate_image(file_path, file.filename)
        metadata = image_service.extract_metadata(file_path, file.filename)
        
        # Return metadata to the client (client then sends image_id with /analysis)
        return {
            "image_id": metadata.image_id,
            "filename": metadata.filename,
            "modality": metadata.modality.value,
            "size_mb": metadata.size_mb,
            "dimensions": f"{metadata.width}x{metadata.height}",
            "crs": metadata.crs
        }
    except (InvalidImageError, UnsupportedFormatError) as e:
        os.remove(file_path) # Cleanup invalid file
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")