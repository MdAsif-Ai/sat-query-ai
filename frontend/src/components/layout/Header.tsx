'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserProfile } from './UserProfile';
import { Bell, Orbit, Menu, ChevronLeft } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
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

  // Determine if back button should be shown
  const showBackButton = pathname !== '/dashboard' && pathname !== '/' && pathname !== '/login' && pathname !== '/register';

  // Get dynamic title based on path
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Satellite Analysis Workspace';
    if (pathname.startsWith('/history')) return 'Mission History';
    if (pathname.startsWith('/settings')) return 'Station Settings';
    return 'SATQuery AI';
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-t-0 border-x-0 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 z-40">
      {/* Left side: Logo & Branding / Page Title */}
      <div className="flex items-center gap-3">
        {showBackButton ? (
          <button
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 border border-white/5 transition-all cursor-pointer mr-1"
            aria-label="Go Back to Previous Page"
          >
            <ChevronLeft size={18} />
          </button>
        ) : (
          onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu size={18} />
            </button>
          )
        )}
        
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.15)]">
            <Orbit size={16} className="animate-spin-slow" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide leading-tight uppercase flex items-center gap-1.5">
              <span>SATQuery AI</span>
              <span className="hidden sm:inline-block text-[9px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/20">v2.4 RS</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-medium leading-none">AI for Earth Observation</div>
          </div>
        </div>

        <div className="hidden lg:block h-5 w-px bg-white/10 mx-2" />

        {/* Dynamic section indicator */}
        <div className="hidden lg:flex items-center gap-2">
          <h1 className="text-xs font-semibold text-zinc-300 select-none">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center/Right side: Theme Toggle, Notifications, User profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">

        {/* Day/Night custom toggle button */}
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
          {/* Slider knob */}
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

          {/* Background icons & graphics */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2 text-[7px] opacity-40 font-bold select-none">
            <span className={theme === 'light' ? 'invisible' : 'visible text-zinc-400'}>★</span>
            <span className={theme === 'light' ? 'visible text-sky-600' : 'invisible'}>☁</span>
          </div>
        </button>

        {/* Notification Icon with alert pulse */}
        <button
          className="relative text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
          aria-label="System Notifications"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 ring-1 ring-black animate-pulse" />
        </button>

        <div className="h-5 w-px bg-white/10" />

        {/* Profile Dropdown */}
        <UserProfile />
      </div>
    </header>
  );
}
