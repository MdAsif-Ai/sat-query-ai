import torch
from typing import Dict, Any
from PIL import Image
from loguru import logger

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings


class GeoChatModel(BaseRemoteSensingModel):
    """
    GeoChat-7B — a remote-sensing VQA model (LLaVA-1.5 architecture).
    
    GeoChat's HF repo (MBZUAI/GeoChat-7B) contains only config + tokenizer;
    its model_type='geochat' is not registered in modern transformers.
    We load it via LlavaForConditionalGeneration (the parent architecture)
    by forcing config.model_type = 'llava' before calling from_pretrained.
    The 4-bit quantization is applied so it fits within 12GB VRAM.
    """

    def __init__(self):
        super().__init__(
            model_name="geochat",
            model_id="MBZUAI/GeoChat-7B",
            device=settings.DEVICE
        )
        self.quantized = True
        self.max_new_tokens = 256

    def load(self):
        if self.loaded:
            return
        logger.info(f"Loading {self.model_id} in 4-bit precision (LLaVA backend)...")
        try:
            from transformers import (
                AutoTokenizer,
                BitsAndBytesConfig,
                CLIPImageProcessor,
                LlavaConfig,
                LlavaForConditionalGeneration,
            )

            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
                bnb_4bit_compute_dtype=torch.float16,
            )

            # Load tokenizer from GeoChat (it's a standard LLaMA tokenizer)
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_id, use_fast=False
            )

            # Load the config and force model_type to 'llava' so transformers
            # can instantiate LlavaForConditionalGeneration
            config = LlavaConfig.from_pretrained(self.model_id)
            config.model_type = "llava"

            # Patch accelerate dispatch_model to skip model.to() on single-device bnb models
            import accelerate.big_modeling as _bm
            _orig_dispatch = _bm.dispatch_model

            def _safe_dispatch(model, device_map, **kwargs):
                if len(set(device_map.values())) <= 1:
                    # Model already on correct device — skip .to() which breaks bnb
                    model.hf_device_map = dict(device_map)
                    return model
                return _orig_dispatch(model, device_map, **kwargs)

            _bm.dispatch_model = _safe_dispatch
            try:
                self.model = LlavaForConditionalGeneration.from_pretrained(
                    self.model_id,
                    config=config,
                    quantization_config=bnb_config,
                    device_map="auto",
                    low_cpu_mem_usage=True,
                )
            finally:
                _bm.dispatch_model = _orig_dispatch

            # GeoChat uses CLIP ViT-L/14-336 for vision tower
            self.image_processor = CLIPImageProcessor.from_pretrained(
                "openai/clip-vit-large-patch14-336"
            )
            self.model.eval()
            self.loaded = True
            logger.success("GeoChat model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load GeoChat: {e}")
            raise

    def unload(self):
        if hasattr(self, "image_processor"):
            del self.image_processor
        super().unload()

    def estimate_memory(self) -> float:
        return 5500.0

    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        image: Image.Image = inputs["image"]
        question: str = inputs["question"]
        max_tokens: int = inputs.get("max_new_tokens", self.max_new_tokens)

        # Resize to 336x336 (CLIP ViT-L/14-336 expected input)
        image_resized = image.convert("RGB").resize((336, 336))
        image_tensor = self.image_processor(
            image_resized, return_tensors="pt"
        )["pixel_values"].to(self.device, dtype=torch.float16)

        prompt = f"USER: <image>\n{question} ASSISTANT:"
        input_ids = self.tokenizer(
            prompt, return_tensors="pt"
        ).input_ids.to(self.device)

        with torch.no_grad():
            # LlavaForConditionalGeneration (transformers 5.x) uses pixel_values
            output_ids = self.model.generate(
                input_ids,
                pixel_values=image_tensor,
                max_new_tokens=max_tokens,
                do_sample=False,
                use_cache=True,
            )

        response_text = self.tokenizer.decode(
            output_ids[0, input_ids.shape[1]:], skip_special_tokens=True
        ).strip()
        return {"text": response_text}

    def infer(self, image: Image.Image, question: str, max_new_tokens: int = 256) -> str:
        inputs = {"image": image, "question": question, "max_new_tokens": max_new_tokens}
        result = super().infer(inputs)
        return result["text"]

    def answer_vqa(self, image: Image.Image, question: str) -> str:
        return self.infer(image, question)

    def caption(self, image: Image.Image) -> str:
        caption_prompt = (
            "Describe the land cover and major objects visible in this satellite image in detail."
        )
        return self.infer(image, caption_prompt, max_new_tokens=300)