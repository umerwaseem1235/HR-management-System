'use client';

import React from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, type LucideIcon } from 'lucide-react';

export interface QuickLoginOption {
  label: string;
  icon: LucideIcon;
  email: string;
  password: string;
  color: string;
}

interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  loading: boolean;
  rememberMe: boolean;
  quickLoginOptions: QuickLoginOption[];
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onRememberMeChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onQuickLogin: (email: string, password: string) => void;
}

export default function LoginForm({
  email,
  password,
  showPassword,
  error,
  loading,
  rememberMe,
  quickLoginOptions,
  onEmailChange,
  onPasswordChange,
  onToggleShowPassword,
  onRememberMeChange,
  onSubmit,
  onQuickLogin,
}: LoginFormProps) {
  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-500 text-xs font-bold">!</span>
          </div>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Email Address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#D6E4E8] text-sm text-[#263238] placeholder-gray-400 focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full pl-10 pr-12 py-3 rounded-lg border border-[#D6E4E8] text-sm text-[#263238] placeholder-gray-400 focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none"
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => onRememberMeChange(e.target.checked)}
              className="w-4 h-4 rounded border-[#D6E4E8] text-[#024fa7] focus:ring-[#024fa7]"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <button type="button" className="text-sm text-[#024fa7] hover:underline font-medium">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#024fa7] hover:bg-[#013a7c] text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              Sign In
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Quick Login */}
      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#D6E4E8]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-gray-500">Quick Demo Login</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {quickLoginOptions.map(option => (
            <button
              key={option.label}
              onClick={() => onQuickLogin(option.email, option.password)}
              disabled={loading}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-colors ${option.color}`}
            >
              <option.icon size={20} />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
