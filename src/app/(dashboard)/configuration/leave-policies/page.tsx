'use client';
import React from 'react';
import Card from '../../../../components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from '../../../../components/ui/PageHeader';
import { LeaveTypeList } from '../../../../components/settings/SettingsLists';
import { useRequireAuth, AuthLoadingFallback } from '../../../../components/auth/RequireAuth';
import { useAuth } from '../../../../contexts/AuthContext';

export default function LeavePoliciesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  useRequireAuth();
  
  if (!user || user.role !== 'super_admin') return <AuthLoadingFallback />;

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.leavePolicies')} />
      <Card padding="none">
        <div className="p-6">
          <LeaveTypeList />
        </div>
      </Card>
    </div>
  );
}


