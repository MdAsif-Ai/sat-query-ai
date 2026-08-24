'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ClayButton } from './ClayButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmVariant?: 'primary' | 'success' | 'secondary';
  isLoading?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  confirmVariant = 'primary',
  isLoading = false
}: ModalProps) {
  // Lock scroll on mount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <GlassCard className="relative w-full max-w-md p-6 z-10 shadow-2xl clay-card border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-white/95">{title}</h3>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="text-zinc-300 text-sm mb-6 leading-relaxed">
          {children}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <ClayButton 
            variant="secondary" 
            onClick={onClose}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </ClayButton>
          {confirmLabel && onConfirm && (
            <ClayButton 
              variant={confirmVariant} 
              onClick={onConfirm}
              isLoading={isLoading}
              type="button"
            >
              {confirmLabel}
            </ClayButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
