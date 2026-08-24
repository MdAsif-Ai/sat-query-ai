import asyncio
import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.abspath('backend'))

from PIL import Image
from app.models.sam2 import SAM2Model

async def main():
    print("--- Initializing SAM 2 Model ---")
    model = SAM2Model()
    
    print("--- Loading Model into VRAM ---")
    await model.load()
    
    print(f"Model loaded status: {model.is_loaded()}")
    print(f"Model Health: {model.health()}")
    
    try:
        print("\n--- Loading Test Image ---")
        # Ensure you have test_satellite.jpg in the root directory
        image_path = "test_satellite.jpg"
        image = Image.open(image_path).convert("RGB")
        
        print("\n--- Testing Box-Prompted Segmentation ---")
        # Using a dummy box over a region of the image [x1, y1, x2, y2]
        dummy_box = [50.0, 300.0, 1000.0, 700.0]
        print(f"Input Box: {dummy_box}")
        
        result = model.segment_from_box(image, dummy_box)
        
        print("\n--- RESULTS ---")
        print(f"Mask Dimensions (H, W): {result['mask_dimensions']}")
        print(f"Area (pixels): {result['area_pixels']}")
        print(f"Bounding Box from Mask: {result['bounding_box']}")
        print(f"Confidence: {result['confidence']}")  # Expected: None
        
    except Exception as e:
        print(f"Error during test: {e}")
    finally:
        print("\n--- Unloading Model ---")
        model.unload()
        print("Test complete.")

if __name__ == "__main__":
    asyncio.run(main())