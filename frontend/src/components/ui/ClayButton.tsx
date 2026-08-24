import React from 'react';
import { cn } from '@/lib/utils';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'violet' | 'emerald' | 'teal' | 'secondary' | 'success' | 'alert' | 'danger';
  isLoading?: boolean;
}

export function ClayButton({
  children,
  variant = 'violet',
  isLoading = false,
  className,
  disabled,
  ...props
}: ClayButtonProps) {
  const variantClass = {
    primary: 'clay-button',
    violet: 'clay-button',
    emerald: 'clay-button clay-button-emerald',
    success: 'clay-button clay-button-emerald',
    teal: 'clay-button clay-button-teal',
    secondary: 'clay-button-secondary rounded-xl',
    alert: 'clay-button bg-orange-600 hover:bg-orange-500',
    danger: 'clay-button bg-red-600 hover:bg-red-500',
  }[variant];

  return (
    <button
      className={cn(
        variantClass,
        'px-4 py-2.5 font-medium flex items-center justify-center gap-2 text-sm transition-all duration-200 select-none cursor-pointer',
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none transform-none shadow-none',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
