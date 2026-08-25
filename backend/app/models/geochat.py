import torch
from typing import Dict, Any
from PIL import Image
from loguru import logger
from transformers import AutoTokenizer, AutoModel, BitsAndBytesConfig

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings

class GeoChatModel(BaseRemoteSensingModel):
    def __init__(self):
        super().__init__(
            model_name="geochat",
            model_id="OpenGVLab/InternVL2_5-1B",
            device=settings.DEVICE
        )
        self.quantized = True
        self.max_new_tokens = 256
        
    def load(self):
        if self.loaded:
            return
        logger.info(f"Loading {self.model_id} in 4-bit precision...")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.float16
        )
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
            self.model = AutoModel.from_pretrained(
                self.model_id,
                quantization_config=bnb_config,
                device_map="auto",
                trust_remote_code=True
            ).eval()
            self.loaded = True
            logger.success("RS-VLM (InternVL2) loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load RS-VLM: {e}")
            raise

    def unload(self):
        super().unload()

    def estimate_memory(self) -> float:
        return 2000.0 

    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        image: Image.Image = inputs["image"]
        question: str = inputs["question"]
        max_tokens: int = inputs.get("max_new_tokens", self.max_new_tokens)
        
        # InternVL2 standard chat template
        prompt = f"<|im_start|>user\n<image>\n{question}<|im_end|><|im_start|>assistant\n"
        
        # InternVL2 native inference API
        response = self.model.chat(
            self.tokenizer,
            image,
            prompt,
            {
                "max_new_tokens": max_tokens,
                "do_sample": False,
                "use_cache": True
            }
        )
        return {"text": response}

    def infer(self, image: Image.Image, question: str, max_new_tokens: int = 256) -> str:
        inputs = {"image": image, "question": question, "max_new_tokens": max_new_tokens}
        result = super().infer(inputs)
        return result["text"]

    def answer_vqa(self, image: Image.Image, question: str) -> str:
        return self.infer(image, question)

    def caption(self, image: Image.Image) -> str:
        caption_prompt = "Describe the land cover and major objects visible in this image in detail."
        return self.infer(image, caption_prompt, max_new_tokens=300)