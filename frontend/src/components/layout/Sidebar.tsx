'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, History, Settings, LogOut, X, Satellite, Radio } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      accentColor: 'text-teal-400',
      activeBorder: 'border-teal-400',
    },
    {
      name: 'History',
      href: '/history',
      icon: History,
      accentColor: 'text-orange-400',
      activeBorder: 'border-orange-400',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      accentColor: 'text-purple-400',
      activeBorder: 'border-purple-400',
    },
  ];

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-45 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Spacecraft Control Panel Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-60 glass-panel border-y-0 border-l-0 border-r border-white/5 pt-20 pb-4 flex flex-col justify-between z-45 transition-transform duration-300 md:translate-x-0 bg-[#050811]/90",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close Navigation"
        >
          <X size={18} />
        </button>

        {/* Top Navigation Items */}
        <div className="space-y-4">
          <div className="px-5 py-2 select-none">
            <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Radio size={10} className="text-teal-400 animate-pulse" />
              <span>Console Stations</span>
            </div>
          </div>

          <nav className="px-3 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.name === 'Dashboard' && pathname.startsWith('/dashboard'));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group relative cursor-pointer select-none",
                    isActive
                      ? "bg-white/[0.05] text-white border-l-2 pl-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] " + item.activeBorder
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.02]"
                  )}
                >
                  <Icon
                    size={16}
                    className={cn(
                      "transition-colors",
                      isActive ? item.accentColor : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Orbit Ground Station Status & Logout */}
        <div className="px-3 space-y-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <Satellite size={10} className="text-teal-400" />
                ORBIT LINK
              </span>
              <span className="text-emerald-400 font-semibold">SYNCHRONIZED</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-teal-400 to-purple-500 h-full w-4/5 rounded-full" />
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer select-none"
          >
            <LogOut size={15} />
            Disconnect Session
          </button>
        </div>
      </aside>
    </>
  );
}
