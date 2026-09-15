'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
      <div className="w-full max-w-md">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 bg-[#17324D] rounded-lg flex items-center justify-center">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#17324D]">CodQor HRMS</h1>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#17324D] mb-2">Welcome back</h2>
          <p className="text-gray-500">Enter your credentials to access your account</p>
        </div>

        {children}

        <p className="mt-8 text-center text-xs text-gray-400">
          © 2024 CodQor HRMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
