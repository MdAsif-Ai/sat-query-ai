'use client';

import React, { useState } from 'react';
import { InputMode, UploadedSlotFile } from '@/lib/types';
import { ClayButton } from '../ui/ClayButton';
import { Sparkles, CornerDownLeft, Terminal, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueryInputPanelProps {
  mode: InputMode;
  slotFiles: UploadedSlotFile[];
  onSubmitQuery: (query: string) => void;
  isLoading: boolean;
  activeQuery: string;
}

export function QueryInputPanel({ mode, slotFiles, onSubmitQuery, isLoading, activeQuery }: QueryInputPanelProps) {
  const [query, setQuery] = useState(activeQuery || '');
  const [error, setError] = useState('');
  const maxChars = 500;

  // Contextual smart suggestions per mode
  const getSuggestions = () => {
    switch (mode) {
      case 'optical-sar':
        return [
          'Pierce cloud canopy to detect maritime vessels and port structures.',
          'Identify high-dielectric industrial zones using SAR backscatter.',
          'Delineate flood-inundated areas obscured by monsoon cloud cover.'
        ];
      case 'before-after':
        return [
          'What changed in urban built-up area and farmland between T1 and T2?',
          'Quantify percentage loss in forest canopy and reservoir surface area.',
          'Identify new infrastructure construction and transport expansion.'
        ];
      case 'single':
      default:
        return [
          'Identify and locate all cargo container vessels with bounding boxes.',
          'Segment all visible water bodies, reservoirs, and transport corridors.',
          'Provide a detailed scene description of this coastal port facility.'
        ];
    }
  };

  const suggestions = getSuggestions();

  const handleSubmit = () => {
    if (!query.trim()) {
      setError('Please enter an Earth-observation question or prompt.');
      return;
    }
    setError('');
    onSubmitQuery(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4 select-none text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Terminal size={14} className="text-teal-400" />
          Natural-Language Mission Query
        </span>
        <span className="text-[11px] font-mono text-zinc-400">
          Shift+Enter for multi-line
        </span>
      </div>

      {/* Textarea container */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 focus-within:border-teal-500/70 focus-within:ring-1 focus-within:ring-teal-500/30 transition-all space-y-3 shadow-inner">
        <textarea
          rows={3}
          value={query}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              setQuery(e.target.value);
              if (error) setError('');
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={
            mode === 'before-after'
              ? 'Ask about temporal changes (e.g., "What is the percentage increase in built-up area between these observations?")...'
              : mode === 'optical-sar'
              ? 'Ask about cloud-penetration or radar backscatter (e.g., "Detect vessels under cloud cover using SAR VV/VH")...'
              : 'Ask anything about your satellite imagery (e.g., "Identify and box all ships and segment water reservoirs")...'
          }
          className="w-full bg-transparent border-0 outline-none text-sm text-zinc-100 font-medium placeholder:text-zinc-500 resize-none leading-relaxed"
        />

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs font-mono text-zinc-400">
          {error ? (
            <span className="text-red-400 font-bold">{error}</span>
          ) : (
            <span>Master Agent will auto-route specialist neural models</span>
          )}
          <span>{query.length} / {maxChars}</span>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-300">
          <Lightbulb size={13} className="text-amber-400" />
          <span>Suggested Query Prompts for {mode.toUpperCase()} Mode:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setQuery(suggestion);
                setError('');
              }}
              className="text-xs text-zinc-300 font-normal bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/40 px-3.5 py-1.5 rounded-xl transition-all duration-200 text-left cursor-pointer truncate max-w-full hover:text-white shadow-xs"
              title={suggestion}
            >
              • {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Large Action Analyze Button */}
      <ClayButton
        variant="emerald"
        onClick={handleSubmit}
        isLoading={isLoading}
        className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group cursor-pointer shadow-xl hover:shadow-2xl transition-all"
      >
        <Sparkles size={16} className="text-white group-hover:rotate-12 transition-transform" />
        <span>Execute Autonomous Satellite Analysis</span>
        <CornerDownLeft size={14} className="opacity-90" />
      </ClayButton>
    </div>
  );
}
