import React from 'react';
import { Image, Calendar, Layers, Target, Map, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CapabilityCards() {
  const cards = [
    {
      title: "Single Image Analysis",
      description: "Visual Question Answering and feature identification on high-res optical imagery.",
      icon: Image,
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-xs",
      accent: "hover:border-emerald-500/50",
      specialists: "Geo-Chat v3, RS-LLaVA"
    },
    {
      title: "Temporal Change",
      description: "Pixel-wise difference detection across bi-temporal observation timelines.",
      icon: Calendar,
      color: "text-orange-400 border-orange-500/30 bg-orange-500/10 shadow-xs",
      accent: "hover:border-orange-500/50",
      specialists: "ChangeFormer v2"
    },
    {
      title: "Optical + SAR",
      description: "Fuse radar backscatter polarization coefficients with visible spectral bands.",
      icon: Layers,
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-xs",
      accent: "hover:border-cyan-500/50",
      specialists: "CrossModal-Net, Sentinel-1"
    },
    {
      title: "Grounding & Segmentation",
      description: "Delineate exact vector boundaries for bodies of water, forests, and structures.",
      icon: Target,
      color: "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10 shadow-xs",
      accent: "hover:border-fuchsia-500/50",
      specialists: "SAM-RS, GroundingDINO"
    },
    {
      title: "Geo Analytics",
      description: "Extract UTM coordinate bounds, area surface vectors, and geometry statistics.",
      icon: Map,
      color: "text-teal-400 border-teal-500/30 bg-teal-500/10 shadow-xs",
      accent: "hover:border-teal-500/50",
      specialists: "GeoLayoutLM, CoordEngine"
    },
    {
      title: "AI Supervisor",
      description: "Automatic task orchestration, metadata validation, and evidence verification.",
      icon: ShieldAlert,
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-xs",
      accent: "hover:border-amber-500/50",
      specialists: "Master Agent Router"
    }
  ];

  return (
    <div className="space-y-4 select-none">
      <div className="text-left">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <span>Operational Earth-Observation Pipelines</span>
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">The Routing Agent coordinates specialist neural models automatically based on your input.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;

          return (
            <div
              key={idx}
              className={cn(
                "bg-[#111827]/75 hover:bg-[#111827]/95 backdrop-blur-xl p-5 flex flex-col justify-between min-h-[220px] rounded-2xl transition-all duration-300 cursor-pointer group select-none border border-white/10 shadow-xl hover:-translate-y-0.5",
                card.accent
              )}
            >
              <div className="space-y-3 text-left">
                <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs", card.color)}>
                  <Icon size={20} />
                </div>
                <h4 className="text-sm font-bold text-white leading-tight group-hover:text-teal-300 transition-colors">
                  {card.title}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {card.description}
                </p>
              </div>

              <div className="text-left pt-3 mt-3 border-t border-white/10">
                <span className="text-[9px] font-mono font-semibold text-zinc-500 uppercase tracking-wider block">Specialist Models</span>
                <span className="text-[11px] font-mono font-medium text-zinc-300 truncate block mt-0.5" title={card.specialists}>
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
