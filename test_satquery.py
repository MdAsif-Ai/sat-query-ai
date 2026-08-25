import os
import sys
import time
import asyncio

# Ensure backend directory is in the path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Set CUDA version override for bitsandbytes if needed
os.environ["BNB_CUDA_VERSION"] = "126"

import torch
from PIL import Image

async def run_tests():
    # Lazy imports to ensure environment is set up
    from app.models.manager import model_manager
    from app.db.database import init_db
    
    print("\n--- Initializing Database ---")
    await init_db()
    print("Database initialized successfully.")
    
    image_path = "test_satellite.jpg" # Ensure this image is in the same directory
    if not os.path.exists(image_path):
        print(f"Error: Test image not found at {image_path}")
        return
        
    img = Image.open(image_path).convert("RGB")
    print(f"Loaded test image: {image_path} (Size: {img.size})")

    # 1. Test GeoChat Model
    print("\n--- Testing GeoChat-7B ---")
    try:
        print("Loading GeoChat model...")
        start_load = time.time()
        await model_manager.load_model("geochat")
        print(f"GeoChat loaded in {time.time() - start_load:.2f}s.")
        
        geochat = model_manager._registry["geochat"]
        
        # Test captioning
        print("Running captioning...")
        caption = geochat.caption(img)
        print(f"Caption result:\n{caption}")
        
    except Exception as e:
        print(f"GeoChat test failed: {e}")
        import traceback
        traceback.print_exc()

    # 2. Test Grounding DINO Model
    print("\n--- Testing Grounding DINO ---")
    try:
        print("Loading Grounding DINO model...")
        start_load = time.time()
        await model_manager.load_model("grounding_dino")
        print(f"Grounding DINO loaded in {time.time() - start_load:.2f}s.")
        
        dino = model_manager._registry["grounding_dino"]
        print("Running grounding inference for 'houses'...")
        result = dino.infer(img, "houses")
        print(f"Grounding DINO detected {len(result['boxes'])} objects.")
        
    except Exception as e:
        print(f"Grounding DINO test failed: {e}")
        import traceback
        traceback.print_exc()

    # 3. Test SAM 2 Model
    print("\n--- Testing SAM 2 ---")
    try:
        print("Loading SAM 2 model...")
        start_load = time.time()
        await model_manager.load_model("sam2")
        print(f"SAM 2 loaded in {time.time() - start_load:.2f}s.")
        
        sam2 = model_manager._registry["sam2"]
        # Use a mock box
        box = [100.0, 100.0, 300.0, 300.0]
        print(f"Running segmentation from box prompt: {box}...")
        result = sam2.segment_from_box(img, box)
        print(f"SAM 2 completed successfully. Mask dimensions: {result['mask_dimensions']}")
        
    except Exception as e:
        print(f"SAM 2 test failed: {e}")
        import traceback
        traceback.print_exc()

    # Unload all models to clean up
    print("\n--- Releasing all models ---")
    model_manager.release_all()
    print("VRAM cleared.")

if __name__ == "__main__":
    asyncio.run(run_tests())