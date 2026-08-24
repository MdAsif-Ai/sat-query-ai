'use client';

import React from 'react';
import { WarningAlert } from '@/lib/types';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarningBannerProps {
  warnings: WarningAlert[];
  onDismiss?: (id: string) => void;
}

export function WarningBanner({ warnings, onDismiss }: WarningBannerProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2 select-none text-left animate-in fade-in slide-in-from-top-2 duration-200">
      {warnings.map((warn) => {
        const isCaution = warn.severity === 'caution' || warn.severity === 'warning';

        return (
          <div
            key={warn.id}
            className={cn(
              "p-3 rounded-xl border flex items-start justify-between gap-3 text-xs leading-relaxed transition-all",
              isCaution
                ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                : "bg-blue-500/10 border-blue-500/30 text-blue-200"
            )}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-1 rounded bg-black/40 border border-white/10 shrink-0 mt-0.5">
                {isCaution ? (
                  <AlertTriangle size={14} className="text-amber-400" />
                ) : (
                  <Info size={14} className="text-blue-400" />
                )}
              </div>
              <div className="space-y-0.5">
                <span className="font-mono font-bold uppercase tracking-wider block text-[10px]">
                  {warn.title}
                </span>
                <p className="text-[11px] text-zinc-300 font-sans">
                  {warn.message}
                </p>
                <p className="text-[9px] font-mono text-zinc-400">
                  <strong className="text-amber-300/90">Sensor Impact:</strong> {warn.impact}
                </p>
              </div>
            </div>

            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(warn.id)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
