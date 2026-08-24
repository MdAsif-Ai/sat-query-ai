import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'panel' | 'elevated' | 'light';
  hoverable?: boolean;
}

export function GlassCard({
  children,
  variant = 'panel',
  hoverable = false,
  className,
  ...props
}: GlassCardProps) {
  const variantClass = {
    panel: 'glass-panel',
    elevated: 'glass-panel-elevated',
    light: 'glass-panel-light'
  }[variant];

  return (
    <div
      className={cn(
        variantClass,
        hoverable && 'hover:border-white/15 hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all duration-300',
        'p-6 rounded-2xl relative',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
