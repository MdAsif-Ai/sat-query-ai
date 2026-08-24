'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { RotatingEarth } from '@/components/landing/RotatingEarth';
import { 
  Search, 
  ShoppingBag, 
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
  Sparkles,
  Satellite,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('satquery_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
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

        {/* Center: Navigation links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-widest text-zinc-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">catalogue</Link>
          <a href="#capabilities" className="hover:text-white transition-colors">capabilities</a>
          <Link href="/login" className="hover:text-white transition-colors">station</Link>
          <a href="#footer" className="hover:text-white transition-colors">documentation</a>
        </div>

        {/* Right Side: Theme toggler & Authentication links */}
        <div className="flex items-center gap-4">
          {/* Day/Night Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            className="relative w-13 h-6.5 rounded-full flex items-center p-0.5 cursor-pointer select-none transition-all duration-300 border border-white/10 glass-panel-light shrink-0"
            style={{
              background: theme === 'light' 
                ? 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(125,211,252,0.5))' 
                : 'rgba(7, 10, 18, 0.8)',
              boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.1)'
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
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              {theme === 'light' ? (
                <span className="text-[9px] leading-none select-none">☀️</span>
              ) : (
                <span className="text-[9px] leading-none select-none">🌙</span>
              )}
            </div>
          </button>

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

        {/* Section 2: Capabilities Section with Frosted Glass Panels */}
        <section id="capabilities" className="py-24 bg-[#070A12]/85 backdrop-blur-xl border-t border-white/10 px-6 md:px-16 lg:px-24 select-none relative z-10">
          <div className="max-w-7xl mx-auto space-y-12 text-center">
            <div className="space-y-3 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                One Query. Multiple Remote-Sensing Capabilities.
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                The Master Agent orchestrates specialist neural models automatically based on sensor bands and query semantics.
              </p>
            </div>

            {/* Capability cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {capabilities.map((item, index) => {
                const Icon = item.icon;
                return (
                  <GlassCard key={index} className="flex flex-col text-left justify-between h-48 border border-white/10 hover:border-teal-500/40 transition-all p-5 select-none bg-zinc-950/70" hoverable>
                    <div className="space-y-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-white/[0.02] border ${item.color} shadow-sm`}>
                        <Icon size={16} />
                      </div>
                      <h3 className="text-sm font-semibold text-white/95">{item.title}</h3>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-normal mb-1">{item.description}</p>
                  </GlassCard>
                );
              })}
            </div>

            <div className="pt-4">
              <Link href="/dashboard">
                <ClayButton variant="emerald" className="px-8 py-3 rounded-xl inline-flex items-center gap-2 group text-xs uppercase tracking-wider font-bold">
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
