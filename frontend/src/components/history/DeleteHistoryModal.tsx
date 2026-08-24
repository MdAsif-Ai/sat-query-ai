'use client';

import React from 'react';
import { Modal } from '../ui/Modal';

interface DeleteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  querySummary: string;
}

export function DeleteHistoryModal({
  isOpen,
  onClose,
  onConfirm,
  querySummary
}: DeleteHistoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Analysis History"
      confirmLabel="Delete"
      confirmVariant="secondary" // Can represent a styled gray/red tactile layout
    >
      <div className="space-y-3.5 text-left">
        <p className="text-zinc-300 text-xs leading-normal">
          Are you sure you want to permanently delete the history record for this query?
        </p>
        <div className="bg-black/40 border border-white/5 p-3 rounded-lg text-zinc-300 text-xs italic font-medium truncate leading-tight select-none">
          "{querySummary}"
        </div>
        <p className="text-red-400 font-semibold text-[10px] uppercase tracking-wider select-none">
          ⚠️ Warning: This action is irreversible.
        </p>
      </div>
    </Modal>
  );
}
