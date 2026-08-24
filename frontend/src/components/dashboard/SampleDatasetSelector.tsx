'use client';

import React from 'react';
import { SAMPLE_PRESETS, SampleDatasetPreset } from '@/lib/mock-data';
import { Satellite, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SampleDatasetSelectorProps {
  onSelectPreset: (preset: SampleDatasetPreset) => void;
  disabled?: boolean;
}

export function SampleDatasetSelector({ onSelectPreset, disabled }: SampleDatasetSelectorProps) {
  const getBadgeStyle = (mode: string) => {
    switch (mode) {
      case 'optical-sar':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 font-semibold';
      case 'before-after':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30 font-semibold';
      case 'single':
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-semibold';
    }
  };

  return (
    <div className="space-y-3 select-none text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Satellite size={14} className="text-teal-400" />
          Pre-Loaded Earth Observation Datasets
        </span>
        <span className="text-[11px] font-mono text-zinc-400">
          Click to load imagery & query
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLE_PRESETS.map((preset) => {
          const badge = getBadgeStyle(preset.mode);

          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPreset(preset)}
              className="p-5 rounded-2xl bg-[#111827]/75 hover:bg-[#111827]/95 backdrop-blur-xl border border-white/10 hover:border-teal-500/40 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between group space-y-3.5 shadow-xl hover:-translate-y-0.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={cn("text-[10px] font-mono px-3 py-0.5 rounded-full border", badge)}>
                    {preset.mode.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {preset.metadata.resolutionGSD}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                  {preset.title}
                </h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {preset.subtitle}
                </p>
              </div>

              <p className="text-xs text-zinc-300 font-normal line-clamp-2 leading-relaxed italic p-3 rounded-xl bg-black/40 border border-white/5 shadow-inner">
                "{preset.suggestedQuery}"
              </p>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono font-bold text-teal-400 group-hover:text-teal-300">
                <span>Load Mission Dataset</span>
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
