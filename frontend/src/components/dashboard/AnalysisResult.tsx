'use client';

import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { ClayButton } from '../ui/ClayButton';
import { FileDown, Layers, Cpu, Award, ShieldCheck, MapPin, Eye, CheckCircle2 } from 'lucide-react';

interface AnalysisResultProps {
  query: string;
  type: string;
  confidence: number;
  modelsUsed: string[];
  answer: string;
  evidence: {
    type: 'change-map' | 'segmentation' | 'cross-modal' | 'vqa';
    data: any;
  };
  trace: string[];
  onSaveToHistory?: () => void;
}

export function AnalysisResult({
  query,
  type,
  confidence,
  modelsUsed,
  answer,
  evidence,
  trace,
  onSaveToHistory
}: AnalysisResultProps) {
  const [activeTab, setActiveTab] = useState<'evidence' | 'trace'>('evidence');

  const handleDownload = () => {
    alert(`Downloading Geospatial PDF Intelligence Report for: "${query.substring(0, 30)}..."`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 select-none">
      {/* Upper split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Scientific Observation Panel */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/10 bg-[#070A12] flex flex-col justify-between shadow-2xl">
            
            {/* Scientific Observation Content */}
            <div className="absolute inset-0 flex items-center justify-center p-3">
              
              {/* 1. Temporal Change Map (Orange/Amber accents) */}
              {evidence.type === 'change-map' && (
                <div className="w-full h-full relative rounded-xl bg-gradient-to-br from-orange-950/20 to-black border border-orange-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />
                  
                  {/* Before / After labels */}
                  <div className="absolute top-2 left-2 flex gap-1.5 text-[8px] font-mono">
                    <span className="bg-black/80 px-1.5 py-0.5 rounded border border-white/10 text-zinc-400">T1: 2024-03-12</span>
                    <span className="bg-black/80 px-1.5 py-0.5 rounded border border-orange-500/30 text-orange-400">T2: 2024-08-18</span>
                  </div>

                  {/* Highlighted change regions in Orange & Amber */}
                  <div className="absolute top-1/4 left-1/4 w-32 h-24 bg-orange-500/15 border-2 border-orange-400 rounded-lg animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.25)] flex items-center justify-center">
                    <span className="text-[9px] font-mono text-orange-300 font-bold bg-black/90 px-1.5 py-0.5 rounded border border-orange-400/40">
                      CHANGE MAP: +14.2% Built
                    </span>
                  </div>
                  
                  <div className="absolute bottom-1/4 right-1/4 w-20 h-16 bg-emerald-500/15 border border-emerald-400/50 rounded-lg flex items-center justify-center">
                    <span className="text-[8px] font-mono text-emerald-300 font-bold">VEGETATION STABLE</span>
                  </div>
                </div>
              )}

              {/* 2. Grounding & Segmentation (Purple / Magenta outlines) */}
              {evidence.type === 'segmentation' && (
                <div className="w-full h-full relative rounded-xl bg-gradient-to-br from-purple-950/20 to-black border border-purple-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />
                  
                  <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
                    {/* Water polygon in Cyan */}
                    <path d="M22 25 Q 32 18, 40 28 T 60 32 T 48 55 Z" fill="rgba(6, 182, 212, 0.25)" stroke="#06b6d4" strokeWidth="0.9" />
                    {/* Building / Road segment in Purple / Magenta */}
                    <path d="M 15 85 Q 50 45, 88 85" fill="none" stroke="#d946ef" strokeWidth="1.2" strokeDasharray="3 1.5" />
                    <rect x="68" y="20" width="16" height="14" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="0.8" />
                  </svg>

                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[9px] font-mono border border-white/5 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Water Body Polygon</div>
                    <div className="flex items-center gap-1.5 text-fuchsia-400"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" /> Grounded Infrastructure</div>
                  </div>
                </div>
              )}

              {/* 3. Cross-Modal Optical + SAR (Teal/Radar treatment) */}
              {evidence.type === 'cross-modal' && (
                <div className="w-full h-full relative rounded-xl overflow-hidden flex border border-white/10">
                  {/* Left: Optical */}
                  <div className="flex-1 bg-zinc-950 relative border-r border-white/10 p-2 flex flex-col justify-between">
                    <span className="text-[8px] font-mono bg-black/80 px-1 py-0.5 rounded text-zinc-400 self-start border border-white/5">
                      OPTICAL RGB
                    </span>
                    <div className="w-12 h-10 border border-white/20 rounded mx-auto" />
                    <span className="text-[7px] font-mono text-zinc-500">CLOUD OCCLUDED</span>
                  </div>
                  {/* Right: SAR Radar Grayscale */}
                  <div className="flex-1 bg-[#050811] relative p-2 flex flex-col justify-between">
                    <span className="text-[8px] font-mono bg-teal-500/20 px-1 py-0.5 rounded text-teal-300 self-start border border-teal-500/30">
                      SENTINEL-1 / SAR
                    </span>
                    <div className="w-12 h-10 border-2 border-teal-400 bg-teal-500/20 rounded mx-auto shadow-[0_0_10px_rgba(20,184,166,0.3)]" />
                    <span className="text-[7px] font-mono text-teal-400">RADAR BACKSCATTER HIGH</span>
                  </div>
                </div>
              )}

              {/* 4. Single Image VQA */}
              {evidence.type === 'vqa' && (
                <div className="w-full h-full relative rounded-xl bg-gradient-to-br from-purple-950/20 to-black border border-purple-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />
                  <div className="absolute top-1/3 left-1/4 w-28 h-28 border border-dashed border-purple-400 rounded-lg flex items-center justify-center">
                    <span className="text-[8px] font-mono bg-purple-500/80 px-1.5 py-0.5 rounded text-white font-bold uppercase">
                      PORT FACILITY DOCKS
                    </span>
                  </div>
                  <div className="absolute top-1/2 right-1/3 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-ping" />
                </div>
              )}
            </div>

            {/* Scientific Observation Header Bar */}
            <div className="w-full bg-[#070A12]/90 backdrop-blur-md px-3.5 py-2.5 border-b border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400 z-10">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                OBSERVATION FRAME
              </span>
              <span className="text-zinc-500">EPSG:32643 · WGS-84</span>
            </div>

            {/* Scientific Observation Footer Bar */}
            <div className="w-full bg-[#070A12]/90 backdrop-blur-md px-3.5 py-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-zinc-500 z-10">
              <span>SENSOR: MULTI-SPECTRAL</span>
              <span>RES: 10m / PIXEL</span>
            </div>
          </div>
          
          <div className="text-[10px] font-mono text-zinc-500 text-center">
            *Raster evidence layers fused with neural inference grounding markers.
          </div>
        </div>

        {/* Right Side: AI Answer and analysis breakdowns */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <GlassCard variant="elevated" className="border-white/10 flex-1 flex flex-col justify-between p-6">
            <div className="space-y-4">
              
              {/* Answer Header Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3.5">
                <div className="space-y-0.5 text-left">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Analysis Modality</span>
                  <p className="text-sm font-bold text-white">{type}</p>
                </div>
                
                {/* Confidence Meter */}
                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3.5 py-2">
                  <div className="space-y-0.5 text-right">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">Confidence Score</span>
                    <span className="text-sm font-mono font-extrabold text-emerald-400">{confidence}%</span>
                  </div>
                  <div className="h-7 w-px bg-white/10" />
                  <div className="h-7 w-7 rounded-lg border border-emerald-500/30 flex items-center justify-center text-emerald-400 bg-emerald-500/10">
                    <Award size={15} />
                  </div>
                </div>
              </div>

              {/* Query & Answer Text */}
              <div className="space-y-3 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">Query Request</span>
                  <blockquote className="text-xs font-medium text-zinc-300 border-l-2 border-purple-500/50 pl-3 italic bg-white/[0.01] py-1">
                    "{query}"
                  </blockquote>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-teal-400 uppercase tracking-wider block">AI Multimodal Response</span>
                  <div className="text-sm text-zinc-100 leading-relaxed font-sans whitespace-pre-line bg-black/40 p-4 rounded-xl border border-white/5">
                    {answer}
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
              <ClayButton variant="teal" onClick={handleDownload} className="text-xs py-2 rounded-xl">
                <FileDown size={14} />
                Download Report
              </ClayButton>
              {onSaveToHistory && (
                <ClayButton variant="secondary" onClick={onSaveToHistory} className="text-xs py-2 rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Save to Mission Log
                </ClayButton>
              )}
            </div>
          </GlassCard>
        </div>

      </div>

      {/* Tabs Menu section (Evidence breakdown vs Execution Trace) */}
      <GlassCard variant="elevated" className="border-white/5 p-6">
        <div className="flex border-b border-white/5 mb-4">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'evidence'
                ? 'border-teal-400 text-teal-400 bg-teal-500/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers size={13} />
              Geospatial Metrics & Evidence
            </span>
          </button>
          <button
            onClick={() => setActiveTab('trace')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'trace'
                ? 'border-purple-400 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Cpu size={13} />
              Agent Execution Trace
            </span>
          </button>
        </div>

        {/* Evidence tab content with Geospatial Analytics */}
        {activeTab === 'evidence' && (
          <div className="text-left space-y-3.5 animate-in fade-in duration-200">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Derived Analytics Telemetry</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {Object.entries(evidence.data).map(([key, val]) => (
                <div key={key} className="p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-sm font-mono font-bold text-teal-300 block">
                    {String(val)}
                  </span>
                </div>
              ))}
              <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider block">Models Orchestrated</span>
                <span className="text-xs font-mono font-bold text-white block truncate" title={modelsUsed.join(', ')}>
                  {modelsUsed.join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Execution Trace tab content */}
        {activeTab === 'trace' && (
          <div className="text-left space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Master Agent Pipeline Auditing</h4>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded">
                AUDIT TRAIL COMPLETE
              </span>
            </div>
            <div className="space-y-2.5 pl-4 border-l border-white/10 font-mono text-xs text-zinc-400">
              {trace.map((log, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <span className="text-zinc-600 shrink-0 select-none">[{idx + 1}]</span>
                  <span className="leading-relaxed">
                    {log.startsWith('Input Validator') && <span className="text-teal-400 font-semibold">{log.split(':')[0]}:</span>}
                    {log.startsWith('Master Agent') && <span className="text-purple-400 font-semibold">{log.split(':')[0]}:</span>}
                    {log.startsWith('Task Router') && <span className="text-purple-400 font-semibold">{log.split(':')[0]}:</span>}
                    {log.startsWith('Query Router') && <span className="text-purple-400 font-semibold">{log.split(':')[0]}:</span>}
                    {log.startsWith('Evidence Aggregator') && <span className="text-amber-400 font-semibold">{log.split(':')[0]}:</span>}
                    {log.startsWith('Response Generator') && <span className="text-emerald-400 font-semibold">{log.split(':')[0]}:</span>}
                    {!['Input Validator', 'Master Agent', 'Task Router', 'Query Router', 'Evidence Aggregator', 'Response Generator'].some(k => log.startsWith(k)) && (
                      <span className="text-fuchsia-400 font-semibold">{log.split(':')[0]}:</span>
                    )}
                    {log.split(':').slice(1).join(':')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
