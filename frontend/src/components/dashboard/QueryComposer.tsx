'use client';

import React, { useState } from 'react';
import { UploadedFile } from './ImageUploader';
import { ClayButton } from '../ui/ClayButton';
import { Send, FileText, X, Sparkles } from 'lucide-react';

interface QueryComposerProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export function QueryComposer({ files, onRemoveFile, onSubmit, isLoading }: QueryComposerProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const maxChars = 500;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= maxChars) {
      setQuery(val);
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!query.trim()) {
      setError('Please enter a question about your imagery.');
      return;
    }
    onSubmit(query.trim());
  };

  return (
    <div className="space-y-3.5">
      {/* Container Wrapper */}
      <div className="glass-input rounded-xl border border-white/5 p-3 flex flex-col focus-within:border-brand-routing/40 focus-within:ring-1 focus-within:ring-brand-routing/10 transition-colors">
        
        {/* Attached references inside/top of composer */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2.5 mb-2.5 border-b border-white/5">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0 pt-1.5">
              Attached ({files.length}):
            </span>
            {files.map(file => (
              <div
                key={file.id}
                className="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded bg-white/[0.04] border border-white/5 text-[10px] text-zinc-300 font-medium select-none"
              >
                {file.previewUrl === 'geotiff-placeholder' ? (
                  <FileText size={10} className="text-brand-processing" />
                ) : (
                  <img
                    src={file.previewUrl}
                    alt={file.file.name}
                    className="h-3 w-3 rounded object-cover shrink-0"
                  />
                )}
                <span className="max-w-[80px] truncate">{file.file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  disabled={isLoading}
                  className="text-zinc-500 hover:text-zinc-300 rounded p-0.5 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          rows={3}
          value={query}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={
            files.length > 0
              ? "Ask something about your imagery (e.g., 'What changed between these images?')..."
              : "Upload imagery above and compose your question here..."
          }
          className="w-full bg-transparent border-0 outline-none p-1 text-sm text-zinc-100 placeholder-zinc-500 resize-none min-h-[60px]"
        />

        {/* Footer actions inside the Composer box */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.03] text-[10px] text-zinc-500 font-medium select-none">
          {/* Validation Alert inline */}
          {error ? (
            <span className="text-red-400 font-semibold animate-shake">{error}</span>
          ) : (
            <span>Use Shift+Enter for new lines</span>
          )}

          {/* Character counter */}
          <span>
            {query.length} / {maxChars}
          </span>
        </div>
      </div>

      {/* Main Large Action Analyze button */}
      <ClayButton
        variant="primary"
        onClick={handleSubmit}
        isLoading={isLoading}
        className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 group cursor-pointer shadow-lg"
      >
        <Sparkles size={16} className="text-brand-success group-hover:scale-110 transition-transform" />
        Analyze with SATQuery AI
      </ClayButton>
    </div>
  );
}
