'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, Eye, EyeOff, Shield, Users, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_USERS } from '../../lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  const handleQuickLogin = async (userEmail: string, userPassword: string) => {
    setError('');
    setLoading(true);
    setEmail(userEmail);
    setPassword(userPassword);
    const success = await login(userEmail, userPassword);
    if (success) {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const quickLoginOptions = [
    { label: 'Super Admin', icon: Shield, email: MOCK_USERS[0].email, password: MOCK_USERS[0].password, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
    { label: 'HR Manager', icon: Users, email: MOCK_USERS[1].email, password: MOCK_USERS[1].password, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { label: 'Employee', icon: User, email: MOCK_USERS[2].email, password: MOCK_USERS[2].password, color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#17324D] via-[#1e3f5f] to-[#0F8B8D] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[#0F8B8D]/30 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Building2 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">CodeQor</h1>
              <p className="text-white/60 text-sm">HRMS Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Manage Your<br />Workforce<br />Efficiently
          </h2>
          <p className="text-white/70 text-lg max-w-md leading-relaxed">
            Streamline HR operations with our comprehensive human resource management system. From recruitment to retirement.
          </p>

          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-white/60 text-sm">Companies</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-white/60 text-sm">Employees</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">99.9%</p>
              <p className="text-white/60 text-sm">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-[#17324D] rounded-lg flex items-center justify-center">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#17324D]">CodeQor HRMS</h1>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#17324D] mb-2">Welcome back</h2>
            <p className="text-gray-500">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#263238] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#D6E4E8] text-sm text-[#263238] placeholder-gray-400 focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20 focus:outline-none"
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-[#D6E4E8] text-sm text-[#263238] placeholder-gray-400 focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D6E4E8] text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-[#0F8B8D] hover:underline font-medium">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  onClick={() => handleQuickLogin(option.email, option.password)}
                  disabled={loading}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-colors ${option.color}`}
                >
                  <option.icon size={20} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            © 2024 CodeQor HRMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
