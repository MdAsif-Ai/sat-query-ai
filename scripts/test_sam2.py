import gc
import os
import time

import numpy as np
import torch
from PIL import Image
from transformers import Sam2Model, Sam2Processor


# ============================================================
# CONFIG
# ============================================================

IMAGE_PATH = "test_data/test_satellite.jpg"
MODEL_ID = "facebook/sam2-hiera-tiny"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

OUTPUT_DIR = "test_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# GPU CLEANUP
# ============================================================

def cleanup():
    gc.collect()

    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()


# ============================================================
# GPU INFO
# ============================================================

print("=" * 70)
print("SAM 2 TEST")
print("=" * 70)

print(f"Device       : {DEVICE}")

if torch.cuda.is_available():
    print(f"GPU          : {torch.cuda.get_device_name(0)}")
    print(f"Capability   : {torch.cuda.get_device_capability(0)}")
    print(f"PyTorch      : {torch.__version__}")
    print(f"CUDA         : {torch.version.cuda}")


# ============================================================
# CHECK IMAGE
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
# LOAD PROCESSOR
# ============================================================

print()
print("[1/5] Loading SAM 2 processor...")

processor = Sam2Processor.from_pretrained(MODEL_ID)

print("Processor loaded successfully.")


# ============================================================
# LOAD MODEL
# ============================================================

print()
print("[2/5] Loading SAM 2 model...")
print(f"Model: {MODEL_ID}")

if DEVICE == "cuda":
    model = Sam2Model.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float32,
    ).to(DEVICE)
else:
    model = Sam2Model.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float32,
    )

model.eval()

print("Model loaded successfully.")

if DEVICE == "cuda":
    print(
        f"GPU memory after loading: "
        f"{torch.cuda.memory_allocated() / 1024**3:.2f} GB"
    )


# ============================================================
# CREATE TEST BOX
# ============================================================

print()
print("[3/5] Creating test bounding box...")

width, height = image.size

# Central region of the satellite image.
# This is only for testing SAM 2.
x1 = int(886.9,)
y1 = int(669.1)

x2 = int(2356.5)
y2 = int(1363.2)

box = [x1, y1, x2, y2]

print(f"Test box: {box}")


# ============================================================
# PREPARE INPUT
# ============================================================

print()
print("[4/5] Preparing inputs...")

inputs = processor(
    images=image,
    input_boxes=[[box]],
    return_tensors="pt",
)

for key, value in inputs.items():
    if torch.is_tensor(value):
        print(
            f"{key:25s}"
            f"shape={tuple(value.shape)} "
            f"dtype={value.dtype} "
            f"device={value.device}"
        )

# Move tensors to GPU.
if DEVICE == "cuda":
    inputs = {
        key: value.to(DEVICE) if torch.is_tensor(value) else value
        for key, value in inputs.items()
    }


# ============================================================
# INFERENCE
# ============================================================

print()
print("[5/5] Running SAM 2 inference...")

if DEVICE == "cuda":
    torch.cuda.synchronize()

start = time.perf_counter()

try:

    with torch.inference_mode():

        outputs = model(**inputs)

    if DEVICE == "cuda":
        torch.cuda.synchronize()

    elapsed = time.perf_counter() - start

except Exception as e:

    print()
    print("=" * 70)
    print("SAM 2 INFERENCE FAILED")
    print("=" * 70)

    print(type(e).__name__)
    print(str(e))

    del model
    del processor
    cleanup()

    raise


# ============================================================
# VERIFY OUTPUT
# ============================================================

print()
print("=" * 70)
print("SAM 2 INFERENCE SUCCESS")
print("=" * 70)

print(f"Inference time : {elapsed:.2f} seconds")

print()
print("Model outputs:")

for key, value in outputs.items():

    if torch.is_tensor(value):

        print(
            f"{key:25s}"
            f"shape={tuple(value.shape)} "
            f"dtype={value.dtype}"
        )


# ============================================================
# MASK INFORMATION
# ============================================================

if hasattr(outputs, "pred_masks"):

    pred_masks = outputs.pred_masks

    print()
    print("Predicted masks:")
    print(f"Shape : {tuple(pred_masks.shape)}")

    # Convert first mask to CPU.
    mask = pred_masks[0, 0, 0].detach().float().cpu().numpy()

    # Convert logits/probabilities into binary mask.
    binary_mask = mask > 0

    print(f"Mask pixels : {binary_mask.size}")
    print(f"Foreground  : {binary_mask.sum()}")

    # Save mask.
    mask_image = Image.fromarray(
        (binary_mask.astype(np.uint8) * 255)
    )

    mask_path = os.path.join(
        OUTPUT_DIR,
        "sam2_mask.png"
    )

    mask_image.save(mask_path)

    print()
    print(f"Mask saved to: {mask_path}")


# ============================================================
# CLEANUP
# ============================================================

print()
print("Cleaning GPU memory...")

del outputs
del inputs
del model
del processor
del image

cleanup()

if DEVICE == "cuda":

    print(
        f"GPU memory after cleanup: "
        f"{torch.cuda.memory_allocated() / 1024**3:.2f} GB"
    )


print()
print("=" * 70)
print("SAM 2 TEST COMPLETE")
print("=" * 70)