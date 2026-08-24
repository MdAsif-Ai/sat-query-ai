'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { ClayButton } from '../ui/ClayButton';
import { GlassCard } from '../ui/GlassCard';
import { User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sync state with context user
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      setError('All fields are required.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    const ok = await updateProfile(name, phone, email);
    if (ok) {
      setSuccess(true);
      // Clear success alert after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('Unable to update profile details.');
    }
    setIsLoading(false);
  };

  return (
    <GlassCard className="clay-card border-white/5 p-6 space-y-4">
      <div className="text-left border-b border-white/5 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Profile Information</h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">Modify your account profile identity and contact details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Success Banner */}
        {success && (
          <div className="flex items-center gap-2 p-3.5 rounded-lg border border-brand-success/20 bg-brand-success/5 text-brand-success text-xs font-medium animate-in fade-in duration-150">
            <CheckCircle size={14} className="shrink-0" />
            <span>Profile settings updated successfully.</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium animate-in fade-in duration-150">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300" htmlFor="settings-name">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
              <User size={14} />
            </span>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-black/40 border border-white/10 text-white focus:border-brand-routing/50 focus:ring-1 focus:ring-brand-routing/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Phone input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300" htmlFor="settings-phone">
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
              <Phone size={14} />
            </span>
            <input
              id="settings-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-black/40 border border-white/10 text-white focus:border-brand-routing/50 focus:ring-1 focus:ring-brand-routing/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Email input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300" htmlFor="settings-email">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
              <Mail size={14} />
            </span>
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-black/40 border border-white/10 text-white focus:border-brand-routing/50 focus:ring-1 focus:ring-brand-routing/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <ClayButton variant="primary" type="submit" isLoading={isLoading} className="px-5 py-2.5 text-xs font-semibold rounded-lg">
            Save Changes
          </ClayButton>
        </div>
      </form>
    </GlassCard>
  );
}
