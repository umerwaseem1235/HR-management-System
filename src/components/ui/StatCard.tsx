'use client';

import React from 'react';
import {
  Users, UserCheck, UserX, Clock, CalendarDays, UserPlus, Briefcase,
  DollarSign, TrendingUp, Target, Award, Activity, PieChart, BarChart3,
  Shield, Wallet, CreditCard, FileText, Clock3, ArrowUpRight, ArrowDownRight,
  Star, Heart, Zap, Globe, ShieldCheck, Building2
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  iconName?: keyof typeof premiumIcons;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  iconBg?: string;
  iconColor?: string;
}

// Floating hover motion: 6px lift, 900ms symmetric ease-in-out (slow start + slow stop,
// no initial jump like ease-out curves), GPU-only props (transform, opacity)
const FLOAT_EASE = 'ease-[cubic-bezier(0.45,0,0.15,1)]';
const LIFT = `transition-[transform,border-color] duration-[900ms] ${FLOAT_EASE}`;
const FADE = `transition-opacity duration-[900ms] ${FLOAT_EASE}`;
const FLOAT = `transition-[transform,opacity] duration-[900ms] ${FLOAT_EASE}`;

const premiumIcons = {
  totalEmployees: Users,
  presentToday: UserCheck,
  absentToday: UserX,
  lateToday: Clock,
  onLeaveToday: CalendarDays,
  newJoiners: UserPlus,
  openVacancies: Briefcase,
  payrollStatus: DollarSign,
  performance: TrendingUp,
  goals: Target,
  awards: Award,
  activity: Activity,
  analytics: PieChart,
  reports: BarChart3,
  compliance: Shield,
  expenses: Wallet,
  payroll: CreditCard,
  documents: FileText,
  time: Clock3,
  growth: ArrowUpRight,
  decline: ArrowDownRight,
  rating: Star,
  satisfaction: Heart,
  energy: Zap,
  global: Globe,
  certified: ShieldCheck,
  branches: Building2,
} as const;

// Per-metric theme: vibrant stroke color + soft tinted gradient tile
const iconThemes: Record<keyof typeof premiumIcons, { color: string; bg: string }> = {
  totalEmployees: { color: '#17324D', bg: 'bg-gradient-to-br from-[#EDF1F5] to-[#CFDAE3]' },
  presentToday: { color: '#16A34A', bg: 'bg-gradient-to-br from-[#E7F6EC] to-[#C0E7CC]' },
  absentToday: { color: '#DC2626', bg: 'bg-gradient-to-br from-[#FDECEC] to-[#F7CBCB]' },
  lateToday: { color: '#F97316', bg: 'bg-gradient-to-br from-[#FFF0E7] to-[#FFD7B8]' },
  onLeaveToday: { color: '#EA580C', bg: 'bg-gradient-to-br from-[#FFF1E8] to-[#FFD7B9]' },
  newJoiners: { color: '#0F8B8D', bg: 'bg-gradient-to-br from-[#E2F4F5] to-[#BCE4E5]' },
  openVacancies: { color: '#D97706', bg: 'bg-gradient-to-br from-[#FDF1E2] to-[#F7DDBB]' },
  payrollStatus: { color: '#0D9488', bg: 'bg-gradient-to-br from-[#E0F2F1] to-[#BDE2DE]' },
  performance: { color: '#7C3AED', bg: 'bg-gradient-to-br from-[#F0EAFD] to-[#D9CDF8]' },
  goals: { color: '#8B5CF6', bg: 'bg-gradient-to-br from-[#F1EAFE] to-[#DCD1FA]' },
  awards: { color: '#D97706', bg: 'bg-gradient-to-br from-[#FDF1E2] to-[#F7DDBB]' },
  activity: { color: '#C026D3', bg: 'bg-gradient-to-br from-[#FBECFE] to-[#F3CFF8]' },
  analytics: { color: '#DB2777', bg: 'bg-gradient-to-br from-[#FCECF4] to-[#F7D2E1]' },
  reports: { color: '#B45309', bg: 'bg-gradient-to-br from-[#FCEFE0] to-[#F5DCC0]' },
  compliance: { color: '#2563EB', bg: 'bg-gradient-to-br from-[#E8EEFB] to-[#B9C8F0]' },
  expenses: { color: '#059669', bg: 'bg-gradient-to-br from-[#E1F5ED] to-[#B8E8D5]' },
  payroll: { color: '#65A30D', bg: 'bg-gradient-to-br from-[#F1F8E4] to-[#DDEEBB]' },
  documents: { color: '#4B5563', bg: 'bg-gradient-to-br from-[#EDEFF1] to-[#D4DAE0]' },
  time: { color: '#B45309', bg: 'bg-gradient-to-br from-[#FCEFE0] to-[#F5DCC0]' },
  growth: { color: '#16A34A', bg: 'bg-gradient-to-br from-[#E7F6EC] to-[#C0E7CC]' },
  decline: { color: '#DC2626', bg: 'bg-gradient-to-br from-[#FDECEC] to-[#F7CBCB]' },
  rating: { color: '#EAB308', bg: 'bg-gradient-to-br from-[#FEFAE4] to-[#F8ECC0]' },
  satisfaction: { color: '#EC4899', bg: 'bg-gradient-to-br from-[#FCECF4] to-[#F9D3E3]' },
  energy: { color: '#F97316', bg: 'bg-gradient-to-br from-[#FFF0E7] to-[#FFD7B8]' },
  global: { color: '#0D9488', bg: 'bg-gradient-to-br from-[#E0F2F1] to-[#BDE2DE]' },
  certified: { color: '#84CC16', bg: 'bg-gradient-to-br from-[#F2FADE] to-[#E0F5BA]' },
  branches: { color: '#16A34A', bg: 'bg-gradient-to-br from-[#E7F6EC] to-[#C0E7CC]' },
};

