import os
import base64
import asyncio
from typing import Dict, Any, Optional, List
from PIL import Image
import io
import httpx
from loguru import logger

from app.models.base import BaseRemoteSensingModel
from app.core.config import settings
from app.core.exceptions import ExternalAPIFailureError

class ExternalVLM(BaseRemoteSensingModel):
    """
    External VLM integration for Groq and Gemini.
    Used STRICTLY for natural language synthesis of specialist outputs, 
    or as a fallback VLM when local specialists fail.
    """
    
    def __init__(self):
        super().__init__(
            model_name="external_vlm",
            model_id="groq/gemini",
            device="cpu" # Runs on CPU via HTTP
        )
        self.quantized = False


    def load(self):
        if self.loaded:
            return
        self.groq_api_key = settings.GROQ_API_KEY
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.groq_text_model = "llama-3.1-8b-instant"
        self.groq_vision_model = "llama-3.2-90b-vision-preview"
        self.gemini_vision_model = "gemini-1.5-flash"
        self.loaded = True
        logger.info("ExternalVLM initialized (Groq/Gemini ready).")
 
        # Check for empty or placeholder keys
        if self.groq_api_key in [None, "", "your_groq_api_key_here"]:
            self.groq_api_key = None
        if self.gemini_api_key in [None, "", "your_gemini_api_key_here"]:
            self.gemini_api_key = None
            
        if not self.groq_api_key and not self.gemini_api_key:
            logger.warning("Neither GROQ_API_KEY nor GEMINI_API_KEY is properly set. External VLM will fail if called.")
            
        # Default models
        self.groq_text_model = "llama-3.1-8b-instant"
        self.groq_vision_model = "llama-3.2-90b-vision-preview"
        self.gemini_vision_model = "gemini-1.5-flash"
        
        self.loaded = True
        logger.info("ExternalVLM initialized (Groq/Gemini ready).")

    def estimate_memory(self) -> float:
        return 0.0 # Cloud API, 0 local VRAM

    def _encode_image(self, image: Image.Image) -> str:
        """PIL Image to base64 string."""
        buffered = io.BytesIO()
        image.convert("RGB").save(buffered, format="JPEG", quality=85)
        return base64.b64encode(buffered.getvalue()).decode("utf-8")

    async def _request_with_retry(self, client: httpx.AsyncClient, url: str, headers: dict, payload: dict, retries=3) -> dict:
        """Helper to make async HTTP requests with exponential backoff."""
        for attempt in range(retries):
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=30.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 or e.response.status_code >= 500:
                    wait_time = 2 ** attempt
                    logger.warning(f"External API retryable error {e.response.status_code}. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"External API HTTP error: {e.response.text}")
                    raise ExternalAPIFailureError(service_name="ExternalVLM", detail=e.response.text) from e
            except httpx.RequestError as e:
                wait_time = 2 ** attempt
                logger.warning(f"Network error. Retrying in {wait_time}s... ({e})")
                await asyncio.sleep(wait_time)
                
        raise ExternalAPIFailureError(service_name="ExternalVLM", detail="Max retries exceeded")

    async def _call_groq(self, prompt: str, image: Optional[Image.Image] = None, model: Optional[str] = None) -> str:
        """Calls Groq API (OpenAI compatible)."""
        if not self.groq_api_key:
            raise ExternalAPIFailureError("Groq", "API key not configured")
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.groq_api_key}", "Content-Type": "application/json"}
        
        content = []
        if image:
            b64 = self._encode_image(image)
            # Determine if using vision model
            target_model = model or self.groq_vision_model
            content.append({"type": "text", "text": prompt})
            content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})
        else:
            target_model = model or self.groq_text_model
            content.append({"type": "text", "text": prompt})
            
        payload = {
            "model": target_model,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 1024
        }
        
        async with httpx.AsyncClient() as client:
            data = await self._request_with_retry(client, url, headers, payload)
            return data["choices"][0]["message"]["content"]

    async def _call_gemini(self, prompt: str, image: Optional[Image.Image] = None, model: Optional[str] = None) -> str:
        """Calls Gemini API."""
        if not self.gemini_api_key:
            raise ExternalAPIFailureError("Gemini", "API key not configured")
            
        target_model = model or self.gemini_vision_model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={self.gemini_api_key}"
        headers = {"Content-Type": "application/json"}
        
        parts = [{"text": prompt}]
        if image:
            b64 = self._encode_image(image)
            parts.append({"inline_data": {"mime_type": "image/jpeg", "data": b64}})
            
        payload = {"contents": [{"parts": parts}]}
        
        async with httpx.AsyncClient() as client:
            data = await self._request_with_retry(client, url, headers, payload)
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def answer(self, image: Image.Image, question: str, provider: str = "groq", fallback: bool = False) -> Dict[str, Any]:
        """
        Answers a question about an image using external Vision API.
        """
        system_prompt = (
            "You are an external fallback Vision-Language Model. "
            "You are answering a question about a satellite image because the local specialist model was unavailable. "
            "Answer concisely and accurately."
        )
        full_prompt = f"{system_prompt}\n\nQuestion: {question}"
        
        try:
            if provider == "gemini":
                text = await self._call_gemini(full_prompt, image)
                model_name = self.gemini_vision_model
            else:
                text = await self._call_groq(full_prompt, image)
                model_name = self.groq_vision_model
                
            return {
                "text": text,
                "provider": provider,
                "model": model_name,
                "fallback": fallback
            }
        except Exception as e:
            logger.error(f"External 'answer' failed: {e}")
            return {
                "text": "External VLM failed to generate an answer.",
                "provider": provider,
                "model": "unknown",
                "fallback": fallback,
                "error": str(e)
            }

    async def analyze(self, image: Image.Image, question: str, provider: str = "groq", fallback: bool = False) -> Dict[str, Any]:
        """Alias for answer, can be used for more detailed analysis prompts."""
        return await self.answer(image, question, provider, fallback)

    async def synthesize(self, evidence: List[Dict[str, Any]], provider: str = "groq", fallback: bool = False) -> Dict[str, Any]:
        """
        Synthesizes a final natural language answer from structured specialist evidence.
        This does NOT look at images. It relies purely on the JSON/data provided by specialist tools.
        """
        system_prompt = (
            "You are the final synthesis agent for SatQuery AI. "
            "Your job is to take raw evidence generated by specialist remote-sensing models (like bounding boxes, masks, areas) "
            "and formulate a clear, professional natural language response for the user. "
            "Do not hallucinate information. Base your answer ONLY on the provided evidence."
        )
        
        import json
        evidence_str = json.dumps(evidence, indent=2)
        full_prompt = f"{system_prompt}\n\nEvidence:\n{evidence_str}\n\nPlease write the final response:"
        
        try:
            if provider == "gemini":
                text = await self._call_gemini(full_prompt, image=None)
                model_name = self.gemini_vision_model
            else:
                text = await self._call_groq(full_prompt, image=None)
                model_name = self.groq_text_model
                
            return {
                "text": text,
                "provider": provider,
                "model": model_name,
                "fallback": fallback
            }
        except Exception as e:
            logger.error(f"External 'synthesize' failed: {e}")
            return {
                "text": "Failed to synthesize final answer from evidence.",
                "provider": provider,
                "model": "unknown",
                "fallback": fallback,
                "error": str(e)
            }

    # Required abstract methods from BaseRemoteSensingModel
    def _run_inference(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Use specific async methods (answer, analyze, synthesize) instead.")

    def infer(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Use specific async methods (answer, analyze, synthesize) instead.")