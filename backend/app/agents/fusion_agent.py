import time
from typing import Dict, Any, List
from loguru import logger

from app.models.manager import model_manager
from app.schemas.evidence import EvidenceItem, EvidenceType, ConfidenceScore, ConfidenceLevel
from app.schemas.execution import ExecutionStep, ModelExecution
from app.schemas.models import ModelStatus
from app.core.exceptions import IncompatibleImagePairError

class FusionAgent:
    """
    Orchestrates the Cross-Modal Optical + SAR Fusion workflow:
    Validate -> AnySat (Fusion) -> Extract Features -> Optional VLM Synthesis.
    """
    
    async def execute(self, optical_image: Any, sar_image: Any, query: str) -> Dict[str, Any]:
        """
        Executes the cross-modal fusion pipeline.
        
        Args:
            optical_image: ProcessedImage object for the Optical/Multispectral image.
            sar_image: ProcessedImage object for the SAR image.
            query: The user's natural language query.
            
        Returns:
            Dictionary containing answer, findings, evidence, confidence, and execution trace.
        """
        trace: List[ExecutionStep] = []
        evidence: List[EvidenceItem] = []
        step_id = 0

        def new_step(msg: str) -> ExecutionStep:
            nonlocal step_id
            step = ExecutionStep(step_id=step_id, status="running", message=msg, timestamp=str(time.time()))
            step_id += 1
            trace.append(step)
            return step

        # --- STEP 1: Validate Pair ---
        step = new_step("Validating Optical-SAR pair compatibility")
        if optical_image.pil_image.size != sar_image.pil_image.size:
            step.status = "failed"
            step.message = "Spatial dimensions mismatch."
            return {
                "answer": "Validation failed: Optical and SAR images must have the exact same spatial dimensions.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Invalid input").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }
        step.status = "success"
        step.message = "Images are spatially compatible."
        trace.append(step)

        # --- STEP 2: Load Fusion Model (AnySat) ---
        step = new_step("Loading Fusion model (AnySat)")
        try:
            fusion_model = await model_manager.get_model("fusion_model")
            step.status = "success"
            step.message = "AnySat loaded successfully."
            trace.append(step)
        except Exception as e:
            logger.error(f"Failed to load fusion model: {e}")
            step.status = "failed"
            step.message = str(e)
            return {
                "answer": "Failed to load the Optical/SAR fusion model.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Model load failure").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }

        # --- STEP 3: Run Fusion Inference ---
        step = new_step("Running cross-modal feature extraction")
        try:
            fusion_result = fusion_model.infer(optical_image.pil_image, sar_image.pil_image)
            step.status = "success"
            step.model_execution = ModelExecution(
                model_name="fusion_model",
                status=ModelStatus.SUCCESS,
                start_time=step.timestamp,
                end_time=str(time.time())
            )
            trace.append(step)
        except Exception as e:
            logger.error(f"Fusion inference failed: {e}")
            step.status = "failed"
            step.message = str(e)
            return {
                "answer": "Failed to execute cross-modal fusion model.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Inference failure").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }

        # --- STEP 4: Package Fused Features as Evidence ---
        # AnySat provides joint embeddings. We package them for the synthesizer.
        fused_features = {
            "embedding_dimension": fusion_result.get("embedding_dimension"),
            "patch_shape": fusion_result.get("patch_shape"),
            "model_note": fusion_result.get("message")
        }
        evidence.append(EvidenceItem(
            type=EvidenceType.TEXT,
            description="Joint multimodal features extracted from Optical + SAR",
            data=fused_features
        ))

        # --- STEP 5: Optional VLM Synthesis ---
        step = new_step("Synthesizing findings via External VLM")
        vlm_answer = None
        try:
            external_vlm = await model_manager.get_model("external_vlm")
            
            # Construct a prompt for the synthesizer using the raw fused feature data
            import json
            synthesis_prompt = (
                f"User Query: '{query}'\n"
                f"A cross-modal fusion model (AnySat) successfully processed paired Optical and SAR imagery. "
                f"It extracted joint features with dimension {fused_features['embedding_dimension']}. "
                f"Explain how combining Optical (spectral/contextual) and SAR (structural/all-weather) data "
                f"provides a more complete and reliable understanding of the scene than either alone. "
                f"Formulate a concise answer to the user's query based on this complementary fusion."
            )
            
            vlm_response = await external_vlm.synthesize(
                evidence=[{"fusion_model_output": fused_features, "query": query}],
                provider="groq"
            )
            vlm_answer = vlm_response.get("text")
            
            step.status = "success"
            step.model_execution = ModelExecution(
                model_name="external_vlm",
                status=ModelStatus.SUCCESS,
                start_time=step.timestamp,
                end_time=str(time.time())
            )
            trace.append(step)
        except Exception as e:
            logger.warning(f"VLM synthesis failed, relying on raw fusion stats: {e}")
            step.status = "failed"
            step.message = str(e)
            trace.append(step)

        # --- FINAL RESPONSE ---
        optical_findings = "Optical data provided spectral and contextual information."
        sar_findings = "SAR data provided structural and roughness information."
        
        if vlm_answer:
            fused_findings = vlm_answer
            confidence_val = 0.85
            rationale = "Synthesized from joint multimodal feature extraction"
        else:
            fused_findings = "Successfully fused Optical and SAR data to create a joint representation. Semantic description unavailable due to VLM failure."
            confidence_val = 0.70
            rationale = "Based on successful feature concatenation by AnySat"
            
        return {
            "answer": fused_findings,
            "optical_findings": optical_findings,
            "sar_findings": sar_findings,
            "fused_findings": fused_findings,
            "confidence": ConfidenceScore(
                score=confidence_val, 
                level=ConfidenceLevel.HIGH, 
                rationale=rationale
            ).model_dump(),
            "evidence": [e.model_dump() for e in evidence],
            "execution_trace": trace
        }

# Singleton instance
fusion_agent = FusionAgent()