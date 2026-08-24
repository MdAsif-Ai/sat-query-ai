'use client';

import React from 'react';
import { Check, Loader, GitBranch, ShieldCheck, Radio, Satellite, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoutingStatusProps {
  currentStep: number;
  taskType?: string;
  modelsUsed?: string[];
  isFailed?: boolean;
}

export function RoutingStatus({ currentStep, taskType, modelsUsed, isFailed }: RoutingStatusProps) {
  const steps = [
    { title: 'Reading spatial metadata...', desc: 'Extracting CRS, resolution & sensor bands' },
    { title: 'Understanding your query...', desc: 'Parsing natural language semantics' },
    { title: 'Selecting specialist models...', desc: 'Determining optimal remote-sensing pipeline' },
    { title: 'Analyzing Earth observation data...', desc: 'Executing deep multimodal neural inference' },
    { title: 'Cross-validating evidence...', desc: 'Checking confidence intervals & spatial bounds' }
  ];

  return (
    <div className="rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
            <GitBranch size={13} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">AI Routing Orchestration</h3>
        </div>
        <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 flex items-center gap-1">
          <Radio size={9} className="animate-pulse" />
          ACTIVE ORCHESTRATOR
        </span>
      </div>

      {/* Pipeline Stage Timeline */}
      <div className="relative pl-6 space-y-4">
        {/* Continuous trajectory line */}
        <div className="absolute left-2.5 top-2 bottom-2 w-px bg-white/10" />

        {steps.map((step, idx) => {
          const isCompleted = currentStep > idx;
          const isActive = currentStep === idx;
          const isPending = currentStep < idx;

          return (
            <div key={idx} className="relative flex gap-3 text-left">
              {/* Step indicator dot/icon */}
              <div
                className={cn(
                  "absolute -left-6 h-5.5 w-5.5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 z-10",
                  isCompleted && "bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
                  isActive && !isFailed && "bg-purple-500/20 border-purple-400 text-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.3)] animate-pulse",
                  isActive && isFailed && "bg-orange-500/20 border-orange-400 text-orange-400",
                  isPending && "bg-zinc-950 border-white/10 text-zinc-600"
                )}
              >
                {isCompleted ? (
                  <Check size={11} strokeWidth={3} />
                ) : isActive && !isFailed ? (
                  <Loader size={11} className="animate-spin text-purple-400" />
                ) : (
                  <span className="text-[9px] font-mono">{idx + 1}</span>
                )}
              </div>

              {/* Text metadata */}
              <div className="space-y-0.5">
                <p
                  className={cn(
                    "text-xs font-semibold leading-tight transition-colors",
                    isCompleted && "text-zinc-200",
                    isActive && !isFailed && "text-purple-300 font-bold",
                    isPending && "text-zinc-500"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-[10px] text-zinc-500 leading-none">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolved Task & Models output badge */}
      {currentStep >= 4 && taskType && (
        <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left animate-in fade-in duration-300">
          <div className="space-y-1 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">Identified Task</span>
            <span className="text-xs font-bold text-white block truncate">
              {taskType}
            </span>
          </div>
          <div className="space-y-1 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[9px] font-mono text-teal-400 uppercase tracking-wider block">Specialist Models</span>
            <span className="text-xs font-mono font-semibold text-teal-300 block truncate">
              {modelsUsed?.join(', ') || 'Geo-Chat v3'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
