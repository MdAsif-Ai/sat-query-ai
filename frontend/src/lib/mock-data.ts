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
    type: 'change-map' | 'segmentation' | 'cross-modal' | 'vqa';
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

export const CAPABILITY_CARDS = [
  {
    id: "cap-1",
    title: "Single Image Analysis",
    description: "Extract features, caption scenes, and answer VQA queries on a single satellite snapshot.",
    icon: "Image",
    color: "violet"
  },
  {
    id: "cap-2",
    title: "Temporal Change Detection",
    description: "Detect infrastructure expansion, crop health shifts, and natural disasters across multiple dates.",
    icon: "Calendar",
    color: "orange"
  },
  {
    id: "cap-3",
    title: "Optical + SAR Analysis",
    description: "Combine optical bands with synthetic aperture radar (SAR) to penetrate clouds and capture surface texture.",
    icon: "Layers",
    color: "teal"
  },
  {
    id: "cap-4",
    title: "Grounding & Segmentation",
    description: "Segment structures, fields, roads, or water bodies with pixel-level segmentation masks.",
    icon: "Target",
    color: "purple"
  },
  {
    id: "cap-5",
    title: "Intelligent Agent Routing",
    description: "No manual routing. The supervisor automatically coordinates specialist models for your specific query.",
    icon: "GitBranch",
    color: "amber"
  }
];

