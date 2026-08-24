'use client';

import React, { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Orbit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
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

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden select-none">
      
      {/* Fullscreen Background Image - Crystal Clear & Bright */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url('/satellite_auth_bg.jpg')`
        }}
      />

      {/* Top Header Actions */}
      <header className="relative z-20 w-full px-6 py-6 sm:px-10 flex items-center justify-between">
        {/* Back button to Landing page */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 hover:border-teal-400/60 text-xs font-medium text-white transition-all backdrop-blur-md shadow-xl cursor-pointer group"
        >
          <ArrowLeft size={14} className="text-teal-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Landing</span>
        </Link>

        {/* Brand / Telemetry Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[11px] font-mono text-teal-300 uppercase tracking-wider shadow-xl">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Telemetry: Online · ARS-984</span>
        </div>

        {/* Day/Night Theme toggler */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          className="relative w-13 h-6.5 rounded-full flex items-center p-0.5 cursor-pointer select-none transition-all duration-300 border border-white/20 glass-panel-light shrink-0 backdrop-blur-md"
          style={{
            background: theme === 'light' 
              ? 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(125,211,252,0.5))' 
              : 'rgba(7, 10, 18, 0.6)',
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
      </header>

      {/* Centered Translucent Glass Login Panel */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md rounded-[28px] p-7 sm:p-9 bg-black/45 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-left space-y-6">
          
          {/* Header */}
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.35)]">
                <Orbit size={18} className="animate-spin-slow" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-300">
                Mission Station
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Sign In
            </h1>
            <p className="text-xs text-zinc-200">
              Welcome to the mission station SATQuery AI
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Register Footer Link */}
          <div className="pt-3 border-t border-white/15 text-center text-xs text-zinc-200">
            <span>Don't have access credentials? </span>
            <Link href="/register" className="font-semibold text-teal-300 hover:text-teal-200 underline underline-offset-4 ml-1">
              Register Station
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-[11px] font-mono text-zinc-300/80 drop-shadow">
        SATQuery AI · Earth Observation Intelligence
      </footer>

    </div>
  );
}
