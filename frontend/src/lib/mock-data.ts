import { 
  AnalysisResultData, 
  InputMode, 
  ModelDetail, 
  TaskType, 
  ExecutionTraceStep, 
  WarningAlert, 
  FallbackStatus,
  SpatialMetadata
} from './types';

export interface HistoryItem {
  id: string;
  query: string;
  type: string;
  imageCount: number;
  status: 'completed' | 'failed' | 'processing';
  createdAt: string;
  confidence?: number;
  modelsUsed?: string[];
  answer?: string;
  evidence?: {
    type: string;
    data: any;
  };
  trace?: string[];
}

export const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: "1",
    query: "What changed in the port area between these two dates?",
    type: "Bi-temporal Change Analysis",
    imageCount: 2,
    status: "completed",
    createdAt: "2 minutes ago",
    confidence: 94.8,
    modelsUsed: ["ChangeFormer v2", "RS-VLM-Temporal"],
    answer: "Analysis reveals a 14.2% expansion in built-up urban structures and a corresponding 8.5% decrease in agricultural land cover in the northeast quadrant between observations. Infrastructure expansion is concentrated along the primary transit corridor.",
    evidence: {
      type: "change-map",
      data: {
        builtUpIncrease: "14.2%",
        vegetationDecrease: "8.5%",
        affectedArea: "1.8 km²"
      }
    },
    trace: [
      "Input Validator: Validated 2 GeoTIFF files (spatial match OK)",
      "Master Agent: Classified task as Bi-temporal Change Detection",
      "Query Router: Routed task to Change Detection pipeline",
      "ChangeFormer v2: Computed pixel-wise difference maps",
      "Evidence Aggregator: Isolated cluster changes and filtered noise",
      "Response Generator: Formulated visual report"
    ]
  },
  {
    id: "2",
    query: "Identify built-up regions using optical and SAR datasets.",
    type: "Optical + SAR Analysis",
    imageCount: 2,
    status: "completed",
    createdAt: "Yesterday",
    confidence: 91.2,
    modelsUsed: ["CrossModal-Net", "Sentinel-SAR-Specialist"],
    answer: "Combined optical-SAR analysis isolates dense built-up zones and differentiates surface textures. SAR backscatter signatures (VV/VH polarization) confirm metal roof structures in the industrial zone, which were partially obscured by cloud cover in the optical imagery.",
    evidence: {
      type: "cross-modal",
      data: {
        sarBackscatter: "High (VV/VH)",
        cloudCoverBypass: "Yes (Radar penetration)",
        matchingAccuracy: "91.2%"
      }
    },
    trace: [
      "Input Validator: Detected optical PNG and SAR GeoTIFF",
      "Master Agent: Classified task as Cross-Modal Fusion Analysis",
      "Sentinel-SAR-Specialist: Extracted ground roughness metrics",
      "CrossModal-Net: Registered and fused optical features with SAR backscatter",
      "Response Generator: Verified building footprints against ground-truth database"
    ]
  },
  {
    id: "3",
    query: "Identify the water bodies and reservoirs in this region.",
    type: "Grounding & Segmentation",
    imageCount: 1,
    status: "completed",
    createdAt: "3 days ago",
    confidence: 96.5,
    modelsUsed: ["SAM-RemoteSensing", "GeoLayoutLM"],
    answer: "Located and segmented all visible water bodies (reservoirs, rivers) and road networks. Identified a total of 18 distinct water containment regions covering 4.2 square kilometers, highlighted in the cyan/purple overlay.",
    evidence: {
      type: "segmentation",
      data: {
        waterBodiesCount: 18,
        totalArea: "4.2 km²",
        primaryClass: "Water Reservoir"
      }
    },
    trace: [
      "Input Validator: Validated single high-res RGB image",
      "Master Agent: Classified task as Grounding & Segmentation",
      "GeoLayoutLM: Identified water boundaries",
      "SAM-RemoteSensing: Generated exact polygon masks",
      "Evidence Aggregator: Filtered shadows & terrain occlusion"
    ]
  }
];


export interface SampleDatasetPreset {
  id: string;
  title: string;
  subtitle: string;
  mode: InputMode;
  suggestedQuery: string;
  sensor: string;
  previewThumbnail: string;
  metadata: SpatialMetadata;
  description: string;
}

