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
    </form>
  );
}
