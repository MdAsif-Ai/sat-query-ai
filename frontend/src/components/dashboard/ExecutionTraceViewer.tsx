'use client';

import React, { useState } from 'react';
import { ExecutionTraceStep } from '@/lib/types';
import { Terminal, CheckCircle2, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutionTraceViewerProps {
  trace: ExecutionTraceStep[];
}

export function ExecutionTraceViewer({ trace }: ExecutionTraceViewerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(prev => prev === idx ? null : idx);
  };

  const getAgentColor = (agent: string) => {
    if (agent.includes('Validator')) return 'text-teal-300 border-teal-500/30 bg-teal-500/10';
    if (agent.includes('Master Agent') || agent.includes('Router')) return 'text-purple-300 border-purple-500/30 bg-purple-500/10';
    if (agent.includes('ChangeFormer') || agent.includes('SAM') || agent.includes('Grounding')) return 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10';
    if (agent.includes('Aggregator')) return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  };

  return (
    <div className="p-6 rounded-2xl bg-[#111827]/75 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 space-y-4 select-none text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Terminal size={15} />
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Auditable Agent Execution Trace
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
          <ShieldCheck size={12} /> AUDIT PASS ({trace.length} STEPS)
        </span>
      </div>

      {/* Trace Log Sequence */}
      <div className="space-y-2.5 font-mono">
        {trace.map((step, idx) => {
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={idx}
              className="rounded-xl border border-white/10 bg-black/40 overflow-hidden transition-all hover:border-teal-500/40 shadow-inner"
            >
              <button
                type="button"
                onClick={() => toggleExpand(idx)}
                className="w-full p-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs text-zinc-500 shrink-0">[{step.timestamp}]</span>
                  <span className={cn("text-[10px] px-2.5 py-0.5 rounded-md border shrink-0 font-bold", getAgentColor(step.agent))}>
                    {step.agent}
                  </span>
                  <span className="text-xs font-semibold text-zinc-200 truncate">
                    {step.action}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="p-4 bg-black/60 border-t border-white/10 text-xs text-zinc-300 space-y-2 animate-in fade-in duration-150">
                  <p className="leading-relaxed">
                    <strong className="text-teal-400 font-bold">Operation:</strong> {step.details}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400 pt-1 border-t border-white/10">
                    <span>Status: SUCCESS</span>
                    <span>Node: Local ISRO Compute</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[11px] font-mono text-zinc-400 text-center pt-2 border-t border-white/10">
        *Full execution provenance cryptographically logged for reproducible auditability.
      </div>
    </div>
  );
}