// Helper function to simulate routing and analysis
export function runSimulatedAnalysis(queryText: string, filesCount: number): Omit<HistoryItem, "id" | "createdAt"> {
  const query = queryText.toLowerCase();
  
  // 1. Bi-temporal Change Detection
  if (filesCount >= 2 || query.includes("change") || query.includes("difference") || query.includes("before") || query.includes("after") || query.includes("temporal") || query.includes("between")) {
    return {
      query: queryText,
      type: "Bi-temporal Change Analysis",
      imageCount: filesCount || 2,
      status: "completed",
      confidence: 93.7,
      modelsUsed: ["ChangeFormer v2", "RS-VLM-Temporal", "Geo-Analytics-Suite"],
      answer: `Bi-temporal change analysis completed. Detected significant changes between the uploaded observations:\n\n- Urban/Built-up area increased by approximately 24,500 m² (commercial sector expansion).\n- Surface water reservoir level decreased by 4.2% due to seasonal variance.\n- Vegetation cover remains stable, with minor clearing in the south-western coordinates.\n\nThe routing agent selected ChangeFormer v2 to calculate difference vectors, and verified changes against spectral indexes.`,
      evidence: {
        type: "change-map",
        data: {
          builtUpIncrease: "24,500 m² (+6.8%)",
          waterDecrease: "-4.2%",
          vegetationShift: "Negligible (-0.3%)"
        }
      },
      trace: [
        "Input Validator: Validated images, verified identical resolution & UTM zone projection",
        "Master Agent: Query analysis detected temporal comparison keywords",
        "Task Router: Selected Specialist Model 'ChangeFormer v2' for difference mapping",
        "ChangeFormer v2: Executed difference vector computation on Red, Green, Blue, and NIR bands",
        "Evidence Aggregator: Evaluated confidence intervals and generated spatial report"
      ]
    };
  }
  
  // 2. Optical + SAR Analysis
  if (query.includes("sar") || query.includes("radar") || query.includes("polarization") || query.includes("cloud") || query.includes("night") || query.includes("texture")) {
    return {
      query: queryText,
      type: "Optical + SAR Analysis",
      imageCount: filesCount || 2,
      status: "completed",
      confidence: 90.4,
      modelsUsed: ["CrossModal-Net", "Sentinel-SAR-Specialist", "RS-VLM"],
      answer: `Optical-SAR fusion successfully bypassed weather limitations. Synthetic Aperture Radar (SAR) VV/VH backscatter was registered with the optical visible bands:\n\n- Isolated metal-roof structures and high-dielectric materials under cloud canopy.\n- Mapped cargo ship layouts in the harbor using high-contrast radar backscatter signatures.\n- Delineated water-land boundaries unaffected by cloud shadow or atmospheric haze.`,
      evidence: {
        type: "cross-modal",
        data: {
          polarizationMode: "VV / VH Dual Polarization",
          radarFrequency: "C-band (5.405 GHz)",
          fusedResolution: "10-meter aligned grid"
        }
      },
      trace: [
        "Input Validator: Aligned optical bands (RGB) with SAR polarization channels",
        "Master Agent: Query indicates cross-modality or weather bypass requirements",
        "Task Router: Selected 'Sentinel-SAR-Specialist' to extract surface scattering coefficients",
        "CrossModal-Net: Fused backscatter matrices with optical arrays to highlight structures",
        "Evidence Aggregator: Consolidated evidence to eliminate false building positives"
      ]
    };
  }

  // 3. Grounding & Segmentation
  if (query.includes("segment") || query.includes("find") || query.includes("locate") || query.includes("where is") || query.includes("identify") || query.includes("bounding box") || query.includes("water") || query.includes("forest") || query.includes("road") || query.includes("crop") || query.includes("building")) {
    return {
      query: queryText,
      type: "Grounding & Segmentation",
      imageCount: filesCount || 1,
      status: "completed",
      confidence: 95.8,
      modelsUsed: ["SAM-RemoteSensing", "GroundingDINO-RS"],
      answer: `Feature grounding completed successfully. The agent located the queried items within the imagery:\n\n- Roads/Transport: Segmented 12.8 km of highway and auxiliary access roads.\n- Water Containment: Delineated a reservoir perimeter of 3.4 km with precise polygon coordinates.\n- Bounding Boxes: Generated coordinates for 42 buildings within the target area.\n\nSAM-RemoteSensing was used to extract high-accuracy vector boundaries of the water and roads.`,
      evidence: {
        type: "segmentation",
        data: {
          segmentedFeatures: "Roads, Water, Building Footprints",
          totalPolygonVertices: 844,
          groundedInstances: 42
        }
      },
      trace: [
        "Input Validator: Inspected imagery dimensions and metadata coordinate bounds",
        "Master Agent: Query indicates spatial localization and object bounding requests",
        "GroundingDINO-RS: Conducted zero-shot text-to-bbox identification",
        "SAM-RemoteSensing: Created pixel masks based on bounding box prompts",
        "Response Generator: Exported polygons and compiled confidence statistics"
      ]
    };
  }

  // 4. Default: Single Image Analysis / VQA / Captioning
  return {
    query: queryText,
    type: "Single Image Analysis",
    imageCount: filesCount || 1,
    status: "completed",
    confidence: 88.5,
    modelsUsed: ["Geo-Chat v3", "RS-LLaVA"],
    answer: `Analysis completed. Based on visual interpretation of the uploaded scene:\n\n- The image covers a coastal metropolitan area featuring dense residential neighborhoods, a major harbor, and surrounding agricultural plots.\n- Harbor: 8 large container ships and 3 dry docks are active.\n- Urban density: Extremely high toward the central harbor, tapering off into suburbs.\n- Atmospheric conditions: Clear sky with less than 2.0% cumulative cloud cover.`,
    evidence: {
      type: "vqa",
      data: {
        sceneType: "Coastal Metropolitan & Port",
        cloudCover: "1.8%",
        dominantLandCover: "Urban Built-up (62%)"
      }
    },
    trace: [
      "Input Validator: Standard image format validated",
      "Master Agent: Interpreted query as generic Visual Question Answering (VQA) / scene description",
      "Task Router: Selected Geo-Chat v3 for multimodal language inference",
      "Geo-Chat v3: Synthesized semantic visual tokens with language prompt",
      "Response Generator: Structured answer from visual grounding details"
    ]
  };
}
