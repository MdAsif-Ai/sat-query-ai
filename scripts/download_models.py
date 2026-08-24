import argparse
import os
import sys
import requests
from pathlib import Path
from loguru import logger
from huggingface_hub import snapshot_download

# Add backend to sys path to allow importing app config
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.append(str(BACKEND_DIR))

try:
    from app.core.config import settings
except ImportError:
    logger.error("Could not import settings from backend/app/core/config.py. Ensure the file exists.")
    sys.exit(1)

# Define the Hugging Face model IDs from your config
HF_MODELS = {
    "geochat": settings.GEOCHAT_MODEL,
    "grounding_dino": settings.GROUNDING_DINO_MODEL,
    "sam2": settings.SAM2_MODEL,
}

# Open-CD BIT model URLs (Not on HF Hub, requires direct download)
OPENCD_FILES = {
    "config": ("https://raw.githubusercontent.com/likyoo/open-cd/main/configs/bit/bit_levircd.py", "bit_levircd.py"),
    "checkpoint": ("https://download.openmmlab.com/mmcd/bitv2/bit_levircd-9449fa1c.pth", "bit_levircd.pth")
}

def download_hf_model(model_name: str, model_id: str, cache_dir: str):
    """Downloads a model snapshot from Hugging Face Hub."""
    logger.info(f"Starting download for '{model_name}' ({model_id})...")
    try:
        snapshot_download(
            repo_id=model_id,
            cache_dir=cache_dir,
            resume_download=True,  # Enables resumable downloads
            max_workers=4
        )
        logger.success(f"Successfully cached '{model_name}' to {cache_dir}")
    except Exception as e:
        logger.error(f"Failed to download '{model_name}' from Hugging Face: {e}")

def download_file_with_progress(url: str, filepath: str):
    """Downloads a file with stream and progress bar (for non-HF assets)."""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024 * 1024  # 1 MB chunks
        downloaded = 0
        
        logger.info(f"Downloading {url} -> {filepath}")
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=block_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    done = int(50 * downloaded / total_size) if total_size > 0 else 0
                    sys.stdout.write(f"\r[{'=' * done}{' ' * (50-done)}] {downloaded/(1024*1024):.2f}MB")
                    sys.stdout.flush()
        sys.stdout.write('\n')
        logger.success(f"Downloaded {os.path.basename(filepath)}")
    except Exception as e:
        logger.error(f"Failed to download {url}: {e}")

def download_change_model(cache_dir: str):
    """Downloads Open-CD BIT config and checkpoint."""
    target_dir = os.path.join(cache_dir, "checkpoints")
    os.makedirs(target_dir, exist_ok=True)
    
    for key, (url, filename) in OPENCD_FILES.items():
        filepath = os.path.join(target_dir, filename)
        if os.path.exists(filepath):
            logger.info(f"Change model {key} already exists at {filepath}. Skipping.")
            continue
        download_file_with_progress(url, filepath)

def main():
    parser = argparse.ArgumentParser(description="Download SatQuery AI Specialist Models")
    parser.add_argument(
        "--model", 
        type=str, 
        choices=["geochat", "grounding_dino", "sam2", "change_model", "all"], 
        help="Specific model to download"
    )
    parser.add_argument(
        "--all", 
        action="store_true", 
        help="Download all configured models"
    )
    parser.add_argument(
        "--cache-dir", 
        type=str, 
        default=settings.HF_HOME, 
        help=f"Hugging Face cache directory (default: {settings.HF_HOME})"
    )
    
    args = parser.parse_args()
    
    if not args.model and not args.all:
        parser.print_help()
        sys.exit(1)
        
    os.makedirs(args.cache_dir, exist_ok=True)
    logger.info(f"Using cache directory: {args.cache_dir}")
    
    targets = []
    if args.all or args.model == "all":
        targets = ["geochat", "grounding_dino", "sam2", "change_model"]
    else:
        targets = [args.model]
        
    for target in targets:
        if target in HF_MODELS:
            download_hf_model(target, HF_MODELS[target], args.cache_dir)
        elif target == "change_model":
            download_change_model(args.cache_dir)
            
    logger.success("Download script finished.")

if __name__ == "__main__":
    main()