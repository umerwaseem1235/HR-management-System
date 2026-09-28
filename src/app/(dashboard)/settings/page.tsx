'use client';

import React from 'react';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import ChangePasswordForm from '../../../components/settings/ChangePasswordForm';
import PreferencesForm from '../../../components/settings/PreferencesForm';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth, AuthLoadingFallback } from '../../../components/auth/RequireAuth';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  useRequireAuth();
  
  if (!user) return <AuthLoadingFallback />;

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} />
      
      <Card>
        <div className="p-2 sm:p-6">
          <PreferencesForm />
        </div>
      </Card>

      <Card>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
