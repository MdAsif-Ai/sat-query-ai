FROM python:3.11-slim

# Install system dependencies for rasterio, opencv, and GDAL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    software-properties-common \
    sudo \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    libgdal-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install PyTorch first with CUDA 12.1 support
# Using specific index URL for compatibility
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cu121

# Copy requirements and install remaining dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8000

# Command to run the application (will be replaced by actual main.py later)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]