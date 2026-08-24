'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ClayButton } from '../ui/ClayButton';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('lalith.kumar@satquery.ai');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation States
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!email) {
      tempErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      tempErrors.password = 'Password is required.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const res = await login(email, password);
    if (!res.success) {
      setErrors({ general: res.error || 'Authentication failed. Please check your credentials.' });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {errors.general && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs leading-normal animate-in fade-in-50 duration-150">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Email / Username Field */}
      <div className="space-y-1">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 pointer-events-none">
            <Mail size={16} />
          </span>
          <input
            id="email"
            type="email"
            placeholder="Username or Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className={`w-full pl-11 pr-4 py-3 rounded-xl text-xs sm:text-sm bg-black/40 border text-white placeholder:text-zinc-500 ${
              errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-teal-400/60'
            } focus:ring-1 focus:ring-teal-400/20 outline-none transition-colors shadow-inner`}
          />
        </div>
        {errors.email && (
          <p className="text-[10px] text-red-400 font-medium leading-none mt-1 pl-1">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 pointer-events-none">
            <Lock size={16} />
          </span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className={`w-full pl-11 pr-11 py-3 rounded-xl text-xs sm:text-sm bg-black/40 border text-white placeholder:text-zinc-500 ${
              errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-teal-400/60'
            } focus:ring-1 focus:ring-teal-400/20 outline-none transition-colors shadow-inner`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[10px] text-red-400 font-medium leading-none mt-1 pl-1">{errors.password}</p>
        )}
      </div>

      {/* Submit Action Button */}
      <div className="pt-2">
        <ClayButton
          type="submit"
          variant="emerald"
          disabled={isLoading}
          className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all transform active:scale-98"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Authorizing...</span>
            </span>
          ) : (
            <span>LOGIN NOW</span>
          )}
        </ClayButton>
      </div>

      {/* Demo Credentials Footer Info */}
      <div className="pt-3 text-center text-[10px] font-mono text-zinc-500">
        <span>Demo: lalith.kumar@satquery.ai / password123</span>
      </div>
    </form>
  );
}