export const SAMPLE_PRESETS: SampleDatasetPreset[] = [
  {
    id: 'preset-single-mumbai-port',
    title: 'Mumbai Port Maritime Infrastructure',
    subtitle: 'ISRO Cartosat-3 • 0.28m PAN / 1.12m VNIR',
    mode: 'single',
    suggestedQuery: 'Identify all cargo container vessels and count dry dock berths along the western waterfront.',
    sensor: 'ISRO Cartosat-3 (High-Resolution Optical)',
    previewThumbnail: '/satellite-port.jpg',
    metadata: {
      crs: 'EPSG:32643 (WGS 84 / UTM Zone 43N)',
      resolutionGSD: '0.28m PAN / 1.12m VNIR',
      dimensions: { width: 4096, height: 4096 },
      bands: ['Band 1 (Blue)', 'Band 2 (Green)', 'Band 3 (Red)', 'Band 4 (NIR)'],
      acquisitionDate: '2024-04-12 05:42:19 UTC',
      sensor: 'ISRO Cartosat-3 (Panchromatic + Multispectral)',
      centerCoordinates: { lat: 18.9438, lng: 72.8536 }
    },
    description: 'Ultra high-resolution optical scene over Mumbai Port maritime docks. Ideal for object grounding, vessel counting, and infrastructure VQA.'
  },
  {
    id: 'preset-sar-kerala-flood',
    title: 'Kochi Estuary Cloud Bypass & SAR Fusion',
    subtitle: 'Sentinel-2 Optical + Sentinel-1 C-Band SAR Dual-Pol',
    mode: 'optical-sar',
    suggestedQuery: 'Pierce the heavy monsoon cloud canopy to identify submerged aquaculture fields and coastal structures.',
    sensor: 'Sentinel-2 L2A (RGB) + Sentinel-1 (VV+VH SAR)',
    previewThumbnail: '/satellite-sar.jpg',
    metadata: {
      crs: 'EPSG:32643 (WGS 84 / UTM Zone 43N)',
      resolutionGSD: '10.0m Spatial Grid',
      dimensions: { width: 2048, height: 2048 },
      bands: ['Optical RGB (B4,B3,B2)', 'SAR C-Band VV', 'SAR C-Band VH'],
      acquisitionDate: '2024-07-28 00:30:11 UTC',
      sensor: 'Optical + Synthetic Aperture Radar (SAR)',
      polarization: 'VV + VH Cross-Polarization',
      centerCoordinates: { lat: 9.9312, lng: 76.2673 }
    },
    description: 'Cross-modal observation combining cloudy optical imagery with synthetic aperture radar to map surface water and detect metallic roof structures.'
  },
  {
    id: 'preset-change-chennai-urban',
    title: 'Chennai Tech Corridor Urban Growth',
    subtitle: 'Bi-Temporal Observation (2022-03 vs 2024-03)',
    mode: 'before-after',
    suggestedQuery: 'Quantify urban built-up expansion versus reduction in agricultural/wetland acreage between T1 and T2.',
    sensor: 'ISRO Resourcesat-2 LISS-IV & Sentinel-2',
    previewThumbnail: '/satellite-urban.jpg',
    metadata: {
      crs: 'EPSG:32644 (WGS 84 / UTM Zone 44N)',
      resolutionGSD: '5.8m Multispectral',
      dimensions: { width: 3000, height: 3000 },
      bands: ['Green (B2)', 'Red (B3)', 'NIR (B4)', 'SWIR (B11)'],
      acquisitionDate: 'T1: 2022-03-15 | T2: 2024-03-20',
      sensor: 'Bi-Temporal Multispectral Observation',
      centerCoordinates: { lat: 12.8406, lng: 80.1534 }
    },
    description: 'Two-date observation sequence monitoring IT expressway infrastructure development and water reservoir surface area shifts.'
  }
];

