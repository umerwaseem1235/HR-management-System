'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2, UserPlus, User, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    try {
      const success = await register(name, email, password);
      if (success) {
        router.push(`/login?email=${encodeURIComponent(email.trim())}&registered=1`);
      } else {
        setError('An account with this email already exists. Please sign in instead.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white">
      {/* ───────── LEFT PANEL — Fluid Wave & Topographic Light Theme ───────── */}
      <div className="relative hidden w-[52%] overflow-hidden border-r border-slate-100 lg:block xl:w-[55%]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c5fe0] via-[#094bb8] to-[#052668]" />

        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 48%, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.1) 35%, transparent 70%)',
          }}
        />

        <div className="pointer-events-none absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-cyan-400/[0.14] blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-[520px] w-[520px] rounded-full bg-[#003896]/70 blur-[100px]" />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 95%)',
          }}
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg
            className="absolute inset-0 h-full w-full opacity-90"
            viewBox="0 0 800 1000"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.22" />
                <stop offset="50%" stopColor="#2563EB" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="wave2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.18" />
                <stop offset="60%" stopColor="#1D4ED8" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0B2B6B" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="wave3" x1="0%" y1="50%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#172554" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d="M-50 420 C 180 260, 420 540, 850 360 L 850 1050 L -50 1050 Z" fill="url(#wave1)" />
            <path d="M-50 620 C 260 460, 480 760, 850 560 L 850 1050 L -50 1050 Z" fill="url(#wave2)" />
            <path d="M-50 780 C 300 680, 540 920, 850 760 L 850 1050 L -50 1050 Z" fill="url(#wave3)" />

            <path d="M-50 390 C 180 230, 420 510, 850 330" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1.5" />
            <path d="M-50 430 C 190 270, 430 550, 850 370" stroke="rgba(56, 189, 248, 0.28)" strokeWidth="1" strokeDasharray="4 8" />
            <path d="M-50 590 C 250 430, 470 730, 850 530" stroke="rgba(255, 255, 255, 0.14)" strokeWidth="1.5" />
            <path d="M-50 630 C 270 470, 490 770, 850 570" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
            <path d="M-50 750 C 290 650, 530 890, 850 730" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="1.5" />
            <path d="M-50 790 C 310 690, 550 930, 850 770" stroke="rgba(255, 255, 255, 0.07)" strokeWidth="1" strokeDasharray="6 10" />
            <path d="M-50 180 C 220 80, 480 280, 850 160" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
            <path d="M-50 220 C 240 120, 500 320, 850 200" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" strokeDasharray="3 6" />
          </svg>
        </div>

        {/* ── Centered CodQor Technologies Identity — High-End & Clean ── */}
        <div
          className={`relative z-10 flex h-full flex-col items-center justify-center px-10 text-center transition-all delay-300 duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] ring-1 ring-white/40">
            <Image
              src="/logo.png"
              alt="CodQor Technologies"
              width={76}
              height={76}
              className="h-full w-full object-contain p-3.5"
              priority
            />
          </div>

          <h1 className="text-3xl font-normal tracking-tight text-white lg:text-4xl">CodQor</h1>
          <p className="mt-1 text-xs font-light uppercase tracking-[0.28em] text-white/70">Technologies</p>

          <p className="mt-3 text-sm font-normal tracking-wide text-white/80">
            Human Resource Management System
          </p>
        </div>
      </div>

      {/* ───────── RIGHT PANEL — Signup Form ───────── */}
      <div className="relative z-10 flex w-full flex-col lg:w-[48%] xl:w-[45%]">
        {/* Mobile Header for small screens */}
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#0c5fe0] via-[#094bb8] to-[#052668] lg:hidden">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
            fill="none"
          >
            <path d="M-20 120 C 100 70, 240 160, 420 100" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1.5" />
            <path d="M-20 145 C 110 95, 250 185, 420 125" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" strokeDasharray="4 6" />
          </svg>

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-white/30">
              <Image
                src="/logo.png"
                alt="CodQor Logo"
                width={48}
                height={48}
                className="h-full w-full object-contain p-2"
                priority
              />
            </div>
            <h1 className="text-2xl font-normal text-white">CodQor</h1>
            <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/70">Technologies</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="relative flex flex-1 flex-col overflow-y-auto px-8 py-8 sm:px-12 lg:px-16 xl:px-24">
          <div
            className={`relative z-30 m-auto w-full max-w-[420px] transition-all duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {/* Greeting */}
            <div className="mb-7">
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  aria-label="Back to sign in"
                  title="Back to sign in"
                  className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#1565D8]/10 text-[#1565D8] transition-all duration-300 hover:bg-[#1565D8]/15 hover:shadow-[0_8px_20px_-10px_rgba(21,101,216,0.5)] focus:outline-none focus:ring-2 focus:ring-[#1565D8]/25 focus:ring-offset-2 active:scale-95"
                >
                  <ArrowLeft
                    size={17}
                    className="transition-transform duration-300 group-hover:-translate-x-0.5"
                  />
                </button>
              </div>
              <h2 className="text-3xl font-normal tracking-tight text-[#1a1a2e]">
                Create your account
              </h2>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50/90 px-4 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <div
                  className={`flex items-center gap-3 border-b-2 px-1 pb-3 transition-all duration-300 ${
                    nameFocused ? 'border-[#1565D8]' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                      nameFocused ? 'bg-[#1565D8]/10 text-[#1565D8] scale-110' : 'bg-[#F3F4F6] text-[#9CA3AF]'
                    }`}
                  >
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    placeholder="Full Name"
                    required
                    autoComplete="name"
                    className="w-full bg-transparent text-[15px] text-[#1a1a2e] placeholder-[#9CA3AF] outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <div
                  className={`flex items-center gap-3 border-b-2 px-1 pb-3 transition-all duration-300 ${
                    emailFocused ? 'border-[#1565D8]' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                      emailFocused ? 'bg-[#1565D8]/10 text-[#1565D8] scale-110' : 'bg-[#F3F4F6] text-[#9CA3AF]'
                    }`}
                  >
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="Work Email"
                    required
                    autoComplete="email"
                    className="w-full bg-transparent text-[15px] text-[#1a1a2e] placeholder-[#9CA3AF] outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div
                  className={`flex items-center gap-3 border-b-2 px-1 pb-3 transition-all duration-300 ${
                    passwordFocused ? 'border-[#1565D8]' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                      passwordFocused ? 'bg-[#1565D8]/10 text-[#1565D8] scale-110' : 'bg-[#F3F4F6] text-[#9CA3AF]'
                    }`}
                  >
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="Password (min. 8 characters)"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-[15px] text-[#1a1a2e] placeholder-[#9CA3AF] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#9CA3AF] transition-all duration-200 hover:bg-[#F3F4F6] hover:text-[#1565D8]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <div
                  className={`flex items-center gap-3 border-b-2 px-1 pb-3 transition-all duration-300 ${
                    confirmFocused ? 'border-[#1565D8]' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                      confirmFocused ? 'bg-[#1565D8]/10 text-[#1565D8] scale-110' : 'bg-[#F3F4F6] text-[#9CA3AF]'
                    }`}
                  >
                    <KeyRound size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    placeholder="Confirm Password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-[15px] text-[#1a1a2e] placeholder-[#9CA3AF] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#9CA3AF] transition-all duration-200 hover:bg-[#F3F4F6] hover:text-[#1565D8]"
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="group flex cursor-pointer items-start gap-2.5 pt-1">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-2 border-[#D1D5DB] transition-all duration-200 peer-checked:border-[#1565D8] peer-checked:bg-[#1565D8] group-hover:border-[#1565D8]/60">
                    <svg
                      className={`h-3 w-3 text-white transition-all duration-200 ${
                        acceptTerms ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="select-none text-[13px] leading-relaxed text-[#6B7280] transition-colors group-hover:text-[#4B5563]">
                  I agree to the{' '}
                  <span className="font-semibold text-[#1565D8] transition-colors hover:text-[#0D47A1]">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="font-semibold text-[#1565D8] transition-colors hover:text-[#0D47A1]">
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>

              {/* Create account button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-[#1565D8] to-[#1E88E5] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_30px_-6px_rgba(21,101,216,0.55)] transition-all duration-300 hover:shadow-[0_12px_40px_-6px_rgba(21,101,216,0.65)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/40 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.15] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Create Account
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>

            {/* Already have an account */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[13px]">
              <span className="text-[#6B7280]">Already have an account?</span>
              <Link
                href="/login"
                className="font-semibold text-[#1565D8] transition-colors hover:text-[#0D47A1]"
              >
                Sign in
              </Link>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-[12px] text-[#9CA3AF]">
              © {new Date().getFullYear()} CodQor Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}