'use client';

import React, { useState } from 'react';
import { HistoryItem as HistoryItemType } from '@/lib/mock-data';
import { ClayButton } from '../ui/ClayButton';
import { 
  X, 
  ExternalLink, 
  Radio
} from 'lucide-react';

interface HistoryDetailDrawerProps {
  item: HistoryItemType | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInDashboard: (item: HistoryItemType) => void;
}

export function HistoryDetailDrawer({ item, isOpen, onClose, onOpenInDashboard }: HistoryDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'evidence' | 'trace'>('evidence');

  if (!isOpen || !item) return null;

  const evidenceType = item.evidence?.type || 'vqa';
  const evidenceData = item.evidence?.data || {};
  const modelsUsed = item.modelsUsed || ['Geo-Chat v3'];
  const trace = item.trace || [];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Side Panel Drawer from Right */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[540px] md:w-[620px] lg:w-[680px] z-50 bg-[#070A12] border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300 select-none text-zinc-100">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Radio size={16} className="animate-pulse" />
            </div>
            <div className="space-y-0.5 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Mission Record</span>
                <span className="text-[10px] font-mono text-zinc-500">#{item.id}</span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate max-w-sm">{item.query}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close Side Panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-left">
          
          {/* Top Modality & Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Pipeline Modality</span>
              <p className="text-xs font-bold text-white">{item.type}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Confidence</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{item.confidence || 92}%</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-right">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Recorded</span>
                <span className="text-xs font-mono text-zinc-400">{item.createdAt}</span>
              </div>
            </div>
          </div>

          {/* User Query Block */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Query Request</span>
            <blockquote className="text-xs sm:text-sm font-medium text-zinc-200 border-l-2 border-purple-500/60 pl-3.5 py-1.5 bg-white/[0.01] rounded-r-lg italic">
              "{item.query}"
            </blockquote>
          </div>

          {/* AI Multimodal Response Block */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider block">Multimodal Neural Answer</span>
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line font-sans shadow-inner">
              {item.answer || 'Analysis synthesized and verified.'}
            </div>
          </div>

          {/* Observation Evidence Preview Visualizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Observation Raster Evidence</span>
              <span className="text-[9px] font-mono text-zinc-500">EPSG:32643 · 10m Ground Res</span>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black/60 relative flex items-center justify-center shadow-lg">
              {/* Change map */}
              {evidenceType === 'change-map' && (
                <div className="w-full h-full relative p-3 bg-gradient-to-br from-orange-950/20 to-black">
                  <div className="absolute top-2 left-2 flex gap-1.5 text-[8px] font-mono">
                    <span className="bg-black/80 px-1.5 py-0.5 rounded border border-white/10 text-zinc-400">T1: BASELINE</span>
                    <span className="bg-black/80 px-1.5 py-0.5 rounded border border-orange-500/30 text-orange-400">T2: DETECTED</span>
                  </div>
                  <div className="absolute top-1/4 left-1/3 w-32 h-20 bg-orange-500/20 border-2 border-orange-400 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-[9px] font-mono text-orange-300 font-bold bg-black/90 px-1.5 py-0.5 rounded">
                      CHANGE: +14.2% BUILT
                    </span>
                  </div>
                </div>
              )}

              {/* Segmentation */}
              {evidenceType === 'segmentation' && (
                <div className="w-full h-full relative p-3 bg-gradient-to-br from-purple-950/20 to-black">
                  <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
                    <path d="M22 25 Q 32 18, 40 28 T 60 32 T 48 55 Z" fill="rgba(6, 182, 212, 0.25)" stroke="#06b6d4" strokeWidth="0.9" />
                    <rect x="68" y="20" width="16" height="14" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="0.8" />
                  </svg>
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[8px] font-mono border border-white/5 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Water Body Polygon</div>
                    <div className="flex items-center gap-1.5 text-fuchsia-400"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" /> Grounded Infrastructure</div>
                  </div>
                </div>
              )}

              {/* Optical + SAR */}
              {evidenceType === 'cross-modal' && (
                <div className="w-full h-full flex">
                  <div className="flex-1 bg-zinc-950 border-r border-white/10 p-2 flex flex-col justify-between">
                    <span className="text-[8px] font-mono text-zinc-400 bg-black/80 px-1 py-0.5 rounded self-start">OPTICAL RGB</span>
                    <span className="text-[8px] font-mono text-zinc-500 mx-auto">CLOUD OCCLUDED</span>
                  </div>
                  <div className="flex-1 bg-[#050811] p-2 flex flex-col justify-between">
                    <span className="text-[8px] font-mono text-teal-300 bg-teal-500/20 px-1 py-0.5 rounded self-start">SENTINEL-1 / SAR</span>
                    <span className="text-[8px] font-mono text-teal-400 mx-auto font-bold">RADAR BACKSCATTER</span>
                  </div>
                </div>
              )}

              {/* VQA default */}
              {evidenceType === 'vqa' && (
                <div className="w-full h-full relative bg-gradient-to-br from-purple-950/20 to-black p-3">
                  <div className="absolute top-1/3 left-1/4 w-28 h-20 border border-dashed border-purple-400 rounded-lg flex items-center justify-center">
                    <span className="text-[8px] font-mono bg-purple-500/80 px-1.5 py-0.5 rounded text-white font-bold uppercase">
                      GROUNDED INFRASTRUCTURE
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Derived Metrics vs Trace Tabs */}
          <div className="space-y-3 pt-2">
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'evidence'
                    ? 'border-teal-400 text-teal-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Derived Metrics
              </button>
              <button
                onClick={() => setActiveTab('trace')}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'trace'
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Execution Trace
              </button>
            </div>

            {activeTab === 'evidence' && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {Object.entries(evidenceData).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-0.5">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-xs font-mono font-bold text-teal-300 block truncate">{String(v)}</span>
                  </div>
                ))}
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-0.5">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Models Used</span>
                  <span className="text-xs font-mono font-bold text-white block truncate">{modelsUsed.join(', ')}</span>
                </div>
              </div>
            )}

            {activeTab === 'trace' && (
              <div className="space-y-1.5 pl-3 border-l border-white/10 font-mono text-[11px] text-zinc-400 pt-1">
                {trace.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-zinc-600 select-none">[{i + 1}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Close Panel
          </button>

          <ClayButton
            variant="teal"
            onClick={() => onOpenInDashboard(item)}
            className="px-5 py-2 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <ExternalLink size={13} />
            <span>Open in Full Dashboard</span>
          </ClayButton>
        </div>

      </div>
    </>
  );
}
