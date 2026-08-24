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
      accentColor: 'text-teal-500 dark:text-teal-400',
      activeBorder: 'border-teal-500',
    },
    {
      name: 'History',
      href: '/history',
      icon: History,
      accentColor: 'text-orange-500 dark:text-orange-400',
      activeBorder: 'border-orange-500',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      accentColor: 'text-purple-500 dark:text-purple-400',
      activeBorder: 'border-purple-500',
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Spacecraft Control Panel Sidebar */}
      <aside
        className={cn(
          "sidebar-container fixed bottom-0 left-0 w-60 border-r pb-4 flex flex-col justify-between transition-transform duration-300 select-none",
          // On desktop, it starts at top-16 (below header) at z-30
          "md:top-16 md:z-30 md:translate-x-0 md:pt-4",
          // On mobile, it covers full height with backdrop at z-50
          "top-0 z-50 pt-16",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close Navigation"
        >
          <X size={18} />
        </button>

        {/* Top Navigation Items */}
        <div className="space-y-4">
          <div className="px-5 py-2 select-none">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-bold">
              <Radio size={12} className="text-teal-500 dark:text-teal-400 animate-pulse" />
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
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer select-none",
                    isActive
                      ? "sidebar-link-active border-l-4 pl-3 shadow-xs " + item.activeBorder
                      : "sidebar-link-inactive"
                  )}
                >
                  <Icon
                    size={17}
                    className={cn(
                      "transition-colors shrink-0",
                      isActive ? item.accentColor : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"
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
          <div className="p-3 rounded-xl status-card border space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600 dark:text-zinc-300 font-semibold">
              <span className="flex items-center gap-1">
                <Satellite size={11} className="text-teal-500 dark:text-teal-400" />
                ORBIT LINK
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">SYNCHRONIZED</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-teal-400 to-purple-500 h-full w-4/5 rounded-full" />
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10 transition-all cursor-pointer select-none"
          >
            <LogOut size={16} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
