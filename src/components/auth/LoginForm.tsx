'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  loading: boolean;
  rememberMe: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onRememberMeChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({
  email,
  password,
  showPassword,
  error,
  loading,
  rememberMe,
  onEmailChange,
  onPasswordChange,
  onToggleShowPassword,
  onRememberMeChange,
  onSubmit,
}: LoginFormProps) {
  const router = useRouter();
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <>
      {/* Error message */}
      {error && (
        <div className="login-fade-up mb-5 rounded-xl border border-red-100 bg-red-50/90 px-4 py-3 text-[13px] text-red-600 backdrop-blur-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Email field */}
        <div>
          <div
            className={`flex items-center gap-3 border-b-2 px-1 pb-3 transition-all duration-300 ${
              emailFocused
                ? 'border-[#1565D8]'
                : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
            }`}
          >
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                emailFocused
                  ? 'bg-[#1565D8]/10 text-[#1565D8] scale-110'
                  : 'bg-[#F3F4F6] text-[#9CA3AF]'
              }`}
            >
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="Email Address"
              required
              autoComplete="email"
              className="w-full bg-transparent text-[15px] text-[#1a1a2e] placeholder-[#9CA3AF] outline-none"
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <div
            className={`flex items-center gap-3 border-b-2 px-1 pb-3 transition-all duration-300 ${
              passwordFocused
                ? 'border-[#1565D8]'
                : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
            }`}
          >
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                passwordFocused
                  ? 'bg-[#1565D8]/10 text-[#1565D8] scale-110'
                  : 'bg-[#F3F4F6] text-[#9CA3AF]'
              }`}
            >
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full bg-transparent text-[15px] text-[#1a1a2e] placeholder-[#9CA3AF] outline-none"
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#9CA3AF] transition-all duration-200 hover:bg-[#F3F4F6] hover:text-[#1565D8]"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot password row */}
        <div className="flex items-center justify-between">
          <label className="group flex cursor-pointer items-center gap-2.5">
            <div className="relative">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => onRememberMeChange(e.target.checked)}
                className="peer sr-only"
              />
              <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-2 border-[#D1D5DB] transition-all duration-200 peer-checked:border-[#1565D8] peer-checked:bg-[#1565D8] group-hover:border-[#1565D8]/60">
                <svg
                  className={`h-3 w-3 text-white transition-all duration-200 ${
                    rememberMe
                      ? 'scale-100 opacity-100'
                      : 'scale-0 opacity-0'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <span className="select-none text-[13px] text-[#6B7280] transition-colors group-hover:text-[#4B5563]">
              Remember me
            </span>
          </label>
          <button
            type="button"
            className="cursor-pointer text-[13px] font-semibold text-[#1565D8] transition-colors hover:text-[#0D47A1]"
          >
            Forgot Password?
          </button>
        </div>

        {/* Sign In button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-[#1565D8] to-[#1E88E5] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_30px_-6px_rgba(21,101,216,0.55)] transition-all duration-300 hover:shadow-[0_12px_40px_-6px_rgba(21,101,216,0.65)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/40 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
          >
            {/* Shimmer sweep on hover */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.15] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </span>
          </button>
        </div>

        {/* Sign up link */}
        <div className="pt-1 text-center text-[13.5px] leading-relaxed">
          <span className="text-[#6B7280]">New to CodQor HRMS? </span>
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="group relative inline-flex cursor-pointer items-center gap-1 font-semibold text-[#1565D8] transition-colors duration-200 after:absolute after:-bottom-0.5 after:left-0 after:h-[1.5px] after:w-0 after:rounded-full after:bg-current after:transition-all after:duration-300 hover:text-[#0D47A1] hover:after:w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1565D8]/40 focus-visible:ring-offset-2"
          >
            Create an account
            <ArrowRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </form>
    </>
  );
}
