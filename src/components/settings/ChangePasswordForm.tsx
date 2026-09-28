'use client';

import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { KeyRound } from 'lucide-react';
import { updatePassword } from '@/lib/actions/auth';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!oldPassword) {
      setError('Please enter your old password.');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (oldPassword === newPassword) {
      setError('Old password and new password should not be same.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    const result = await updatePassword(oldPassword, newPassword);
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Failed to update password. Please try again.');
      return;
    }
    setSuccess('Password changed successfully.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">{t('settings.changePassword')}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-lg px-4 py-2.5">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/60 rounded-lg px-4 py-2.5">{success}</p>
        )}
        <Input
          label={t('settings.currentPassword')}
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder={t('settings.currentPassword')}
        />
        <Input
          label={t('settings.newPassword')}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t('settings.newPassword')}
        />
        <Input
          label={t('settings.confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('settings.confirmPassword')}
        />
        <div className="flex justify-end pt-2">
          <Button variant="primary" type="submit" disabled={saving}>
            <KeyRound size={16} /> {saving ? t('action.saving') : t('settings.updatePassword')}
          </Button>
        </div>
      </form>
    </div>
  );
}
