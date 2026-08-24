'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { ChevronDown, User } from 'lucide-react';
import Link from 'next/link';

export function UserProfile() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Generate simple avatar initials
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left cursor-pointer"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-routing to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/20 select-none">
          {initials}
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-white/95 leading-tight">{user.name}</div>
          <div className="text-[10px] text-zinc-400 leading-none">{user.role}</div>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg glass-panel p-1.5 shadow-2xl border border-white/10 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-white/5 mb-1.5">
            <div className="text-xs font-semibold text-white/95">{user.name}</div>
            <div className="text-[10px] text-zinc-400">{user.email || user.role}</div>
          </div>
          
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white rounded-md hover:bg-white/5 transition-colors"
          >
            <User size={14} className="text-zinc-400" />
            Profile
          </Link>
        </div>
      )}
    </div>
  );
}
