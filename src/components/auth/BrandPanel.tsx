'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

export default function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0265cc] via-[#024fa7] to-[#013a7c] relative overflow-hidden">
      {/* Animated ambient orbs */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-2xl login-float-a" />
      <div className="absolute -bottom-28 right-0 w-[28rem] h-[28rem] bg-white/10 rounded-full blur-2xl login-float-b" />
      <div className="absolute top-1/3 left-1/4 w-56 h-56 bg-white/5 rounded-full blur-3xl login-float-a" />

      {/* Slow rotating ring accent */}
      <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full border border-white/10 login-spin-slow">
        <div className="absolute top-6 left-1/2 w-3 h-3 -ml-1.5 rounded-full bg-white/40" />
        <div className="absolute bottom-10 right-10 w-2 h-2 rounded-full bg-white/30" />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '26px 26px' }}
      />

      {/* Light shimmer sweep */}
      <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent login-shimmer" />

      <div className="relative z-10 flex flex-col justify-center px-16">
        <div className="flex items-center gap-4 mb-8 login-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center ring-1 ring-white/25 login-glow">
            <Building2 size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">CodQor</h1>
            <p className="text-white/70 text-sm">HRMS Platform</p>
          </div>
        </div>

        <h2 className="text-4xl font-bold text-white mb-4 leading-tight login-fade-up" style={{ animationDelay: '0.18s' }}>
          Manage Your<br />Workforce<br />Efficiently
        </h2>
        <p className="text-white/75 text-lg max-w-md leading-relaxed login-fade-up" style={{ animationDelay: '0.3s' }}>
          Streamline HR operations with our comprehensive human resource management system. From recruitment to retirement.
        </p>

        <div className="mt-12 flex gap-8 login-fade-up" style={{ animationDelay: '0.42s' }}>
          <div>
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="text-white/65 text-sm">Companies</p>
          </div>
          <div className="border-l border-white/15 pl-8">
            <p className="text-3xl font-bold text-white">50K+</p>
            <p className="text-white/65 text-sm">Employees</p>
          </div>
          <div className="border-l border-white/15 pl-8">
            <p className="text-3xl font-bold text-white">99.9%</p>
            <p className="text-white/65 text-sm">Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
