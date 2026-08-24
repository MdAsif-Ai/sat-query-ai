import time
from typing import Dict, Any, List, Optional
from loguru import logger

from app.models.manager import model_manager
from app.schemas.evidence import (
    EvidenceItem, EvidenceType, ChangeResult, ConfidenceScore, ConfidenceLevel
)
from app.schemas.execution import ExecutionStep, ModelExecution
from app.schemas.models import ModelStatus
from app.core.exceptions import IncompatibleImagePairError, ModelInferenceFailureError

class ChangeAgent:
    """
    Orchestrates the Bi-Temporal Change Analysis workflow:
    Validate -> ChangeFormer -> Geo Stats -> optional VLM Explanation.
    """
    
    async def execute(self, image_t1: Any, image_t2: Any, query: str) -> Dict[str, Any]:
        """
        Executes the change detection pipeline.
        
        Args:
            image_t1: ProcessedImage object for Time 1.
            image_t2: ProcessedImage object for Time 2.
            query: The user's natural language query.
            
        Returns:
            Dictionary containing answer, evidence, confidence, and execution trace.
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
        step = new_step("Validating image pair compatibility")
        if image_t1.pil_image.size != image_t2.pil_image.size:
            step.status = "failed"
            step.message = "Spatial dimensions mismatch."
            return {
                "answer": "Validation failed: T1 and T2 images must have the exact same spatial dimensions.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Invalid input").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }
        step.status = "success"
        step.message = "Images are spatially compatible."
        trace.append(step)

        # --- STEP 2: Load Change Model ---
        step = new_step("Loading Change Detection model (ChangeFormer)")
        try:
            cd_model = await model_manager.get_model("change_model")
            step.status = "success"
            step.message = "ChangeFormer loaded successfully."
            trace.append(step)
        except Exception as e:
            logger.error(f"Failed to load change model: {e}")
            step.status = "failed"
            step.message = str(e)
            return {
                "answer": "Failed to load the change detection model.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Model load failure").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }

        # --- STEP 3: Run Change Detection Inference ---
        step = new_step("Running change detection inference")
        try:
            cd_result = cd_model.infer(image_t1.pil_image, image_t2.pil_image)
            step.status = "success"
            step.model_execution = ModelExecution(
                model_name="change_model",
                status=ModelStatus.SUCCESS,
                start_time=step.timestamp,
                end_time=str(time.time())
            )
            trace.append(step)
        except Exception as e:
            logger.error(f"Change detection inference failed: {e}")
            step.status = "failed"
            step.message = str(e)
            return {
                "answer": "Failed to execute change detection model.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Inference failure").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }

        # --- STEP 4: Calculate Geospatial Statistics ---
        step = new_step("Calculating changed area statistics")
        changed_ratio = cd_result.get("changed_area_ratio", 0.0)
        change_prob = cd_result.get("change_probability", 0.0)
        # In a real app, we would convert pixel area to hectares using resolution from metadata here.
        # mock_ha = changed_ratio * 1000  # Placeholder calculation
        
        step.status = "success"
        step.message = f"Calculated changed area ratio: {changed_ratio:.4f}"
        trace.append(step)
        
        # Package Change Map Evidence
        change_evidence = ChangeResult(
            change_mask_url="storage/masks/change_mask_latest.png", # Simulated URL
            changed_area_ha=float(changed_ratio * 100), # Mock conversion to hectares
            change_percentage=float(changed_ratio * 100)
        )
        evidence.append(EvidenceItem(
            type=EvidenceType.CHANGE_MAP,
            description="Binary change mask and area statistics",
            data=change_evidence.model_dump()
        ))

        # --- STEP 5: Optional VLM Explanation ---
        step = new_step("Loading GeoChat for natural language explanation")
        vlm_answer = None
        try:
            geochat_model = await model_manager.get_model("geochat")
            step.status = "success"
            step.message = "GeoChat loaded for synthesis."
            trace.append(step)
            
            step = new_step("Running GeoChat for change description")
            # Construct a prompt that includes the quantitative evidence
            vqa_prompt = (
                f"I have analyzed two satellite images taken at different times. "
                f"A change detection model identified that {changed_ratio*100:.2f}% of the area has changed. "
                f"Based on the images, what do you think changed?"
            )
            vlm_answer = geochat_model.answer_vqa(image_t1.pil_image, vqa_prompt) # Typically you'd pass both, but GeoChat takes 1.
            
            step.status = "success"
            step.model_execution = ModelExecution(
                model_name="geochat",
                status=ModelStatus.SUCCESS,
                start_time=step.timestamp,
                end_time=str(time.time())
            )
            trace.append(step)
        except Exception as e:
            logger.warning(f"VLM explanation failed, relying on raw stats: {e}")
            step.status = "failed"
            step.message = str(e)
            trace.append(step)

        # --- FINAL RESPONSE ---
        if vlm_answer:
            answer = vlm_answer
            rationale = "VLM reasoning based on quantitative change mask"
        else:
            answer = f"Detected significant changes in {changed_ratio*100:.2f}% of the observed area."
            rationale = "Statistical output from ChangeFormer model"
            
        confidence_level = ConfidenceLevel.HIGH if change_prob > 0.7 else ConfidenceLevel.MEDIUM
        
        return {
            "answer": answer,
            "confidence": ConfidenceScore(
                score=float(change_prob), 
                level=confidence_level, 
                rationale=rationale
            ).model_dump(),
            "evidence": [e.model_dump() for e in evidence],
            "execution_trace": trace
        }

# Singleton instance
change_agent = ChangeAgent()