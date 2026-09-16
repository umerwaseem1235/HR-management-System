'use client';

import React from 'react';
import Button from '../ui/Button';
import { Plus } from 'lucide-react';

interface SettingsSectionProps {
  title: string;
  addLabel: string;
  children: React.ReactNode;
}

export default function SettingsSection({ title, addLabel, children }: SettingsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#17324D]">{title}</h3>
        <Button variant="primary" size="sm"><Plus size={16} /> {addLabel}</Button>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
