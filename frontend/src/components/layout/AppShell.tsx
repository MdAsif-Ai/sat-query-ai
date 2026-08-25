'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const APP_ROUTES = ['/dashboard', '/history', '/settings'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if current route should render the persistent app shell
  const isAppRoute = APP_ROUTES.some(route => pathname.startsWith(route));

  if (!isAppRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen space-background text-zinc-100 flex flex-col select-none">
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-grow md:pl-60 pt-16 flex flex-col">
        {children}
      </main>
    </div>
  );
}
