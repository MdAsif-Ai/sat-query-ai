'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HistoryItem as HistoryItemType } from '@/lib/mock-data';
import { 
  MoreVertical, 
  Trash2, 
  Calendar, 
  FileImage, 
  ExternalLink, 
  ChevronRight,
  Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryItemProps {
  item: HistoryItemType;
  isSelected: boolean;
  onSelect: (item: HistoryItemType) => void;
  onOpenInDashboard: (item: HistoryItemType) => void;
  onDeleteRequest: (item: HistoryItemType) => void;
}

export function HistoryItem({ 
  item, 
  isSelected, 
  onSelect, 
  onOpenInDashboard, 
  onDeleteRequest 
}: HistoryItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Optical + SAR Analysis':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'Bi-temporal Change Analysis':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      case 'Grounding & Segmentation':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Single Image Analysis':
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div 
      onClick={() => onSelect(item)}
      className={cn(
        "p-5 rounded-2xl bg-[#111827]/75 hover:bg-[#111827]/95 backdrop-blur-xl border text-left transition-all duration-300 cursor-pointer select-none relative group shadow-xl hover:-translate-y-0.5",
        isSelected
          ? "border-emerald-500/80 bg-[#111827]/95 ring-1 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
          : "border-white/10 hover:border-emerald-500/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        
        {/* Info content */}
        <div className="space-y-2.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Analysis Type Badge */}
            <span className={cn("text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border", getTypeBadge(item.type))}>
              • {item.type}
            </span>
            
            {/* Image Count Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] text-zinc-400 font-medium leading-none">
              <FileImage size={11} />
              {item.imageCount} {item.imageCount === 1 ? 'image' : 'images'}
            </span>

            {/* Confidence indicator */}
            {item.confidence && (
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {item.confidence}% Match
              </span>
            )}
          </div>

          {/* User query */}
          <h3 className="text-sm font-bold text-white leading-snug truncate" title={item.query}>
            {item.query}
          </h3>

          {/* Time & status */}
          <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-zinc-500" />
              {item.createdAt}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> Completed
            </span>
          </div>
        </div>

        {/* Action triggers: Open Chat button & Menu */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          
          {/* Quick Open Button */}
          <button
            onClick={() => onSelect(item)}
            className={cn(
              "px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-xs",
              isSelected
                ? "text-emerald-300 bg-emerald-500/20 border border-emerald-500/40"
                : "text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
            )}
            title="Open Chat in Right Panel"
          >
            <span>Open Chat</span>
            <ChevronRight size={14} />
          </button>

          {/* Direct Delete Quick Button */}
          <button
            onClick={() => onDeleteRequest(item)}
            className="text-zinc-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
            title="Delete Observation Record"
          >
            <Trash2 size={15} />
          </button>

          {/* Three-dot menu button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10"
              aria-label="Actions Menu"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl p-1.5 shadow-2xl border border-white/20 z-50 animate-in fade-in duration-100 bg-[#0f172a] backdrop-blur-2xl">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSelect(item);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Radio size={14} className="text-teal-400" />
                  <span>Open Chat</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenInDashboard(item);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ExternalLink size={14} className="text-purple-400" />
                  <span>Open in Workspace</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteRequest(item);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={14} className="text-rose-400" />
                  <span>Delete Record</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
