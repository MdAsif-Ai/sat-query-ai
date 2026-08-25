import os
import sys
from huggingface_hub import snapshot_download, hf_hub_download

print("Downloading GeoChat-7B (approx 14GB)...")
# Download GeoChat-7B snapshot (which will get the large .bin weight files)
geochat_dir = snapshot_download(repo_id="MBZUAI/GeoChat-7B")
print(f"GeoChat-7B downloaded to: {geochat_dir}")

print("Downloading Grounding DINO base model...")
dino_dir = snapshot_download(repo_id="IDEA-Research/grounding-dino-base")
print(f"Grounding DINO downloaded to: {dino_dir}")

print("Downloading SAM 2 tiny model...")
sam2_dir = snapshot_download(repo_id="facebook/sam2-hiera-tiny")
print(f"SAM 2 downloaded to: {sam2_dir}")

# We will locate where the actual .pt file is for SAM 2
# SAM 2 on HF usually contains sam2_hiera_tiny.pt
checkpoint_name = "sam2_hiera_tiny.pt"
try:
    sam2_checkpoint_path = hf_hub_download(repo_id="facebook/sam2-hiera-tiny", filename=checkpoint_name)
    print(f"SAM 2 checkpoint downloaded to: {sam2_checkpoint_path}")
except Exception as e:
    print(f"Could not download {checkpoint_name} directly: {e}")
    # Let's list files in the downloaded sam2 directory
    print("Files in sam2 directory:", os.listdir(sam2_dir))
