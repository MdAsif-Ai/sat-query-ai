'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { RealisticSatelliteWidget } from '@/components/dashboard/RealisticSatelliteWidget';
import { CapabilityCards } from '@/components/dashboard/CapabilityCards';

// Modular Dashboard Components
import { ModeSelector } from '@/components/dashboard/ModeSelector';
import { ImageUploadPanel } from '@/components/dashboard/ImageUploadPanel';
import { QueryInputPanel } from '@/components/dashboard/QueryInputPanel';
import { SampleDatasetSelector } from '@/components/dashboard/SampleDatasetSelector';
import { TaskDetectionCard } from '@/components/dashboard/TaskDetectionCard';
import { AnalysisProgressTimeline } from '@/components/dashboard/AnalysisProgressTimeline';
import { AnswerPanel } from '@/components/dashboard/AnswerPanel';
import { ConfidencePanel } from '@/components/dashboard/ConfidencePanel';
import { ExecutionTraceViewer } from '@/components/dashboard/ExecutionTraceViewer';
import { VisualEvidenceViewer } from '@/components/dashboard/VisualEvidenceViewer';
import { ModelInformationCard } from '@/components/dashboard/ModelInformationCard';
import { WarningBanner } from '@/components/dashboard/WarningBanner';
import { FallbackStatusBadge } from '@/components/dashboard/FallbackStatusBadge';
import { DownloadReportModal } from '@/components/dashboard/DownloadReportModal';

// Types and API
import { InputMode, UploadedSlotFile, AnalysisResultData, SpatialMetadata } from '@/lib/types';
import { runEarthObservationAnalysis, checkFastApiHealth, ApiStatus } from '@/lib/api';
import { SampleDatasetPreset } from '@/lib/mock-data';
import { Radio, RefreshCw, Sparkles, Activity, ShieldCheck, Satellite, Layers, Compass } from 'lucide-react';

