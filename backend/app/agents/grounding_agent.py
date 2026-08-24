import time
from typing import Dict, Any, List
from loguru import logger

from app.models.manager import model_manager
from app.schemas.evidence import EvidenceItem, EvidenceType, BoundingBox, ConfidenceScore, ConfidenceLevel
from app.schemas.execution import ExecutionStep, ModelExecution
from app.schemas.models import ModelStatus

class GroundingAgent:
    """
    Orchestrates the Grounding workflow: 
    Query -> Grounding DINO (boxes) -> optional SAM2 (masks).
    """
    
    async def execute(self, query: str, image: Any) -> Dict[str, Any]:
        """
        Executes the grounding pipeline.
        
        Args:
            query: The text prompt / object to find.
            image: A ProcessedImage object containing the PIL image and metadata.
            
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

        # --- STEP 1: Grounding DINO ---
        step = new_step("Loading Grounding DINO model")
        try:
            dino_model = await model_manager.get_model("grounding_dino")
            step.status = "success"
            step.message = "Grounding DINO loaded"
            
            # Run inference
            step = new_step(f"Running Grounding DINO for prompt: '{query}'")
            dino_result = dino_model.infer(image.pil_image, text_prompt=query)
            
            step.status = "success"
            step.model_execution = ModelExecution(
                model_name="grounding_dino",
                status=ModelStatus.SUCCESS,
                start_time=step.timestamp,
                end_time=str(time.time())
            )
            trace.append(step)
            
        except Exception as e:
            logger.error(f"Grounding DINO failed: {e}")
            step.status = "failed"
            step.message = str(e)
            return {
                "answer": "Failed to execute grounding model.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="DINO failure").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }

        # Check if objects were found
        boxes = dino_result.get("boxes", [])
        scores = dino_result.get("scores", [])
        labels = dino_result.get("labels", [])
        
        if not boxes:
            step = new_step("No objects found")
            step.status = "success"
            step.message = "DINO found no matching objects."
            return {
                "answer": f"No objects matching '{query}' were found in the image.",
                "confidence": ConfidenceScore(score=0.95, level=ConfidenceLevel.HIGH, rationale="Deterministic negative").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }

        # --- STEP 2: Optional SAM2 ---
        step = new_step("Loading SAM2 for mask generation")
        sam2_model = None
        try:
            sam2_model = await model_manager.get_model("sam2")
            step.status = "success"
            step.message = "SAM2 loaded"
            trace.append(step)
        except Exception as e:
            logger.warning(f"SAM2 failed to load: {e}. Proceeding with boxes only.")
            step.status = "failed"
            step.message = f"SAM2 load failed: {e}"
            trace.append(step)

        # Process each detected box
        for i, (box, score, label) in enumerate(zip(boxes, scores, labels)):
            # 1. Add Bounding Box Evidence
            bbox = BoundingBox(
                x1=box[0], y1=box[1], 
                x2=box[2], y2=box[3],
                confidence=float(score)
            )
            evidence.append(EvidenceItem(
                type=EvidenceType.BBOX,
                description=f"Bounding box {i+1} for '{label}'",
                data=bbox.model_dump()
            ))
            
            # 2. Attempt Segmentation Mask
            if sam2_model and sam2_model.is_loaded():
                step = new_step(f"Running SAM2 segmentation for box {i+1}")
                try:
                    sam_result = sam2_model.segment_from_box(image.pil_image, box)
                    step.status = "success"
                    step.model_execution = ModelExecution(
                        model_name="sam2",
                        status=ModelStatus.SUCCESS,
                        start_time=step.timestamp,
                        end_time=str(time.time())
                    )
                    trace.append(step)
                    
                    # Add Mask Evidence
                    evidence.append(EvidenceItem(
                        type=EvidenceType.MASK,
                        description=f"Segmentation mask for '{label}'",
                        data={
                            "area_pixels": sam_result["area_pixels"],
                            "mask_bbox": sam_result["bounding_box"]
                        }
                    ))
                except Exception as e:
                    logger.warning(f"SAM2 inference failed for box {i+1}: {e}")
                    step.status = "failed"
                    step.message = str(e)
                    trace.append(step)

        # --- FINAL RESPONSE ---
        answer = f"Found {len(boxes)} instance(s) of '{query}'. Generated bounding boxes"
        if sam2_model and sam2_model.is_loaded():
            answer += " and segmentation masks"
        answer += " for visual evidence."

        avg_confidence = sum(scores) / len(scores) if scores else 0.0
        
        return {
            "answer": answer,
            "confidence": ConfidenceScore(
                score=avg_confidence, 
                level=ConfidenceLevel.HIGH if avg_confidence > 0.7 else ConfidenceLevel.MEDIUM, 
                rationale="Based on Grounding DINO confidence scores"
            ).model_dump(),
            "evidence": [e.model_dump() for e in evidence],
            "execution_trace": trace
        }

# Singleton instance
grounding_agent = GroundingAgent()