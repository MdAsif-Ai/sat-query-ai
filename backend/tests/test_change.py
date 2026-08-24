import asyncio
import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.abspath('backend'))

from PIL import Image
from app.models.change_model import ChangeModel

async def main():
    print("--- Initializing Change Detection Model ---")
    model = ChangeModel()
    
    print("--- Loading Model into VRAM ---")
    await model.load()
    
    print(f"Model loaded status: {model.is_loaded()}")
    print(f"Model Health: {model.health()}")
    
    try:
        print("\n--- Loading Test Images ---")
        # We use the same image twice to simulate T1 and T2 for this code test
        image_path = "test_satellite.jpg"
        image_t1 = Image.open(image_path).convert("RGB")
        image_t2 = Image.open(image_path).convert("RGB")
        
        print("\n--- Testing Bi-Temporal Inference ---")
        result = model.infer(image_t1, image_t2)
        
        print("\n--- RESULTS ---")
        print(f"Model: {result['model_name']}")
        print(f"Image Size (W, H): {result['image_size']}")
        print(f"Change Probability: {result['change_probability']:.4f}")
        print(f"Changed Area Ratio: {result['changed_area_ratio']:.4f}")
        print(f"Mask Shape: {result['change_mask'].shape}")
        print(f"Mask dtype: {result['change_mask'].dtype}")
        
    except Exception as e:
        print(f"Error during test: {e}")
    finally:
        print("\n--- Unloading Model ---")
        model.unload()
        print("Test complete.")

if __name__ == "__main__":
    asyncio.run(main())