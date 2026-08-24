'use client';

import React from 'react';
import { FallbackStatus } from '@/lib/types';
import { ShieldCheck, AlertCircle, Cpu, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FallbackStatusBadgeProps {
  fallback: FallbackStatus;
}

export function FallbackStatusBadge({ fallback }: FallbackStatusBadgeProps) {
  const isFallback = fallback.isFallback;

  return (
    <div
      className={cn(
        "p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs select-none text-left",
        isFallback
          ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
          : "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn("p-1 rounded border", isFallback ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400")}>
          {isFallback ? <AlertCircle size={12} /> : <ShieldCheck size={12} />}
        </div>
        <div className="space-y-0.5 truncate">
          <span className="text-[9px] font-mono uppercase tracking-wider block text-zinc-400">
            {isFallback ? 'Fallback Specialist Routing' : 'Primary Neural Pipeline'}
          </span>
          <p className="text-[11px] font-mono font-bold text-white truncate">
            {isFallback ? `Fallback: ${fallback.activeModel}` : `Primary: ${fallback.primaryModel} (Optimal Precision)`}
          </p>
        </div>
      </div>

      <span className={cn(
        "text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0",
        isFallback ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      )}>
        {isFallback ? `Quality: ${fallback.qualityImpact}` : 'NO FALLBACK REQUIRED'}
      </span>
    </div>
  );
}
