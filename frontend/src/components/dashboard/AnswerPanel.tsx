'use client';

import React, { useState } from 'react';
import { ClayButton } from '../ui/ClayButton';
import { Copy, Check, FileDown, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnswerPanelProps {
  query: string;
  answer: string;
  keyInsights?: string[];
  confidence: number;
  taskType: string;
  onOpenReportModal?: () => void;
  onSaveToHistory?: () => void;
}

export function AnswerPanel({
  query,
  answer,
  keyInsights,
  confidence,
  taskType,
  onOpenReportModal,
  onSaveToHistory
}: AnswerPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`SATQuery AI Report:\nQuery: ${query}\nTask: ${taskType}\nConfidence: ${confidence}%\n\nAnswer:\n${answer}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 rounded-2xl bg-[#111827]/75 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 space-y-5 select-none text-left">
      {/* Header with Title and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Multimodal Geospatial Intelligence
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Ground-verified response generated from specialist neural fusion
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
            title="Copy Response Text"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onOpenReportModal && (
            <ClayButton variant="teal" onClick={onOpenReportModal} className="px-3.5 py-1.5 text-xs rounded-xl flex items-center gap-1.5 font-bold shadow-md">
              <FileDown size={14} />
              <span>Export Report</span>
            </ClayButton>
          )}
        </div>
      </div>

      {/* Query Banner */}
      <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10 shadow-inner">
        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Inquiry Prompt</span>
        <blockquote className="text-xs font-medium text-zinc-200 italic leading-relaxed">
          "{query}"
        </blockquote>
      </div>

      {/* Main Formatted Answer */}
      <div className="space-y-2">
        <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider block">
          Synthesized Findings:
        </span>
        <div className="text-xs sm:text-sm text-zinc-200 font-normal leading-relaxed whitespace-pre-line bg-black/50 p-4 rounded-xl border border-white/10 space-y-2 shadow-inner">
          {answer}
        </div>
      </div>

      {/* Key Insights Bullet Cards */}
      {keyInsights && keyInsights.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-xs font-mono text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb size={14} className="text-amber-400" />
            Key Strategic Insights
          </span>
          <div className="grid grid-cols-1 gap-2">
            {keyInsights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-white/[0.03] p-3 rounded-xl border border-white/10 text-xs font-normal text-zinc-200 shadow-xs"
              >
                <span className="h-5 w-5 rounded-full bg-teal-500/10 text-teal-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-teal-500/30">
                  {idx + 1}
                </span>
                <span className="leading-snug">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