export const SPECIALIST_MODELS_CATALOG: ModelDetail[] = [
  {
    name: 'Master Agent Query Orchestrator',
    category: 'Orchestrator',
    version: 'v2.4-Agentic',
    parameters: '70B MoE',
    latencyMs: 142,
    device: 'ISRO Master Compute Node',
    architecture: 'Multi-Agent Supervisor & Intent Planner',
    accuracyMetric: '99.2% Task Classification'
  },
  {
    name: 'ChangeFormer v2 (Bi-Temporal Transformer)',
    category: 'Specialist',
    version: 'v2.1.0',
    parameters: '124M Params',
    latencyMs: 380,
    device: 'ISRO GPU Cluster A100',
    architecture: 'Hierarchical Siamese Vision Transformer',
    accuracyMetric: '94.8% F1 Score on LEVIR-CD'
  },
  {
    name: 'SAM-RemoteSensing (Segment Anything RS)',
    category: 'Segmentor',
    version: 'v1.6-Geo',
    parameters: '636M Params',
    latencyMs: 420,
    device: 'ISRO GPU Cluster A100',
    architecture: 'Promptable ViT-H with Geo-Adapter',
    accuracyMetric: '92.4% mIoU on SpaceNet-8'
  },
  {
    name: 'GroundingDINO-RS (Text-to-BBox)',
    category: 'Grounding',
    version: 'v2.0-Sensing',
    parameters: '240M Params',
    latencyMs: 290,
    device: 'ISRO GPU Cluster A100',
    architecture: 'Dual-Encoder Cross-Modality Grounding',
    accuracyMetric: '89.6% mAP@50 (DOTA-v2)'
  },
  {
    name: 'CrossModal-Net (Optical + SAR Fusion)',
    category: 'Fusion',
    version: 'v3.2',
    parameters: '310M Params',
    latencyMs: 340,
    device: 'ISRO GPU Cluster A100',
    architecture: 'Cross-Attention Radar-Optical Joint Embedder',
    accuracyMetric: '91.8% Cloud-Canopy Penetration'
  },
  {
    name: 'Geo-Chat v3 (Remote Sensing VLM)',
    category: 'Specialist',
    version: 'v3.0-Instruct',
    parameters: '8B Multi-Modal',
    latencyMs: 510,
    device: 'ISRO GPU Cluster A100',
    architecture: 'Remote-Sensing Vision-Language Model',
    accuracyMetric: '88.5% RS-VQA Accuracy'
  }
];

