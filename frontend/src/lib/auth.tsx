'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

export interface User {
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (name: string, phone: string, email: string) => Promise<boolean>;
}

export const DEFAULT_USER: User = {
  name: 'Lalith Kumar',
  email: 'lalith.kumar@satquery.ai',
  phone: '+91 98765 43210',
  role: 'AI Explorer',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROTECTED_ROUTES = ['/dashboard', '/new-chat', '/history', '/settings'];
const AUTH_ROUTES = ['/login', '/register'];

function sessionToUser(session: Session): User {
  const meta = session.user.user_metadata as Record<string, string> | undefined;
  return {
    name: meta?.name ?? meta?.full_name ?? session.user.email?.split('@')[0] ?? 'User',
    email: session.user.email ?? '',
    phone: meta?.phone ?? '',
    role: 'AI Explorer',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Seed default mock user in localStorage if not present
    if (typeof window !== 'undefined') {
      const existingDb = localStorage.getItem('satquery_user_db');
      if (!existingDb) {
        localStorage.setItem(
          'satquery_user_db',
          JSON.stringify([
            {
              name: DEFAULT_USER.name,
              email: DEFAULT_USER.email,
              phone: DEFAULT_USER.phone,
              password: 'password123',
              role: DEFAULT_USER.role,
            },
          ])
        );
      }

      // Check stored mock authentication first
      const storedUser = localStorage.getItem('satquery_user');
      const isAuthenticated = localStorage.getItem('satquery_auth') === 'true';
      if (isAuthenticated && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('satquery_user');
          localStorage.removeItem('satquery_auth');
        }
      }
    }

    // Check Supabase session
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        const sUser = sessionToUser(data.session);
        setUser(sUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('satquery_user', JSON.stringify(sUser));
          localStorage.setItem('satquery_auth', 'true');
        }
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const sUser = sessionToUser(session);
        setUser(sUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('satquery_user', JSON.stringify(sUser));
          localStorage.setItem('satquery_auth', 'true');
        }
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
    const isAuth = AUTH_ROUTES.some(r => pathname.startsWith(r));
    if (isProtected && !user) router.push('/login');
    else if (isAuth && user) router.push('/dashboard');
  }, [user, pathname, loading, router]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    // Check mock / demo database first
    const userDbStr = typeof window !== 'undefined' ? localStorage.getItem('satquery_user_db') : null;
    const userDb = userDbStr
      ? JSON.parse(userDbStr)
      : [{ ...DEFAULT_USER, password: 'password123' }];

    const mockMatch = userDb.find(
      (u: any) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (mockMatch) {
      if (mockMatch.password === password) {
        const loggedUser: User = {
          name: mockMatch.name || DEFAULT_USER.name,
          email: mockMatch.email || DEFAULT_USER.email,
          phone: mockMatch.phone || DEFAULT_USER.phone,
          role: mockMatch.role || DEFAULT_USER.role,
        };
        setUser(loggedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('satquery_user', JSON.stringify(loggedUser));
          localStorage.setItem('satquery_auth', 'true');
        }
        setLoading(false);
        router.push('/dashboard');
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: 'Invalid email or password.' };
      }
    }

    // Try Supabase auth if not in local mock DB
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }
      if (data?.session) {
        const sUser = sessionToUser(data.session);
        setUser(sUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('satquery_user', JSON.stringify(sUser));
          localStorage.setItem('satquery_auth', 'true');
        }
      }
      setLoading(false);
      router.push('/dashboard');
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err?.message || 'Authentication failed. Please check your credentials.' };
    }
  };

  const register = async (name: string, phone: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    const userDbStr = typeof window !== 'undefined' ? localStorage.getItem('satquery_user_db') : null;
    const userDb = userDbStr
      ? JSON.parse(userDbStr)
      : [{ ...DEFAULT_USER, password: 'password123' }];

    const exists = userDb.some(
      (u: any) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );
    if (exists) {
      setLoading(false);
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Register locally
    const newUser = {
      name,
      phone,
      email: email.trim(),
      password,
      role: 'AI Explorer',
    };
    userDb.push(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('satquery_user_db', JSON.stringify(userDb));
    }

    // Also attempt Supabase registration
    try {
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name, phone } },
      });
    } catch (e) {
      console.warn('Supabase signUp fallback:', e);
    }

    setLoading(false);
    router.push('/login');
    return { success: true };
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('satquery_user');
      localStorage.removeItem('satquery_auth');
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (name: string, phone: string, email: string): Promise<boolean> => {
    if (!user) return false;
    const trimmedEmail = email.trim();
    const updatedUser = { ...user, name, phone, email: trimmedEmail };
    setUser(updatedUser);

    if (typeof window !== 'undefined') {
      localStorage.setItem('satquery_user', JSON.stringify(updatedUser));

      // Update in user database
      const userDbStr = localStorage.getItem('satquery_user_db');
      if (userDbStr) {
        try {
          const userDb = JSON.parse(userDbStr);
          const idx = userDb.findIndex((u: any) => u.email?.toLowerCase() === user.email.toLowerCase());
          if (idx !== -1) {
            userDb[idx] = { ...userDb[idx], name, phone, email: trimmedEmail };
            localStorage.setItem('satquery_user_db', JSON.stringify(userDb));
          }
        } catch (e) {
          console.error('Failed to sync user database on profile update', e);
        }
      }
    }

    // Sync to Supabase if session exists
    try {
      const updates: Parameters<typeof supabase.auth.updateUser>[0] = { data: { name, phone } };
      if (trimmedEmail !== user.email) updates.email = trimmedEmail;
      await supabase.auth.updateUser(updates);
    } catch (e) {
      console.warn('Supabase updateUser error:', e);
    }

    return true;
  };

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // Prevent flash of protected content while authenticating or when unauthenticated
  if (isProtectedRoute && (loading || !user)) {
    return (
      <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
        <div className="min-h-screen space-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 select-none">
            <div className="h-7 w-7 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
            <span className="text-[11px] font-mono text-zinc-400">Verifying Mission Clearance...</span>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  // Prevent flash of auth forms when user is already authenticated
  if (isAuthRoute && (loading || user)) {
    return (
      <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
        <div className="min-h-screen space-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 select-none">
            <div className="h-7 w-7 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
            <span className="text-[11px] font-mono text-zinc-400">Opening Mission Station...</span>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
