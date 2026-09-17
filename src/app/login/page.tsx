'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/auth/LoginForm';
import DemoAccountsDropdown from '../../components/auth/DemoAccountsDropdown';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);

    const params = new URLSearchParams(window.location.search);
    const emailQuery = params.get('email');
    if (emailQuery) {
      setEmail(emailQuery);
    }
    if (params.get('registered') === '1') {
      setSignupSuccess(true);
      setPassword('');
    }
    if (emailQuery || params.get('registered')) {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignupSuccess(false);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
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
        {/* Base: Rich Signature Royal Blue Canvas */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c5fe0] via-[#094bb8] to-[#052668]" />

        {/* Studio Center Radial Spotlight (behind branding) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 48%, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.1) 35%, transparent 70%)',
          }}
        />

        {/* Ambient Corner Atmosphere Glows */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-cyan-400/[0.14] blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-[520px] w-[520px] rounded-full bg-[#003896]/70 blur-[100px]" />

        {/* Delicate Precision Tech Micro-Grid with Smooth Vignette Mask */}
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

        {/* ── Fluid Waves & Topographic Contour Silk Ribbons (100% Static & Razor-Sharp) ── */}
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

            {/* Dimensional Gradient Wave Layers */}
            <path
              d="M-50 420 C 180 260, 420 540, 850 360 L 850 1050 L -50 1050 Z"
              fill="url(#wave1)"
            />
            <path
              d="M-50 620 C 260 460, 480 760, 850 560 L 850 1050 L -50 1050 Z"
              fill="url(#wave2)"
            />
            <path
              d="M-50 780 C 300 680, 540 920, 850 760 L 850 1050 L -50 1050 Z"
              fill="url(#wave3)"
            />

            {/* Precision Topographic Flow Lines */}
            <path
              d="M-50 390 C 180 230, 420 510, 850 330"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeWidth="1.5"
            />
            <path
              d="M-50 430 C 190 270, 430 550, 850 370"
              stroke="rgba(56, 189, 248, 0.28)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
            <path
              d="M-50 590 C 250 430, 470 730, 850 530"
              stroke="rgba(255, 255, 255, 0.14)"
              strokeWidth="1.5"
            />
            <path
              d="M-50 630 C 270 470, 490 770, 850 570"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
            <path
              d="M-50 750 C 290 650, 530 890, 850 730"
              stroke="rgba(56, 189, 248, 0.22)"
              strokeWidth="1.5"
            />
            <path
              d="M-50 790 C 310 690, 550 930, 850 770"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="1"
              strokeDasharray="6 10"
            />

            {/* Upper Ambient Contour Whispers */}
            <path
              d="M-50 180 C 220 80, 480 280, 850 160"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
            <path
              d="M-50 220 C 240 120, 500 320, 850 200"
              stroke="rgba(56, 189, 248, 0.12)"
              strokeWidth="1"
              strokeDasharray="3 6"
            />
          </svg>
        </div>

        {/* ── Centered CodQor Technologies Identity — High-End & Clean ── */}
        <div
          className={`relative z-10 flex h-full flex-col items-center justify-center px-10 text-center transition-all delay-300 duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          {/* Logo Emblem in Solid White Rounded Card */}
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

          {/* Company Name — Refined, professional non-bold typography */}
          <h1 className="text-3xl font-normal tracking-tight text-white lg:text-4xl">
            CodQor
          </h1>
          <p className="mt-1 text-xs font-light uppercase tracking-[0.28em] text-white/70">
            Technologies
          </p>

          {/* Professional HRMS Subtitle — Clean title case */}
          <p className="mt-3 text-sm font-normal tracking-wide text-white/80">
            Human Resource Management System
          </p>
        </div>
      </div>

      {/* ───────── RIGHT PANEL — Login Form ───────── */}
      <div className="relative z-10 flex w-full flex-col lg:w-[48%] xl:w-[45%]">
        {/* Mobile Header for small screens */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#0c5fe0] via-[#094bb8] to-[#052668] lg:hidden">
          {/* Subtle wave contours for mobile */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M-20 120 C 100 70, 240 160, 420 100"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeWidth="1.5"
            />
            <path
              d="M-20 145 C 110 95, 250 185, 420 125"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          </svg>

          {/* Mobile branding */}
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
            <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/70">
              Technologies
            </p>
          </div>
        </div>

        {/* Form Container — scrollable so demo accounts are never clipped */}
        <div className="relative flex flex-1 flex-col overflow-y-auto px-8 py-8 sm:px-12 lg:px-16 xl:px-24">
          <div
            className={`relative z-30 m-auto w-full max-w-[400px] transition-all duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {/* Greeting — Clean, professional non-bold */}
            <div className="mb-8">
              <h2 className="text-3xl font-normal tracking-tight text-[#1a1a2e]">
                HRMS Portal
              </h2>
              <p className="mt-1.5 text-[15px] font-normal text-[#6B7280]">
                Sign in to your account to continue
              </p>
            </div>

            {/* Signup success banner */}
            {signupSuccess && (
              <div className="login-fade-up mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/90 px-4 py-3">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div className="text-[13px] leading-relaxed text-emerald-700">
                  <span className="font-semibold">Account created successfully!</span>
                  <br />
                  Your workspace is ready. Please sign in to continue.
                </div>
              </div>
            )}

            {/* Login form */}
            <LoginForm
              email={email}
              password={password}
              showPassword={showPassword}
              error={error}
              loading={loading}
              rememberMe={rememberMe}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onToggleShowPassword={() => setShowPassword(!showPassword)}
              onRememberMeChange={setRememberMe}
              onSubmit={handleSubmit}
            />

            {/* Quick Demo Accounts */}
            <div className="mt-7 border-t border-[#E5E7EB] pt-5">
              <div className="mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Quick Access
                </span>
              </div>
              <DemoAccountsDropdown
                activeEmail={email}
                onSelect={(demoEmail, demoPass) => {
                  setEmail(demoEmail);
                  setPassword(demoPass);
                  setError('');
                }}
              />
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-[12px] text-[#9CA3AF]">
              © {new Date().getFullYear()} CodQor Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