export function generateSimulatedAnalysis(
  query: string, 
  mode: InputMode, 
  filesCount: number,
  customSensor?: string,
  primaryPreviewUrl?: string,
  secondaryPreviewUrl?: string
): AnalysisResultData {
  const q = query.toLowerCase();
  const id = `mission-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const primaryImg = primaryPreviewUrl || (mode === 'before-after' ? '/satellite-urban.jpg' : '/satellite-port.jpg');
  const secondaryImg = secondaryPreviewUrl || (mode === 'optical-sar' ? '/satellite-sar.jpg' : '/satellite-port.jpg');

  // --- Scenario 1: Bi-temporal Change Detection ---
  if (mode === 'before-after' || q.includes('change') || q.includes('expand') || q.includes('difference') || q.includes('before') || q.includes('after') || q.includes('growth')) {
    const models = [
      SPECIALIST_MODELS_CATALOG[0], // Master Agent
      SPECIALIST_MODELS_CATALOG[1], // ChangeFormer v2
      SPECIALIST_MODELS_CATALOG[5]  // Geo-Chat v3
    ];

    return {
      id,
      query,
      taskType: 'Bi-temporal Change Detection',
      mode: 'before-after',
      status: 'completed',
      createdAt: nowStr,
      confidence: 94.6,
      confidenceBreakdown: {
        semanticMatch: 97,
        spectralAlignment: 95,
        spatialResolution: 93,
        modelAgreement: 94
      },
      modelsUsed: models,
      answer: `Bi-temporal Earth observation analysis has successfully detected structural and land cover transitions between Observation T1 (Baseline) and Observation T2 (Current):\n\n• **Urban Built-Up Expansion**: Increased by **+14.2%** (approx. 48,200 m² of new commercial & logistical infrastructure).\n• **Vegetation Cover**: Decreased by **-8.5%** primarily due to planned ground clearance along the transit corridor.\n• **Surface Water Bodies**: Retained stable water boundaries with **-1.4%** seasonal deviation.\n• **High-Confidence Difference Vectors**: ChangeFormer v2 isolated 12 discrete change clusters with zero spatial registration error.`,
      keyInsights: [
        'Built-up land cover expanded by +14.2% across northeastern sectors.',
        'Vegetation clearing observed along secondary transport spine (-8.5%).',
        'Spatial alignment between T1 and T2 validated at sub-pixel accuracy (< 0.2 GSD).'
      ],
      evidence: {
        type: 'change-map',
        primaryImageUrl: primaryImg,
        secondaryImageUrl: secondaryImg,
        changeData: {
          builtUpChangePercent: 14.2,
          vegetationChangePercent: -8.5,
          waterChangePercent: -1.4,
          totalAffectedAreaKm2: 2.34,
          t1Date: '2023-01-10',
          t2Date: '2024-03-24',
          regions: [
            { name: 'Northeast Logistics Hub', type: 'expansion', changePercent: 24.8, description: 'New warehousing complex & paved access roads.' },
            { name: 'Southern Agricultural Belt', type: 'depletion', changePercent: -11.2, description: 'Farmland conversion to industrial plots.' },
            { name: 'Central Retention Pond', type: 'stable', changePercent: -1.4, description: 'Normal seasonal water-level fluctuation.' }
          ]
        },
        derivedMetrics: {
          'Total Spatial Area': '16.4 km²',
          'Change Impact Zone': '2.34 km²',
          'Built-Up Delta': '+48,200 m²',
          'Registration Error': '0.12 pixels'
        }
      },
      trace: [
        { stepIndex: 1, timestamp: '00:00.120', agent: 'Input Validator', action: 'Spatial Registration', status: 'success', details: 'Validated 2 temporal GeoTIFF rasters (EPSG:32643). Sub-pixel homography verified.' },
        { stepIndex: 2, timestamp: '00:00.340', agent: 'Master Agent', action: 'Task Classification', status: 'success', details: 'Detected query intent: Temporal Land-Cover Change Detection. Routed to ChangeFormer v2.' },
        { stepIndex: 3, timestamp: '00:00.890', agent: 'ChangeFormer v2', action: 'Bi-Temporal Inference', status: 'success', details: 'Extracted multi-scale difference features across B2, B3, B4, B8 bands.' },
        { stepIndex: 4, timestamp: '00:01.210', agent: 'Evidence Aggregator', action: 'Cluster Noise Filtering', status: 'success', details: 'Removed atmospheric scattering noise and generated raster change polygons.' },
        { stepIndex: 5, timestamp: '00:01.480', agent: 'Response Generator', action: 'Synthesize Intelligence', status: 'success', details: 'Compiled quantitative area deltas and formatted final ISRO response.' }
      ],
      warnings: [],
      fallback: {
        isFallback: false,
        primaryModel: 'ChangeFormer v2',
        activeModel: 'ChangeFormer v2',
        qualityImpact: 'None'
      },
      spatialMetadata: {
        crs: 'EPSG:32643 (UTM Zone 43N)',
        resolutionGSD: '10.0m / pixel',
        dimensions: { width: 2048, height: 2048 },
        bands: ['Blue (B2)', 'Green (B3)', 'Red (B4)', 'NIR (B8)'],
        sensor: customSensor || 'Sentinel-2 MSI Bi-Temporal'
      }
    };
  }

  // --- Scenario 2: Optical + SAR Cross-Modal Fusion ---
  if (mode === 'optical-sar' || q.includes('sar') || q.includes('radar') || q.includes('cloud') || q.includes('penetrat') || q.includes('polariz')) {
    const models = [
      SPECIALIST_MODELS_CATALOG[0], // Master Agent
      SPECIALIST_MODELS_CATALOG[4], // CrossModal-Net
      SPECIALIST_MODELS_CATALOG[5]  // Geo-Chat v3
    ];

    return {
      id,
      query,
      taskType: 'Optical + SAR Cross-Modal Fusion',
      mode: 'optical-sar',
      status: 'completed',
      createdAt: nowStr,
      confidence: 91.8,
      confidenceBreakdown: {
        semanticMatch: 94,
        spectralAlignment: 90,
        spatialResolution: 89,
        modelAgreement: 93
      },
      modelsUsed: models,
      answer: `Cross-modal Optical + SAR fusion successfully bypassed heavy cloud coverage (48% cloud occlusion in optical RGB):\n\n• **Cloud Penetration**: Synthetic Aperture Radar (C-Band 5.405 GHz) penetrated the cloud layer to reveal surface topology and shoreline profiles.\n• **High Dielectric & Metallic Signatures**: High backscatter intensity in VV/VH cross-polarization identified **9 cargo container vessels** moored in the harbor.\n• **Structural Backscatter**: Double-bounce radar reflections pinpointed high-density industrial warehouses otherwise invisible under cloud shadows.`,
      keyInsights: [
        'Radar backscatter penetrated 48% optical cloud occlusion.',
        '9 maritime vessels identified via high VV/VH cross-polarization signatures.',
        'Fused optical spectral bands with radar roughness matrix for zero-occlusion intelligence.'
      ],
      evidence: {
        type: 'cross-modal',
        primaryImageUrl: primaryImg,
        secondaryImageUrl: secondaryImg,
        opticalSarData: {
          opticalPreviewUrl: primaryImg,
          sarPreviewUrl: secondaryImg,
          polarization: 'Dual VV+VH',
          radarFrequency: 'C-Band (5.405 GHz)',
          cloudOcclusionPercent: 48,
          cloudCanopyBypassSuccess: true,
          backscatterIntensity: 'High',
          metallicReflectanceIdentified: true,
          fusionSummary: 'Optical RGB registered with Sentinel-1 SAR VV/VH dual-pol channels.'
        },
        derivedMetrics: {
          'Cloud Occlusion Bypass': '48.2%',
          'Radar Polarization': 'Dual-Pol (VV/VH)',
          'Radar Wavelength': '5.6 cm (C-Band)',
          'Backscatter Peak': '-4.2 dB (Metallic)'
        }
      },
      trace: [
        { stepIndex: 1, timestamp: '00:00.150', agent: 'Input Validator', action: 'Cross-Modal Channel Alignment', status: 'success', details: 'Co-registered Optical RGB (10m) with SAR Sentinel-1 amplitude matrix.' },
        { stepIndex: 2, timestamp: '00:00.390', agent: 'Master Agent', action: 'Workflow Selection', status: 'success', details: 'Detected cloud occlusion keywords and dual sensors. Engaged CrossModal-Net.' },
        { stepIndex: 3, timestamp: '00:00.920', agent: 'CrossModal-Net', action: 'Radar-Optical Joint Fusion', status: 'success', details: 'Extracted polarimetric scattering matrices and fused with optical NIR bands.' },
        { stepIndex: 4, timestamp: '00:01.310', agent: 'Evidence Aggregator', action: 'False Positive Suppression', status: 'success', details: 'Filtered speckle noise using Lee-Sigma filter and verified vessel backscatter.' },
        { stepIndex: 5, timestamp: '00:01.620', agent: 'Response Generator', action: 'Synthesize Intelligence', status: 'success', details: 'Produced cross-modal grounded intelligence report.' }
      ],
      warnings: [
        {
          id: 'warn-cloud-occlusion',
          severity: 'info',
          title: 'Optical Cloud Occlusion (48%)',
          message: 'Visible spectrum partially obscured. SAR C-Band microwave radar active for surface penetration.',
          impact: 'Optical band confidence adjusted; SAR radar data utilized for primary object classification.'
        }
      ],
      fallback: {
        isFallback: false,
        primaryModel: 'CrossModal-Net',
        activeModel: 'CrossModal-Net',
        qualityImpact: 'None'
      },
      spatialMetadata: {
        crs: 'EPSG:32643 (UTM Zone 43N)',
        resolutionGSD: '10.0m Spatial Grid',
        dimensions: { width: 2048, height: 2048 },
        bands: ['RGB (B4,B3,B2)', 'SAR VV', 'SAR VH'],
        sensor: customSensor || 'Sentinel-2A + Sentinel-1 SAR Dual-Pol'
      }
    };
  }

  // --- Scenario 3: Grounding / Object Bounding Boxes ---
  if (q.includes('locate') || q.includes('box') || q.includes('count') || q.includes('vessel') || q.includes('ship') || q.includes('building') || q.includes('aircraft') || q.includes('tank') || q.includes('grounding')) {
    const models = [
      SPECIALIST_MODELS_CATALOG[0], // Master Agent
      SPECIALIST_MODELS_CATALOG[3], // GroundingDINO-RS
      SPECIALIST_MODELS_CATALOG[5]  // Geo-Chat v3
    ];

    return {
      id,
      query,
      taskType: 'Text-Guided Grounding',
      mode: 'single',
      status: 'completed',
      createdAt: nowStr,
      confidence: 96.2,
      confidenceBreakdown: {
        semanticMatch: 98,
        spectralAlignment: 96,
        spatialResolution: 95,
        modelAgreement: 96
      },
      modelsUsed: models,
      answer: `Text-guided zero-shot grounding completed with high precision:\n\n• **Detected Targets**: Successfully located and grounded **8 Maritime Vessels** (including 2 container carriers and 6 cargo transports) and **4 Oil/Chemical Storage Tanks** in the designated ROI.\n• **Spatial Bounding Coordinates**: Each target is bounded with sub-pixel normalized coordinate boxes.\n• **Classification Quality**: GroundingDINO-RS achieved an average confidence score of 96.2% across all identified bounding boxes.`,
      keyInsights: [
        'Located 8 maritime vessels (container ships, cargo) with avg confidence 96.4%.',
        'Identified 4 cylindrical storage tank terminals along dockside perimeter.',
        'Extracted bounding box pixel coordinates calibrated to UTM Zone 43N projection.'
      ],
      evidence: {
        type: 'bounding-box',
        primaryImageUrl: primaryImg,
        boundingBoxes: [
          { id: 'bbox-1', label: 'Container Vessel A (280m)', confidence: 97.8, category: 'vessel', coordinates: { x: 18, y: 22, width: 24, height: 16 } },
          { id: 'bbox-2', label: 'Cargo Ship B (160m)', confidence: 95.4, category: 'vessel', coordinates: { x: 52, y: 15, width: 18, height: 12 } },
          { id: 'bbox-3', label: 'Bulk Carrier C (210m)', confidence: 96.1, category: 'vessel', coordinates: { x: 68, y: 38, width: 20, height: 14 } },
          { id: 'bbox-4', label: 'Fuel Storage Tank 01', confidence: 98.2, category: 'storage-tank', coordinates: { x: 12, y: 65, width: 14, height: 14 } },
          { id: 'bbox-5', label: 'Fuel Storage Tank 02', confidence: 97.6, category: 'storage-tank', coordinates: { x: 28, y: 68, width: 14, height: 14 } },
          { id: 'bbox-6', label: 'Dry Dock Berth West', confidence: 93.9, category: 'infrastructure', coordinates: { x: 45, y: 55, width: 26, height: 20 } }
        ],
        derivedMetrics: {
          'Total Targets Grounded': 6,
          'Max Target Confidence': '98.2%',
          'Ground Resolution': '0.5m / pixel',
          'Coordinate Precision': 'WGS-84 Reticle'
        }
      },
      trace: [
        { stepIndex: 1, timestamp: '00:00.090', agent: 'Input Validator', action: 'Coordinate System Check', status: 'success', details: 'Checked high-resolution optical image dimensions (4096x4096). Validated metadata.' },
        { stepIndex: 2, timestamp: '00:00.280', agent: 'Master Agent', action: 'Query Decomposition', status: 'success', details: 'Parsed natural language prompt to extract target entity descriptors: "vessel", "storage tank".' },
        { stepIndex: 3, timestamp: '00:00.740', agent: 'GroundingDINO-RS', action: 'Zero-Shot Bounding Inference', status: 'success', details: 'Conducted cross-modal text-image attention to extract target bounding boxes.' },
        { stepIndex: 4, timestamp: '00:01.050', agent: 'Evidence Aggregator', action: 'NMS Suppression', status: 'success', details: 'Applied Non-Maximum Suppression (IoU threshold = 0.45) to merge overlapping detections.' },
        { stepIndex: 5, timestamp: '00:01.320', agent: 'Response Generator', action: 'Compile Report', status: 'success', details: 'Generated itemized detection inventory and telemetry.' }
      ],
      warnings: [],
      fallback: {
        isFallback: false,
        primaryModel: 'GroundingDINO-RS',
        activeModel: 'GroundingDINO-RS',
        qualityImpact: 'None'
      },
      spatialMetadata: {
        crs: 'EPSG:32643 (UTM Zone 43N)',
        resolutionGSD: '0.5m / pixel',
        dimensions: { width: 4096, height: 4096 },
        bands: ['Panchromatic (0.28m)', 'Multispectral VNIR (1.12m)'],
        sensor: customSensor || 'ISRO Cartosat-3 High-Resolution'
      }
    };
  }

  // --- Scenario 4: Semantic Segmentation ---
  if (q.includes('segment') || q.includes('water') || q.includes('reservoir') || q.includes('forest') || q.includes('road') || q.includes('polygon') || q.includes('mask') || q.includes('area')) {
    const models = [
      SPECIALIST_MODELS_CATALOG[0], // Master Agent
      SPECIALIST_MODELS_CATALOG[2], // SAM-RemoteSensing
      SPECIALIST_MODELS_CATALOG[5]  // Geo-Chat v3
    ];

    return {
      id,
      query,
      taskType: 'Semantic Segmentation',
      mode: 'single',
      status: 'completed',
      createdAt: nowStr,
      confidence: 95.8,
      confidenceBreakdown: {
        semanticMatch: 97,
        spectralAlignment: 96,
        spatialResolution: 94,
        modelAgreement: 96
      },
      modelsUsed: models,
      answer: `Semantic segmentation executed using SAM-RemoteSensing with high polygon accuracy:\n\n• **Water Containment**: Delineated **18 distinct water bodies & reservoirs** spanning **4.25 km²** total surface area.\n• **Road & Transportation Network**: Segmented **14.8 km** of primary highways and port access corridors.\n• **Built-Up Polygon Footprints**: Extracted **32 industrial building contours** with sharp boundary vector delineation.\n• **Land Surface Coverage**: Urban infrastructure comprises 58.4%, open water 26.1%, and vegetative perimeter 15.5%.`,
      keyInsights: [
        'Segmented 18 water bodies covering 4.25 km² with zero cloud-shadow misclassifications.',
        'Delineated 14.8 km highway transport corridors with smooth vector polygons.',
        'SAM-RemoteSensing achieved 92.4% mIoU benchmark accuracy on the target scene.'
      ],
      evidence: {
        type: 'segmentation',
        primaryImageUrl: primaryImg,
        segmentationPolygons: [
          {
            id: 'poly-water-1',
            label: 'Main Water Reservoir (2.1 km²)',
            color: '#06b6d4',
            areaKm2: 2.1,
            confidence: 98.4,
            points: [{ x: 20, y: 30 }, { x: 38, y: 22 }, { x: 55, y: 32 }, { x: 48, y: 58 }, { x: 28, y: 50 }]
          },
          {
            id: 'poly-water-2',
            label: 'Port Harbor Basin (1.4 km²)',
            color: '#0284c7',
            areaKm2: 1.4,
            confidence: 97.2,
            points: [{ x: 62, y: 40 }, { x: 88, y: 35 }, { x: 92, y: 70 }, { x: 70, y: 75 }]
          },
          {
            id: 'poly-infra-1',
            label: 'Industrial Terminal Complex (0.75 km²)',
            color: '#d946ef',
            areaKm2: 0.75,
            confidence: 94.6,
            points: [{ x: 15, y: 68 }, { x: 42, y: 65 }, { x: 45, y: 88 }, { x: 18, y: 92 }]
          }
        ],
        derivedMetrics: {
          'Segmented Water Area': '4.25 km²',
          'Total Polygon Vertices': 488,
          'Mean Intersection over Union': '92.4% mIoU',
          'Dominant Land Class': 'Built-up (58.4%)'
        }
      },
      trace: [
        { stepIndex: 1, timestamp: '00:00.110', agent: 'Input Validator', action: 'Spectral Band Verification', status: 'success', details: 'Verified multispectral bands (NDWI water index computed from Green & NIR).' },
        { stepIndex: 2, timestamp: '00:00.310', agent: 'Master Agent', action: 'Task Classification', status: 'success', details: 'Classified task as Semantic Segmentation. Routed to SAM-RemoteSensing pipeline.' },
        { stepIndex: 3, timestamp: '00:00.820', agent: 'SAM-RemoteSensing', action: 'Polygon Mask Generation', status: 'success', details: 'Prompted vision transformer backbone to extract pixel-level segmentation masks.' },
        { stepIndex: 4, timestamp: '00:01.180', agent: 'Evidence Aggregator', action: 'Vector Polygon Simplification', status: 'success', details: 'Calculated geodesic polygon area (km²) and topological consistency.' },
        { stepIndex: 5, timestamp: '00:01.440', agent: 'Response Generator', action: 'Finalize Report', status: 'success', details: 'Generated structured segmentation summary and land cover distribution.' }
      ],
      warnings: [],
      fallback: {
        isFallback: false,
        primaryModel: 'SAM-RemoteSensing',
        activeModel: 'SAM-RemoteSensing',
        qualityImpact: 'None'
      },
      spatialMetadata: {
        crs: 'EPSG:32643 (UTM Zone 43N)',
        resolutionGSD: '2.5m / pixel',
        dimensions: { width: 3000, height: 3000 },
        bands: ['Red (B4)', 'Green (B3)', 'Blue (B2)', 'NIR (B8)', 'SWIR (B11)'],
        sensor: customSensor || 'ISRO Resourcesat-2 LISS-IV'
      }
    };
  }

  // --- Scenario 5: Default Single Image VQA / Captioning ---
  const models = [
    SPECIALIST_MODELS_CATALOG[0], // Master Agent
    SPECIALIST_MODELS_CATALOG[5]  // Geo-Chat v3
  ];

  return {
    id,
    query,
    taskType: 'Single Image VQA',
    mode: 'single',
    status: 'completed',
    createdAt: nowStr,
    confidence: 92.4,
    confidenceBreakdown: {
      semanticMatch: 95,
      spectralAlignment: 92,
      spatialResolution: 91,
      modelAgreement: 92
    },
    answer: `Geospatial Visual Question Answering inference synthesized successfully:\n\n• **Scene Overview**: The observation captures a major coastal port and urban logistics terminal characterized by deep-water berths, breakwaters, and container freight stations.\n• **Operational Activity**: Active maritime transit observed with docked container vessels and cargo loading infrastructure.\n• **Atmospheric & Spectral Quality**: High radiometric quality with less than 2.1% cloud presence and optimal solar azimuth angle (42.6°).`,
    keyInsights: [
      'Identified deep-water container terminal with active vessel loading operations.',
      'Atmospheric clarity is high (<2.1% cloud contamination).',
      'Multimodal VLM extracted full semantic context matching user inquiry.'
    ],
    modelsUsed: models,
    evidence: {
      type: 'vqa',
      primaryImageUrl: primaryImg,
      derivedMetrics: {
        'Scene Category': 'Deepwater Port & Maritime Terminal',
        'Cloud Cover': '2.1%',
        'Sun Elevation': '42.6°',
        'Spectral Dynamic Range': '12-bit Radiometric'
      }
    },
    trace: [
      { stepIndex: 1, timestamp: '00:00.080', agent: 'Input Validator', action: 'Radiometric Calibration', status: 'success', details: 'Parsed image header metadata and verified 12-bit dynamic range.' },
      { stepIndex: 2, timestamp: '00:00.260', agent: 'Master Agent', action: 'Query Interpretation', status: 'success', details: 'Classified task as Visual Question Answering (VQA). Routed to Geo-Chat v3.' },
      { stepIndex: 3, timestamp: '00:00.780', agent: 'Geo-Chat v3', action: 'Multimodal Vision-Language Generation', status: 'success', details: 'Conditioned vision-language transformer on spatial tokens and natural language query.' },
      { stepIndex: 4, timestamp: '00:01.090', agent: 'Evidence Aggregator', action: 'Fact Grounding & Confidence Scoring', status: 'success', details: 'Cross-checked model assertions against spatial telemetry.' },
      { stepIndex: 5, timestamp: '00:01.320', agent: 'Response Generator', action: 'Compile Report', status: 'success', details: 'Generated grounded natural-language response.' }
    ],
    warnings: [],
    fallback: {
      isFallback: false,
      primaryModel: 'Geo-Chat v3',
      activeModel: 'Geo-Chat v3',
      qualityImpact: 'None'
    },
    spatialMetadata: {
      crs: 'EPSG:32643 (UTM Zone 43N)',
      resolutionGSD: '0.8m / pixel',
      dimensions: { width: 2048, height: 2048 },
      bands: ['Red', 'Green', 'Blue', 'NIR'],
      sensor: customSensor || 'ISRO Cartosat / VNIR Optical'
    }
  };
}
