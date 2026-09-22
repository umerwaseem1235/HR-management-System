'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '../lib/types';
import { signIn, signUp, signOut, getCurrentUser } from '@/lib/actions/auth';
import { createClient } from '@/lib/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchUser = async () => {
    const { user, error } = await getCurrentUser();
    if (!error && user) {
      setUser(user);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    const result = await signIn(formData);
    if (result.success) {
      await fetchUser();
      return { success: true };
    }
    return { success: false, error: result.error || 'Invalid email or password. Please try again.' };
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    const result = await signUp(formData);
    if (result.success) {
      await fetchUser();
      return true;
    }
    return false;
  };

  const logout = async () => {
    // Clear local state first so route guards see a logged-out user instantly,
    // even if a network call below fails.
    setUser(null);
    setIsLoading(false);
    try {
      // Clear the browser session (also fires SIGNED_OUT on the listener).
      await supabase.auth.signOut();
    } catch {
      // Ignore — server-side cleanup below is the source of truth.
    }
    try {
      // Clear the server session cookies.
      await signOut();
    } catch {
      // Ignore — local state is already cleared.
    }
    router.replace('/login');
    router.refresh();
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      // NOTE: This only updates local state for UI testing without altering DB
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
