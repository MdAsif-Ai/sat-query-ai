'use client';

import React, { useState } from 'react';
import { ChangeDetectionData } from '@/lib/types';
import { Sliders, Calendar, ArrowRight, TrendingUp, TrendingDown, Layers, SplitSquareVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChangeComparisonViewerProps {
  changeData?: ChangeDetectionData;
  primaryUrl?: string;
  secondaryUrl?: string;
}

export function ChangeComparisonViewer({ changeData, primaryUrl, secondaryUrl }: ChangeComparisonViewerProps) {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'heatmap' | 'side-by-side'>('slider');

  const data = changeData || {
    builtUpChangePercent: 14.2,
    vegetationChangePercent: -8.5,
    waterChangePercent: -1.4,
    totalAffectedAreaKm2: 2.34,
    t1Date: '2023-01-10',
    t2Date: '2024-03-24',
    regions: [
      { name: 'Northeast Logistics Hub', type: 'expansion' as const, changePercent: 24.8, description: 'New warehousing complex & paved access roads.' },
      { name: 'Southern Agricultural Belt', type: 'depletion' as const, changePercent: -11.2, description: 'Farmland conversion to industrial plots.' }
    ]
  };

  return (
    <div className="w-full h-full relative flex flex-col justify-between overflow-hidden">
      {/* Top View Mode Switcher */}
      <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md p-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 z-30">
        <button
          type="button"
          onClick={() => setViewMode('slider')}
          className={cn(
            "text-[9px] font-mono uppercase px-2.5 py-1 rounded transition-colors cursor-pointer",
            viewMode === 'slider' ? "bg-orange-500 text-black font-bold" : "text-zinc-300 hover:bg-white/10"
          )}
        >
          Swipe Slider
        </button>
        <button
          type="button"
          onClick={() => setViewMode('heatmap')}
          className={cn(
            "text-[9px] font-mono uppercase px-2.5 py-1 rounded transition-colors cursor-pointer",
            viewMode === 'heatmap' ? "bg-orange-500 text-black font-bold" : "text-zinc-300 hover:bg-white/10"
          )}
        >
          Difference Heatmap
        </button>
        <button
          type="button"
          onClick={() => setViewMode('side-by-side')}
          className={cn(
            "text-[9px] font-mono uppercase px-2.5 py-1 rounded transition-colors cursor-pointer",
            viewMode === 'side-by-side' ? "bg-orange-500 text-black font-bold" : "text-zinc-300 hover:bg-white/10"
          )}
        >
          Side by Side
        </button>
      </div>

      {/* Main Visual Display */}
      <div className="relative w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-orange-950/20 via-black to-zinc-950/40">
        
        {/* 1. Swipe Slider Mode */}
        {viewMode === 'slider' && (
          <div className="relative max-h-full max-w-full aspect-[4/3] rounded-lg overflow-hidden border border-orange-500/30 shadow-2xl select-none">
            {/* T1 Baseline Image (Bottom layer) */}
            <img
              src={primaryUrl || '/satellite-urban.jpg'}
              alt="T1 Baseline Observation"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/satellite-urban.jpg';
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* T2 Current Image (Top layer clipped by slider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={secondaryUrl || '/satellite-port.jpg'}
                alt="T2 Current Observation"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/satellite-port.jpg';
                }}
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%' }}
              />
              {/* Highlight changes inside T2 */}
              <div className="absolute top-1/4 left-1/4 w-28 h-20 bg-orange-500/25 border-2 border-orange-400 rounded-lg animate-pulse" />
            </div>

            {/* Slider Divider Line & Thumb */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8)] z-20 cursor-ew-resize"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-black border-2 border-orange-400 flex items-center justify-center text-orange-400 shadow-xl">
                <Sliders size={12} />
              </div>
            </div>

            {/* Invisible Range Input on top of entire canvas */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-25"
            />

            {/* T1 vs T2 Date Badges */}
            <div className="absolute bottom-3 left-3 bg-black/80 px-2 py-1 rounded text-[9px] font-mono text-zinc-300 border border-white/10 z-10">
              T1: {data.t1Date}
            </div>
            <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-[9px] font-mono text-orange-300 border border-orange-500/30 z-10">
              T2: {data.t2Date}
            </div>
          </div>
        )}

        {/* 2. Difference Heatmap Mode */}
        {viewMode === 'heatmap' && (
          <div className="relative max-h-full max-w-full aspect-[4/3] rounded-lg overflow-hidden border border-orange-500/30 shadow-2xl p-2 bg-black/80 flex flex-col justify-between">
            <div className="w-full h-full relative rounded bg-gradient-to-br from-orange-950/40 via-black to-emerald-950/30 overflow-hidden flex items-center justify-center">
              {/* Expansion Heatmap Zone */}
              <div className="absolute top-1/4 left-1/4 w-36 h-28 bg-orange-500/30 border-2 border-orange-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-pulse">
                <span className="text-[9px] font-mono font-bold bg-black/90 px-2 py-0.5 rounded text-orange-300 border border-orange-400/40">
                  +14.2% BUILT EXPANSION
                </span>
              </div>

              {/* Depletion Zone */}
              <div className="absolute bottom-1/4 right-1/4 w-28 h-20 bg-emerald-500/20 border border-emerald-400 rounded-lg flex items-center justify-center">
                <span className="text-[8px] font-mono font-bold bg-black/90 px-1.5 py-0.5 rounded text-emerald-300">
                  -8.5% VEGETATION
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Side-by-Side Mode */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-3 max-h-full max-w-full aspect-[16/9] w-full">
            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black">
              <img
                src={primaryUrl || '/satellite-urban.jpg'}
                alt="T1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/satellite-urban.jpg';
                }}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded text-zinc-300">
                Baseline (T1): {data.t1Date}
              </span>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-orange-500/30 bg-black">
              <img
                src={secondaryUrl || '/satellite-port.jpg'}
                alt="T2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/satellite-port.jpg';
                }}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded text-orange-400">
                Observation (T2): {data.t2Date}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Land Cover Shift Summary Matrix */}
      <div className="p-3 bg-black/80 border-t border-white/5 grid grid-cols-3 gap-2 text-left">
        <div className="bg-orange-500/10 border border-orange-500/25 p-2 rounded-lg">
          <span className="text-[8px] font-mono text-orange-400 uppercase tracking-wider block">Built-Up Expansion</span>
          <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
            <TrendingUp size={11} className="text-orange-400" />
            +{data.builtUpChangePercent}%
          </span>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/25 p-2 rounded-lg">
          <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-wider block">Vegetation Shift</span>
          <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
            <TrendingDown size={11} className="text-emerald-400" />
            {data.vegetationChangePercent}%
          </span>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/25 p-2 rounded-lg">
          <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-wider block">Impact Area</span>
          <span className="text-xs font-mono font-bold text-white">
            {data.totalAffectedAreaKm2} km²
          </span>
        </div>
      </div>
    </div>
  );
}
