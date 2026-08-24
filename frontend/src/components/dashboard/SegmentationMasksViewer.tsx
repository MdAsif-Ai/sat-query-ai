'use client';

import React, { useState } from 'react';
import { SegmentationPolygon } from '@/lib/types';
import { Layers, Sliders, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SegmentationMasksViewerProps {
  imageUrl: string;
  polygons: SegmentationPolygon[];
}

export function SegmentationMasksViewer({ imageUrl, polygons }: SegmentationMasksViewerProps) {
  const [opacity, setOpacity] = useState<number>(0.55);
  const [activePolygonId, setActivePolygonId] = useState<string | null>(null);

  return (
    <div className="w-full h-full relative flex flex-col justify-between overflow-hidden">
      {/* Background Raster with SVG Mask Overlay */}
      <div className="relative w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-purple-950/20 via-black to-indigo-950/20">
        <div className="relative max-h-full max-w-full aspect-[4/3] rounded-lg overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={imageUrl || '/satellite-port.jpg'}
            alt="Segmented Satellite Observation"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/satellite-port.jpg';
            }}
            className="w-full h-full object-cover"
          />

          {/* SVG Vector Segmentation Polygon Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
            {polygons.map((poly) => {
              const pointsStr = poly.points.map(p => `${p.x},${p.y}`).join(' ');
              const isActive = activePolygonId === poly.id;

              return (
                <polygon
                  key={poly.id}
                  points={pointsStr}
                  fill={poly.color}
                  fillOpacity={isActive ? Math.min(opacity + 0.3, 0.95) : opacity}
                  stroke={poly.color}
                  strokeWidth={isActive ? '1.5' : '0.8'}
                  strokeDasharray={isActive ? 'none' : '2 1'}
                  className="transition-all duration-200"
                />
              );
            })}
          </svg>
        </div>

        {/* Top Control Bar with Opacity Slider */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md p-2 rounded-lg border border-white/10 flex items-center gap-3 z-20">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-300">
            <Sliders size={11} className="text-purple-400" />
            <span>MASK OPACITY:</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
          <span className="text-[9px] font-mono text-purple-300">{Math.round(opacity * 100)}%</span>
        </div>

        {/* Legend pill list at bottom left */}
        <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md p-2 rounded-lg border border-white/10 flex flex-wrap gap-2 z-20 max-w-[80%]">
          {polygons.map((poly) => (
            <div
              key={poly.id}
              onMouseEnter={() => setActivePolygonId(poly.id)}
              onMouseLeave={() => setActivePolygonId(null)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer border",
                activePolygonId === poly.id ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/5 text-zinc-300"
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: poly.color }} />
              <span className="font-semibold">{poly.label}</span>
              <span className="text-zinc-500">({poly.areaKm2} km²)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
