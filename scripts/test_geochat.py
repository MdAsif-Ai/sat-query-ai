import gc
import os
import time

import torch
from PIL import Image
from transformers import AutoTokenizer, AutoModelForCausalLM


# ============================================================
# CONFIG
# ============================================================

IMAGE_PATH = "test_data/test_satellite.jpg"
MODEL_ID = "MBZUAI/GeoChat-7B"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MAX_NEW_TOKENS = 80


# ============================================================
# CLEANUP
# ============================================================

def cleanup():
    gc.collect()

    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()


# ============================================================
# HEADER
# ============================================================

print("=" * 70)
print("GEOCHAT TEST")
print("=" * 70)

print(f"Device       : {DEVICE}")

if torch.cuda.is_available():
    print(f"GPU          : {torch.cuda.get_device_name(0)}")
    print(f"Capability   : {torch.cuda.get_device_capability(0)}")
    print(f"PyTorch      : {torch.__version__}")
    print(f"CUDA         : {torch.version.cuda}")


# ============================================================
# IMAGE
# ============================================================

if not os.path.exists(IMAGE_PATH):
    raise FileNotFoundError(
        f"Image not found: {IMAGE_PATH}"
    )

image = Image.open(IMAGE_PATH).convert("RGB")

print()
print("Image:")
print(f"  Path : {IMAGE_PATH}")
print(f"  Size : {image.size}")
print(f"  Mode : {image.mode}")


# ============================================================
# TOKENIZER
# ============================================================

print()
print("[1/4] Loading GeoChat tokenizer...")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_ID,
    trust_remote_code=True,
)

print("Tokenizer loaded successfully.")


# ============================================================
# MODEL
# ============================================================

print()
print("[2/4] Loading GeoChat model...")
print("This may take several minutes on first run.")

try:

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        trust_remote_code=True,
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        device_map="auto" if DEVICE == "cuda" else None,
    )

    model.eval()

except Exception as e:

    print()
    print("=" * 70)
    print("GEOCHAT MODEL LOADING FAILED")
    print("=" * 70)

    print(type(e).__name__)
    print(str(e))

    cleanup()
    raise


print("GeoChat model loaded successfully.")

if DEVICE == "cuda":
    print(
        f"GPU memory after loading: "
        f"{torch.cuda.memory_allocated() / 1024**3:.2f} GB"
    )


# ============================================================
# PROMPT
# ============================================================

print()
print("[3/4] Preparing question...")

question = (
    "Describe this satellite image. "
    "Identify the major land cover, water bodies, "
    "buildings, roads, vegetation, and other visible features."
)

prompt = (
    "USER: <image>\n"
    f"{question}\n"
    "ASSISTANT:"
)

print()
print("Question:")
print(question)


# ============================================================
# IMPORTANT
# ============================================================

print()
print(
    "NOTE: GeoChat uses custom image handling through "
    "its remote-code implementation."
)

# GeoChat's custom implementation may expose different
# inference APIs depending on the installed transformers/
# remote-code revision.

# Try the model's native `chat` method first.

if not hasattr(model, "chat"):

    print()
    print("=" * 70)
    print("GEOCHAT API NOT AVAILABLE")
    print("=" * 70)

    print(
        "This GeoChat checkpoint does not expose the expected "
        "`chat()` method through the currently downloaded "
        "remote-code implementation."
    )

    print()
    print("Model loaded successfully, but image inference cannot")
    print("be safely executed with this generic CausalLM interface.")

    del model
    del tokenizer
    del image

    cleanup()

    raise RuntimeError(
        "GeoChat native chat() API unavailable."
    )


# ============================================================
# INFERENCE
# ============================================================

print()
print("[4/4] Running GeoChat image inference...")

try:

    if DEVICE == "cuda":
        torch.cuda.synchronize()

    start = time.perf_counter()

    with torch.inference_mode():

        response = model.chat(
            tokenizer,
            image,
            question,
            generation_config={
                "max_new_tokens": MAX_NEW_TOKENS,
                "do_sample": False,
            },
        )

    if DEVICE == "cuda":
        torch.cuda.synchronize()

    elapsed = time.perf_counter() - start

except Exception as e:

    print()
    print("=" * 70)
    print("GEOCHAT INFERENCE FAILED")
    print("=" * 70)

    print(type(e).__name__)
    print(str(e))

    del model
    del tokenizer
    del image

    cleanup()

    raise


# ============================================================
# RESULT
# ============================================================

print()
print("=" * 70)
print("GEOCHAT INFERENCE SUCCESS")
print("=" * 70)

print(f"Inference time : {elapsed:.2f} seconds")

print()
print("QUESTION:")
print(question)

print()
print("GEochat RESPONSE:")
print(response)


# ============================================================
# CLEANUP
# ============================================================

print()
print("Cleaning GPU memory...")

del response
del model
del tokenizer
del image

cleanup()

if DEVICE == "cuda":

    print(
        f"GPU memory after cleanup: "
        f"{torch.cuda.memory_allocated() / 1024**3:.2f} GB"
    )

print()
print("=" * 70)
print("GEOCHAT TEST COMPLETE")
print("=" * 70)