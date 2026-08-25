#!/usr/bin/env python3

import gc
import sys
import time

import torch


# ============================================================
# CONFIG
# ============================================================

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# AnySat's current hub wrapper expects patch_size.
#
# IMPORTANT:
# patch_size must be a multiple of 10.
#
# 60 means a 60m x 60m satellite tile.
#
PATCH_SIZE = 60

# Sentinel-2 has 10 channels in AnySat:
#
# B2, B3, B4, B5, B6, B7, B8, B8A, B11, B12
#
NUM_S2_BANDS = 10

# Number of temporal observations.
#
# We use one date for this smoke test.
#
TIME_STEPS = 1


# ============================================================
# HEADER
# ============================================================

print("=" * 70)
print("ANYSAT TEST")
print("=" * 70)

print("Python       :", sys.version.split()[0])
print("PyTorch      :", torch.__version__)
print("CUDA         :", torch.version.cuda)
print("Device       :", DEVICE)

if torch.cuda.is_available():
    print("GPU          :", torch.cuda.get_device_name(0))
    print("Capability   :", torch.cuda.get_device_capability(0))

print()


# ============================================================
# GPU CHECK
# ============================================================

if not torch.cuda.is_available():

    print("CUDA is not available.")
    sys.exit(1)


def gpu_memory(label):

    allocated = torch.cuda.memory_allocated() / (1024 ** 3)
    reserved = torch.cuda.memory_reserved() / (1024 ** 3)

    print(label)
    print(f"  Allocated : {allocated:.2f} GB")
    print(f"  Reserved  : {reserved:.2f} GB")


gpu_memory("GPU memory before model:")


# ============================================================
# LOAD ANYSAT
# ============================================================

print()
print("[1/6] Loading AnySat...")

try:

    AnySat = torch.hub.load(
        "gastruc/anysat",
        "anysat",
        pretrained=True,
        flash_attn=False,
    )

except Exception as e:

    print()
    print("=" * 70)
    print("ANYSAT MODEL LOAD FAILED")
    print("=" * 70)

    print(type(e).__name__)
    print(str(e))

    raise


print("AnySat loaded successfully.")

gpu_memory("GPU memory after model loading:")


# ============================================================
# MOVE MODEL TO GPU
# ============================================================

print()
print("[2/6] Moving model to GPU...")

AnySat = AnySat.to(DEVICE)
AnySat.eval()

print("Model device:", DEVICE)

gpu_memory("GPU memory after moving model:")


# ============================================================
# CREATE SYNTHETIC SENTINEL-2 DATA
# ============================================================

print()
print("[3/6] Creating Sentinel-2 test input...")


# AnySat expects:
#
# [B, T, C, H, W]
#
# For Sentinel-2:
#
# B = batch
# T = time
# C = 10 spectral bands
# H/W = pixels
#
# PATCH_SIZE is in meters.
#
# Sentinel-2 resolution = 10m.
#
# Therefore:
#
# 60m tile / 10m resolution = 6 pixels
#
IMAGE_SIZE = PATCH_SIZE // 10


print()
print("Patch size :", PATCH_SIZE, "meters")
print("Image size :", IMAGE_SIZE, "x", IMAGE_SIZE, "pixels")


# ------------------------------------------------------------
# Synthetic S2 image
# ------------------------------------------------------------

s2 = torch.randn(
    1,
    TIME_STEPS,
    NUM_S2_BANDS,
    IMAGE_SIZE,
    IMAGE_SIZE,
    dtype=torch.float32,
    device=DEVICE,
)


# ------------------------------------------------------------
# Acquisition date
# ------------------------------------------------------------
#
# Day 100 of the year.
#
s2_dates = torch.tensor(
    [[100]],
    dtype=torch.long,
    device=DEVICE,
)


print()
print("s2:")
print("  Shape :", tuple(s2.shape))
print("  Dtype :", s2.dtype)
print("  Device:", s2.device)

print()
print("s2_dates:")
print("  Shape :", tuple(s2_dates.shape))
print("  Dtype :", s2_dates.dtype)
print("  Device:", s2_dates.device)


# ============================================================
# INPUT DICTIONARY
# ============================================================

data = {
    "s2": s2,
    "s2_dates": s2_dates,
}


print()
print("Input keys:", list(data.keys()))


# ============================================================
# RUN INFERENCE
# ============================================================

print()
print("[4/6] Running AnySat inference...")

print()
print("Parameters:")
print("  patch_size :", PATCH_SIZE)
print("  output     : tile")


# IMPORTANT
# ------------------------------------------------------------
#
# DO NOT pass scale here.
#
# The current PyTorch Hub wrapper internally converts:
#
# patch_size -> patch_size // 10
#
# and passes that to AnySat's internal forward_release().
#
# Passing scale manually causes:
#
# TypeError:
# got multiple values for argument 'scale'
#
# ------------------------------------------------------------

torch.cuda.empty_cache()
gc.collect()

torch.cuda.synchronize()

start = time.perf_counter()

try:

    with torch.inference_mode():

        features = AnySat(
            data,
            PATCH_SIZE,
            output="tile",
        )

    torch.cuda.synchronize()

except Exception as e:

    print()
    print("=" * 70)
    print("ANYSAT INFERENCE FAILED")
    print("=" * 70)

    print("Exception:", type(e).__name__)
    print("Message  :", str(e))

    print()

    gpu_memory("GPU memory at failure:")

    raise


elapsed = time.perf_counter() - start


# ============================================================
# SUCCESS
# ============================================================

print()
print("=" * 70)
print("ANYSAT INFERENCE SUCCESS")
print("=" * 70)

print("Inference time :", f"{elapsed:.3f} seconds")


# ============================================================
# INSPECT OUTPUT
# ============================================================

print()
print("[5/6] Inspecting output...")


print()
print("Output type:", type(features))


if torch.is_tensor(features):

    print("Output shape :", tuple(features.shape))
    print("Output dtype :", features.dtype)
    print("Output device:", features.device)

    feature_cpu = features.detach().float().cpu()

    print()
    print("Feature statistics:")

    print("  Min  :", feature_cpu.min().item())
    print("  Max  :", feature_cpu.max().item())
    print("  Mean :", feature_cpu.mean().item())
    print("  Std  :", feature_cpu.std().item())


elif isinstance(features, dict):

    print("Output dictionary:")

    for key, value in features.items():

        print()
        print("KEY:", key)
        print("TYPE:", type(value))

        if torch.is_tensor(value):

            print("SHAPE :", tuple(value.shape))
            print("DTYPE :", value.dtype)
            print("DEVICE:", value.device)

        else:

            print("VALUE:", value)


elif isinstance(features, (tuple, list)):

    print("Output contains", len(features), "items.")

    for index, value in enumerate(features):

        print()
        print(f"ITEM {index}")
        print("TYPE:", type(value))

        if torch.is_tensor(value):

            print("SHAPE :", tuple(value.shape))
            print("DTYPE :", value.dtype)
            print("DEVICE:", value.device)

        else:

            print("VALUE:", value)


else:

    print(features)


# ============================================================
# MEMORY
# ============================================================

print()

gpu_memory("GPU memory after inference:")


# ============================================================
# CLEANUP
# ============================================================

print()
print("[6/6] Cleaning GPU memory...")


del features
del data
del s2
del s2_dates
del AnySat

gc.collect()

torch.cuda.empty_cache()

torch.cuda.synchronize()


gpu_memory("GPU memory after cleanup:")


# ============================================================
# COMPLETE
# ============================================================

print()
print("=" * 70)
print("ANYSAT TEST COMPLETE")
print("=" * 70)