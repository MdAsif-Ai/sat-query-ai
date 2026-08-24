import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Image, Calendar, Layers, Target, Map, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CapabilityCards() {
  const cards = [
    {
      title: "Single Image Analysis",
      description: "Visual Question Answering and feature identification on high-res optical imagery.",
      icon: Image,
      color: "text-emerald-400 border-emerald-500/25 bg-emerald-500/10 shadow-emerald-500/20",
      accent: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
      specialists: "Geo-Chat v3, RS-LLaVA"
    },
    {
      title: "Temporal Change",
      description: "Pixel-wise difference detection across bi-temporal observation timelines.",
      icon: Calendar,
      color: "text-orange-400 border-orange-500/25 bg-orange-500/10 shadow-orange-500/20",
      accent: "hover:border-orange-500/40 hover:shadow-orange-500/10",
      specialists: "ChangeFormer v2"
    },
    {
      title: "Optical + SAR",
      description: "Fuse radar backscatter polarization coefficients with visible spectral bands.",
      icon: Layers,
      color: "text-cyan-400 border-cyan-500/25 bg-cyan-500/10 shadow-cyan-500/20",
      accent: "hover:border-cyan-500/40 hover:shadow-cyan-500/10",
      specialists: "CrossModal-Net, Sentinel-1"
    },
    {
      title: "Grounding & Segmentation",
      description: "Delineate exact vector boundaries for bodies of water, forests, and structures.",
      icon: Target,
      color: "text-fuchsia-400 border-fuchsia-500/25 bg-fuchsia-500/10 shadow-fuchsia-500/20",
      accent: "hover:border-fuchsia-500/40 hover:shadow-fuchsia-500/10",
      specialists: "SAM-RS, GroundingDINO"
    },
    {
      title: "Geo Analytics",
      description: "Extract UTM coordinate bounds, area surface vectors, and geometry statistics.",
      icon: Map,
      color: "text-teal-400 border-teal-500/25 bg-teal-500/10 shadow-teal-500/20",
      accent: "hover:border-teal-500/40 hover:shadow-teal-500/10",
      specialists: "GeoLayoutLM, CoordEngine"
    },
    {
      title: "AI Supervisor",
      description: "Automatic task orchestration, metadata validation, and evidence verification.",
      icon: ShieldAlert,
      color: "text-amber-400 border-amber-500/25 bg-amber-500/10 shadow-amber-500/20",
      accent: "hover:border-amber-500/40 hover:shadow-amber-500/10",
      specialists: "Master Agent Router"
    }
  ];

  return (
    <div className="space-y-4 select-none">
      <div className="text-left">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <span>Operational Earth-Observation Pipelines</span>
        </h3>
        <p className="text-[11px] text-zinc-500 mt-0.5">The Routing Agent coordinates specialist neural models automatically based on your input.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;

          return (
            <div
              key={idx}
              className={cn(
                "glass-panel-elevated p-5 flex flex-col justify-between min-h-[220px] rounded-2xl transition-all duration-300 cursor-pointer group select-none border border-white/10 hover:scale-[1.04] hover:-translate-y-1.5 hover:shadow-2xl",
                card.accent
              )}
            >
              <div className="space-y-3 text-left">
                <div className={cn("h-9 w-9 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-md", card.color)}>
                  <Icon size={18} />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white leading-tight group-hover:text-teal-300 transition-colors">
                  {card.title}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="text-left pt-3 mt-3 border-t border-white/5">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Specialist Models</span>
                <span className="text-[10px] font-mono font-semibold text-zinc-300 truncate block mt-0.5" title={card.specialists}>
                  {card.specialists}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
