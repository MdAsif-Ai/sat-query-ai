'use client';

import React, { useState } from 'react';
import { AnalysisResultData } from '@/lib/types';
import { Modal } from '../ui/Modal';
import { ClayButton } from '../ui/ClayButton';
import { FileText, Download, Printer, Check, ShieldCheck, Cpu, Award } from 'lucide-react';
import { exportPdfReport, downloadJsonReport } from '@/lib/report-generator';

interface DownloadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResultData;
}

export function DownloadReportModal({ isOpen, onClose, data }: DownloadReportModalProps) {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  const handlePrintPdf = () => {
    setDownloadedFormat('pdf');
    exportPdfReport(data);
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  const handleDownloadJson = () => {
    setDownloadedFormat('json');
    downloadJsonReport(data);
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Download Geospatial Intelligence Report">
      <div className="space-y-4 text-left select-none">
        {/* Mission Metadata Summary Card */}
        <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">MISSION IDENTIFIER:</span>
            <span className="text-teal-300 font-bold">{data.id}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">CLASSIFIED TASK:</span>
            <span className="text-white font-bold">{data.taskType}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">CONFIDENCE SCORE:</span>
            <span className="text-emerald-400 font-bold">{data.confidence}%</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">SENSOR MODALITY:</span>
            <span className="text-zinc-300">{data.spatialMetadata?.sensor || data.mode}</span>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
          Export verified Earth-observation findings, quantitative land metrics, spatial coordinate footprints, and cryptographic execution provenance.
        </p>

        {/* Download Options Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* PDF Report Option */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="p-3.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-left transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                <Printer size={14} /> Printable PDF Report
              </span>
              {downloadedFormat === 'pdf' ? <Check size={14} className="text-emerald-400" /> : <Download size={14} className="text-zinc-400 group-hover:text-white" />}
            </div>
            <p className="text-[10px] text-zinc-400">
              Formatted A4 PDF document with satellite overlays, telemetry metrics, and ISRO certificate.
            </p>
          </button>

          {/* JSON Structured Data Option */}
          <button
            type="button"
            onClick={handleDownloadJson}
            className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-left transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <FileText size={14} /> Machine-Readable JSON
              </span>
              {downloadedFormat === 'json' ? <Check size={14} className="text-emerald-400" /> : <Download size={14} className="text-zinc-400 group-hover:text-white" />}
            </div>
            <p className="text-[10px] text-zinc-400">
              Raw geospatial JSON with normalized polygon coordinates, bboxes, and trace telemetry.
            </p>
          </button>
        </div>

        {/* Certification footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[9px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <ShieldCheck size={10} className="text-emerald-400" /> Grounding Verified
          </span>
          <span>EPSG:32643 Calibrated</span>
        </div>
      </div>
    </Modal>
  );
}
