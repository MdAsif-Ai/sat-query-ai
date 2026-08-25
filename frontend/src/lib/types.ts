export type InputMode = 'single' | 'optical-sar' | 'before-after';

export type SensorType = 
  | 'optical-rgb' 
  | 'multispectral' 
  | 'sar-sentinel1' 
  | 'sar-risat' 
  | 'cartosat-pan' 
  | 'thermal-infrared';

export type TaskType = 
  | 'Single Image VQA'
  | 'Scene Captioning'
  | 'Text-Guided Grounding'
  | 'Semantic Segmentation'
  | 'Bi-temporal Change Detection'
  | 'Change-based VQA'
  | 'Optical + SAR Cross-Modal Fusion';

export interface SpatialMetadata {
  crs: string; // e.g. "EPSG:32643 (UTM Zone 43N)"
  resolutionGSD: string; // e.g. "0.5m / pixel"
  dimensions: { width: number; height: number };
  bands: string[]; // e.g. ["Red (B4)", "Green (B3)", "Blue (B2)", "NIR (B8)"]
  acquisitionDate?: string;
  sensor: string; // e.g. "ISRO Cartosat-3" | "Sentinel-2A" | "Sentinel-1 C-Band SAR"
  polarization?: string; // e.g. "VV + VH Dual-Pol"
  centerCoordinates?: { lat: number; lng: number };
}

export interface UploadedSlotFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  sensorType: SensorType;
  label: string; // e.g. "Primary Optical", "SAR Radar", "T1 (Baseline)", "T2 (Current)"
  metadata?: SpatialMetadata;
}

export interface BoundingBox {
  id: string;
  label: string;
  confidence: number;
  coordinates: { x: number; y: number; width: number; height: number }; // normalized 0-100%
  pixelCoordinates?: { xMin: number; yMin: number; xMax: number; yMax: number };
  category: 'vessel' | 'infrastructure' | 'aircraft' | 'vehicle' | 'storage-tank' | 'water-body';
}

export interface SegmentationPolygon {
  id: string;
  label: string;
  color: string;
  points: { x: number; y: number }[]; // normalized polygon vertices
  areaKm2: number;
  confidence: number;
}

export interface ChangeDetectionData {
  builtUpChangePercent: number; // e.g. +14.2
  vegetationChangePercent: number; // e.g. -8.5
  waterChangePercent: number; // e.g. -3.1
  totalAffectedAreaKm2: number;
  t1Date: string;
  t2Date: string;
  changeHeatmapUrl?: string;
  regions: {
    name: string;
    type: 'expansion' | 'depletion' | 'stable';
    changePercent: number;
    description: string;
  }[];
}

export interface OpticalSarData {
  opticalPreviewUrl: string;
  sarPreviewUrl: string;
  polarization: 'VV' | 'VH' | 'Dual VV+VH';
  radarFrequency: string; // "C-Band (5.405 GHz)"
  cloudOcclusionPercent: number; // e.g. 48%
  cloudCanopyBypassSuccess: boolean;
  backscatterIntensity: 'High' | 'Medium' | 'Low';
  metallicReflectanceIdentified: boolean;
  fusionSummary: string;
}

export interface ModelDetail {
  name: string;
  category: 'Orchestrator' | 'Specialist' | 'Fusion' | 'Segmentor' | 'Grounding';
  version: string;
  parameters: string;
  latencyMs: number;
  device: string; // "NVIDIA A100 (ISRO Node 4)"
  architecture: string;
  accuracyMetric: string;
}

export interface ExecutionTraceStep {
  stepIndex: number;
  timestamp: string;
  agent: string; // "Input Validator" | "Master Agent" | "Task Router" | "ChangeFormer v2" | "Evidence Aggregator" | "Response Generator"
  action: string;
  status: 'success' | 'running' | 'warning' | 'skipped';
  details: string;
  latencyMs?: number;
}

export interface WarningAlert {
  id: string;
  severity: 'warning' | 'info' | 'caution';
  title: string;
  message: string;
  impact: string;
}

export interface FallbackStatus {
  isFallback: boolean;
  primaryModel: string;
  activeModel: string;
  reason?: string;
  qualityImpact: 'None' | 'Minor' | 'Moderate';
}

export interface VisualEvidence {
  type: 'vqa' | 'bounding-box' | 'segmentation' | 'change-map' | 'cross-modal';
  primaryImageUrl: string;
  secondaryImageUrl?: string;
  boundingBoxes?: BoundingBox[];
  segmentationPolygons?: SegmentationPolygon[];
  changeData?: ChangeDetectionData;
  opticalSarData?: OpticalSarData;
  derivedMetrics: Record<string, string | number>;
}

export interface AnalysisResultData {
  id: string;
  query: string;
  taskType: TaskType;
  mode: InputMode;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  confidence: number;
  confidenceBreakdown: {
    semanticMatch: number; // 0-100
    spectralAlignment: number; // 0-100
    spatialResolution: number; // 0-100
    modelAgreement: number; // 0-100
  };
  modelsUsed: ModelDetail[];
  answer: string;
  keyInsights: string[];
  evidence: VisualEvidence;
  trace: ExecutionTraceStep[];
  warnings: WarningAlert[];
  fallback: FallbackStatus;
  spatialMetadata?: SpatialMetadata;
}
