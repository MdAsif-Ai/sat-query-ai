import torch
import numpy as np
import glob
import os
from typing import Dict, Any, List
from PIL import Image
from loguru import logger

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings
from app.core.exceptions import ModelUnavailableError


class SAM2Model(BaseRemoteSensingModel):
    def __init__(self):
        super().__init__(
            model_name="sam2",
            model_id="facebook/sam2-hiera-tiny",
            device=settings.DEVICE
        )
        self.quantized = False
        self.predictor = None

    def load(self):
        if self.loaded:
            return
        logger.info(f"Loading {self.model_id} using official sam2 package...")
        try:
            from sam2.build_sam import build_sam2
            from sam2.sam2_image_predictor import SAM2ImagePredictor

            # Prefer the HF-cached blob (149MB) over the corrupt local copy (9MB)
            MIN_BYTES = 100 * 1024 * 1024
            hf_blobs = glob.glob(os.path.expanduser(
                "~/.cache/huggingface/hub/models--facebook--sam2-hiera-tiny/blobs/*"
            ))
            hf_valid = sorted(
                [p for p in hf_blobs if os.path.getsize(p) > MIN_BYTES],
                key=os.path.getsize, reverse=True
            )
            if hf_valid:
                checkpoint_path = hf_valid[0]
                logger.info(f"Using SAM2 checkpoint: {checkpoint_path} "
                            f"({os.path.getsize(checkpoint_path)//1024//1024}MB)")
            else:
                checkpoint_path = os.path.join(settings.MODEL_CACHE_DIR, "sam2_hiera_tiny.pt")

            if not os.path.exists(checkpoint_path) or os.path.getsize(checkpoint_path) < MIN_BYTES:
                raise ModelUnavailableError(
                    "SAM2 checkpoint not found or corrupt. Re-download: "
                    "python -c \"from huggingface_hub import hf_hub_download; "
                    "hf_hub_download('facebook/sam2-hiera-tiny', 'sam2_hiera_tiny.pt')\""
                )

            # build_sam2 resolves configs relative to the sam2 package configs/ dir
            sam2_model = build_sam2(
                config_file="configs/sam2/sam2_hiera_t.yaml",
                ckpt_path=checkpoint_path,
                device=self.device
            )
            self.predictor = SAM2ImagePredictor(sam2_model)
            self.model = sam2_model
            self.loaded = True
            logger.success("SAM 2 model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load SAM 2: {e}")
            raise

    def unload(self):
        if self.predictor is not None:
            del self.predictor
            self.predictor = None
        super().unload()

    def estimate_memory(self) -> float:
        return 500.0

    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        image: Image.Image = inputs["image"]
        prompt_type: str = inputs["prompt_type"]

        image_rgb = image.convert("RGB")
        image_np = np.array(image_rgb)
        self.predictor.set_image(image_np)

        if prompt_type == "box":
            box: List[float] = inputs["box"]
            box_np = np.array(box)
            masks, scores, _ = self.predictor.predict(
                point_coords=None,
                point_labels=None,
                box=box_np[None, :],
                multimask_output=False
            )
        elif prompt_type == "point":
            point: List[float] = inputs["point"]
            point_np = np.array(point)
            masks, scores, _ = self.predictor.predict(
                point_coords=point_np[None, :],
                point_labels=np.array([1]),
                box=None,
                multimask_output=False
            )
        else:
            raise ValueError(f"Invalid prompt type: {prompt_type}")

        mask_tensor = masks[0].astype(bool)
        rows, cols = np.where(mask_tensor)
        if len(rows) == 0 or len(cols) == 0:
            area_pixels = 0
            bbox = None
        else:
            area_pixels = int(len(rows))
            x1, x2 = int(cols.min()), int(cols.max())
            y1, y2 = int(rows.min()), int(rows.max())
            bbox = [x1, y1, x2, y2]

        return {
            "binary_mask": mask_tensor,
            "mask_dimensions": mask_tensor.shape,
            "area_pixels": area_pixels,
            "bounding_box": bbox,
            "confidence": float(scores[0]) if scores is not None else None
        }

    def segment_from_box(self, image: Image.Image, box: List[float]) -> Dict[str, Any]:
        inputs = {"image": image, "prompt_type": "box", "box": box}
        return super().infer(inputs)

    def segment_from_point(self, image: Image.Image, point: List[float]) -> Dict[str, Any]:
        inputs = {"image": image, "prompt_type": "point", "point": point}
        return super().infer(inputs)