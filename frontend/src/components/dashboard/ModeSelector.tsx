'use client';

import React from 'react';
import { InputMode } from '@/lib/types';
import { Image, Layers, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeSelectorProps {
  currentMode: InputMode;
  onSelectMode: (mode: InputMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ currentMode, onSelectMode, disabled }: ModeSelectorProps) {
  const modes = [
    {
      id: 'single' as InputMode,
      title: 'Single Image',
      badge: 'Optical / SAR',
      description: 'VQA, scene captioning, target grounding & segmentation',
      icon: Image,
      activeBorder: 'border-emerald-500/80 bg-emerald-950/25 ring-1 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-semibold',
      iconColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'optical-sar' as InputMode,
      title: 'Optical + SAR',
      badge: 'Dual-Modality',
      description: 'Penetrate cloud occlusions and extract radar surface backscatter',
      icon: Layers,
      activeBorder: 'border-cyan-500/80 bg-cyan-950/25 ring-1 ring-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 font-semibold',
      iconColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    },
    {
      id: 'before-after' as InputMode,
      title: 'Before + After',
      badge: 'Bi-Temporal',
      description: 'Quantify urban growth, deforestation, and temporal deviations',
      icon: Calendar,
      activeBorder: 'border-orange-500/80 bg-orange-950/25 ring-1 ring-orange-500/40 shadow-[0_0_25px_rgba(249,115,22,0.15)]',
      badgeColor: 'bg-orange-500/10 text-orange-300 border-orange-500/30 font-semibold',
      iconColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    }
  ];

  return (
    <div className="space-y-2.5 select-none text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} className="text-teal-400" />
          Select Observation Modality Mode
        </span>
        <span className="text-[11px] font-mono text-zinc-400">
          Auto-routes specialist models per modality
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {modes.map(mode => {
          const Icon = mode.icon;
          const isSelected = currentMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMode(mode.id)}
              className={cn(
                "p-5 rounded-2xl text-left bg-[#111827]/75 hover:bg-[#111827]/95 backdrop-blur-xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative group",
                "shadow-xl hover:-translate-y-0.5",
                isSelected
                  ? mode.activeBorder
                  : "border border-white/10 hover:border-white/20",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              {/* Top Row: Icon + Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className={cn("p-2.5 rounded-xl border flex items-center justify-center shadow-xs transition-transform group-hover:scale-105", mode.iconColor)}>
                  <Icon size={20} />
                </div>
                <span className={cn("text-[10px] font-mono px-3 py-1 rounded-full border", mode.badgeColor)}>
                  {mode.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <div className="text-base font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                  {mode.title}
                </div>
                <div className="text-xs text-zinc-400 leading-snug">
                  {mode.description}
                </div>
              </div>

              {/* Active Indicator dot */}
              {isSelected && (
                <div className="absolute top-3.5 right-3.5 h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse ring-4 ring-teal-500/20" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
