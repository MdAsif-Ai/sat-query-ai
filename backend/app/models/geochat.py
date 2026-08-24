import torch
from typing import Dict, Any
from PIL import Image
from loguru import logger
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig, CLIPImageProcessor

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings

class GeoChatModel(BaseRemoteSensingModel):
    """
    GeoChat-7B specialist model for Remote Sensing VQA, Captioning, and Reasoning.
    Loaded in 4-bit precision to minimize VRAM footprint.
    """
    
    def __init__(self):
        super().__init__(
            model_name="geochat",
            model_id=settings.GEOCHAT_MODEL,
            device=settings.DEVICE
        )
        self.quantized = True
        self.max_new_tokens = 256
        
    def load(self):
        """Loads the GeoChat model, tokenizer, and image processor in 4-bit."""
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
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                quantization_config=bnb_config,
                device_map="auto",
                trust_remote_code=True
            ).to(self.device)
            
            # GeoChat uses the standard CLIP image processor for its vision tower
            self.image_processor = CLIPImageProcessor.from_pretrained(self.model_id)
            
            self.model.eval()
            self.loaded = True
            logger.success("GeoChat model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load GeoChat: {e}")
            raise

    def unload(self):
        """Clears image_processor reference and calls base unload."""
        if hasattr(self, 'image_processor'):
            del self.image_processor
        super().unload()

    def estimate_memory(self) -> float:
        # 7B model in 4-bit is roughly 4.5GB + ~1GB for KV cache/activations
        return 5500.0 

    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Internal method to handle the actual LLaVA/GeoChat generation pipeline.
        """
        image: Image.Image = inputs["image"]
        question: str = inputs["question"]
        max_tokens: int = inputs.get("max_new_tokens", self.max_new_tokens)
        
        # 1. Process Image
        # GeoChat expects RGB images. We ensure this during preprocessing.
        image_tensor = self.image_processor(image, return_tensors="pt")["pixel_values"].to(self.device, dtype=torch.float16)
        
        # 2. Format Prompt (Strict LLaVA/GeoChat template)
        # The <image> token is mandatory as it tells the model where to inject visual features.
        prompt = f"USER: <image>\n{question} ASSISTANT:"
        input_ids = self.tokenizer(prompt, return_tensors="pt").input_ids.to(self.device)
        
        # 3. Generate Response
        with torch.no_grad():
            output_ids = self.model.generate(
                input_ids,
                images=image_tensor,
                max_new_tokens=max_tokens,
                do_sample=False,
                use_cache=True
            )
            
        # 4. Decode and Clean Output
        # Slice off the input prompt from the output to get only the assistant's response
        response_text = self.tokenizer.decode(output_ids[0, input_ids.shape[1]:], skip_special_tokens=True).strip()
        
        return {"text": response_text}

    def infer(self, image: Image.Image, question: str, max_new_tokens: int = 256) -> str:
        """Safe wrapper for VQA/Captioning."""
        inputs = {"image": image, "question": question, "max_new_tokens": max_new_tokens}
        result = super().infer(inputs)
        return result["text"]

    def answer_vqa(self, image: Image.Image, question: str) -> str:
        """Answers a natural language question about the satellite image."""
        return self.infer(image, question)

    def caption(self, image: Image.Image) -> str:
        """Generates a detailed description of the satellite image."""
        # GeoChat responds well to this specific instruction format for dense captioning
        caption_prompt = "Describe the land cover and major objects visible in this image in detail."
        return self.infer(image, caption_prompt, max_new_tokens=300)