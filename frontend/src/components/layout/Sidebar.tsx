'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, History, Settings, LogOut, X, Radio } from 'lucide-react';

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
      accentColor: 'text-emerald-500 dark:text-emerald-400',
      activeBorder: 'border-emerald-500',
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
          <div className="px-4 py-2 select-none animate-ease-up">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-bold">
              <Radio size={12} className="text-emerald-500 dark:text-emerald-400 animate-pulse" />
              <span>Console Navigation</span>
            </div>
          </div>

          <nav className="px-3 space-y-1.5">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href || (item.name === 'Dashboard' && pathname.startsWith('/dashboard'));
              const Icon = item.icon;
              const delayClass = idx === 0 ? 'animate-ease-up-delay-1' : idx === 1 ? 'animate-ease-up-delay-2' : 'animate-ease-up-delay-3';

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs select-none transition-all duration-200 group",
                    delayClass,
                    isActive
                      ? "bg-emerald-500 text-white font-bold shadow-md border border-emerald-400 dark:bg-emerald-500 dark:text-white dark:font-bold dark:border-emerald-400 dark:shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-default"
                      : "text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 border border-transparent cursor-pointer hover:translate-x-1"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0",
                        isActive
                          ? "bg-black/15 text-white dark:bg-black/20 dark:text-white"
                          : "bg-slate-100 text-slate-700 group-hover:bg-emerald-500/15 group-hover:text-emerald-800 dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-emerald-500/10 dark:group-hover:text-emerald-300 group-hover:scale-105"
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold tracking-wide transition-colors duration-200",
                        isActive
                          ? "text-white font-bold"
                          : "text-slate-700 group-hover:text-slate-950 dark:text-zinc-400 dark:group-hover:text-white"
                      )}
                    >
                      {item.name}
                    </span>
                  </div>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Logout */}
        <div className="px-3 pt-3 border-t border-slate-200 dark:border-white/10 animate-ease-up-delay-4">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all duration-200 hover:translate-x-0.5 cursor-pointer select-none group"
          >
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-rose-500/10 group-hover:bg-rose-500/20 group-hover:scale-105 transition-all duration-200 shrink-0">
              <LogOut size={15} />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
