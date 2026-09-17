'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full lg:w-[48%] flex items-center justify-center p-6 sm:p-12 bg-[#EAF2F4]">
      <div className="w-full max-w-md rounded-2xl border border-[#D6E4E8] bg-white p-8 sm:p-10 shadow-[0_2px_4px_rgba(23,50,77,0.06),0_18px_44px_-14px_rgba(23,50,77,0.22)]">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 bg-[#17324D] rounded-lg flex items-center justify-center">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#17324D]">CodQor HRMS</h1>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#024fa7]">
              HRMS Platform
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="w-11 h-1 rounded-full bg-[#024fa7] mb-4 hidden lg:block" />
          <h2 className="text-2xl font-bold tracking-tight text-[#17324D] mb-2">Welcome back</h2>
          <p className="text-sm text-[#263238]/70">Enter your credentials to access your account</p>
        </div>

        {children}

        <p className="mt-8 text-center text-xs text-[#263238]/50">
          © 2026 CodQor HRMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
