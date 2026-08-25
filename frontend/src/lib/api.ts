import { AnalysisResultData, InputMode, ModelDetail, SpatialMetadata } from './types';
import { generateSimulatedAnalysis, SPECIALIST_MODELS_CATALOG } from './mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AnalyzePayload {
  query: string;
  mode: InputMode;
  files: {
    file?: File;
    name: string;
    sensorType: string;
    slotLabel: string;
    previewUrl?: string;
  }[];
  spatialMetadata?: SpatialMetadata;
}

export interface ApiStatus {
  isOnline: boolean;
  endpoint: string;
  latencyMs?: number;
  engine: 'FastAPI Backend' | 'Local Neural Simulator';
}

/**
 * Check if the FastAPI backend is running
 */
export async function checkFastApiHealth(): Promise<ApiStatus> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return {
        isOnline: true,
        endpoint: API_BASE_URL,
        latencyMs: Date.now() - startTime,
        engine: 'FastAPI Backend'
      };
    }
  } catch (e) {
    // Backend offline or unreachable
  }

  return {
    isOnline: false,
    endpoint: API_BASE_URL,
    engine: 'Local Neural Simulator'
  };
}

/**
 * Fetch available specialist models
 */
export async function getSpecialistModels(): Promise<ModelDetail[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/models`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // fallback to catalog
  }
  return SPECIALIST_MODELS_CATALOG;
}

/**
 * Execute Earth Observation Analysis via FastAPI API or local fallback
 */
export async function runEarthObservationAnalysis(payload: AnalyzePayload): Promise<{
  result: AnalysisResultData;
  source: 'fastapi' | 'simulator';
}> {
  try {
    const formData = new FormData();
    formData.append('query', payload.query);
    formData.append('mode', payload.mode);
    
    if (payload.spatialMetadata) {
      formData.append('metadata', JSON.stringify(payload.spatialMetadata));
    }

    payload.files.forEach((f, idx) => {
      if (f.file) {
        formData.append(`file_${idx}`, f.file);
      }
      formData.append(`file_meta_${idx}`, JSON.stringify({
        name: f.name,
        sensorType: f.sensorType,
        slotLabel: f.slotLabel
      }));
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        result: data,
        source: 'fastapi'
      };
    }
  } catch (err) {
    console.info('FastAPI endpoint unreachable; using verified remote-sensing simulation engine.', err);
  }

  // Graceful deterministic simulator with user uploaded previews
  const simulated = generateSimulatedAnalysis(
    payload.query, 
    payload.mode, 
    payload.files.length, 
    payload.spatialMetadata?.sensor,
    payload.files[0]?.previewUrl,
    payload.files[1]?.previewUrl
  );

  return {
    result: simulated,
    source: 'simulator'
  };
}
