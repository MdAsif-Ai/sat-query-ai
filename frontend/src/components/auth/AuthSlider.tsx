'use client';

import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AuthEarthSatelliteScene } from './AuthEarthSatelliteScene';

interface AuthSliderProps {
  initialMode?: 'login' | 'register';
}

export function AuthSlider({ initialMode = 'login' }: AuthSliderProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load saved theme on mount
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

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', newMode === 'login' ? '/login' : '/register');
    }
  };

  return (
    <div className="relative w-full h-screen min-h-[640px] overflow-hidden bg-[#060913] text-foreground select-none flex flex-col justify-between">
      
      {/* Top Floating Controls Overlay */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-5 sm:px-10 flex items-center justify-between pointer-events-none">
        {/* Back to Landing Button */}
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 hover:border-teal-400/60 text-xs font-semibold text-white transition-all backdrop-blur-md shadow-xl cursor-pointer group"
        >
          <ArrowLeft size={14} className="text-teal-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Landing</span>
        </Link>

        {/* Day/Night Theme Toggler */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          className="pointer-events-auto relative w-13 h-6.5 rounded-full flex items-center p-0.5 cursor-pointer select-none transition-all duration-300 border border-white/20 shrink-0 backdrop-blur-md"
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

      {/* Main Fullscreen Split Screen Container */}
      <div className="relative w-full h-full flex flex-col lg:flex-row overflow-hidden">

        {/* ------------------------------------------------------------- */}
        {/* Visual Panel: 3D Spinning Earth & Orbiting Satellite (Sliding 50% Panel) */}
        {/* ------------------------------------------------------------- */}
        <div
          className={`hidden lg:block absolute top-0 bottom-0 w-1/2 h-full z-30 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            mode === 'login' ? 'left-0 translate-x-0' : 'left-0 translate-x-full'
          }`}
        >
          <div className="relative w-full h-full bg-[#050811] overflow-hidden flex flex-col justify-end p-12">
            {/* 3D WebGL Spinning Earth & Orbiting Satellite */}
            <AuthEarthSatelliteScene />

            {/* Subtle Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Left Form Area: Register Form (Visible when mode === 'register') */}
        {/* ------------------------------------------------------------- */}
        <div 
          className={`w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-4 py-12 sm:px-8 md:px-12 overflow-y-auto transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            mode === 'register' 
              ? 'lg:opacity-100 lg:translate-x-0 pointer-events-auto' 
              : 'lg:opacity-0 lg:-translate-x-16 pointer-events-none hidden lg:flex'
          }`}
        >
          {/* Sheer Glassmorphism Card Container */}
          <div className="w-full max-w-md my-auto p-7 sm:p-9 rounded-[32px] bg-white/[0.03] backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-5 relative overflow-hidden">
            {/* Top subtle highlight rim */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-9 w-9 rounded-xl satquery-logo-badge p-1 flex items-center justify-center shrink-0">
                  <img src="/SatQuery.png" alt="SATQuery AI Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                  Mission Station
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Register
              </h1>
              <p className="text-xs text-zinc-400">
                Welcome to the mission station SATQuery AI
              </p>
            </div>

            {/* Registration Form */}
            <RegisterForm />

            {/* Switch to Login Link */}
            <div className="pt-2 border-t border-white/10 text-center text-xs text-zinc-400">
              <span>Already registered with mission control? </span>
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="font-bold text-teal-400 hover:text-teal-300 underline underline-offset-4 ml-1 cursor-pointer transition-colors"
              >
                Sign In
              </button>
            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Right Form Area: Sign In Form (Visible when mode === 'login') */}
        {/* ------------------------------------------------------------- */}
        <div 
          className={`w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-4 py-12 sm:px-8 md:px-12 overflow-y-auto transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            mode === 'login' 
              ? 'lg:opacity-100 lg:translate-x-0 pointer-events-auto' 
              : 'lg:opacity-0 lg:translate-x-16 pointer-events-none hidden lg:flex'
          }`}
        >
          {/* Sheer Glassmorphism Card Container */}
          <div className="w-full max-w-md my-auto p-7 sm:p-9 rounded-[32px] bg-white/[0.03] backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6 relative overflow-hidden">
            {/* Top subtle highlight rim */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-9 w-9 rounded-xl satquery-logo-badge p-1 flex items-center justify-center shrink-0">
                  <img src="/SatQuery.png" alt="SATQuery AI Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
                  Mission Station
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Sign In
              </h1>
              <p className="text-xs text-zinc-400">
                Welcome to the mission station SATQuery AI
              </p>
            </div>

            {/* Login Form */}
            <LoginForm />

            {/* Switch to Register Link */}
            <div className="pt-2 border-t border-white/10 text-center text-xs text-zinc-400">
              <span>Don't have access credentials? </span>
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className="font-bold text-teal-400 hover:text-teal-300 underline underline-offset-4 ml-1 cursor-pointer transition-colors"
              >
                Register Station
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Floating Bottom Footer */}
      <footer className="absolute bottom-3 left-0 right-0 z-40 text-center text-[11px] font-mono text-zinc-500 pointer-events-none">
        SATQuery AI · Earth Observation Intelligence
      </footer>

    </div>
  );
}
