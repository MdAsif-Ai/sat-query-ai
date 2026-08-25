import sys
sys.path.append("/home/techpark-10/Documents/GeoChat")
import torch
from geochat.model.builder import load_pretrained_model

model_path = "MBZUAI/GeoChat-7B"
model_name = "geochat"

print("Attempting to load GeoChat using geochat.model.builder...")
try:
    tokenizer, model, image_processor, context_len = load_pretrained_model(
        model_path=model_path,
        model_base=None,
        model_name=model_name,
        load_4bit=True
    )
    print("SUCCESSFULLY LOADED:")
    print("tokenizer:", tokenizer)
    print("model:", model)
    print("image_processor:", image_processor)
except Exception as e:
    import traceback
    traceback.print_exc()
