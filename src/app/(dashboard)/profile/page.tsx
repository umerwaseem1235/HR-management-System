'use client';

import React from 'react';
import Link from 'next/link';
import Badge from '../../../components/ui/Badge';
import {
  ArrowLeft, User, Mail, Phone, CalendarDays, MapPin, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth, AuthLoadingFallback } from '../../../components/auth/RequireAuth';
import { ROLE_LABELS } from '../../../lib/constants';
import { useEmployeeDirectory } from '../../../hooks/useEmployeeDirectory';
import ProfileHeader from '../../../components/profile/ProfileHeader';
import ProfileInfo, { FieldRow } from '../../../components/profile/ProfileInfo';

export default function ProfilePage() {
  const { user } = useAuth();
  const { findByUser } = useEmployeeDirectory();

  useRequireAuth();
  if (!user) return <AuthLoadingFallback />;

  // Match logged-in user to a live employee record (by email first, then by name)
  const employee = findByUser(user);

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      Active: 'success',
      Inactive: 'danger',
      'On Notice': 'warning',
      Probation: 'info',
    };
    return <Badge variant={map[status] || 'neutral'} size="md">{status}</Badge>;
  };

  // Fallback when no matching employee record exists: same layout, account data
  if (!employee) {
    return (
      <>
        <div className="max-w-4xl mx-auto space-y-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#024fa7] hover:underline">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className="overflow-hidden rounded-2xl border border-[#D6E4E8]/70 bg-white shadow-[0_1px_2px_rgba(23,50,77,0.05),0_16px_44px_-20px_rgba(23,50,77,0.25)]">
            <ProfileHeader
              displayName={user.name}
              badges={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#024fa7]/10 px-3 py-1 text-xs font-bold text-[#024fa7]">
                  <ShieldCheck size={14} /> {ROLE_LABELS[user.role]}
                </span>
              }
              isActive
            />
            <ProfileInfo icon={User} title="Account Information">
              <FieldRow icon={User} label="Full Name" value={user.name} />
              <FieldRow icon={Mail} label="Email" value={user.email} />
              <FieldRow icon={ShieldCheck} label="Role" value={ROLE_LABELS[user.role]} />
            </ProfileInfo>
          </div>
        </div>
      </>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#024fa7] hover:underline">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="overflow-hidden rounded-2xl border border-[#D6E4E8]/70 bg-white shadow-[0_1px_2px_rgba(23,50,77,0.05),0_16px_44px_-20px_rgba(23,50,77,0.25)]">
          <ProfileHeader
            displayName={fullName}
            badges={
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#024fa7]/10 px-3 py-1 text-xs font-bold text-[#024fa7]">
                  <ShieldCheck size={14} /> {ROLE_LABELS[user.role]}
                </span>
                {statusBadge(employee.status)}
              </>
            }
            isActive={employee.status === 'Active'}
          />
          <ProfileInfo icon={User} title="Personal Information">
            <FieldRow icon={User} label="Full Name" value={fullName} />
            <FieldRow icon={Mail} label="Email" value={employee.email} />
            <FieldRow icon={Phone} label="Phone" value={employee.phone} />
            <FieldRow icon={CalendarDays} label="Date of Birth" value={employee.dateOfBirth} />
            <FieldRow icon={MapPin} label="Address" value={`${employee.address}, ${employee.city}, ${employee.country}`} />
          </ProfileInfo>
        </div>
      </div>
    </>
  );
}
