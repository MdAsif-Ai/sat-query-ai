'use client';

import React, { useState } from 'react';
import { BoundingBox } from '@/lib/types';
import { Target, Layers, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoundingBoxesViewerProps {
  imageUrl: string;
  boundingBoxes: BoundingBox[];
}

export function BoundingBoxesViewer({ imageUrl, boundingBoxes }: BoundingBoxesViewerProps) {
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(boundingBoxes.map(b => b.category)))];

  const filteredBoxes = selectedCategory === 'all'
    ? boundingBoxes
    : boundingBoxes.filter(b => b.category === selectedCategory);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'vessel':
        return { border: 'border-cyan-400', bg: 'bg-cyan-500/20', text: 'text-cyan-300', badge: 'bg-cyan-500/80' };
      case 'storage-tank':
        return { border: 'border-amber-400', bg: 'bg-amber-500/20', text: 'text-amber-300', badge: 'bg-amber-500/80' };
      case 'infrastructure':
        return { border: 'border-purple-400', bg: 'bg-purple-500/20', text: 'text-purple-300', badge: 'bg-purple-500/80' };
      default:
        return { border: 'border-emerald-400', bg: 'bg-emerald-500/20', text: 'text-emerald-300', badge: 'bg-emerald-500/80' };
    }
  };

  return (
    <div className="w-full h-full relative flex flex-col justify-between overflow-hidden">
      {/* Background Raster */}
      <div className="relative w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950/20 via-black to-cyan-950/20">
        <div className="relative max-h-full max-w-full aspect-[4/3] rounded-lg overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={imageUrl || '/satellite-port.jpg'}
            alt="Grounded Satellite Observation"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/satellite-port.jpg';
            }}
            className="w-full h-full object-cover"
          />

          {/* Render Bounding Boxes Overlay */}
          {filteredBoxes.map((box) => {
            const colors = getCategoryColor(box.category);
            const isHovered = hoveredBoxId === box.id;

            return (
              <div
                key={box.id}
                onMouseEnter={() => setHoveredBoxId(box.id)}
                onMouseLeave={() => setHoveredBoxId(null)}
                className={cn(
                  "absolute border-2 rounded transition-all duration-200 cursor-pointer flex flex-col justify-between p-1",
                  colors.border,
                  isHovered ? "bg-white/20 shadow-[0_0_15px_rgba(6,182,212,0.6)] z-30 scale-105" : colors.bg
                )}
                style={{
                  left: `${box.coordinates.x}%`,
                  top: `${box.coordinates.y}%`,
                  width: `${box.coordinates.width}%`,
                  height: `${box.coordinates.height}%`
                }}
              >
                {/* Top Label Tag */}
                <div className="flex items-center gap-1 self-start">
                  <span className={cn("text-[8px] font-mono font-bold text-white px-1 py-0.5 rounded shadow-sm leading-none uppercase", colors.badge)}>
                    {box.label}
                  </span>
                </div>

                {/* Bottom Confidence */}
                <span className="text-[7px] font-mono font-bold text-white bg-black/80 px-1 py-0.5 rounded self-end border border-white/10">
                  {box.confidence}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Filter Pill Selector Overlay on Canvas */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 z-20">
          <span className="text-[9px] font-mono text-zinc-400 px-1">CLASS FILTER:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "text-[9px] font-mono uppercase px-2 py-0.5 rounded transition-colors cursor-pointer",
                selectedCategory === cat ? "bg-teal-500 text-black font-bold" : "text-zinc-300 hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
