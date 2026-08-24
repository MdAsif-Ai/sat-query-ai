'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { RotatingEarth } from '@/components/landing/RotatingEarth';
import { 
  ArrowRight, 
  BookOpen, 
  Compass, 
  Mail, 
  Image, 
  Calendar, 
  Layers, 
  Target, 
  GitBranch, 
  Orbit, 
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  // Respect saved theme on mount if previously toggled
  useEffect(() => {
    const savedTheme = localStorage.getItem('satquery_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }
  }, []);

  const capabilities = [
    {
      icon: Image,
      title: "Single Image Analysis",
      description: "Visual Question Answering and feature identification on high-res optical imagery.",
      color: "border-emerald-500/30 text-emerald-400"
    },
    {
      icon: Calendar,
      title: "Temporal Change Detection",
      description: "Spot urban expansion, deforestation, and water deviations over bi-temporal dates.",
      color: "border-orange-500/30 text-orange-400"
    },
    {
      icon: Layers,
      title: "Optical + SAR Analysis",
      description: "Synthesize synthetic aperture radar and visible wavelengths to pierce cloud coverage.",
      color: "border-cyan-500/30 text-cyan-400"
    },
    {
      icon: Target,
      title: "Grounding & Segmentation",
      description: "Segment and count infrastructure, highways, agricultural crops, or rivers.",
      color: "border-fuchsia-500/30 text-fuchsia-400"
    },
    {
      icon: GitBranch,
      title: "Intelligent Agent Routing",
      description: "Inputs are routed automatically to specialist models by the Master Agent.",
      color: "border-amber-500/30 text-amber-400"
    }
  ];

  return (
    <div className="min-h-screen space-background text-zinc-100 flex flex-col selection:bg-teal-500/20 selection:text-white relative overflow-x-hidden">
      
      {/* Fixed Rotating Earth Horizon Background */}
      <div className="fixed -bottom-[500px] sm:-bottom-[700px] md:-bottom-[880px] left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] sm:w-[1500px] sm:h-[1500px] md:w-[1800px] md:h-[1800px] pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <RotatingEarth />
      </div>

      {/* Navigation Header */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-16 backdrop-blur-xl bg-[#050811]/70 fixed top-0 left-0 right-0 z-50 border-b border-white/5 select-none">
        
        {/* Left Side: Orbit Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
            <Orbit size={18} className="animate-spin-slow" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-wider text-white">SATQuery AI</span>
            <span className="hidden sm:inline-block text-[9px] font-mono text-zinc-400 ml-2 pl-2 border-l border-white/10">Earth Observation Intelligence</span>
          </div>
        </div>

        {/* Right Side: Authentication links */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs text-zinc-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <ClayButton variant="secondary" className="px-3.5 py-1.5 text-xs rounded-xl">
              Create Account
            </ClayButton>
          </Link>
        </div>
      </nav>

      {/* Main Content Layout (Scrolls smoothly over the fixed Earth background) */}
      <main className="flex-grow pt-20 relative z-10">
        
        {/* Section 1: Hero Section */}
        <section className="min-h-[86vh] flex flex-col items-center justify-center px-6 md:px-16 text-center select-none">
          
          <div className="max-w-3xl space-y-6 pt-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs font-mono uppercase tracking-wider backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              Multimodal Vision-Language Assistant
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-wide text-white leading-tight uppercase drop-shadow-md">
              Ask Your Satellite <br />
              <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.45)]">
                Images Anything.
              </span>
            </h1>

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
              SATQuery AI turns natural-language queries into automated remote-sensing workflows with bi-temporal change detection, SAR fusion, and vector grounding.
            </p>
            
            {/* Hero Action Buttons */}
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link href="/dashboard">
                <ClayButton variant="teal" className="px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 group">
                  <Sparkles size={15} className="text-emerald-300 group-hover:rotate-12 transition-transform" />
                  <span>Start Analyzing</span>
                </ClayButton>
              </Link>
              <a href="#capabilities">
                <ClayButton variant="secondary" className="px-7 py-3.5 rounded-xl font-medium text-xs uppercase tracking-wider">
                  Explore Platform
                </ClayButton>
              </a>
            </div>
          </div>
        </section>

        {/* Section 2: Capabilities Section */}
        <section id="capabilities" className="py-24 px-6 md:px-16 lg:px-24 select-none relative z-10">
          <div className="max-w-7xl mx-auto space-y-12 text-center">
            <div className="space-y-3 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase drop-shadow-md">
                One Query. Multiple Remote-Sensing Capabilities.
              </h2>
              <p className="text-zinc-300 text-sm leading-relaxed drop-shadow">
                The Master Agent orchestrates specialist neural models automatically based on sensor bands and query semantics.
              </p>
            </div>

            {/* Capability cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {capabilities.map((item, index) => {
                const Icon = item.icon;
                return (
                  <GlassCard key={index} className="flex flex-col text-left justify-between h-48 border border-white/15 hover:border-teal-400/50 transition-all p-5 select-none bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md" hoverable>
                    <div className="space-y-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-white/[0.04] border ${item.color} shadow-sm`}>
                        <Icon size={16} />
                      </div>
                      <h3 className="text-sm font-semibold text-white/95">{item.title}</h3>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-normal mb-1">{item.description}</p>
                  </GlassCard>
                );
              })}
            </div>

            <div className="pt-4">
              <Link href="/dashboard">
                <ClayButton variant="emerald" className="px-8 py-3 rounded-xl inline-flex items-center gap-2 group text-xs uppercase tracking-wider font-bold shadow-2xl">
                  <span>Open Workspace</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </ClayButton>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer" className="border-t border-white/10 bg-[#050811]/90 backdrop-blur-xl py-10 px-6 md:px-16 lg:px-24 select-none relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="text-sm font-bold text-white leading-tight">SATQuery AI</div>
            <div className="text-[10px] font-mono text-zinc-500 leading-tight">AI FOR EARTH OBSERVATION · DEEP NEURAL SENSING</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-xs font-mono text-zinc-400">
            <Link href="/" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Compass size={12} />
              About
            </Link>
            <Link href="/" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <BookOpen size={12} />
              Documentation
            </Link>
            <Link href="/" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Mail size={12} />
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
