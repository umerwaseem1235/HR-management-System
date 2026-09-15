'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { LeaveProvider } from '../contexts/LeaveContext';
import { ExpenseProvider } from '../contexts/ExpenseContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { WorkProvider } from '../contexts/WorkContext';
import { RemoteProvider } from '../contexts/RemoteContext';
import { ProgressProvider } from '../contexts/ProgressContext';

/**
 * Composes every domain provider in one place so
 * `app/layout.tsx` stays a thin shell.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LeaveProvider>
        <ExpenseProvider>
          <NotificationProvider>
            <WorkProvider>
              <RemoteProvider>
                <ProgressProvider>{children}</ProgressProvider>
              </RemoteProvider>
            </WorkProvider>
          </NotificationProvider>
        </ExpenseProvider>
      </LeaveProvider>
    </AuthProvider>
  );
}
