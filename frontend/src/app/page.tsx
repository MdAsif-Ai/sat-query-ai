'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { RotatingEarth } from '@/components/landing/RotatingEarth';
import { 
  ArrowRight, 
  BookOpen, 
  Compass, 
  Mail, 
  Image as ImageIcon, 
  Calendar, 
  Layers, 
  Target, 
  GitBranch, 
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Default to dark space theme on mount unless explicitly set to light
  useEffect(() => {
    const savedTheme = localStorage.getItem('satquery_theme') as 'dark' | 'light' | null;
    if (savedTheme === 'light') {
      setTheme('light');
      document.documentElement.classList.add('light');
    } else {
      setTheme('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('satquery_theme', nextTheme);
    document.documentElement.classList.toggle('light', nextTheme === 'light');
  };

  const capabilities = [
    {
      icon: ImageIcon,
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
      
      {/* Fixed Fullscreen 3D Rotating Earth Horizon & Twinkling Starfield */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <RotatingEarth />
      </div>

      {/* Navigation Header */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-16 header-container fixed top-0 left-0 right-0 z-50 select-none">
        
        {/* Left Side: SatQuery Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl satquery-logo-badge p-1 flex items-center justify-center shrink-0">
            <img src="/SatQuery.png" alt="SATQuery AI Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-wider text-white text-brand-title">SATQuery AI</span>
            <span className="hidden sm:inline-block text-[9px] font-mono text-zinc-400 ml-2 pl-2 border-l border-white/10">Earth Observation Intelligence</span>
          </div>
        </div>

        {/* Right Side: Theme Toggle & Authentication links */}
        <div className="flex items-center gap-3.5">
          {/* Day/Night custom toggle button */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            className="relative w-13 h-6.5 rounded-full flex items-center p-0.5 cursor-pointer select-none transition-all duration-300 border border-white/10 shrink-0"
            style={{
              background: theme === 'light' 
                ? 'linear-gradient(to right, #ffffff, #e2e8f0)' 
                : 'rgba(7, 10, 18, 0.8)',
              boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300 transform"
              style={{
                transform: theme === 'light' ? 'translateX(24px)' : 'translateX(0px)',
                background: theme === 'light' ? '#f59e0b' : '#312e81',
                boxShadow: theme === 'light'
                  ? 'inset 1px 1px 1px rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.2)'
                  : 'inset 1px 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              {theme === 'light' ? (
                <span className="text-[9px] leading-none select-none">☀️</span>
              ) : (
                <span className="text-[9px] leading-none select-none">🌙</span>
              )}
            </div>
          </button>

          <Link href="/login" className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors">
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono uppercase tracking-wider backdrop-blur-md shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              Multimodal Vision-Language Assistant
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-wide text-white leading-tight uppercase drop-shadow-md">
              Ask Your Satellite <br />
              <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.45)]">
                Images Anything.
              </span>
            </h1>

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-medium drop-shadow">
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
                <ClayButton variant="secondary" className="px-7 py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider">
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
              <p className="text-zinc-300 text-sm leading-relaxed">
                The Master Agent orchestrates specialist neural models automatically based on sensor bands and query semantics.
              </p>
            </div>

            {/* Capability cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {capabilities.map((item, index) => {
                const Icon = item.icon;
                return (
                  <GlassCard key={index} className="flex flex-col text-left justify-between h-48 border border-white/10 hover:border-teal-400/50 transition-all p-5 select-none bg-[#111827]/70 hover:bg-[#111827]/90 backdrop-blur-md" hoverable>
                    <div className="space-y-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-white/[0.04] border ${item.color} shadow-sm`}>
                        <Icon size={16} />
                      </div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-normal mb-1 font-medium">{item.description}</p>
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
      <footer id="footer" className="border-t border-white/10 bg-[#0b0f19]/90 backdrop-blur-xl py-10 px-6 md:px-16 lg:px-24 select-none relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="text-sm font-bold text-white leading-tight">SATQuery AI</div>
            <div className="text-[10px] font-mono text-zinc-400 leading-tight">AI FOR EARTH OBSERVATION · DEEP NEURAL SENSING</div>
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
