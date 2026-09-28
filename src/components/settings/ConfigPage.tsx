'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { AuthLoadingFallback, useRequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConfigPageProps {
  titleKey: string;
  children: React.ReactNode;
}

/**
 * Shared shell for the super-admin configuration pages
 * (branches / departments / shifts / leave-policies).
 * Preserves the existing guard + layout; pages only supply title + list.
 */
export default function ConfigPage({ titleKey, children }: ConfigPageProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  useRequireAuth();

  if (!user || user.role !== 'super_admin') return <AuthLoadingFallback />;

  return (
    <div className="space-y-6">
      <PageHeader title={t(titleKey)} />
      <Card padding="none">
        <div className="p-6">{children}</div>
      </Card>
    </div>
  );
}
