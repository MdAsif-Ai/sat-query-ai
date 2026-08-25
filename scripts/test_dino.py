#!/usr/bin/env python3

import gc
import sys
import time
from pathlib import Path

import torch
from PIL import Image
from transformers import (
    AutoProcessor,
    AutoModelForZeroShotObjectDetection,
)


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_ID = "IDEA-Research/grounding-dino-base"

IMAGE_PATH = Path("test_data/test_satellite.jpg")

# Text query for Grounding DINO
TEXT_QUERY = "house"

# Thresholds
BOX_THRESHOLD = 0.25
TEXT_THRESHOLD = 0.25

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# IMPORTANT:
# Use FP32 for this test to avoid the FP16/BF16 grid_sample
# dtype incompatibility seen on this environment.
DTYPE = torch.float32


# ============================================================
# HELPERS
# ============================================================

def cleanup():
    """Free GPU memory."""
    gc.collect()

    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()


def print_gpu_memory(label):
    """Print current GPU memory usage."""
    if not torch.cuda.is_available():
        return

    allocated = torch.cuda.memory_allocated() / (1024 ** 3)
    reserved = torch.cuda.memory_reserved() / (1024 ** 3)

    print(f"{label}")
    print(f"  Allocated : {allocated:.2f} GB")
    print(f"  Reserved  : {reserved:.2f} GB")


# ============================================================
# ENVIRONMENT INFORMATION
# ============================================================

print("=" * 70)
print("GROUNDING DINO - FP32 INFERENCE TEST")
print("=" * 70)

print(f"Device       : {DEVICE}")
print(f"Model        : {MODEL_ID}")
print(f"Image        : {IMAGE_PATH}")
print(f"PyTorch      : {torch.__version__}")
print(f"CUDA         : {torch.version.cuda}")
print(f"FP dtype     : {DTYPE}")

if torch.cuda.is_available():

    gpu_name = torch.cuda.get_device_name(0)
    capability = torch.cuda.get_device_capability(0)

    print(f"GPU          : {gpu_name}")
    print(f"Capability   : {capability}")

else:
    print("WARNING: CUDA is not available.")
    print("Inference will run on CPU.")

print("=" * 70)


# ============================================================
# CHECK IMAGE
# ============================================================

print("\n[1/6] Checking image...")

if not IMAGE_PATH.exists():

    print(f"\nERROR: Image not found:")
    print(f"       {IMAGE_PATH}")

    print("\nCurrent directory:")
    print(Path.cwd())

    sys.exit(1)


try:

    image = Image.open(IMAGE_PATH).convert("RGB")

except Exception as e:

    print(f"ERROR: Could not open image: {e}")
    sys.exit(1)


print(f"Image format : {image.format}")
print(f"Image mode   : {image.mode}")
print(f"Image size   : {image.size}")

print("Image loaded successfully.")


# ============================================================
# LOAD PROCESSOR
# ============================================================

print("\n[2/6] Loading processor...")

try:

    processor = AutoProcessor.from_pretrained(
        MODEL_ID
    )

    print("Processor loaded successfully.")

except Exception as e:

    print("\nERROR: Failed to load processor.")
    print(e)

    sys.exit(1)


# ============================================================
# LOAD MODEL
# ============================================================

print("\n[3/6] Loading Grounding DINO model...")

print("Using FP32 intentionally.")

try:

    start = time.time()

    model = AutoModelForZeroShotObjectDetection.from_pretrained(
        MODEL_ID,
        dtype=DTYPE,
        device_map=DEVICE,
    )

    model.eval()

    elapsed = time.time() - start

    print(f"Model loaded successfully in {elapsed:.2f} seconds.")

except Exception as e:

    print("\nERROR: Failed to load Grounding DINO.")

    print("\nException:")
    print(e)

    cleanup()

    sys.exit(1)


# ============================================================
# VERIFY MODEL DTYPE
# ============================================================

print("\n[4/6] Checking model...")

try:

    first_parameter = next(model.parameters())

    print(f"Model device : {first_parameter.device}")
    print(f"Model dtype  : {first_parameter.dtype}")

except Exception as e:

    print(f"Could not inspect model parameters: {e}")


print_gpu_memory("GPU memory after model loading:")


# ============================================================
# PREPARE INPUT
# ============================================================

print("\n[5/6] Preparing input...")

print(f"Text query: '{TEXT_QUERY}'")

try:

    inputs = processor(
        images=image,
        text=TEXT_QUERY,
        return_tensors="pt",
    )

except Exception as e:

    print("\nERROR: Processor failed.")
    print(e)

    del model
    cleanup()

    sys.exit(1)


