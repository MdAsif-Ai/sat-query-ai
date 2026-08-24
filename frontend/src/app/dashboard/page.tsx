'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ImageUploader, UploadedFile } from '@/components/dashboard/ImageUploader';
import { QueryComposer } from '@/components/dashboard/QueryComposer';
import { RoutingStatus } from '@/components/dashboard/RoutingStatus';
import { AnalysisResult } from '@/components/dashboard/AnalysisResult';
import { CapabilityCards } from '@/components/dashboard/CapabilityCards';
import { RealisticSatelliteWidget } from '@/components/dashboard/RealisticSatelliteWidget';
import { runSimulatedAnalysis, HistoryItem } from '@/lib/mock-data';
import { Orbit, Sparkles, RefreshCw, Radio, Satellite, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Active analysis results
  const [activeQuery, setActiveQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<Omit<HistoryItem, 'id' | 'createdAt'> | null>(null);

  // Keep state sync across page session redirects (e.g. new chat triggers, opening history item)
  useEffect(() => {
    const handleResetEvent = () => {
      setFiles([]);
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
        const item = JSON.parse(activeItemStr) as HistoryItem;
        setActiveQuery(item.query);
        setAnalysisResult({
          query: item.query,
          type: item.type,
          imageCount: item.imageCount,
          status: item.status,
          confidence: item.confidence,
          modelsUsed: item.modelsUsed,
          answer: item.answer,
          evidence: item.evidence,
          trace: item.trace
        });

        // Reconstruct mock attachment file inputs
        const mockFiles: UploadedFile[] = Array.from({ length: item.imageCount }).map((_, idx) => ({
          id: `history-restored-${idx}-${Math.random().toString(36).substring(5)}`,
          file: new File([""], `spatial_sensor_capture_${idx + 1}.tif`, { type: "image/tiff" }),
          previewUrl: "geotiff-placeholder",
          progress: 100,
          status: "completed"
        }));
        setFiles(mockFiles);
      } catch (e) {
        console.error("Failed to restore history item from sessionStorage", e);
      } finally {
        sessionStorage.removeItem('satquery_active_history_item');
      }
    }

    return () => {
      window.removeEventListener('satquery-reset-dashboard-event', handleResetEvent);
    };
  }, []);

  const handleAnalysisSubmit = (queryText: string) => {
    setIsLoading(true);
    setLoadingStep(0);
    setActiveQuery(queryText);
    setAnalysisResult(null);

    const intervalTime = 600;
    
    // Step 0: Reading spatial metadata
    setTimeout(() => {
      setLoadingStep(1); // Understanding query
      setTimeout(() => {
        setLoadingStep(2); // Selecting specialist models
        setTimeout(() => {
          setLoadingStep(3); // Analyzing Earth observation data
          setTimeout(() => {
            setLoadingStep(4); // Cross-validating evidence
            setTimeout(() => {
              const simulated = runSimulatedAnalysis(queryText, files.length);
              setAnalysisResult(simulated);
              setIsLoading(false);

              // Persist this query session in history local storage database
              try {
                const historyData = localStorage.getItem('satquery_history_db');
                const currentHistory: HistoryItem[] = historyData ? JSON.parse(historyData) : [];
                
                const newItem: HistoryItem = {
                  id: Math.random().toString(36).substring(7),
                  createdAt: 'Just now',
                  ...simulated
                };
                
                localStorage.setItem('satquery_history_db', JSON.stringify([newItem, ...currentHistory]));
              } catch (e) {
                console.error("Failed to update history data store", e);
              }
            }, intervalTime);
          }, intervalTime);
        }, intervalTime);
      }, intervalTime);
    }, intervalTime);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const startNewAnalysis = () => {
    setFiles([]);
    setActiveQuery('');
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen space-background text-zinc-100 flex flex-col">
      {/* Fixed top Header */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Fixed left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content viewport */}
      <main className="flex-1 md:pl-60 pt-16 flex flex-col min-h-full">
        <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1640px] w-full mx-auto space-y-7">
          
          {/* Dashboard Console Hero Section (When no active analysis) */}
          {!analysisResult && !isLoading && (
            <GlassCard variant="elevated" className="relative overflow-hidden p-7 sm:p-10 border-white/10 select-none group hover:border-white/20 transition-all duration-300">
              
              {/* Space Atmospheric background glow */}
              <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                {/* Left Text */}
                <div className="text-left space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs font-mono uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                    Autonomous Remote Sensing Console
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    Ask Your Satellite Imagery Anything.
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                    Upload your multi-spectral or SAR imagery and ask a natural-language question. Our AI routing agent automatically determines the required specialist analysis.
                  </p>
                </div>

                {/* Right Realistic 3D Earth Observation Satellite */}
                <div className="relative flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500">
                  <RealisticSatelliteWidget />
                </div>
              </div>
            </GlassCard>
          )}

          {/* Active Session Bar (When processing or results present) */}
          {(analysisResult || isLoading) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4 select-none">
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
                <button
                  onClick={startNewAnalysis}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none"
                >
                  <RefreshCw size={12} />
                  Start New Query
                </button>
              )}
            </div>
          )}

          {/* Main workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Upload & Query Composer Workspace */}
            {!analysisResult && !isLoading && (
              <div className="lg:col-span-12 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Universal dropzone upload component */}
                  <ImageUploader files={files} setFiles={setFiles} />
                  
                  {/* Text/NL query composer */}
                  <QueryComposer
                    files={files}
                    onRemoveFile={handleRemoveFile}
                    onSubmit={handleAnalysisSubmit}
                    isLoading={isLoading}
                  />
                </div>
                
                {/* Available capability cards grid */}
                <div className="pt-2">
                  <CapabilityCards />
                </div>
              </div>
            )}

            {/* Display processing status steps when analysis is in-flight */}
            {isLoading && (
              <div className="lg:col-span-12 max-w-xl mx-auto w-full pt-6 animate-in fade-in zoom-in-95 duration-200">
                <RoutingStatus currentStep={loadingStep} />
              </div>
            )}

            {/* Display finalized results */}
            {!isLoading && analysisResult && (
              <div className="lg:col-span-12 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <AnalysisResult
                      query={activeQuery}
                      type={analysisResult.type}
                      confidence={analysisResult.confidence || 90}
                      modelsUsed={analysisResult.modelsUsed || []}
                      answer={analysisResult.answer || ''}
                      evidence={analysisResult.evidence || { type: 'vqa', data: {} }}
                      trace={analysisResult.trace || []}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <RoutingStatus
                      currentStep={5}
                      taskType={analysisResult.type}
                      modelsUsed={analysisResult.modelsUsed}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
