import asyncio
import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.abspath('backend'))

from PIL import Image
from app.models.fusion_model import FusionModel

async def main():
    print("--- Initializing Fusion Model (AnySat) ---")
    model = FusionModel()
    
    print("--- Loading Model into VRAM ---")
    await model.load()
    
    print(f"Model loaded status: {model.is_loaded()}")
    print(f"Model Health: {model.health()}")
    
    try:
        print("\n--- Loading Test Images ---")
        # We use the same image twice to simulate Optical and SAR for this code test
        image_path = "test_satellite.jpg"
        opt_img = Image.open(image_path).convert("RGB")
        sar_img = Image.open(image_path).convert("RGB") # Pretending RGB is SAR for the test
        
        print("\n--- Testing Cross-Modal Fusion ---")
        result = model.infer(opt_img, sar_img)
        
        print("\n--- RESULTS ---")
        print(f"Model: {result['model_name']}")
        print(f"Fusion Successful: {result['fused']}")
        print(f"Embedding Dimension: {result['embedding_dimension']}")
        print(f"Patch Shape: {result['patch_shape']}")
        print(f"Global Embedding Sample (first 10): {result['global_embedding_sample']}")
        print(f"Note: {result['message']}")
        
    except Exception as e:
        print(f"Error during test: {e}")
    finally:
        print("\n--- Unloading Model ---")
        model.unload()
        print("Test complete.")

if __name__ == "__main__":
    asyncio.run(main())