export default function DashboardPage() {
  // Dashboard Input State
  const [mode, setMode] = useState<InputMode>('single');
  const [slotFiles, setSlotFiles] = useState<UploadedSlotFile[]>([]);
  const [activeQuery, setActiveQuery] = useState('');
  const [activeMetadata, setActiveMetadata] = useState<SpatialMetadata | undefined>();
  
  // Analysis Lifecycle State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // FastAPI Connection Status
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isOnline: false,
    endpoint: 'http://localhost:8000',
    engine: 'Local Neural Simulator'
  });

  // Check FastAPI health on mount
  useEffect(() => {
    checkFastApiHealth().then(status => setApiStatus(status));
  }, []);

  // Handle session reset or history restore
  useEffect(() => {
    const handleResetEvent = () => {
      setSlotFiles([]);
      setActiveQuery('');
      setAnalysisResult(null);
    };

    window.addEventListener('satquery-reset-dashboard-event', handleResetEvent);

    const shouldReset = sessionStorage.getItem('satquery_reset_dashboard') === 'true';
    const activeItemStr = sessionStorage.getItem('satquery_active_history_item');

    if (shouldReset) {
      handleResetEvent();
      sessionStorage.removeItem('satquery_reset_dashboard');
    } else if (activeItemStr) {
      try {
        const item = JSON.parse(activeItemStr);
        setActiveQuery(item.query || '');
        if (item.answer) {
          setAnalysisResult(item);
        }
      } catch (e) {
        console.error('Failed to parse history item', e);
      } finally {
        sessionStorage.removeItem('satquery_active_history_item');
      }
    }

    return () => {
      window.removeEventListener('satquery-reset-dashboard-event', handleResetEvent);
    };
  }, []);

  // Switch mode handler
  const handleSelectMode = (newMode: InputMode) => {
    setMode(newMode);
    setSlotFiles([]);
    setAnalysisResult(null);
  };

  // Pre-loaded sample dataset selector handler
  const handleSelectPreset = (preset: SampleDatasetPreset) => {
    setMode(preset.mode);
    setActiveQuery(preset.suggestedQuery);
    setActiveMetadata(preset.metadata);

    // Create virtual slot file objects for preset
    const presetFiles: UploadedSlotFile[] = [
      {
        id: `slot-preset-${preset.id}-1`,
        file: new File([''], `${preset.id}_channel_1.tif`, { type: 'image/tiff' }),
        previewUrl: preset.previewThumbnail || '/satellite-port.jpg',
        progress: 100,
        status: 'completed',
        sensorType: preset.mode === 'optical-sar' ? 'optical-rgb' : 'cartosat-pan',
        label: preset.mode === 'before-after' ? 'T1: Baseline (2022)' : 'Primary Optical Scene',
        metadata: preset.metadata
      }
    ];

    if (preset.mode !== 'single') {
      presetFiles.push({
        id: `slot-preset-${preset.id}-2`,
        file: new File([''], `${preset.id}_channel_2.tif`, { type: 'image/tiff' }),
        previewUrl: preset.mode === 'optical-sar' ? '/satellite-sar.jpg' : '/satellite-port.jpg',
        progress: 100,
        status: 'completed',
        sensorType: preset.mode === 'optical-sar' ? 'sar-sentinel1' : 'optical-rgb',
        label: preset.mode === 'before-after' ? 'T2: Current (2024)' : 'SAR Radar Backscatter (VV/VH)',
        metadata: preset.metadata
      });
    }

    setSlotFiles(presetFiles);
  };

  // Execute Earth Observation Analysis
  const handleExecuteAnalysis = async (queryText: string) => {
    setIsLoading(true);
    setLoadingStep(0);
    setActiveQuery(queryText);
    setAnalysisResult(null);

    const stepInterval = 500;

    // Phase 1: Input Validation
    setTimeout(() => {
      setLoadingStep(1); // Phase 2: Master Agent Planning
      setTimeout(() => {
        setLoadingStep(2); // Phase 3: Specialist Inference
        setTimeout(() => {
          setLoadingStep(3); // Phase 4: Evidence Aggregator
          setTimeout(async () => {
            setLoadingStep(4); // Phase 5: Grounded Response Generation
            
            // Execute request
            const { result } = await runEarthObservationAnalysis({
              query: queryText,
              mode,
              files: slotFiles.map(s => ({
                file: s.file,
                name: s.file.name,
                sensorType: s.sensorType,
                slotLabel: s.label,
                previewUrl: s.previewUrl
              })),
              spatialMetadata: activeMetadata
            });

            setAnalysisResult(result);
            setIsLoading(false);

            // Persist to local mission history log
            try {
              const historyData = localStorage.getItem('satquery_history_db');
              const currentHistory = historyData ? JSON.parse(historyData) : [];
              localStorage.setItem('satquery_history_db', JSON.stringify([result, ...currentHistory]));
            } catch (e) {
              console.error('Failed to save to local history', e);
            }
          }, stepInterval);
        }, stepInterval);
      }, stepInterval);
    }, stepInterval);
  };

  const handleStartNewAnalysis = () => {
    setSlotFiles([]);
    setActiveQuery('');
    setAnalysisResult(null);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1640px] w-full mx-auto space-y-7 selection:bg-teal-500/20 selection:text-white">
      
      {/* Active Session Bar (When processing or results present) */}
      {(analysisResult || isLoading) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4 select-none animate-in fade-in duration-200">
          <div className="text-left space-y-1">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Radio size={18} className="text-teal-400 animate-pulse" />
              Active Observation Session
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              {isLoading ? 'Neural pipeline is executing mission workflow...' : 'Geospatial inference synthesized.'}
            </p>
          </div>

          {!isLoading && (
            <ClayButton
              variant="secondary"
              onClick={handleStartNewAnalysis}
              className="px-3.5 py-1.5 text-xs rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Start New Query</span>
            </ClayButton>
          )}
        </div>
      )}

      {/* Hero Banner with 3D Satellite (Visible when idle) */}
      {!analysisResult && !isLoading && (
        <div className="relative overflow-hidden p-8 sm:p-10 rounded-2xl bg-[#111827]/75 backdrop-blur-xl border border-white/10 select-none group shadow-2xl hover:border-teal-500/30 transition-all duration-300">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-left space-y-3 max-w-2xl">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Ask Your Earth Observation Imagery Anything.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
                Select an input mode (Single Image, Optical + SAR, or Before + After), ingest satellite rasters, and compose your mission query. The Master Agent coordinates specialist neural models automatically.
              </p>
            </div>

            <div className="relative flex items-center justify-center shrink-0 group-hover:scale-102 transition-transform duration-300">
              <RealisticSatelliteWidget />
            </div>
          </div>
        </div>
      )}

      {/* Input Console Workspace (Visible when idle) */}
      {!analysisResult && !isLoading && (
        <div className="space-y-6">
          {/* 1. Mode Selector */}
          <ModeSelector currentMode={mode} onSelectMode={handleSelectMode} />

          {/* 2. Pre-loaded Sample Datasets */}
          <SampleDatasetSelector onSelectPreset={handleSelectPreset} />

          {/* 3. Main Input Cards Grid: Uploader + Query Composer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6">
              <div className="p-6 rounded-2xl bg-[#111827]/75 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300">
                <ImageUploadPanel
                  mode={mode}
                  slotFiles={slotFiles}
                  setSlotFiles={setSlotFiles}
                />
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-6 rounded-2xl bg-[#111827]/75 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300">
                <QueryInputPanel
                  mode={mode}
                  slotFiles={slotFiles}
                  onSubmitQuery={handleExecuteAnalysis}
                  isLoading={isLoading}
                  activeQuery={activeQuery}
                />
              </div>
            </div>
          </div>

          {/* 4. Operational Capability Cards */}
          <CapabilityCards />
        </div>
      )}

      {/* Stepped Timeline View (Visible during in-flight analysis) */}
      {isLoading && (
        <div className="pt-6 animate-in fade-in zoom-in-95 duration-200">
          <AnalysisProgressTimeline
            currentStep={loadingStep}
            taskName={mode === 'before-after' ? 'Bi-temporal Change Detection' : mode === 'optical-sar' ? 'Optical + SAR Cross-Modal Fusion' : 'Single Image Analysis'}
          />
        </div>
      )}

      {/* Comprehensive Results Workbench (Visible upon completion) */}
      {!isLoading && analysisResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Warning Banner (if sensor occlusions or alerts exist) */}
          <WarningBanner warnings={analysisResult.warnings} />

          {/* Top Summary Split: Left = Visual Evidence Canvas, Right = Answer Panel & Routing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Visual Evidence Viewport (Bounding boxes, Masks, Change Comparison, Optical/SAR) */}
            <div className="lg:col-span-7">
              <VisualEvidenceViewer
                evidence={analysisResult.evidence}
                metadata={analysisResult.spatialMetadata}
                query={analysisResult.query}
              />
            </div>

            {/* Right Side: Answer Panel & Key Insights */}
            <div className="lg:col-span-5 space-y-4">
              <AnswerPanel
                query={analysisResult.query}
                answer={analysisResult.answer}
                keyInsights={analysisResult.keyInsights}
                confidence={analysisResult.confidence}
                taskType={analysisResult.taskType}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />

              {/* Fallback Status Pill */}
              <FallbackStatusBadge fallback={analysisResult.fallback} />
            </div>
          </div>

          {/* Middle Row: Task Detection Card & Multi-Factor Confidence Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6">
              <TaskDetectionCard
                taskType={analysisResult.taskType}
                confidence={analysisResult.confidence}
                modelsUsed={analysisResult.modelsUsed}
              />
            </div>

            <div className="lg:col-span-6">
              <ConfidencePanel
                confidence={analysisResult.confidence}
                breakdown={analysisResult.confidenceBreakdown}
              />
            </div>
          </div>

          {/* Bottom Row: Specialist Models Architecture & Auditable Execution Trace */}
          <div className="space-y-6">
            <ModelInformationCard models={analysisResult.modelsUsed} />
            <ExecutionTraceViewer trace={analysisResult.trace} />
          </div>

          {/* Download Report Modal */}
          <DownloadReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            data={analysisResult}
          />
        </div>
      )}

    </div>
  );
}
