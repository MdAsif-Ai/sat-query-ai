'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HistoryItem as HistoryItemType } from '@/lib/mock-data';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  MoreVertical, 
  Trash2, 
  Calendar, 
  FileImage, 
  ExternalLink,
  ChevronRight,
  Radio
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

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

  const badgeStatusMap: Record<string, any> = {
    'Bi-temporal Change Analysis': 'alert',
    'Optical + SAR Analysis': 'teal',
    'Grounding & Segmentation': 'grounding',
    'Single Image Analysis': 'routing'
  };

  const badgeStatus = badgeStatusMap[item.type] || 'success';

  return (
    <GlassCard 
      onClick={() => onSelect(item)}
      className={`p-4 transition-all duration-200 rounded-2xl relative select-none cursor-pointer border ${
        isSelected 
          ? 'bg-white/[0.06] border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.15)] ring-1 ring-teal-400/30' 
          : 'bg-zinc-900/30 hover:bg-zinc-900/50 border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3 text-left">
        
        {/* Info content */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Analysis Type Badge */}
            <StatusBadge status={badgeStatus === 'teal' ? 'processing' : badgeStatus} label={item.type} />
            
            {/* Image Count Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02] text-[9px] text-zinc-400 font-semibold leading-none">
              <FileImage size={10} />
              {item.imageCount} {item.imageCount === 1 ? 'image' : 'images'}
            </span>

            {/* Confidence indicator */}
            {item.confidence && (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {item.confidence}% Match
              </span>
            )}
          </div>

          {/* User query */}
          <h3 className={`text-sm font-bold truncate transition-colors ${
            isSelected ? 'text-teal-300' : 'text-zinc-100 group-hover:text-white'
          }`} title={item.query}>
            {item.query}
          </h3>

          {/* Time & status */}
          <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {item.createdAt}
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-700" />
            <span className="text-emerald-400 font-semibold">Completed</span>
          </div>
        </div>

        {/* Action triggers: Chevron & Three-dot menu */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          
          {/* Quick Open Indicator */}
          <button
            onClick={() => onSelect(item)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              isSelected ? 'text-teal-400 bg-teal-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            title="Open Chat in Right Panel"
          >
            <span className="hidden sm:inline text-[11px] font-medium">Open Chat</span>
            <ChevronRight size={15} />
          </button>

          {/* Three-dot menu button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Actions Menu"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-xl glass-panel-elevated p-1 shadow-2xl border border-white/10 z-30 animate-in fade-in duration-100 bg-[#070A12]/95 backdrop-blur-xl">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSelect(item);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-xs text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Radio size={13} className="text-teal-400" />
                  Open Chat
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenInDashboard(item);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-xs text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} className="text-purple-400" />
                  Open in Workspace
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteRequest(item);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-xs text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </GlassCard>
  );
}
