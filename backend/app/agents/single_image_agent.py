import time
from typing import Dict, Any, List
from loguru import logger

from app.models.manager import model_manager
from app.schemas.analysis import TaskType
from app.schemas.evidence import EvidenceItem, EvidenceType, BoundingBox, ConfidenceScore, ConfidenceLevel
from app.schemas.execution import ExecutionStep, ModelExecution
from app.schemas.models import ModelStatus
from app.core.exceptions import ModelInferenceFailureError

class SingleImageAgent:
    """
    Orchestrates single-image workflows: VQA, Captioning, and Grounding.
    Dynamically loads models and formats structured evidence.
    """
    
    async def execute(self, task_type: TaskType, query: str, image: Any) -> Dict[str, Any]:
        """
        Routes to the correct workflow based on task_type.
        
        Args:
            task_type: SINGLE_VQA, CAPTION, or GROUNDING.
            query: The user's natural language query.
            image: A ProcessedImage object containing the PIL image and metadata.
            
        Returns:
            Dictionary containing answer, evidence, and execution trace.
        """
        if task_type == TaskType.SINGLE_VQA:
            return await self._run_vqa(query, image)
        elif task_type == TaskType.CAPTION:
            return await self._run_caption(query, image)
        elif task_type == TaskType.GROUNDING:
            return await self._run_grounding(query, image)
        else:
            raise ValueError(f"SingleImageAgent does not support task type: {task_type}")

    async def _run_vqa(self, query: str, image: Any) -> Dict[str, Any]:
        """Workflow: GeoChat VQA"""
        trace = []
        evidence = []
        
        # 1. Load GeoChat
        step = self._create_trace_step("Loading GeoChat model")
        try:
            geochat_model = await model_manager.get_model("geochat")
            step.status = "success"
            step.message = "GeoChat loaded successfully"
            trace.append(step)
            
            # 2. Run Inference
            step = self._create_trace_step("Running VQA inference")
            answer = geochat_model.answer_vqa(image.pil_image, query)
            
            step.status = "success"
            step.message = f"VQA completed. Answer generated."
            step.model_execution = ModelExecution(
                model_name="geochat",
                status=ModelStatus.SUCCESS,
                start_time=step.timestamp,
                end_time=str(time.time()),
                duration_ms=(time.time() - float(step.timestamp)) * 1000
            )
            trace.append(step)
            
            # 3. Format Output
            evidence.append(EvidenceItem(
                type=EvidenceType.TEXT,
                description="Model Answer",
                data={"text": answer}
            ))
            
            return {
                "answer": answer,
                "confidence": ConfidenceScore(score=0.85, level=ConfidenceLevel.HIGH, rationale="VLM direct answer").model_dump(),
                "evidence": [e.model_dump() for e in evidence],
                "execution_trace": trace
            }
            
        except Exception as e:
            logger.error(f"VQA workflow failed: {e}")
            step.status = "failed"
            step.message = str(e)
            trace.append(step)
            return {
                "answer": "Failed to process VQA request.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Model failure").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }

    async def _run_caption(self, query: str, image: Any) -> Dict[str, Any]:
        """Workflow: GeoChat Captioning"""
        trace = []
        evidence = []
        
        step = self._create_trace_step("Loading GeoChat model")
        try:
            geochat_model = await model_manager.get_model("geochat")
            step.status = "success"
            trace.append(step)
            
            step = self._create_trace_step("Running Captioning")
            caption = geochat_model.caption(image.pil_image)
            
            step.status = "success"
            step.model_execution = ModelExecution(
                model_name="geochat",
                status=ModelStatus.SUCCESS,
                start_time=step.timestamp,
                end_time=str(time.time())
            )
            trace.append(step)
            
            evidence.append(EvidenceItem(
                type=EvidenceType.TEXT,
                description="Image Caption",
                data={"text": caption}
            ))
            
            return {
                "answer": caption,
                "confidence": ConfidenceScore(score=0.80, level=ConfidenceLevel.HIGH, rationale="VLM generated caption").model_dump(),
                "evidence": [e.model_dump() for e in evidence],
                "execution_trace": trace
            }
        except Exception as e:
            logger.error(f"Caption workflow failed: {e}")
            step.status = "failed"
            step.message = str(e)
            trace.append(step)
            return {
                "answer": "Failed to generate caption.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Model failure").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }

    async def _run_grounding(self, query: str, image: Any) -> Dict[str, Any]:
        """Workflow: Grounding DINO -> Optional SAM2"""
        trace = []
        evidence = []
        
        # 1. Load Grounding DINO
        step = self._create_trace_step("Loading Grounding DINO")
        try:
            dino_model = await model_manager.get_model("grounding_dino")
            step.status = "success"
            trace.append(step)
            
            # 2. Run DINO Inference (Query acts as the text prompt)
            step = self._create_trace_step(f"Running Grounding DINO for prompt: '{query}'")
            dino_result = dino_model.infer(image.pil_image, text_prompt=query)
            
            step.status = "success"
            step.model_execution = ModelExecution(
                model_name="grounding_dino",
                status=ModelStatus.SUCCESS,
                start_time=step.timestamp,
                end_time=str(time.time())
            )
            trace.append(step)
            
            # Check if objects were found
            if not dino_result["boxes"]:
                return {
                    "answer": f"No objects matching '{query}' were found in the image.",
                    "confidence": ConfidenceScore(score=0.9, level=ConfidenceLevel.HIGH, rationale="Deterministic negative result").model_dump(),
                    "evidence": [],
                    "execution_trace": trace
                }
                
            # 3. Load SAM2 for segmentation (Visual Evidence)
            step = self._create_trace_step("Loading SAM2 for mask generation")
            try:
                sam2_model = await model_manager.get_model("sam2")
                step.status = "success"
                trace.append(step)
                
                # 4. Run SAM2 Inference on the first detected box
                step = self._create_trace_step("Running SAM2 segmentation")
                first_box = dino_result["boxes"][0]
                sam_result = sam2_model.segment_from_box(image.pil_image, first_box)
                
                step.status = "success"
                step.model_execution = ModelExecution(
                    model_name="sam2",
                    status=ModelStatus.SUCCESS,
                    start_time=step.timestamp,
                    end_time=str(time.time())
                )
                trace.append(step)
                
                # 5. Format Evidence
                bbox = BoundingBox(
                    x1=first_box[0], y1=first_box[1], 
                    x2=first_box[2], y2=first_box[3],
                    confidence=dino_result["scores"][0]
                )
                
                # In a full app, we would save the mask to disk and return a URL here.
                # For now, we return the metadata in the data dict.
                evidence.append(EvidenceItem(
                    type=EvidenceType.BBOX,
                    description=f"Bounding box for '{query}'",
                    data=bbox.model_dump()
                ))
                evidence.append(EvidenceItem(
                    type=EvidenceType.MASK,
                    description="Segmentation mask generated by SAM2",
                    data={
                        "area_pixels": sam_result["area_pixels"],
                        "mask_bbox": sam_result["bounding_box"]
                    }
                ))
                
                answer = f"Found {len(dino_result['boxes'])} instance(s) of '{query}'. Generated segmentation masks for visual evidence."
                confidence = float(dino_result["scores"][0])
                
                return {
                    "answer": answer,
                    "confidence": ConfidenceScore(
                        score=confidence, 
                        level=ConfidenceLevel.HIGH if confidence > 0.7 else ConfidenceLevel.MEDIUM, 
                        rationale="Based on Grounding DINO confidence score"
                    ).model_dump(),
                    "evidence": [e.model_dump() for e in evidence],
                    "execution_trace": trace
                }
                
            except Exception as e:
                logger.warning(f"SAM2 failed, falling back to DINO boxes only: {e}")
                step.status = "failed"
                step.message = str(e)
                trace.append(step)
                
                # Fallback to just providing boxes
                bbox = BoundingBox(
                    x1=dino_result["boxes"][0][0], y1=dino_result["boxes"][0][1],
                    x2=dino_result["boxes"][0][2], y2=dino_result["boxes"][0][3],
                    confidence=dino_result["scores"][0]
                )
                evidence.append(EvidenceItem(
                    type=EvidenceType.BBOX,
                    description=f"Bounding box for '{query}' (SAM2 fallback)",
                    data=bbox.model_dump()
                ))
                return {
                    "answer": f"Found {len(dino_result['boxes'])} instance(s) of '{query}'. (Mask generation failed).",
                    "confidence": ConfidenceScore(score=0.6, level=ConfidenceLevel.MEDIUM, rationale="DINO success, SAM2 failure").model_dump(),
                    "evidence": [e.model_dump() for e in evidence],
                    "execution_trace": trace
                }
                
        except Exception as e:
            logger.error(f"Grounding workflow failed: {e}")
            step.status = "failed"
            step.message = str(e)
            trace.append(step)
            return {
                "answer": "Failed to execute grounding workflow.",
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Model failure").model_dump(),
                "evidence": [],
                "execution_trace": trace
            }

    def _create_trace_step(self, message: str) -> ExecutionStep:
        """Helper to create a standardized trace step."""
        return ExecutionStep(
            step_id=len([]), # Will be overwritten or appended sequentially in a real orchestrator
            status="running",
            message=message,
            timestamp=str(time.time())
        )

# Singleton instance
single_image_agent = SingleImageAgent()