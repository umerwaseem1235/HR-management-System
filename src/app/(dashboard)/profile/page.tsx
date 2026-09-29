'use client';

import React from 'react';
import Link from 'next/link';
import Badge from '../../../components/ui/Badge';
import {
  ArrowLeft, User, Mail, Phone, CalendarDays, MapPin, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth, AuthLoadingFallback } from '../../../components/auth/RequireAuth';
import { useEmployeeDirectory } from '../../../hooks/useEmployeeDirectory';
import ProfileHeader from '../../../components/profile/ProfileHeader';
import ProfileInfo, { FieldRow } from '../../../components/profile/ProfileInfo';
import EditProfileModal from '../../../components/profile/EditProfileModal';
import { updateProfile } from '../../../lib/actions/auth';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { User as AuthUser } from '../../../lib/types';

function EditProfileModalWrapper({ user, isOpen, onClose }: { user: AuthUser, isOpen: boolean, onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSave = async (values: { name: string; email: string }, photo: string | null) => {
    setIsSubmitting(true);
    try {
      const res = await updateProfile({
        name: values.name,
        email: values.email,
        avatar: photo,
      });
      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile');
      }
      // Force refresh to get updated data
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EditProfileModal
      user={user}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      isSubmitting={isSubmitting}
    />
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { findByUser } = useEmployeeDirectory();
  const { t } = useLanguage();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

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
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-teal hover:underline">
              <ArrowLeft size={16} className="rtl:rotate-180" /> {t('action.backToDashboard')}
            </Link>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] px-3 py-1.5 text-sm font-medium text-dark-text dark:text-gray-100 shadow-sm hover:bg-blue-gray dark:hover:bg-white/10 transition-colors"
            >
              {t('action.editProfile')}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-medium-gray/70 bg-white dark:bg-[#1b263b] shadow-[0_1px_2px_rgba(23,50,77,0.05),0_16px_44px_-20px_rgba(23,50,77,0.25)]">
            <ProfileHeader
              displayName={user.name}
              avatarUrl={user.avatar}
              badges={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                  <ShieldCheck size={14} /> {t(`role.${user.role}`)}
                </span>
              }
              isActive
            />
            <ProfileInfo icon={User} title={t('profile.accountInfo')}>
              <FieldRow icon={User} label={t('profile.fullName')} value={user.name} />
              <FieldRow icon={Mail} label={t('profile.email')} value={user.email} />
              <FieldRow icon={ShieldCheck} label={t('profile.role')} value={t(`role.${user.role}`)} />
            </ProfileInfo>
          </div>
        </div>
        
        {isEditModalOpen && (
          <EditProfileModalWrapper 
            user={user} 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
          />
        )}
      </>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-teal hover:underline">
            <ArrowLeft size={16} className="rtl:rotate-180" /> {t('action.backToDashboard')}
          </Link>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] px-3 py-1.5 text-sm font-medium text-dark-text dark:text-gray-100 shadow-sm hover:bg-blue-gray dark:hover:bg-white/10 transition-colors"
          >
            {t('action.editProfile')}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-medium-gray/70 bg-white dark:bg-[#1b263b] shadow-[0_1px_2px_rgba(23,50,77,0.05),0_16px_44px_-20px_rgba(23,50,77,0.25)]">
          <ProfileHeader
            displayName={fullName}
            avatarUrl={user.avatar || employee.avatar}
            badges={
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                  <ShieldCheck size={14} /> {t(`role.${user.role}`)}
                </span>
                {statusBadge(employee.status)}
              </>
            }
            isActive={employee.status === 'Active'}
          />
          <ProfileInfo icon={User} title={t('profile.personalInfo')}>
            <FieldRow icon={User} label={t('profile.fullName')} value={fullName} />
            <FieldRow icon={Mail} label={t('profile.email')} value={employee.email} />
            <FieldRow icon={Phone} label={t('profile.phone')} value={employee.phone} />
            <FieldRow icon={CalendarDays} label="Date of Birth" value={employee.dateOfBirth} />
            <FieldRow icon={MapPin} label="Address" value={`${employee.address}, ${employee.city}, ${employee.country}`} />
          </ProfileInfo>
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModalWrapper
          user={user}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
}
