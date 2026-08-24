'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ClayButton } from '../ui/ClayButton';
import { User, Phone, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function RegisterForm() {
  const { register, login } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation States
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const validate = () => {
    const tempErrors: typeof errors = {};

    if (!name) {
      tempErrors.name = 'Full Name is required.';
    }

    if (!phone) {
      tempErrors.phone = 'Phone number is required.';
    } else if (!/^\+?[0-9\s-]{8,15}$/.test(phone)) {
      tempErrors.phone = 'Please enter a valid phone number.';
    }

    if (!email) {
      tempErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      tempErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const res = await register(name, phone, email, password);
    if (!res.success) {
      setErrors({ general: res.error || 'Registration failed. Please try again.' });
      setIsLoading(false);
    }
  };

  const handleSocialRegister = (provider: string) => {
    login('lalith.kumar@satquery.ai', 'password123');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
      {errors.general && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs leading-normal animate-in fade-in-50 duration-150">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-1">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 pointer-events-none">
            <User size={15} />
          </span>
          <input
            id="name"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-black/40 border text-white placeholder:text-zinc-500 ${
              errors.name ? 'border-red-500/50' : 'border-white/10 focus:border-purple-400/60'
            } focus:ring-1 focus:ring-purple-400/20 outline-none transition-colors shadow-inner`}
          />
        </div>
        {errors.name && <p className="text-[10px] text-red-400 font-medium leading-none mt-1 pl-1">{errors.name}</p>}
      </div>

      {/* Phone Field */}
      <div className="space-y-1">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 pointer-events-none">
            <Phone size={15} />
          </span>
          <input
            id="phone"
            type="tel"
            placeholder="Phone Number (+1 555-0199)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-black/40 border text-white placeholder:text-zinc-500 ${
              errors.phone ? 'border-red-500/50' : 'border-white/10 focus:border-purple-400/60'
            } focus:ring-1 focus:ring-purple-400/20 outline-none transition-colors shadow-inner`}
          />
        </div>
        {errors.phone && <p className="text-[10px] text-red-400 font-medium leading-none mt-1 pl-1">{errors.phone}</p>}
      </div>

      {/* Email Field */}
      <div className="space-y-1">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 pointer-events-none">
            <Mail size={15} />
          </span>
          <input
            id="email"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-black/40 border text-white placeholder:text-zinc-500 ${
              errors.email ? 'border-red-500/50' : 'border-white/10 focus:border-purple-400/60'
            } focus:ring-1 focus:ring-purple-400/20 outline-none transition-colors shadow-inner`}
          />
        </div>
        {errors.email && <p className="text-[10px] text-red-400 font-medium leading-none mt-1 pl-1">{errors.email}</p>}
      </div>

      {/* Password and Confirm Password side-by-side or stacked */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Password */}
        <div className="space-y-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 pointer-events-none">
              <Lock size={15} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-black/40 border text-white placeholder:text-zinc-500 ${
                errors.password ? 'border-red-500/50' : 'border-white/10 focus:border-purple-400/60'
              } focus:ring-1 focus:ring-purple-400/20 outline-none transition-colors shadow-inner`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-red-400 font-medium leading-none mt-1 pl-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 pointer-events-none">
              <Lock size={15} />
            </span>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-black/40 border text-white placeholder:text-zinc-500 ${
                errors.confirmPassword ? 'border-red-500/50' : 'border-white/10 focus:border-purple-400/60'
              } focus:ring-1 focus:ring-purple-400/20 outline-none transition-colors shadow-inner`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
            >
              {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-red-400 font-medium leading-none mt-1 pl-1">{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <ClayButton
          type="submit"
          variant="violet"
          disabled={isLoading}
          className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all"
        >
          {isLoading ? 'Creating Station Account...' : 'REGISTER NOW'}
        </ClayButton>
      </div>

      {/* Social Logins Separator */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-[9px] uppercase font-mono tracking-wider">
          <span className="bg-[#0e121e] px-3 text-zinc-400">Register with Others</span>
        </div>
      </div>

      {/* Social SSO Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleSocialRegister('google')}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialRegister('github')}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>GitHub</span>
        </button>
      </div>
    </form>
  );
}
