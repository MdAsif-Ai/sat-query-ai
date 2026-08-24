'use client';

import React from 'react';
import { TaskType, ModelDetail } from '@/lib/types';
import { GitBranch, Target, CheckCircle2, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDetectionCardProps {
  taskType: TaskType;
  confidence: number;
  modelsUsed: ModelDetail[];
  rationale?: string;
  isProcessing?: boolean;
}

export function TaskDetectionCard({ taskType, confidence, modelsUsed, rationale, isProcessing }: TaskDetectionCardProps) {
  // Get color and badge for task
  const getTaskMeta = () => {
    switch (taskType) {
      case 'Bi-temporal Change Detection':
        return {
          bannerColor: 'bg-orange-500/10 border border-orange-500/30 text-orange-200',
          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          pipeline: 'Change Detection Siamese ViT',
          defaultRationale: 'Detected dual-temporal observation sequence with change quantification semantics.'
        };
      case 'Optical + SAR Cross-Modal Fusion':
        return {
          bannerColor: 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-200',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          pipeline: 'Radar-Optical Joint Embedder',
          defaultRationale: 'Identified optical cloud occlusion and SAR microwave backscatter channels.'
        };
      case 'Text-Guided Grounding':
        return {
          bannerColor: 'bg-purple-500/10 border border-purple-500/30 text-purple-200',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          pipeline: 'Zero-Shot Cross-Attention BBox',
          defaultRationale: 'Detected target localization query terms requiring pixel bounding coordinates.'
        };
      case 'Semantic Segmentation':
        return {
          bannerColor: 'bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-200',
          badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
          pipeline: 'Promptable Vision Transformer Masks',
          defaultRationale: 'Detected land cover polygon mask request (water bodies, roads, building footprints).'
        };
      case 'Single Image VQA':
      default:
        return {
          bannerColor: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          pipeline: 'Multimodal Remote-Sensing VLM',
          defaultRationale: 'Classified query as visual question answering and scene semantics description.'
        };
    }
  };

  const meta = getTaskMeta();

  return (
    <div className="p-6 rounded-2xl bg-[#111827]/75 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 space-y-4 select-none text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <GitBranch size={15} />
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Master Agent Task Routing
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 size={12} /> ROUTED
        </span>
      </div>

      {/* Task Type Banner */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>CLASSIFIED MISSION TASK</span>
          <span className="text-teal-400 font-bold">Intent Match: {confidence}%</span>
        </div>
        <div className={cn("p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-xs", meta.bannerColor)}>
          <div className="flex items-center gap-2.5 min-w-0">
            <Target size={18} className="shrink-0" />
            <span className="text-sm font-bold text-white truncate">
              {taskType}
            </span>
          </div>
          <span className={cn("text-[10px] font-mono px-2.5 py-1 rounded-md border shrink-0 font-bold", meta.badgeColor)}>
            {meta.pipeline}
          </span>
        </div>
      </div>

      {/* Routing Rationale */}
      <div className="space-y-1 text-xs">
        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Routing Rationale</span>
        <p className="text-xs text-zinc-300 font-normal bg-black/40 p-3 rounded-xl border border-white/10 leading-relaxed italic">
          "{rationale || meta.defaultRationale}"
        </p>
      </div>

      {/* Orchestrated Models preview */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu size={12} className="text-teal-400" />
          Active Neural Pipelines ({modelsUsed.length}):
        </span>
        <div className="flex flex-wrap gap-2">
          {modelsUsed.map((m, idx) => (
            <span
              key={idx}
              className="text-xs font-mono text-zinc-200 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg shadow-xs"
              title={`${m.name} (${m.parameters}) - ${m.architecture}`}
            >
              {m.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
