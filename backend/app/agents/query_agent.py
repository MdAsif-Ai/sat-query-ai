import re
from typing import List, Dict, Any
from loguru import logger

from app.schemas.enums import TaskType, Modality
class QueryAgent:
    """
    Determines the task type and required tools based on the user's query and image metadata.
    Uses deterministic rules to avoid unnecessary LLM calls for simple classification.
    """
    
    def __init__(self):
        # Define keyword dictionaries for rule-based classification
        self.keywords = {
            TaskType.CAPTION: [
                r'\bdescribe\b', r'\bcaption\b', r'\bsummarize\b', r'\bwhat is in\b', 
                r'\boverview\b', r'\bscene\b'
            ],
            TaskType.GROUNDING: [
                r'\bfind\b', r'\blocate\b', r'\bhighlight\b', r'\bwhere is\b', 
                r'\bdetect\b', r'\bpoint out\b'
            ],
            TaskType.SEGMENTATION: [
                r'\bsegment\b', r'\bmask\b', r'\boutline\b', r'\bboundary\b', 
                r'\bprecise shape\b'
            ],
            TaskType.CHANGE_VQA: [
                r'\bwhat changed\b', r'\bhas the\b', r'\bincreased\b', r'\bdecreased\b', 
                r'\bdifference\b', r'\bchanged\b', r'\bhow much\b'
            ],
            TaskType.CHANGE_DETECTION: [
                r'\bdetect change\b', r'\bchange map\b', r'\bwhere changed\b', 
                r'\bidentify changes\b'
            ],
            TaskType.OPTICAL_SAR_ANALYSIS: [
                r'\buse both\b', r'\bfusion\b', r'\boptical and sar\b', r'\btogether\b', 
                r'\bcombined\b', r'\bcross-modal\b'
            ]
        }

    def _match_keywords(self, query: str, task_type: TaskType) -> bool:
        """Checks if the query contains any keywords for the given task type."""
        for pattern in self.keywords.get(task_type, []):
            if re.search(pattern, query, re.IGNORECASE):
                return True
        return False

    def classify(self, query: str, image_count: int, modalities: List[Modality]) -> Dict[str, Any]:
        """
        Classifies the query and determines the required tools based on rules.
        
        Args:
            query: The natural language user query.
            image_count: Number of uploaded images.
            modalities: List of image modalities (OPTICAL, SAR, MULTISPECTRAL).
            
        Returns:
            Dictionary containing task_type, required_tools, reason_for_selection, confidence.
        """
        query_lower = query.lower()
        required_tools = []
        reason = ""
        confidence = 0.0
        task_type = TaskType.SINGLE_VQA # Default fallback

        # --- RULE 1: Single Image Inputs ---
        if image_count == 1:
            if self._match_keywords(query_lower, TaskType.CAPTION):
                task_type = TaskType.CAPTION
                required_tools = ["geochat"]
                reason = "Query contains captioning keywords ('describe', 'summarize') for a single image."
                confidence = 0.95
                
            elif self._match_keywords(query_lower, TaskType.SEGMENTATION):
                task_type = TaskType.SEGMENTATION
                required_tools = ["grounding_dino", "sam2"]
                reason = "Query requests precise masking/segmentation. Requires DINO for localization and SAM2 for masking."
                confidence = 0.90
                
            elif self._match_keywords(query_lower, TaskType.GROUNDING):
                task_type = TaskType.GROUNDING
                required_tools = ["grounding_dino"]
                reason = "Query requests object localization ('find', 'where is'). DINO selected for bounding box generation."
                confidence = 0.90
                
            else:
                task_type = TaskType.SINGLE_VQA
                required_tools = ["geochat"]
                reason = "Defaulting to Single Image VQA for general question on one image."
                confidence = 0.80

        # --- RULE 2: Two Image Inputs ---
        elif image_count == 2:
            modality_set = set(modalities)
            
            # Check for Optical + SAR pair
            if Modality.OPTICAL in modality_set and Modality.SAR in modality_set or Modality.MULTISPECTRAL in modality_set and Modality.SAR in modality_set:
                task_type = TaskType.OPTICAL_SAR_ANALYSIS
                required_tools = ["fusion_model", "geochat"]
                reason = "Inputs consist of an Optical and SAR pair. AnySat selected for cross-modal fusion."
                confidence = 0.95
                
            # Check for Bi-temporal (Homogeneous modalities)
            elif len(modality_set) == 1:
                if self._match_keywords(query_lower, TaskType.CHANGE_VQA):
                    task_type = TaskType.CHANGE_VQA
                    required_tools = ["change_model", "geochat"]
                    reason = "Query asks about the nature of changes. ChangeFormer selected for mask, GeoChat for VQA."
                    confidence = 0.95
                    
                elif self._match_keywords(query_lower, TaskType.CHANGE_DETECTION):
                    task_type = TaskType.CHANGE_DETECTION
                    required_tools = ["change_model"]
                    reason = "Query requests raw change detection map. ChangeFormer selected."
                    confidence = 0.90
                    
                else:
                    # Fallback if two images are provided but query is vague
                    task_type = TaskType.CHANGE_VQA
                    required_tools = ["change_model", "geochat"]
                    reason = "Two images provided. Defaulting to Change VQA to provide a comprehensive answer."
                    confidence = 0.70
                    
            else:
                # Fallback for incompatible pairs (e.g., 2 SARs but asking for Optical+SAR)
                task_type = TaskType.CHANGE_DETECTION
                required_tools = ["change_model"]
                reason = "Two images provided with mixed/unknown modalities. Defaulting to Change Detection."
                confidence = 0.50

        # --- RULE 3: Invalid Configurations ---
        else:
            reason = f"Invalid number of images provided: {image_count}. Must be 1 or 2."
            confidence = 0.0
            required_tools = []

        logger.info(f"Query classified as '{task_type.value}' with confidence {confidence:.2f}.")
        
        return {
            "task_type": task_type,
            "required_tools": required_tools,
            "reason_for_selection": reason,
            "confidence": confidence
        }

# Singleton instance
query_agent = QueryAgent()