'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { PasswordSettings } from '@/components/settings/PasswordSettings';
import { NotificationStorageSettings } from '@/components/settings/NotificationStorageSettings';
import { Settings, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen space-background text-zinc-100 flex flex-col select-none">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-grow md:pl-60 pt-16 flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          
          {/* Header titles */}
          <div className="text-left space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Settings size={22} className="text-purple-400" />
              Station Configuration & Security
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium">
              Configure ground station operator identity, access credentials, mission telemetry notifications, and storage cache.
            </p>
          </div>

          {/* Main Dual Grid: Profile & Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <ProfileSettings />
            <PasswordSettings />
          </div>

          {/* Notifications & Storage Management */}
          <div className="pt-2">
            <NotificationStorageSettings />
          </div>

        </div>
      </main>
    </div>
  );
}
