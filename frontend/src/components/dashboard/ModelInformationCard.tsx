'use client';

import React from 'react';
import { ModelDetail } from '@/lib/types';
import { Cpu, Zap, Server, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelInformationCardProps {
  models: ModelDetail[];
}

export function ModelInformationCard({ models }: ModelInformationCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-[#111827]/75 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 space-y-4 select-none text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Cpu size={15} />
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Specialist Model Telemetry & Infrastructure
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          {models.length} Neural Models
        </span>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {models.map((model, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 hover:border-teal-500/40 space-y-2.5 transition-all shadow-inner"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{model.name}</span>
              <span className="text-[10px] font-mono font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                {model.parameters}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Category:</span>
                <span className="font-mono text-zinc-200 font-bold">{model.category} ({model.version})</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Accuracy Metric:</span>
                <span className="font-mono text-emerald-400 font-bold">{model.accuracyMetric}</span>
              </div>

              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-1 text-[10px] font-mono text-zinc-400">
                <div className="flex items-center gap-1">
                  <Server size={11} className="text-teal-400" />
                  <span className="truncate">{model.architecture}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Zap size={11} className="text-amber-400" />
                  <span>{model.latencyMs}ms ({model.device})</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
