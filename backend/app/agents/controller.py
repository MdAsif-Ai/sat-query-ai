import time
import json
from typing import Dict, Any, List, Optional
from loguru import logger

from app.services.image_service import image_service, ProcessedImage
from app.agents.query_agent import query_agent
from app.agents.validation_agent import validation_agent
from app.agents.single_image_agent import single_image_agent
from app.agents.grounding_agent import grounding_agent
from app.agents.change_agent import change_agent
from app.agents.fusion_agent import fusion_agent
from app.models.manager import model_manager
from app.schemas.analysis import AnalysisResponse, TaskType, ErrorResponse
from app.schemas.evidence import ConfidenceScore, ConfidenceLevel, EvidenceItem, EvidenceType
from app.schemas.execution import ExecutionTrace, ExecutionStep, AgentDecision, ModelExecution
from app.schemas.models import ModelStatus
from app.core.exceptions import SatQueryException

class SatQueryController:
    """
    Central orchestrator for SatQuery AI.
    Manages the end-to-end pipeline from query intake to final response generation.
    Ensures strict auditable traces, graceful failure handling, and no fabricated results.
    """
    
    def __init__(self):
        self.trace_steps: List[ExecutionStep] = []
        self.step_id_counter = 0
        self.warnings: List[str] = []
        self.fallback_used = False

    def _add_step(self, message: str, status: str = "running") -> ExecutionStep:
        """Helper to create and store execution steps."""
        step = ExecutionStep(
            step_id=self.step_id_counter,
            status=status,
            message=message,
            timestamp=str(time.time())
        )
        self.step_id_counter += 1
        self.trace_steps.append(step)
        logger.info(f"Trace Step {step.step_id}: {message} ({status})")
        return step

    async def process(self, query: str, image_files: List[Any]) -> AnalysisResponse:
        """
        Main entry point for processing a user query and images.
        """
        start_time = time.time()
        self.trace_steps = []
        self.warnings = []
        self.fallback_used = False
        self.step_id_counter = 0
        
        try:
            # --- 1. Receive query and uploaded images ---
            # --- 2. Validate files ---
            # --- 3. Extract metadata ---
            # --- 4. Determine modality ---
            step = self._add_step("Processing and validating uploaded images...")
            processed_images: List[ProcessedImage] = []
            for file in image_files:
                try:
                    # file is expected to be an object with .path and .filename or similar
                    # Assuming a simple object structure for this prototype
                    p_img = image_service.process_image(file.path, file.filename)
                    processed_images.append(p_img)
                except SatQueryException as e:
                    self._add_step(f"Image validation failed: {e.message}", status="failed")
                    return self._format_error_response(query, e.message, e.code)
                    
            step.status = "success"
            step.message = f"Successfully processed {len(processed_images)} image(s)."

            # --- 5. Determine number of images ---
            image_count = len(processed_images)
            modalities = [img.metadata.modality for img in processed_images]
            
            # --- 6. Classify task ---
            step = self._add_step("Classifying user query...")
            classification = query_agent.classify(query, image_count, modalities)
            task_type: TaskType = classification["task_type"]
            required_tools = classification["required_tools"]
            
            agent_decision = AgentDecision(
                step_id=self.step_id_counter,
                task_type=task_type,
                tools_selected=required_tools,
                parameters={"query": query, "thresholds": "default"},
                timestamp=str(time.time())
            )
            step.agent_decision = agent_decision
            step.status = "success"
            step.message = f"Task classified as '{task_type.value}'. Selected tools: {required_tools}"
            
            # --- 7. Select specialist agent ---
            # --- 8. Execute tools ---
            step = self._add_step(f"Executing specialist workflow for {task_type.value}...")
            agent_result = await self._execute_agent(task_type, query, processed_images)
            
            # Check for agent internal failures
            if not agent_result.get("evidence") and "Failed" in agent_result.get("answer", ""):
                self.warnings.append("Specialist agent reported a failure during execution.")
                # We will attempt fallback synthesis later

            # --- 9. Collect structured outputs ---
            # --- 10. Validate outputs ---
            evidence = agent_result.get("evidence", [])
            if not evidence:
                self.warnings.append("Specialist agent returned no evidence.")
                
            # --- 11. Calculate confidence ---
            confidence_data = agent_result.get("confidence", {
                "score": 0.0, "level": ConfidenceLevel.LOW, "rationale": "No confidence data returned."
            })
            confidence = ConfidenceScore(**confidence_data)

            # --- 12. Generate visual evidence ---
            # (In a full app, this saves masks/bboxes to storage and updates URLs.
            # Here we just ensure the evidence items are structured correctly.)
            visual_artifacts = [e["data"].get("mask_url") for e in evidence if e.get("data", {}).get("mask_url")]
            visual_artifacts = [url for url in visual_artifacts if url]

            # --- 13. Optionally send structured evidence to Groq/Gemini for explanation ---
            answer = agent_result.get("answer", "")
            
            # If specialist failed to generate a good natural language answer, use External VLM
            if "Failed" in answer or (task_type in [TaskType.CHANGE_VQA, TaskType.OPTICAL_SAR_ANALYSIS] and not answer):
                step = self._add_step("Specialist answer incomplete. Falling back to External VLM for synthesis...")
                self.fallback_used = True
                try:
                    external_vlm = await model_manager.get_model("external_vlm")
                    vlm_response = await external_vlm.synthesize(evidence=evidence, provider="groq", fallback=True)
                    answer = vlm_response.get("text", "Synthesis failed.")
                    step.status = "success"
                    step.message = "External VLM synthesized final answer."
                except Exception as e:
                    self.warnings.append(f"External VLM synthesis failed: {str(e)}")
                    step.status = "failed"
                    step.message = str(e)
                    if not answer:
                        answer = "Failed to generate an answer."

            # --- 14. Produce final answer ---
            # --- 15. Produce execution trace ---
            # Merge agent trace with controller trace
            agent_trace = agent_result.get("execution_trace", [])
            self.trace_steps.extend(agent_trace)
            
            # Enrich trace with model IDs
            self._enrich_trace_with_model_info(required_tools)

            total_latency = (time.time() - start_time) * 1000
            
            final_trace = ExecutionTrace(
                request_id=f"req_{int(start_time)}",
                steps=self.trace_steps,
                total_duration_ms=total_latency
            )

            return AnalysisResponse(
                query=query,
                task_type=task_type,
                answer=answer,
                confidence=confidence,
                evidence=[EvidenceItem(**e) for e in evidence],
                visual_artifacts=visual_artifacts,
                model_info=[], # Populated by _enrich_trace logically, but can be left empty or extracted
                execution_trace=final_trace,
                warnings=self.warnings,
                errors=[]
            )

        except Exception as e:
            logger.exception("Unhandled error in SatQueryController")
            return self._format_error_response(query, f"Internal server error: {str(e)}", 500)

    async def _execute_agent(self, task_type: TaskType, query: str, images: List[ProcessedImage]) -> Dict[str, Any]:
        """Routes to the correct specialist agent."""
        try:
            if task_type in [TaskType.SINGLE_VQA, TaskType.CAPTION]:
                return await single_image_agent.execute(task_type, query, images[0])
            elif task_type in [TaskType.GROUNDING, TaskType.SEGMENTATION]:
                return await grounding_agent.execute(query, images[0])
            elif task_type in [TaskType.CHANGE_DETECTION, TaskType.CHANGE_VQA]:
                return await change_agent.execute(images[0], images[1], query)
            elif task_type == TaskType.OPTICAL_SAR_ANALYSIS:
                # Assume images[0] is optical, images[1] is SAR based on heuristic
                return await fusion_agent.execute(images[0], images[1], query)
            else:
                return {
                    "answer": f"Unsupported task type: {task_type.value}",
                    "evidence": [],
                    "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Unsupported task").model_dump(),
                    "execution_trace": []
                }
        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            return {
                "answer": "Failed to execute specialist model workflow.",
                "evidence": [],
                "confidence": ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Agent failure").model_dump(),
                "execution_trace": []
            }

    def _enrich_trace_with_model_info(self, used_tools: List[str]):
        """Updates trace steps with model IDs and fallback usage."""
        for step in self.trace_steps:
            if step.model_execution:
                model_name = step.model_execution.model_name
                if model_name in used_tools or model_name == "external_vlm":
                    # In a real app, we'd fetch the exact ID used from the manager
                    step.model_execution.model_name = f"{model_name} ({model_manager._registry[model_name].model_id if model_name in model_manager._registry else 'N/A'})"
            
        if self.fallback_used:
            self.warnings.append("External VLM fallback was utilized for final synthesis.")

    def _format_error_response(self, query: str, message: str, code: int) -> AnalysisResponse:
        """Formats a standard error response."""
        error = ErrorResponse(error_type="ProcessingError", message=message, code=code)
        return AnalysisResponse(
            query=query,
            task_type=TaskType.SINGLE_VQA, # Default
            answer="",
            confidence=ConfidenceScore(score=0.0, level=ConfidenceLevel.LOW, rationale="Processing failed"),
            evidence=[],
            visual_artifacts=[],
            model_info=[],
            execution_trace=ExecutionTrace(request_id="error", steps=self.trace_steps, total_duration_ms=0.0),
            warnings=self.warnings,
            errors=[error]
        )

# Singleton instance
satquery_controller = SatQueryController()