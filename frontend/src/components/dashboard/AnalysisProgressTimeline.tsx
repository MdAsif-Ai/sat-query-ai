'use client';

import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Check, Loader, Radio, Cpu, ShieldCheck, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisProgressTimelineProps {
  currentStep: number; // 0 to 5
  taskName?: string;
  activeModelName?: string;
}

export function AnalysisProgressTimeline({ currentStep, taskName, activeModelName }: AnalysisProgressTimelineProps) {
  const phases = [
    {
      title: 'Phase 1: Input Validation & Spatial Registration',
      description: 'Checking GeoTIFF headers, CRS projection (EPSG), and sensor band compatibility.',
      icon: Layers
    },
    {
      title: 'Phase 2: Master Agent Planning & Task Routing',
      description: 'Decomposing query semantics and selecting optimal specialist remote-sensing models.',
      icon: Cpu
    },
    {
      title: 'Phase 3: Specialist Neural Model Inference',
      description: activeModelName
        ? `Executing deep inference with ${activeModelName}...`
        : 'Executing deep multimodal neural vision-language weights.',
      icon: Sparkles
    },
    {
      title: 'Phase 4: Evidence Aggregator & Cross-Validation',
      description: 'Filtering speckle noise, calculating confidence intervals, and verifying ground metrics.',
      icon: ShieldCheck
    },
    {
      title: 'Phase 5: Grounded Response Generation',
      description: 'Synthesizing final natural-language answer with visual overlay coordinates.',
      icon: Check
    }
  ];

  return (
    <GlassCard variant="elevated" className="p-6 border-white/10 space-y-6 select-none text-left max-w-xl mx-auto w-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
        <div className="space-y-0.5">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio size={14} className="text-teal-400 animate-pulse" />
            Autonomous Pipeline Execution
          </h3>
          <p className="text-[10px] text-zinc-400 font-mono">
            {taskName ? `Target: ${taskName}` : 'Orchestrating Earth observation neural graph...'}
          </p>
        </div>
        <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/30">
          STEP {Math.min(currentStep + 1, 5)} / 5
        </span>
      </div>

      {/* Stepped Timeline */}
      <div className="relative pl-6 space-y-5">
        {/* Continuous track line */}
        <div className="absolute left-2.5 top-2 bottom-2 w-px bg-white/10" />

        {phases.map((phase, idx) => {
          const isCompleted = currentStep > idx;
          const isActive = currentStep === idx;
          const isPending = currentStep < idx;

          return (
            <div key={idx} className="relative flex items-start gap-3.5">
              {/* Step indicator node */}
              <div
                className={cn(
                  "absolute -left-6 h-5.5 w-5.5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 z-10",
                  isCompleted && "bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
                  isActive && "bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse",
                  isPending && "bg-zinc-950 border-white/10 text-zinc-600"
                )}
              >
                {isCompleted ? (
                  <Check size={11} strokeWidth={3} />
                ) : isActive ? (
                  <Loader size={11} className="animate-spin text-purple-400" />
                ) : (
                  <span className="text-[9px] font-mono">{idx + 1}</span>
                )}
              </div>

              {/* Step Text Info */}
              <div className="space-y-0.5">
                <p
                  className={cn(
                    "text-xs font-semibold leading-tight transition-colors",
                    isCompleted && "text-zinc-200",
                    isActive && "text-purple-300 font-bold",
                    isPending && "text-zinc-500"
                  )}
                >
                  {phase.title}
                </p>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                  {phase.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] font-mono text-zinc-500 text-center pt-2 border-t border-white/5">
        *Telemetry telemetry streaming across ISRO Deep Learning Compute Nodes.
      </div>
    </GlassCard>
  );
}
