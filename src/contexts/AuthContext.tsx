'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../lib/types';
import { MOCK_USERS } from '../lib/constants';

interface RegisteredUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const REGISTERED_USERS_KEY = 'hrms_registered_users';

function getRegisteredUsers(): RegisteredUser[] {
  try {
    const stored = localStorage.getItem(REGISTERED_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('hrms_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('hrms_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const user: User = {
        id: found.email,
        email: found.email,
        name: found.name,
        role: found.role,
        avatar: found.avatar,
      };
      setUser(user);
      localStorage.setItem('hrms_user', JSON.stringify(user));
      return true;
    }

    const registered = getRegisteredUsers().find(u => u.email === email && u.password === password);
    if (registered) {
      const user: User = {
        id: registered.email,
        email: registered.email,
        name: registered.name,
        role: registered.role,
        avatar: registered.avatar,
      };
      setUser(user);
      localStorage.setItem('hrms_user', JSON.stringify(user));
      return true;
    }

    return false;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();
    const exists =
      MOCK_USERS.some(u => u.email === normalizedEmail) ||
      getRegisteredUsers().some(u => u.email === normalizedEmail);
    if (exists) {
      return false;
    }

    const newUser: RegisteredUser = {
      email: normalizedEmail,
      password,
      name: name.trim(),
      role: 'employee',
      avatar: initialsOf(name),
    };

    const all = getRegisteredUsers();
    all.push(newUser);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(all));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hrms_user');
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('hrms_user', JSON.stringify(updated));
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
