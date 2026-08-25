'use client';

import React, { useState, useRef } from 'react';
import { VisualEvidence, SpatialMetadata } from '@/lib/types';
import { GlassCard } from '../ui/GlassCard';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Layers, Crosshair, Eye, EyeOff, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import child evidence sub-components
import { BoundingBoxesViewer } from './BoundingBoxesViewer';
import { SegmentationMasksViewer } from './SegmentationMasksViewer';
import { ChangeComparisonViewer } from './ChangeComparisonViewer';
import { OpticalSarComparisonViewer } from './OpticalSarComparisonViewer';

interface VisualEvidenceViewerProps {
  evidence: VisualEvidence;
  metadata?: SpatialMetadata;
  query?: string;
}

export function VisualEvidenceViewer({ evidence, metadata, query }: VisualEvidenceViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [showCrosshairs, setShowCrosshairs] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [activeLayer, setActiveLayer] = useState<'composite' | 'nir' | 'thermal'>('composite');
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setMouseCoords({ x, y });
  };

  return (
    <GlassCard variant="elevated" className="border-white/10 overflow-hidden flex flex-col p-0 select-none shadow-2xl">
      {/* Top HUD Telemetry Bar */}
      <div className="bg-slate-50 dark:bg-[#070A12]/90 backdrop-blur-md px-4 py-2.5 border-b border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono transition-colors">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Observation Canvas Viewport
          </span>
          <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">|</span>
          <span className="text-zinc-600 dark:text-zinc-400 text-[10px] hidden sm:inline">
            {metadata?.crs || 'EPSG:32643 (UTM Zone 43N)'}
          </span>
        </div>

        {/* View Controls & Zoom */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            className={cn(
              "p-1.5 rounded-lg border text-[10px] flex items-center gap-1 transition-colors cursor-pointer",
              showCrosshairs 
                ? "bg-teal-500/15 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30 dark:border-teal-500/40 font-semibold" 
                : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10"
            )}
            title="Toggle Coordinate Reticle"
          >
            <Crosshair size={12} />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.75}
            className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-30"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>

          <span className="text-[10px] text-zinc-800 dark:text-zinc-200 font-mono font-bold w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-30"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMouseCoords(null)}
        className="relative aspect-video sm:aspect-[16/10] w-full bg-[#030712] overflow-hidden flex items-center justify-center cursor-crosshair group"
      >
        {/* Subtle coordinate grid overlay */}
        {showGrid && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-10" />
        )}

        {/* Dynamic Center Crosshairs */}
        {showCrosshairs && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="w-8 h-8 border border-teal-400/40 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-teal-400/60" />
            </div>
            <div className="absolute left-0 right-0 h-px bg-teal-400/20" />
            <div className="absolute top-0 bottom-0 w-px bg-teal-400/20" />
          </div>
        )}

        {/* Zoomable Inner Canvas Container */}
        <div
          className="w-full h-full relative transition-transform duration-150 ease-out flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Sub-view switcher based on evidence type */}
          {evidence.type === 'bounding-box' && (
            <BoundingBoxesViewer
              imageUrl={evidence.primaryImageUrl}
              boundingBoxes={evidence.boundingBoxes || []}
            />
          )}

          {evidence.type === 'segmentation' && (
            <SegmentationMasksViewer
              imageUrl={evidence.primaryImageUrl}
              polygons={evidence.segmentationPolygons || []}
            />
          )}

          {evidence.type === 'change-map' && (
            <ChangeComparisonViewer
              changeData={evidence.changeData}
              primaryUrl={evidence.primaryImageUrl}
              secondaryUrl={evidence.secondaryImageUrl}
            />
          )}

          {evidence.type === 'cross-modal' && (
            <OpticalSarComparisonViewer
              opticalSarData={evidence.opticalSarData}
              primaryUrl={evidence.primaryImageUrl}
              secondaryUrl={evidence.secondaryImageUrl}
            />
          )}

          {evidence.type === 'vqa' && (
            <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-indigo-950/20 via-black to-teal-950/20 p-4">
              <img
                src={evidence.primaryImageUrl || '/satellite-port.jpg'}
                alt="Satellite Observation"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/satellite-port.jpg';
                }}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
              />
              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-zinc-300">
                <span className="text-teal-400 font-bold">VQA SCENE:</span> Port & Coastal Maritime Terminal
              </div>
            </div>
          )}
        </div>

        {/* Bottom Coordinate Readout HUD */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[9px] font-mono text-zinc-400 z-20 flex items-center gap-2 pointer-events-none">
          <span>PIXEL: {mouseCoords ? `${mouseCoords.x}%, ${mouseCoords.y}%` : '50%, 50%'}</span>
          <span>•</span>
          <span className="text-teal-300">{metadata?.resolutionGSD || '0.5m GSD'}</span>
        </div>
      </div>

      {/* Bottom Derived Telemetry Summary Cards */}
      {evidence.derivedMetrics && Object.keys(evidence.derivedMetrics).length > 0 && (
        <div className="p-3.5 bg-slate-50 dark:bg-[#070A12]/80 border-t border-black/5 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
          {Object.entries(evidence.derivedMetrics).map(([key, val]) => (
            <div key={key} className="bg-white dark:bg-black/40 p-2 rounded-lg border border-black/5 dark:border-white/5 shadow-xs">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block truncate">
                {key}
              </span>
              <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300 block truncate">
                {String(val)}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
