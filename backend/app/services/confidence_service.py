from typing import Dict, Any, List, Optional
from loguru import logger

from app.schemas.evidence import ConfidenceScore, ConfidenceLevel

class ConfidenceService:
    """
    Calculates overall confidence based on actual available signals from the pipeline.
    Does not invent statistical probabilities. Uses a transparent weighted heuristic.
    """
    
    def calculate(
        self,
        model_scores: List[float] = None,
        supporting_models_count: int = 1,
        model_agreement: bool = True,
        validation_passed: bool = True,
        fallback_used: bool = False
    ) -> ConfidenceScore:
        """
        Calculates the final confidence score.
        
        Args:
            model_scores: List of confidence scores (0.0 to 1.0) returned directly by models (e.g., DINO scores).
            supporting_models_count: Number of models that contributed to the final evidence.
            model_agreement: True if multiple models agreed (e.g., DINO found an object, SAM2 segmented it).
            validation_passed: True if input validation passed cleanly.
            fallback_used: True if an external VLM fallback was used instead of a specialist model.
            
        Returns:
            ConfidenceScore object containing score, level, and rationale.
        """
        components = {}
        warnings = []
        
        if not validation_passed:
            return ConfidenceScore(
                score=0.0,
                level=ConfidenceLevel.LOW,
                rationale="Validation failed. Cannot compute confidence."
            )
            
        # 1. Base Model Confidence
        if model_scores:
            # Average the explicit scores provided by the models
            model_conf = sum(model_scores) / len(model_scores)
            components["base_model_confidence"] = model_conf
        else:
            # If no explicit score (e.g., VLM text generation), estimate a base system confidence.
            # Text generation models don't output a 0-1 score. We rely on system structure.
            model_conf = 0.75 if not fallback_used else 0.50
            components["base_model_confidence"] = model_conf
            components["base_confidence_source"] = "estimated_system_heuristic"
            if not model_scores:
                warnings.append("Model did not provide explicit confidence score; using estimated base.")

        # 2. System Confidence Adjustments
        system_conf = model_conf
        
        # Boost if multiple models corroborated the evidence
        if supporting_models_count > 1:
            boost = 0.05 * (supporting_models_count - 1)
            system_conf += boost
            components["multi_model_boost"] = boost
            
            if not model_agreement:
                # If multiple models ran but disagreed, penalize heavily
                penalty = 0.25
                system_conf -= penalty
                components["model_agreement_penalty"] = penalty
                warnings.append("Penalty applied: Multi-model execution detected disagreement.")
            else:
                components["model_agreement_verified"] = True

        # Penalize if external fallback was used (specialist failed)
        if fallback_used:
            penalty = 0.20
            system_conf -= penalty
            components["fallback_penalty"] = penalty
            warnings.append("Penalty applied: External VLM fallback used instead of local specialist.")

        # Clamp score between 0.0 and 1.0
        final_score = max(0.0, min(1.0, system_conf))
        
        # 3. Determine Level
        if final_score >= 0.80:
            level = ConfidenceLevel.HIGH
        elif final_score >= 0.55:
            level = ConfidenceLevel.MEDIUM
        else:
            level = ConfidenceLevel.LOW
            
        rationale = (
            f"Base: {model_conf:.2f}. "
            f"System Adjustments: Multi-model ({supporting_models_count}), "
            f"Agreement ({model_agreement}), Fallback ({fallback_used}). "
            f"Final: {final_score:.2f}."
        )

        logger.debug(f"Confidence calculated: {final_score:.2f} ({level.value}). Components: {components}")
        
        return ConfidenceScore(
            score=final_score,
            level=level,
            rationale=rationale
        )

# Singleton instance
confidence_service = ConfidenceService()