function PremiumIcon({ name, size = 22, color }: { name: keyof typeof premiumIcons; size?: number; color?: string }) {
  const Icon = premiumIcons[name] || Users;
  const accent = color ?? iconThemes[name]?.color ?? '#0F8B8D';
  return (
    <Icon
      size={size}
      strokeWidth={1.6}
      style={{ stroke: accent, filter: 'drop-shadow(0 3px 6px rgba(23,50,77,0.15))' }}
    />
  );
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  iconName,
  change, 
  changeType = 'neutral', 
  iconBg,
  iconColor
}: StatCardProps) {
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

  const theme = iconName ? iconThemes[iconName] : undefined;
  const bgClass = iconBg ?? theme?.bg ?? 'bg-gradient-to-br from-[#EAF2F4] to-[#D6E4E8]';
  const displayIcon = icon ?? (iconName ? <PremiumIcon name={iconName} size={22} color={iconColor} /> : <Users size={22} className="text-[#0F8B8D]" />);

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-[#D6E4E8]/70 bg-white p-5 shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)] hover:-translate-y-1.5 hover:border-[#0F8B8D]/40 hover:will-change-transform ${LIFT}`}>
      {/* Hover shadow layer — faded via opacity (GPU cheap) instead of animating box-shadow */}
      <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[0_6px_14px_rgba(23,50,77,0.07),0_20px_45px_-20px_rgba(15,139,141,0.35)] group-hover:opacity-100 ${FADE}`} />

      {/* Decorative ambient glow */}
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[#0F8B8D]/14 via-transparent to-transparent opacity-60 group-hover:scale-130 group-hover:opacity-100 ${FLOAT}`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-500 tracking-wide uppercase">{title}</p>
          <p className="mt-1.5 text-[30px] font-extrabold leading-none tracking-tight text-[#17324D]">{value}</p>
          {change && (
            <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${changeStyles[changeType]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[changeType]}`} />
              {change}
            </span>
          )}
        </div>
        <div className={`${bgClass} relative rounded-2xl p-3.5 shadow-md ring-1 ring-black/5 group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-[900ms] ${FLOAT_EASE}`}>
          <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 ${FADE}`} />
          <div className="relative">{displayIcon}</div>
        </div>
      </div>
    </div>
  );
}
