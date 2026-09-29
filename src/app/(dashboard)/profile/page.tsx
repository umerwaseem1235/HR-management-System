'use client';

import React from 'react';
import Link from 'next/link';
import Badge from '../../../components/ui/Badge';
import {
  ArrowLeft, User, Mail, Phone, CalendarDays, MapPin, ShieldCheck, X,
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
  const { t } = useLanguage();

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
      // The reload below would discard any message — stash a one-time notice
      // first so an email change awaiting confirmation is explained, not silent.
      if (res.emailConfirmationRequired) {
        try {
          sessionStorage.setItem('profileNotice', JSON.stringify({ message: t('profile.emailConfirmNotice') }));
        } catch {
          // Storage unavailable — the save itself still applies on reload.
        }
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

function SaveNotice({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="flex items-start justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-300"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 transition-colors hover:bg-sky-100 dark:hover:bg-sky-900/50"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { findByUser } = useEmployeeDirectory();
  const { t } = useLanguage();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  // One-time notice stashed before the post-save reload (e.g. an email
  // change awaiting confirmation). Deferred read keeps it StrictMode-safe
  // and avoids setState-in-effect lint violations.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem('profileNotice');
        if (!raw) return;
        sessionStorage.removeItem('profileNotice');
        const parsed = JSON.parse(raw) as { message?: unknown };
        if (typeof parsed?.message === 'string' && parsed.message) {
          setNotice(parsed.message);
        }
      } catch {
        // Corrupt or unavailable storage — stay silent.
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useRequireAuth();
  if (!user) return <AuthLoadingFallback />;

  // Employees cannot edit their own profile (name, email, photo) — only
  // super admins and HR managers may. The button is hidden here and the
  // server action enforces the same rule.
  const canEditProfile = user.role === 'super_admin' || user.role === 'hr_manager';

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
          <SaveNotice message={notice} onDismiss={() => setNotice(null)} />
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-teal hover:underline">
              <ArrowLeft size={16} className="rtl:rotate-180" /> {t('action.backToDashboard')}
            </Link>
            {canEditProfile && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] px-3 py-1.5 text-sm font-medium text-dark-text dark:text-gray-100 shadow-sm hover:bg-blue-gray dark:hover:bg-white/10 transition-colors"
              >
                {t('action.editProfile')}
              </button>
            )}
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
        
        {isEditModalOpen && canEditProfile && (
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
        <SaveNotice message={notice} onDismiss={() => setNotice(null)} />
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-teal hover:underline">
            <ArrowLeft size={16} className="rtl:rotate-180" /> {t('action.backToDashboard')}
          </Link>
          {canEditProfile && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] px-3 py-1.5 text-sm font-medium text-dark-text dark:text-gray-100 shadow-sm hover:bg-blue-gray dark:hover:bg-white/10 transition-colors"
            >
              {t('action.editProfile')}
            </button>
          )}
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

      {isEditModalOpen && canEditProfile && (
        <EditProfileModalWrapper
          user={user}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
}
