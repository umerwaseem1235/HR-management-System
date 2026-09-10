'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  iconBg?: string;
}

export default function StatCard({ title, value, icon, change, changeType = 'neutral', iconBg = 'bg-[#EAF2F4]' }: StatCardProps) {
  const changeStyles = {
    positive: 'bg-green-50 text-green-700 ring-green-600/20',
    negative: 'bg-red-50 text-red-600 ring-red-600/20',
    neutral: 'bg-gray-100 text-gray-500 ring-gray-500/10',
  };

  const dotStyles = {
    positive: 'bg-green-500',
    negative: 'bg-red-500',
    neutral: 'bg-gray-400',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#D6E4E8]/70 bg-white p-5 shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0F8B8D]/30 hover:shadow-[0_2px_4px_rgba(23,50,77,0.06),0_18px_40px_-14px_rgba(15,139,141,0.3)]">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-[#0F8B8D]/10 to-transparent transition-transform duration-300 group-hover:scale-125" />
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#0F8B8D] to-[#14b8a6] transition-transform duration-300 group-hover:scale-x-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-[28px] font-extrabold leading-none tracking-tight text-[#17324D]">{value}</p>
          {change && (
            <span className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${changeStyles[changeType]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[changeType]}`} />
              {change}
            </span>
          )}
        </div>
        <div className={`${iconBg} rounded-2xl p-3 shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
