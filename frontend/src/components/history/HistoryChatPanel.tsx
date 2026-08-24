'use client';

import React, { useState } from 'react';
import { HistoryItem as HistoryItemType } from '@/lib/mock-data';
import { ClayButton } from '../ui/ClayButton';
import { 
  X, 
  ExternalLink, 
  Radio, 
  FileDown,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryChatPanelProps {
  item: HistoryItemType;
  onClose: () => void;
  onOpenInDashboard: (item: HistoryItemType) => void;
  onDeleteRequest?: (item: HistoryItemType) => void;
}

export function HistoryChatPanel({ item, onClose, onOpenInDashboard, onDeleteRequest }: HistoryChatPanelProps) {
  const [activeTab, setActiveTab] = useState<'evidence' | 'trace'>('evidence');

  const evidenceType = item.evidence?.type || 'vqa';
  const evidenceData = item.evidence?.data || {};
  const modelsUsed = item.modelsUsed || ['Geo-Chat v3'];
  const trace = item.trace || [];

  return (
    <div className="p-6 border border-white/10 bg-[#111827]/85 backdrop-blur-2xl space-y-6 text-left select-none relative shadow-2xl rounded-2xl animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
            <Radio size={18} className="animate-pulse" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Mission Session</span>
              <span className="text-xs font-mono text-zinc-500">#{item.id}</span>
            </div>
            <p className="text-xs text-zinc-300 truncate max-w-sm font-medium">{item.query}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(item)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 border border-transparent hover:border-rose-500/20"
              title="Delete Mission Record"
            >
              <Trash2 size={17} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close Chat Panel"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Metadata & Confidence */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-black/40 border border-white/10">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Pipeline Modality</span>
          <p className="text-xs font-bold text-white">{item.type}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Confidence</span>
            <span className="text-sm font-mono font-black text-emerald-400">{item.confidence || 92}%</span>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Recorded</span>
            <span className="text-xs font-mono text-zinc-400">{item.createdAt}</span>
          </div>
        </div>
      </div>

      {/* Query Block */}
      <div className="space-y-1.5">
        <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">Query Request</span>
        <blockquote className="text-xs sm:text-sm font-medium text-zinc-200 border-l-4 border-emerald-500 pl-3.5 py-2 bg-black/40 rounded-r-xl italic shadow-inner">
          "{item.query}"
        </blockquote>
      </div>

      {/* AI Multimodal Output Block */}
      <div className="space-y-1.5">
        <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider block">Multimodal AI Output</span>
        <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-xs sm:text-sm text-zinc-200 font-normal leading-relaxed whitespace-pre-line font-sans shadow-inner">
          {item.answer || 'Geospatial inference synthesized.'}
        </div>
      </div>

      {/* Observation Evidence Raster Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">Observation Raster Evidence</span>
          <span className="text-[11px] font-mono text-zinc-500">EPSG:32643 · 10m Ground Res</span>
        </div>

        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 relative flex items-center justify-center shadow-lg">
          {/* Change map */}
          {evidenceType === 'change-map' && (
            <div className="w-full h-full relative p-3 bg-gradient-to-br from-orange-950/40 to-slate-900">
              <div className="absolute top-3 left-3 flex gap-2 text-[9px] font-mono font-black">
                <span className="bg-white/90 px-2 py-1 rounded text-black shadow-xs">T1: BASELINE</span>
                <span className="bg-orange-500 text-white px-2 py-1 rounded shadow-xs">T2: DETECTED</span>
              </div>
              <div className="absolute top-1/4 left-1/3 w-40 h-24 bg-orange-500/25 border-2 border-orange-400 rounded-xl animate-pulse flex items-center justify-center shadow-lg">
                <span className="text-xs font-mono text-orange-200 font-black bg-black/90 px-2 py-1 rounded">
                  CHANGE: +14.2% BUILT
                </span>
              </div>
            </div>
          )}

          {/* Segmentation */}
          {evidenceType === 'segmentation' && (
            <div className="w-full h-full relative p-3 bg-gradient-to-br from-purple-950/40 to-slate-900">
              <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
                <path d="M22 25 Q 32 18, 40 28 T 60 32 T 48 55 Z" fill="rgba(6, 182, 212, 0.35)" stroke="#06b6d4" strokeWidth="1.2" />
                <rect x="68" y="20" width="16" height="14" fill="rgba(168, 85, 247, 0.35)" stroke="#a855f7" strokeWidth="1.2" />
              </svg>
              <div className="absolute top-3 left-3 bg-black/90 px-3 py-1.5 rounded-xl text-[9px] font-mono font-black border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Water Body Polygon</div>
                <div className="flex items-center gap-1.5 text-fuchsia-300"><span className="h-2 w-2 rounded-full bg-fuchsia-400" /> Grounded Infrastructure</div>
              </div>
            </div>
          )}

          {/* Optical + SAR */}
          {evidenceType === 'cross-modal' && (
            <div className="w-full h-full flex">
              <div className="flex-1 bg-slate-950 border-r border-white/10 p-3 flex flex-col justify-between">
                <span className="text-[9px] font-mono text-white bg-black/90 px-2 py-1 rounded self-start font-black">OPTICAL RGB</span>
                <span className="text-[10px] font-mono text-zinc-400 mx-auto font-bold">CLOUD OCCLUDED</span>
              </div>
              <div className="flex-1 bg-[#051a15] p-3 flex flex-col justify-between">
                <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950 px-2 py-1 rounded self-start font-black border border-emerald-500/40">SENTINEL-1 / SAR</span>
                <span className="text-[10px] font-mono text-emerald-400 mx-auto font-black">RADAR BACKSCATTER</span>
              </div>
            </div>
          )}

          {/* VQA default */}
          {evidenceType === 'vqa' && (
            <div className="w-full h-full relative bg-gradient-to-br from-emerald-950/40 to-slate-900 p-3">
              <div className="absolute top-1/3 left-1/4 w-36 h-24 border-2 border-dashed border-emerald-400 rounded-xl flex items-center justify-center">
                <span className="text-[9px] font-mono bg-emerald-500 px-2 py-1 rounded text-white font-black uppercase shadow-xs">
                  GROUNDED INFRASTRUCTURE
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Derived Metrics vs Trace Tabs */}
      <div className="space-y-3 pt-1">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('evidence')}
            className={cn(
              "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
              activeTab === 'evidence'
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            Derived Metrics
          </button>
          <button
            onClick={() => setActiveTab('trace')}
            className={cn(
              "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
              activeTab === 'trace'
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            Execution Trace
          </button>
        </div>

        {activeTab === 'evidence' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {Object.entries(evidenceData).map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1 shadow-inner">
                <span className="text-[9px] font-mono font-medium text-zinc-500 uppercase tracking-wider block">{k.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-xs font-mono font-bold text-zinc-200 block truncate">{String(v)}</span>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1 shadow-inner">
              <span className="text-[9px] font-mono font-medium text-zinc-500 uppercase tracking-wider block">Models Used</span>
              <span className="text-xs font-mono font-bold text-emerald-400 block truncate">{modelsUsed.join(', ')}</span>
            </div>
          </div>
        )}

        {activeTab === 'trace' && (
          <div className="space-y-2 pl-3 border-l-2 border-white/10 font-mono text-xs text-zinc-300 font-medium pt-1">
            {trace.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-emerald-400 font-bold select-none">[{i + 1}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-xs font-medium text-zinc-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
          >
            Close Panel
          </button>
          {onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(item)}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-3.5 py-2 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer border border-rose-500/20 flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Delete Mission</span>
            </button>
          )}
        </div>

        <ClayButton
          variant="emerald"
          onClick={() => onOpenInDashboard(item)}
          className="px-5 py-2.5 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md font-bold"
        >
          <ExternalLink size={14} />
          <span>Open in Workspace</span>
        </ClayButton>
      </div>

    </div>
  );
}
