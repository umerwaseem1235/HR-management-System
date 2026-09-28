'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-blue-gray p-4 rounded-full mb-4">
        {icon || <Inbox size={32} className="text-teal" />}
      </div>
      <h3 className="text-lg font-semibold text-primary dark:text-blue-gray-light mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4 text-center max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
