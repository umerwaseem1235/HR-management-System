'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import {
  ArrowLeft, User, Mail, Phone, CalendarDays, MapPin, ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/constants';
import { mockEmployees } from '../../lib/mock-data';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function FieldRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#024fa7]/10 text-[#024fa7]">
          <Icon size={17} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 whitespace-nowrap">
          {label}
        </span>
      </div>
      <span className="min-w-0 text-right text-sm font-semibold text-[#17324D] break-words">
        {value || '—'}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  // Match logged-in user to an employee record (by email first, then by name)
  const employee =
    mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
    mockEmployees.find(
      (e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase()
    );

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      Active: 'success',
      Inactive: 'danger',
      'On Notice': 'warning',
      Probation: 'info',
    };
    return <Badge variant={map[status] || 'neutral'} size="md">{status}</Badge>;
  };

  const renderHeader = (
    displayName: string,
    subtitle: React.ReactNode,
    badges: React.ReactNode,
    isActive: boolean
  ) => (
    <>
      {/* Slim gradient banner */}
      <div className="relative h-20 sm:h-24 bg-gradient-to-r from-[#17324D] via-[#024fa7] to-[#0265cc]">
        <div className="pointer-events-none absolute -top-8 right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
      </div>
      <div className="px-5 sm:px-6 pt-0 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="relative -mt-10 sm:-mt-12 shrink-0 self-start">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-[#17324D] text-xl sm:text-2xl font-bold text-white ring-4 ring-white shadow-xl">
              {getInitials(displayName)}
            </div>
            <span
              className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full ring-4 ring-white ${
                isActive ? 'bg-green-500' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="min-w-0 sm:pb-0.5">
            <h1 className="truncate text-xl sm:text-2xl font-extrabold tracking-tight text-[#17324D]">
              {displayName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">{badges}</div>
            {subtitle}
          </div>
        </div>
      </div>
    </>
  );

  const renderSection = (icon: LucideIcon, title: string, rows: React.ReactNode) => (
    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
      <div className="rounded-xl border border-[#D6E4E8]/70 bg-[#F8FBFC]/70 px-1 py-1">
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          {React.createElement(icon, { size: 16, className: 'text-[#024fa7]' })}
          <h2 className="text-sm font-bold text-[#17324D]">{title}</h2>
        </div>
        <div className="divide-y divide-[#D6E4E8]/60">{rows}</div>
      </div>
    </div>
  );

  // Fallback when no matching employee record exists: same layout, account data
  if (!employee) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#024fa7] hover:underline">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className="overflow-hidden rounded-2xl border border-[#D6E4E8]/70 bg-white shadow-[0_1px_2px_rgba(23,50,77,0.05),0_16px_44px_-20px_rgba(23,50,77,0.25)]">
            {renderHeader(
              user.name,
              null,
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#024fa7]/10 px-3 py-1 text-xs font-bold text-[#024fa7]">
                <ShieldCheck size={14} /> {ROLE_LABELS[user.role]}
              </span>,
              true
            )}
            {renderSection(
              User,
              'Account Information',
              <>
                <FieldRow icon={User} label="Full Name" value={user.name} />
                <FieldRow icon={Mail} label="Email" value={user.email} />
                <FieldRow icon={ShieldCheck} label="Role" value={ROLE_LABELS[user.role]} />
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#024fa7] hover:underline">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="overflow-hidden rounded-2xl border border-[#D6E4E8]/70 bg-white shadow-[0_1px_2px_rgba(23,50,77,0.05),0_16px_44px_-20px_rgba(23,50,77,0.25)]">
          {renderHeader(
            fullName,
            <p className="mt-1 text-[13px] text-gray-500 truncate">
              {employee.designation} · {employee.department}
            </p>,
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#024fa7]/10 px-3 py-1 text-xs font-bold text-[#024fa7]">
                <ShieldCheck size={14} /> {ROLE_LABELS[user.role]}
              </span>
              {statusBadge(employee.status)}
            </>,
            employee.status === 'Active'
          )}
          {renderSection(
            User,
            'Personal Information',
            <>
              <FieldRow icon={User} label="Full Name" value={fullName} />
              <FieldRow icon={Mail} label="Email" value={employee.email} />
              <FieldRow icon={Phone} label="Phone" value={employee.phone} />
              <FieldRow icon={CalendarDays} label="Date of Birth" value={employee.dateOfBirth} />
              <FieldRow icon={MapPin} label="Address" value={`${employee.address}, ${employee.city}, ${employee.country}`} />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
