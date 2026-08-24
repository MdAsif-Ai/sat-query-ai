'use client';

import React, { useState } from 'react';
import { InputMode, SensorType, UploadedSlotFile } from '@/lib/types';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { formatBytes, cn } from '@/lib/utils';

interface ImageUploadPanelProps {
  mode: InputMode;
  slotFiles: UploadedSlotFile[];
  setSlotFiles: React.Dispatch<React.SetStateAction<UploadedSlotFile[]>>;
  disabled?: boolean;
}

export function ImageUploadPanel({ mode, slotFiles, setSlotFiles, disabled }: ImageUploadPanelProps) {
  const [dragActiveSlot, setDragActiveSlot] = useState<string | null>(null);

  // Define required slots based on the active mode
  const getSlotDefinitions = () => {
    switch (mode) {
      case 'optical-sar':
        return [
          {
            slotId: 'optical-slot',
            label: 'Optical / Multispectral Image (RGB / NIR)',
            sensorDefault: 'optical-rgb' as SensorType,
            description: 'Sentinel-2, Cartosat-3 or Landsat visible bands'
          },
          {
            slotId: 'sar-slot',
            label: 'Synthetic Aperture Radar (SAR) Image',
            sensorDefault: 'sar-sentinel1' as SensorType,
            description: 'Sentinel-1 or RISAT C/X Band VV+VH backscatter'
          }
        ];
      case 'before-after':
        return [
          {
            slotId: 'before-slot',
            label: 'T1 Baseline Observation (Before)',
            sensorDefault: 'optical-rgb' as SensorType,
            description: 'Historical reference GeoTIFF or high-res image'
          },
          {
            slotId: 'after-slot',
            label: 'T2 Current Observation (After)',
            sensorDefault: 'optical-rgb' as SensorType,
            description: 'Recent observation capture over identical coordinates'
          }
        ];
      case 'single':
      default:
        return [
          {
            slotId: 'primary-slot',
            label: 'Primary Earth Observation Raster',
            sensorDefault: 'optical-rgb' as SensorType,
            description: 'Multi-spectral optical, panchromatic, or SAR imagery'
          }
        ];
    }
  };

  const slots = getSlotDefinitions();

  const handleFileUpload = (files: FileList | null, slotId: string, sensorType: SensorType, label: string) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const extension = file.name.split('.').pop()?.toLowerCase();
    const isValid = ['tif', 'tiff', 'png', 'jpeg', 'jpg'].includes(extension || '');

    if (!isValid) {
      alert(`Unsupported file format: ${file.name}. Please upload GeoTIFF (.tif, .tiff), PNG, or JPEG.`);
      return;
    }

    const id = `slot-${slotId}-${Math.random().toString(36).substring(5)}`;
    let previewUrl = '';
    try {
      previewUrl = URL.createObjectURL(file);
    } catch (e) {
      previewUrl = sensorType.includes('sar') ? '/satellite-sar.jpg' : '/satellite-port.jpg';
    }

    const newSlotFile: UploadedSlotFile = {
      id,
      file,
      previewUrl,
      progress: 100,
      status: 'completed',
      sensorType,
      label,
      metadata: {
        crs: 'EPSG:32643 (UTM Zone 43N)',
        resolutionGSD: extension === 'tif' ? '0.5m / pixel' : '1.0m GSD',
        dimensions: { width: 2048, height: 2048 },
        bands: sensorType.includes('sar') ? ['VV Amplitude', 'VH Co-Pol'] : ['Red', 'Green', 'Blue', 'NIR'],
        sensor: sensorType.includes('sar') ? 'Sentinel-1 C-Band SAR' : 'ISRO Cartosat / Sentinel-2'
      }
    };

    setSlotFiles(prev => {
      const filtered = prev.filter(f => !f.id.startsWith(`slot-${slotId}`));
      return [...filtered, newSlotFile];
    });
  };

  const removeSlotFile = (id: string) => {
    setSlotFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  return (
    <div className="space-y-4 select-none text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Upload size={14} className="text-teal-400" />
          Remote Sensing Image Ingestion ({slotFiles.length}/{slots.length} Ready)
        </span>
        <span className="text-[11px] font-mono text-zinc-400">
          GeoTIFF • TIFF • PNG • JPEG (Max 250MB)
        </span>
      </div>

      <div className={cn("grid gap-4", slots.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
        {slots.map(slot => {
          const currentFile = slotFiles.find(f => f.id.startsWith(`slot-${slot.slotId}`));
          const isDragging = dragActiveSlot === slot.slotId;

          return (
            <div
              key={slot.slotId}
              className={cn(
                "relative rounded-2xl border p-4 flex flex-col justify-between transition-all duration-300 shadow-xl bg-black/40 backdrop-blur-md",
                currentFile
                  ? "border-emerald-500/50 bg-emerald-950/20"
                  : isDragging
                  ? "border-teal-400 bg-teal-950/40 ring-1 ring-teal-400/40"
                  : "border-white/10 hover:border-teal-500/40"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragActiveSlot(slot.slotId); }}
              onDragLeave={() => setDragActiveSlot(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActiveSlot(null);
                handleFileUpload(e.dataTransfer.files, slot.slotId, slot.sensorDefault, slot.label);
              }}
            >
              {/* Slot Header Label */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-xs font-bold text-white truncate max-w-[220px]" title={slot.label}>
                    {slot.label}
                  </span>
                </div>
                {currentFile ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 size={11} /> Validated
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
                    Required
                  </span>
                )}
              </div>

              {/* Upload Drop area or File Details */}
              {currentFile ? (
                <div className="flex items-center gap-3.5 bg-black/50 p-3.5 rounded-xl border border-white/10 relative shadow-inner">
                  {/* Thumbnail */}
                  <div className="h-16 w-16 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                    {currentFile.previewUrl === 'geotiff-placeholder' ? (
                      <div className="flex flex-col items-center gap-0.5 text-teal-400">
                        <FileText size={20} />
                        <span className="text-[8px] font-mono font-bold">GEOTIFF</span>
                      </div>
                    ) : (
                      <img src={currentFile.previewUrl} alt={currentFile.file.name} className="h-full w-full object-cover" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0 space-y-1 text-left">
                    <p className="text-xs font-bold text-white truncate" title={currentFile.file.name}>
                      {currentFile.file.name}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400">
                      Size: {formatBytes(currentFile.file.size)} • {currentFile.metadata?.resolutionGSD || '0.5m GSD'}
                    </p>
                    <p className="text-[10px] font-mono text-teal-400 truncate">
                      {currentFile.metadata?.crs || 'EPSG:32643 (UTM 43N)'}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeSlotFile(currentFile.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Remove File"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 hover:border-teal-400/60 rounded-xl bg-white/[0.02] hover:bg-teal-500/5 transition-all duration-200 cursor-pointer select-none group">
                  <input
                    type="file"
                    className="hidden"
                    accept=".tif,.tiff,.png,.jpeg,.jpg"
                    disabled={disabled}
                    onChange={(e) => handleFileUpload(e.target.files, slot.slotId, slot.sensorDefault, slot.label)}
                  />
                  <Upload size={22} className={cn("mb-2 transition-transform text-teal-400 group-hover:scale-110", isDragging && "animate-bounce")} />
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-teal-300">Click to browse or drop satellite raster</span>
                  <span className="text-[11px] text-zinc-400 mt-0.5">{slot.description}</span>
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
