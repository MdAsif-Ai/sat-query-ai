class SatQueryException(Exception):
    """Base exception for all SatQuery AI application errors."""
    def __init__(self, message: str = "An unexpected error occurred in SatQuery AI"):
        self.message = message
        super().__init__(self.message)

# --- Input & Geospatial Exceptions ---

class InvalidImageError(SatQueryException):
    """Raised when an image is corrupt or cannot be opened."""
    def __init__(self, message: str = "Invalid or corrupt image file"):
        super().__init__(message)

class UnsupportedFormatError(SatQueryException):
    """Raised when an uploaded file format is not supported (e.g., not GeoTIFF/TIFF)."""
    def __init__(self, message: str = "Unsupported file format. Only GeoTIFF/TIFF are accepted for geospatial data."):
        super().__init__(message)

class IncompatibleImagePairError(SatQueryException):
    """Raised when a pair of images lacks co-registration, matching CRS, or spatial bounds."""
    def __init__(self, message: str = "Image pair is incompatible. Ensure images are co-registered and share the same CRS/bounds."):
        super().__init__(message)

# --- Model & Hardware Exceptions ---

class ModelUnavailableError(SatQueryException):
    """Raised when a required model checkpoint fails to load or is missing."""
    def __init__(self, model_name: str = "Unknown"):
        super().__init__(f"Model '{model_name}' is unavailable or failed to load.")

class ModelInferenceFailureError(SatQueryException):
    """Raised when a model fails during the inference/prediction step."""
    def __init__(self, model_name: str = "Unknown", detail: str = ""):
        super().__init__(f"Inference failed for model '{model_name}'. Details: {detail}")

class GPUMemoryError(SatQueryException):
    """Raised when the system runs out of GPU VRAM during model loading or inference."""
    def __init__(self, message: str = "GPU VRAM exhausted. Cannot load or run model."):
        super().__init__(message)

# --- External Integration Exceptions ---

class ExternalAPIFailureError(SatQueryException):
    """Raised when an external API (e.g., Groq, Gemini) fails or times out."""
    def __init__(self, service_name: str = "External API", detail: str = ""):
        super().__init__(f"External API '{service_name}' call failed. Details: {detail}")