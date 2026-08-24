import asyncio
import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.abspath('backend'))

from PIL import Image
from app.models.grounding_dino import GroundingDinoModel

async def main():
    print("--- Initializing Grounding DINO Model ---")
    model = GroundingDinoModel()
    
    print("--- Loading Model into VRAM ---")
    await model.load()
    
    print(f"Model loaded status: {model.is_loaded()}")
    print(f"Model Health: {model.health()}")
    
    try:
        print("\n--- Loading Test Image ---")
        # Ensure you have test_satellite.jpg in the root directory
        image_path = "test_satellite.jpg"
        image = Image.open(image_path).convert("RGB")
        
        print("\n--- Testing Grounding ---")
        prompt = "water body"
        print(f"Prompt: '{prompt}'")
        
        result = model.infer(image, prompt)
        
        print("\n--- RESULTS ---")
        print(f"Model: {result['model_name']}")
        print(f"Overall Confidence: {result['confidence']:.4f}")
        print(f"Found {len(result['boxes'])} objects.")
        
        for i, (box, score, label) in enumerate(zip(result['boxes'], result['scores'], result['labels'])):
            print(f"  {i+1}. {label} (Score: {score:.4f})")
            print(f"     Box: [x1={box[0]:.2f}, y1={box[1]:.2f}, x2={box[2]:.2f}, y2={box[3]:.2f}]")
            
    except Exception as e:
        print(f"Error during test: {e}")
    finally:
        print("\n--- Unloading Model ---")
        model.unload()
        print("Test complete.")

if __name__ == "__main__":
    asyncio.run(main())