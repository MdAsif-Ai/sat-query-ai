'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ClayButton } from '../ui/ClayButton';
import { GlassCard } from '../ui/GlassCard';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

export function PasswordSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Update password inside user database
    try {
      const userDbStr = localStorage.getItem('satquery_user_db');
      if (userDbStr && user) {
        const userDb = JSON.parse(userDbStr);
        const idx = userDb.findIndex((u: any) => u.email.toLowerCase() === user.email.toLowerCase());
        
        if (idx !== -1) {
          if (userDb[idx].password !== currentPassword) {
            setError('Current password is incorrect.');
            setIsLoading(false);
            return;
          }

          // Update password
          userDb[idx].password = newPassword;
          localStorage.setItem('satquery_user_db', JSON.stringify(userDb));
          setSuccess(true);
          
          // Reset fields
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          
          setTimeout(() => setSuccess(false), 3000);
        } else {
          setError('User record not found in system database.');
        }
      } else {
        setError('Database authentication sync error.');
      }
    } catch (err) {
      setError('An error occurred during verification.');
    }
    setIsLoading(false);
  };

  return (
    <GlassCard className="clay-card border-white/5 p-6 space-y-4">
      <div className="text-left border-b border-white/5 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Security</h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">Manage and alter your account authentication credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Success message */}
        {success && (
          <div className="flex items-center gap-2 p-3.5 rounded-lg border border-brand-success/20 bg-brand-success/5 text-brand-success text-xs font-semibold animate-in fade-in duration-150">
            <CheckCircle size={14} className="shrink-0" />
            <span>Password updated successfully.</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold animate-in fade-in duration-150">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300" htmlFor="settings-curr-pass">
            Current Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
              <Lock size={14} />
            </span>
            <input
              id="settings-curr-pass"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-black/40 border border-white/10 text-white focus:border-brand-routing/50 focus:ring-1 focus:ring-brand-routing/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300" htmlFor="settings-new-pass">
            New Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
              <Lock size={14} />
            </span>
            <input
              id="settings-new-pass"
              type="password"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-black/40 border border-white/10 text-white focus:border-brand-routing/50 focus:ring-1 focus:ring-brand-routing/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300" htmlFor="settings-conf-pass">
            Confirm New Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
              <Lock size={14} />
            </span>
            <input
              id="settings-conf-pass"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-black/40 border border-white/10 text-white focus:border-brand-routing/50 focus:ring-1 focus:ring-brand-routing/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <ClayButton variant="primary" type="submit" isLoading={isLoading} className="px-5 py-2.5 text-xs font-semibold rounded-lg">
            Update Password
          </ClayButton>
        </div>
      </form>
    </GlassCard>
  );
}
