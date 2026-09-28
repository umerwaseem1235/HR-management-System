'use client';
import React from 'react';
import Card from '../../../../components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from '../../../../components/ui/PageHeader';
import { ShiftList } from '../../../../components/settings/SettingsLists';
import { useRequireAuth, AuthLoadingFallback } from '../../../../components/auth/RequireAuth';
import { useAuth } from '../../../../contexts/AuthContext';

export default function ShiftsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  useRequireAuth();
  
  if (!user || user.role !== 'super_admin') return <AuthLoadingFallback />;

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.shifts')} />
      <Card padding="none">
        <div className="p-6">
          <ShiftList />
        </div>
      </Card>
    </div>
  );
}


