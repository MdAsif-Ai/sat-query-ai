'use client';

import React, { useState, useEffect } from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
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

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden select-none space-background">
      
      {/* Top Header Actions */}
      <header className="relative z-20 w-full px-6 py-6 sm:px-10 flex items-center justify-between">
        {/* Back button to Landing page */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/50 hover:bg-black/70 border border-white/20 hover:border-purple-500/60 text-xs font-semibold text-white transition-all backdrop-blur-md shadow-lg cursor-pointer group"
        >
          <ArrowLeft size={14} className="text-purple-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Landing</span>
        </Link>

        {/* Day/Night Theme toggler */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          className="relative w-13 h-6.5 rounded-full flex items-center p-0.5 cursor-pointer select-none transition-all duration-300 border border-white/20 shrink-0 backdrop-blur-md"
          style={{
            background: theme === 'light' 
              ? 'linear-gradient(to right, #ffffff, #e2e8f0)' 
              : 'rgba(7, 10, 18, 0.75)',
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
      </header>

      {/* Main Centered Command Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-5xl rounded-[32px] overflow-hidden border border-white/15 shadow-2xl bg-[#0b0f19]/90 backdrop-blur-2xl grid grid-cols-1 md:grid-cols-12 relative z-10 my-4">
          
          {/* Left Side: Satellite Space Observation Artwork */}
          <div 
            className="md:col-span-6 lg:col-span-7 relative min-h-[380px] md:min-h-[600px] bg-cover bg-center overflow-hidden flex flex-col justify-between p-8 border-b md:border-b-0 md:border-r border-white/10"
            style={{
              backgroundImage: `url('/satellite_auth_bg.jpg')`
            }}
          >
            {/* Top telemetry indicator badge */}
            <div className="flex items-center gap-2 self-start px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono text-purple-300 uppercase tracking-wider shadow-lg">
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Station: Provisioning · ORB-771</span>
            </div>

            {/* Bottom-left floating glass badge */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/65 backdrop-blur-xl border border-white/15 text-left max-w-xs shadow-2xl space-y-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                Station Provisioning
              </div>
              <div className="text-base font-extrabold text-white leading-tight">
                Mission to Earth Orbit
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Initialize your multimodal remote-sensing profile.
              </p>
            </div>
          </div>

          {/* Right Side: Form Panel */}
          <div className="md:col-span-6 lg:col-span-5 bg-[#0f1422]/95 p-7 sm:p-10 flex flex-col justify-center text-left space-y-4">
            
            {/* Header */}
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-9 w-9 rounded-xl satquery-logo-badge p-1 flex items-center justify-center shrink-0">
                  <img src="/SatQuery.png" alt="SATQuery AI Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                  Mission Station
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Register
              </h2>
              <p className="text-xs text-zinc-400">
                Welcome to the mission station SATQuery AI
              </p>
            </div>

            {/* Register Form */}
            <RegisterForm />

            {/* Sign In Footer Link */}
            <div className="pt-2 border-t border-white/10 text-center text-xs text-zinc-400">
              <span>Already registered with mission control? </span>
              <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300 underline underline-offset-4 ml-1">
                Sign In
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-[11px] font-mono text-zinc-400">
        SATQuery AI · Earth Observation Intelligence
      </footer>

    </div>
  );
}
