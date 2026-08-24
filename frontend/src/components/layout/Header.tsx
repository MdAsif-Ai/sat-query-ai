'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserProfile } from './UserProfile';
import { Bell, Menu, ChevronLeft } from 'lucide-react';

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
    if (pathname.startsWith('/dashboard')) return '';
    if (pathname.startsWith('/history')) return 'Mission History';
    if (pathname.startsWith('/settings')) return 'Station Settings';
    return 'SATQuery AI';
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 header-container border-b flex items-center justify-between px-4 sm:px-6 z-40 select-none">
      {/* Left side: Logo & Branding / Page Title */}
      <div className="flex items-center gap-3">
        {showBackButton ? (
          <button
            onClick={() => router.back()}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5 transition-all cursor-pointer mr-1"
            aria-label="Go Back to Previous Page"
          >
            <ChevronLeft size={18} />
          </button>
        ) : (
          onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu size={18} />
            </button>
          )
        )}
        
        {/* Main Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl satquery-logo-badge p-1 flex items-center justify-center shrink-0">
            <img src="/SatQuery.png" alt="SATQuery AI Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wide leading-tight uppercase flex items-center gap-1.5">
              <span className="font-extrabold text-zinc-900 dark:text-white text-brand-title">SATQuery AI</span>
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-none mt-0.5 text-brand-subtitle">
              AI for Earth Observation
            </div>
          </div>
        </div>

        <div className="hidden lg:block h-5 w-px bg-zinc-300 dark:bg-white/10 mx-2" />

        {/* Dynamic section indicator */}
        <div className="hidden lg:flex items-center gap-2">
          <h1 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 text-brand-section">
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
          className="relative w-13 h-6.5 rounded-full flex items-center p-0.5 cursor-pointer select-none transition-all duration-300 border border-black/10 dark:border-white/10 shrink-0"
          style={{
            background: theme === 'light' 
              ? 'linear-gradient(to right, #ffffff, #e2e8f0)' 
              : 'rgba(7, 10, 18, 0.8)',
            boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.05)'
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

        {/* Notifications Icon Button */}
        <button
          className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 border border-black/5 dark:border-white/5 transition-all cursor-pointer"
          title="Satellite Notifications (3 online)"
          aria-label="View Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-500 animate-pulse ring-2 ring-white dark:ring-[#070A12]" />
        </button>

        <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />

        {/* User profile dropdown pill */}
        <UserProfile />
      </div>
    </header>
  );
}