# ============================================================
# MOVE INPUTS TO GPU
# ============================================================

print("\nInput tensors BEFORE device transfer:")

for key, value in inputs.items():

    if torch.is_tensor(value):

        print(
            f"{key:25s}"
            f"shape={tuple(value.shape)} "
            f"dtype={value.dtype} "
            f"device={value.device}"
        )

    else:

        print(
            f"{key:25s}"
            f"type={type(value)}"
        )


# Move tensors to correct device.
for key, value in inputs.items():

    if torch.is_tensor(value):

        inputs[key] = value.to(DEVICE)


# ------------------------------------------------------------
# IMPORTANT:
#
# Grounding DINO is being tested completely in FP32.
#
# Only floating-point image tensors should be converted.
#
# DO NOT convert:
#
# input_ids
# attention_mask
# token_type_ids
# pixel_mask
#
# to float.
# ------------------------------------------------------------

if "pixel_values" in inputs:

    inputs["pixel_values"] = inputs["pixel_values"].float()


print("\nInput tensors AFTER device transfer:")

for key, value in inputs.items():

    if torch.is_tensor(value):

        print(
            f"{key:25s}"
            f"shape={tuple(value.shape)} "
            f"dtype={value.dtype} "
            f"device={value.device}"
        )


print_gpu_memory("\nGPU memory before inference:")


# ============================================================
# INFERENCE
# ============================================================

print("\n[6/6] Running Grounding DINO inference...")

try:

    if torch.cuda.is_available():

        torch.cuda.synchronize()

    start = time.time()

    with torch.inference_mode():

        outputs = model(**inputs)

    if torch.cuda.is_available():

        torch.cuda.synchronize()

    elapsed = time.time() - start

    print("\n" + "=" * 70)
    print("RAW MODEL INFERENCE SUCCESS")
    print("=" * 70)

    print(f"Inference time : {elapsed:.2f} seconds")

    print("\nOutput tensors:")

    if hasattr(outputs, "logits"):

        print(
            f"logits     : "
            f"shape={tuple(outputs.logits.shape)} "
            f"dtype={outputs.logits.dtype}"
        )

    if hasattr(outputs, "pred_boxes"):

        print(
            f"pred_boxes : "
            f"shape={tuple(outputs.pred_boxes.shape)} "
            f"dtype={outputs.pred_boxes.dtype}"
        )

except Exception as e:

    print("\n" + "=" * 70)
    print("GROUNDING DINO INFERENCE FAILED")
    print("=" * 70)

    print(type(e).__name__)
    print(str(e))

    print("\nThis means the model loaded correctly,")
    print("but inference itself failed.")

    print_gpu_memory("\nGPU memory at failure:")

    del model
    cleanup()

    sys.exit(1)


# ============================================================
# POST PROCESS DETECTIONS
# ============================================================

print("\nPost-processing detections...")

try:

    target_sizes = [
        image.size[::-1]
    ]
    # PIL size = (width, height)
    # target_sizes expects = (height, width)

    results = processor.post_process_grounded_object_detection(
        outputs,
        threshold=0.20,
        target_sizes=target_sizes,
    )

except Exception as e:

    print("\nERROR during post-processing.")

    print(type(e).__name__)
    print(str(e))

    del outputs
    del model

    cleanup()

    sys.exit(1)


# ============================================================
# DISPLAY RESULTS
# ============================================================

result = results[0]

boxes = result.get("boxes")
scores = result.get("scores")
labels = result.get("text_labels")

print("\n" + "=" * 70)
print("DETECTION RESULTS")
print("=" * 70)

if boxes is None or len(boxes) == 0:

    print("No objects detected.")

else:

    print(f"Objects detected: {len(boxes)}")

    for i in range(len(boxes)):

        box = boxes[i].detach().cpu().tolist()

        score = (
            scores[i].detach().cpu().item()
            if scores is not None
            else None
        )

        label = (
            labels[i]
            if labels is not None
            else TEXT_QUERY
        )

        print()
        print(f"Detection #{i + 1}")
        print(f"  Label : {label}")
        print(f"  Score : {score:.4f}")
        print(
            "  Box   : "
            f"[{box[0]:.1f}, "
            f"{box[1]:.1f}, "
            f"{box[2]:.1f}, "
            f"{box[3]:.1f}]"
        )


# ============================================================
# SAVE SIMPLE RESULT
# ============================================================

print("\nCleaning GPU memory...")

del outputs
del result
del results
del inputs
del model
del processor

cleanup()

print_gpu_memory("\nGPU memory after cleanup:")

print("\n" + "=" * 70)
print("GROUNDING DINO TEST COMPLETE")
print("=" * 70)