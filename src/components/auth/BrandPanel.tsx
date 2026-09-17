'use client';

import React from 'react';
import { Building2, Check, ShieldCheck, Lock, Award } from 'lucide-react';

const HIGHLIGHTS = [
  'End-to-end employee lifecycle',
  'Automated payroll & compliance',
  'Real-time attendance insights',
  'Enterprise-grade security',
];

const STATS = [
  { value: '500+', label: 'Companies' },
  { value: '50K+', label: 'Employees managed' },
  { value: '99.9%', label: 'Uptime SLA' },
];

export default function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[#17324D]">
      {/* Base — project theme: primary navy to brand blue */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#17324D] via-[#1e3f5f] to-[#024fa7]" />
      {/* Soft brand glows — restrained, on-theme */}
      <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-[#0265cc]/25 blur-[140px]" />
      <div className="absolute -bottom-48 -left-32 w-[480px] h-[480px] rounded-full bg-[#17324D]/70 blur-[120px]" />
      {/* Fine grid — enterprise texture */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(234,242,244,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(234,242,244,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 30% 20%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 30% 20%, black 30%, transparent 75%)',
        }}
      />
      {/* Hairline frame */}
      <div className="absolute inset-4 rounded-2xl border border-white/[0.08] pointer-events-none" />
      {/* Top premium accent line — project blue scale */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#0265cc] via-[#D6E4E8] to-[#024fa7]" />

      <div className="relative z-10 flex flex-col justify-between w-full px-14 py-10 min-h-screen">
        {/* Header — brand lockup */}
        <div className="flex items-center justify-between login-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#EAF2F4] rounded-[12px] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
              <Building2 size={24} className="text-[#17324D]" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-white leading-none">CodQor</h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#D6E4E8] mt-1.5">
                HRMS Platform
              </p>
            </div>
          </div>
        </div>

        {/* Middle — value proposition */}
        <div className="py-5">

          <h2
            className="text-[52px] font-semibold text-white leading-[1.04] tracking-[-0.02em] login-fade-up"
            style={{ animationDelay: '0.22s' }}
          >
            Manage your
            <br />
            workforce with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAF2F4] to-[#D6E4E8]">
              confidence.
            </span>
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3.5 max-w-[460px] login-fade-up" style={{ animationDelay: '0.4s' }}>
            {HIGHLIGHTS.map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#024fa7] border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </span>
                <span className="text-[13.5px] font-medium text-white/85">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — proof + compliance */}
        <div className="login-fade-up" style={{ animationDelay: '0.48s' }}>
          <div className="rounded-2xl border border-white/10 bg-[#17324D]/40 backdrop-blur-md px-7 py-6">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              {STATS.map((s, i) => (
                <div key={s.label} className={i === 0 ? 'pr-6' : 'px-6'}>
                  <p className="text-[28px] font-semibold tracking-tight text-white leading-none">{s.value}</p>
                  <p className="text-[12px] font-medium tracking-wide text-[#D6E4E8]/80 mt-2 uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-5 text-[#D6E4E8]/80">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
                <Lock size={12} /> SOC 2
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
                <ShieldCheck size={12} /> GDPR
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
                <Award size={12} /> ISO 27001
              </span>
            </div>
            <p className="text-[11px] text-[#D6E4E8]/60 font-medium">© 2026 CodQor Technologies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
