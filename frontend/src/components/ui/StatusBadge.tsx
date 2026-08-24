import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeStatusType = 
  | 'online' 
  | 'emerald'
  | 'success' 
  | 'processing' 
  | 'teal'
  | 'routing' 
  | 'violet'
  | 'alert' 
  | 'orange'
  | 'grounding' 
  | 'purple'
  | 'agent' 
  | 'amber'
  | 'geo' 
  | 'cyan'
  | 'magenta'
  | 'offline';

interface StatusBadgeProps {
  status: BadgeStatusType;
  label: string;
  className?: string;
  icon?: React.ReactNode;
}

export function StatusBadge({ status, label, className, icon }: StatusBadgeProps) {
  const dotColors: Record<BadgeStatusType, string> = {
    online: 'bg-emerald-400 shadow-emerald-400/50',
    emerald: 'bg-emerald-400 shadow-emerald-400/50',
    success: 'bg-emerald-400 shadow-emerald-400/50',
    processing: 'bg-teal-400 shadow-teal-400/50',
    teal: 'bg-teal-400 shadow-teal-400/50',
    routing: 'bg-purple-400 shadow-purple-400/50',
    violet: 'bg-purple-400 shadow-purple-400/50',
    alert: 'bg-orange-400 shadow-orange-400/50',
    orange: 'bg-orange-400 shadow-orange-400/50',
    grounding: 'bg-fuchsia-400 shadow-fuchsia-400/50',
    purple: 'bg-fuchsia-400 shadow-fuchsia-400/50',
    agent: 'bg-amber-400 shadow-amber-400/50',
    amber: 'bg-amber-400 shadow-amber-400/50',
    geo: 'bg-cyan-400 shadow-cyan-400/50',
    cyan: 'bg-cyan-400 shadow-cyan-400/50',
    magenta: 'bg-pink-400 shadow-pink-400/50',
    offline: 'bg-zinc-500 shadow-zinc-500/50'
  };

  const badgeStyles: Record<BadgeStatusType, string> = {
    online: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    processing: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    routing: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    violet: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    alert: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    grounding: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
    purple: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
    agent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    geo: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    magenta: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    offline: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm select-none',
      badgeStyles[status],
      className
    )}>
      {icon ? (
        icon
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse shadow-sm', dotColors[status])} />
      )}
      {label}
    </span>
  );
}
