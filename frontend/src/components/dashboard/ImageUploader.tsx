'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
}

interface ImageUploaderProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

export function ImageUploader({ files, setFiles }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  const simulateProgress = (fileId: string) => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setFiles(prev =>
          prev.map(f =>
            f.id === fileId ? { ...f, progress: 100, status: 'completed' } : f
          )
        );
      } else {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileId ? { ...f, progress: currentProgress } : f
          )
        );
      }
    }, 150);
  };

  const handleFiles = (fileList: FileList) => {
    const validFiles: UploadedFile[] = [];

    Array.from(fileList).forEach(file => {
      // Validate type
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isValidExtension = ['tif', 'tiff', 'png', 'jpeg', 'jpg'].includes(extension || '');
      const isValidMime = file.type.startsWith('image/') || file.name.endsWith('.tif') || file.name.endsWith('.tiff');

      if (!isValidExtension && !isValidMime) {
        alert(`Unsupported file format: ${file.name}. Please upload GeoTIFF, PNG, or JPEG.`);
        return;
      }

      const id = Math.random().toString(36).substring(7);
      
      // Create Object URL for image preview (GeoTIFF won't render directly, so we use an abstract placeholder for tif/tiff)
      let previewUrl = '';
      if (['png', 'jpeg', 'jpg'].includes(extension || '')) {
        previewUrl = URL.createObjectURL(file);
      } else {
        previewUrl = 'geotiff-placeholder';
      }

      const uploaded: UploadedFile = {
        id,
        file,
        previewUrl,
        progress: 0,
        status: 'uploading'
      };

      validFiles.push(uploaded);
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      validFiles.forEach(f => simulateProgress(f.id));
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = () => {
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Upload Drag/Drop Box */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerInputClick}
        className={`w-full py-8 px-6 rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none ${
          isDragActive
            ? 'border-brand-routing bg-brand-routing/5'
            : 'border-white/10 bg-black/20 hover:bg-black/35 hover:border-white/15'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={onFileChange}
          className="hidden"
          accept=".tif,.tiff,.png,.jpeg,.jpg"
        />
        <div className="h-10 w-10 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-400">
          <Upload size={18} className={isDragActive ? 'animate-bounce text-brand-routing' : ''} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-white/90">Upload Image(s)</p>
          <p className="text-[11px] text-zinc-500">Drop your satellite imagery here or browse files.</p>
        </div>
      </div>

      {/* Supported formats label OUTSIDE upload box */}
      <div className="flex justify-between items-center px-1 text-[10px] text-zinc-500 font-medium">
        <span>Supported formats: GeoTIFF (.tif, .tiff) • TIFF • PNG • JPEG</span>
        <span>Max size: 250MB per file</span>
      </div>

      {/* Previews Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-2">
          {files.map(file => (
            <div
              key={file.id}
              className="relative rounded-lg overflow-hidden border border-white/5 bg-zinc-900/60 p-2 flex flex-col justify-between group h-28"
            >
              {/* Image preview / Icon placeholder */}
              <div className="h-14 w-full rounded bg-black/40 overflow-hidden flex items-center justify-center relative">
                {file.previewUrl === 'geotiff-placeholder' ? (
                  <div className="flex flex-col items-center gap-1 text-brand-processing">
                    <FileText size={20} />
                    <span className="text-[8px] font-bold font-mono">GEOTIFF</span>
                  </div>
                ) : (
                  <img
                    src={file.previewUrl}
                    alt={file.file.name}
                    className="h-full w-full object-cover"
                  />
                )}
                {/* Overlay Progress for uploading state */}
                {file.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-1.5 p-2">
                    <RefreshCw size={12} className="animate-spin text-brand-routing" />
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div
                        className="bg-brand-routing h-1 rounded-full transition-all duration-150"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Text metadata footer */}
              <div className="mt-1.5 min-w-0">
                <p className="text-[10px] font-semibold text-white/90 truncate leading-tight" title={file.file.name}>
                  {file.file.name}
                </p>
                <div className="flex items-center justify-between text-[9px] text-zinc-500 leading-none mt-1">
                  <span>{formatBytes(file.file.size, 1)}</span>
                  {file.status === 'completed' && (
                    <span className="text-brand-success flex items-center gap-0.5">
                      <CheckCircle size={8} /> Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-zinc-400 hover:text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm border border-white/5"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
