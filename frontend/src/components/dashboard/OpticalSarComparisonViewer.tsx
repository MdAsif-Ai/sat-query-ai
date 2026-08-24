'use client';

import React, { useState } from 'react';
import { OpticalSarData } from '@/lib/types';
import { Layers, Radio, Sliders, ShieldCheck, Eye, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpticalSarComparisonViewerProps {
  opticalSarData?: OpticalSarData;
  primaryUrl?: string;
  secondaryUrl?: string;
}

export function OpticalSarComparisonViewer({ opticalSarData, primaryUrl, secondaryUrl }: OpticalSarComparisonViewerProps) {
  const [blendRatio, setBlendRatio] = useState<number>(0.5); // 0 = 100% optical, 1 = 100% SAR
  const [viewMode, setViewMode] = useState<'fusion-blend' | 'side-by-side' | 'sar-only'>('fusion-blend');

  const data = opticalSarData || {
    opticalPreviewUrl: primaryUrl || '/satellite-port.jpg',
    sarPreviewUrl: secondaryUrl || '/satellite-sar.jpg',
    polarization: 'Dual VV+VH' as const,
    radarFrequency: 'C-Band (5.405 GHz)',
    cloudOcclusionPercent: 48,
    cloudCanopyBypassSuccess: true,
    backscatterIntensity: 'High' as const,
    metallicReflectanceIdentified: true,
    fusionSummary: 'Optical RGB registered with Sentinel-1 SAR VV/VH dual-pol channels.'
  };

  return (
    <div className="w-full h-full relative flex flex-col justify-between overflow-hidden">
      {/* Top Controls Bar */}
      <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md p-1.5 rounded-lg border border-white/10 flex items-center gap-2 z-30">
        <button
          type="button"
          onClick={() => setViewMode('fusion-blend')}
          className={cn(
            "text-[9px] font-mono uppercase px-2.5 py-1 rounded transition-colors cursor-pointer",
            viewMode === 'fusion-blend' ? "bg-teal-500 text-black font-bold" : "text-zinc-300 hover:bg-white/10"
          )}
        >
          Spectral-Radar Blend
        </button>
        <button
          type="button"
          onClick={() => setViewMode('side-by-side')}
          className={cn(
            "text-[9px] font-mono uppercase px-2.5 py-1 rounded transition-colors cursor-pointer",
            viewMode === 'side-by-side' ? "bg-teal-500 text-black font-bold" : "text-zinc-300 hover:bg-white/10"
          )}
        >
          Side by Side
        </button>
        <button
          type="button"
          onClick={() => setViewMode('sar-only')}
          className={cn(
            "text-[9px] font-mono uppercase px-2.5 py-1 rounded transition-colors cursor-pointer",
            viewMode === 'sar-only' ? "bg-teal-500 text-black font-bold" : "text-zinc-300 hover:bg-white/10"
          )}
        >
          SAR Radar Backscatter
        </button>
      </div>

      {/* Main Visual Display */}
      <div className="relative w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-teal-950/20 via-black to-slate-950/40">
        
        {/* 1. Cross-Modal Fusion Blend View */}
        {viewMode === 'fusion-blend' && (
          <div className="relative max-h-full max-w-full aspect-[4/3] rounded-lg overflow-hidden border border-teal-500/30 shadow-2xl">
            {/* Base Layer: Optical RGB */}
            <img
              src={data.opticalPreviewUrl || '/satellite-port.jpg'}
              alt="Optical RGB"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/satellite-port.jpg';
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlaid SAR Radar Grayscale/False Color Layer with Dynamic Opacity */}
            <div
              className="absolute inset-0 bg-teal-950/50 mix-blend-screen transition-opacity duration-150"
              style={{ opacity: blendRatio }}
            >
              {/* Radar backscatter highlights for metallic vessels */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,rgba(20,184,166,0.6)_0%,transparent_35%)]" />
              <div className="absolute top-1/3 left-1/3 w-32 h-20 border-2 border-teal-400 bg-teal-500/20 rounded-lg shadow-[0_0_15px_rgba(20,184,166,0.5)] flex items-center justify-center">
                <span className="text-[8px] font-mono font-bold bg-black/90 px-1.5 py-0.5 rounded text-teal-300 border border-teal-400/40">
                  RADAR RETURN: HIGH DIELECTRIC
                </span>
              </div>
            </div>

            {/* Bottom Blend Slider Control Bar on canvas */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-teal-500/30 flex items-center gap-3 z-20">
              <span className="text-[9px] font-mono text-zinc-400">OPTICAL</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={blendRatio}
                onChange={(e) => setBlendRatio(parseFloat(e.target.value))}
                className="w-28 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <span className="text-[9px] font-mono text-teal-300 font-bold">SAR ({Math.round(blendRatio * 100)}%)</span>
            </div>
          </div>
        )}

        {/* 2. Side-by-Side Mode */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-3 max-h-full max-w-full aspect-[16/9] w-full">
            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black">
              <img
                src={data.opticalPreviewUrl || '/satellite-port.jpg'}
                alt="Optical"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/satellite-port.jpg';
                }}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded text-zinc-300">
                OPTICAL RGB ({data.cloudOcclusionPercent}% Cloud Occlusion)
              </span>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-teal-500/30 bg-[#040812]">
              <img
                src={data.sarPreviewUrl || '/satellite-sar.jpg'}
                alt="SAR"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/satellite-sar.jpg';
                }}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded text-teal-300 border border-teal-500/30">
                SENTINEL-1 SAR ({data.polarization})
              </span>
            </div>
          </div>
        )}

        {/* 3. SAR Radar Only Mode */}
        {viewMode === 'sar-only' && (
          <div className="relative max-h-full max-w-full aspect-[4/3] rounded-lg overflow-hidden border border-teal-500/30 shadow-2xl p-4 bg-[#030610] flex flex-col justify-between">
            <div className="flex justify-between text-[10px] font-mono text-teal-400">
              <span>FREQUENCY: {data.radarFrequency}</span>
              <span>POLARIZATION: {data.polarization}</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="p-6 rounded-xl border border-teal-500/40 bg-teal-500/10 text-center space-y-2">
                <Radio size={24} className="text-teal-400 animate-pulse mx-auto" />
                <p className="text-xs font-mono font-bold text-white">Microwave C-Band Penetration Active</p>
                <p className="text-[10px] font-mono text-zinc-400">Cloud attenuation bypassed with zero radiometric loss</p>
              </div>
            </div>
            <div className="text-[9px] font-mono text-zinc-500 text-center">
              Surface Roughness & Dielectric Scattering Intensity: {data.backscatterIntensity}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="p-3 bg-black/80 border-t border-white/5 grid grid-cols-3 gap-2 text-left">
        <div className="bg-teal-500/10 border border-teal-500/25 p-2 rounded-lg">
          <span className="text-[8px] font-mono text-teal-400 uppercase tracking-wider block">Cloud Bypass</span>
          <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
            <Zap size={11} className="text-teal-400" />
            {data.cloudOcclusionPercent}% Penetrated
          </span>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/25 p-2 rounded-lg">
          <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-wider block">Radar Polarization</span>
          <span className="text-xs font-mono font-bold text-white">
            {data.polarization}
          </span>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/25 p-2 rounded-lg">
          <span className="text-[8px] font-mono text-purple-400 uppercase tracking-wider block">Surface Scatter</span>
          <span className="text-xs font-mono font-bold text-white">
            High Backscatter
          </span>
        </div>
      </div>
    </div>
  );
}
