'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { PasswordSettings } from '@/components/settings/PasswordSettings';
import { Settings, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen space-background text-zinc-100 flex flex-col select-none">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-grow md:pl-60 pt-16 flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Header titles */}
          <div className="text-left space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Settings size={20} className="text-purple-400 animate-spin-slow" />
              Station Configuration & Security
            </h2>
            <p className="text-xs text-zinc-400">
              Configure your ground station operator identity and update account access credentials.
            </p>
          </div>

          {/* Dual Panel Split Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <ProfileSettings />
            <PasswordSettings />
          </div>
        </div>
      </main>
    </div>
  );
}
