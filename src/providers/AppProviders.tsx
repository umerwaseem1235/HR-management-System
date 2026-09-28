'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { DashboardProvider } from '../contexts/DashboardContext';
import { LeaveProvider } from '../contexts/LeaveContext';
import { ExpenseProvider } from '../contexts/ExpenseContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { WorkProvider } from '../contexts/WorkContext';
import { RemoteProvider } from '../contexts/RemoteContext';
import { ProgressProvider } from '../contexts/ProgressContext';
import { LanguageProvider } from '../contexts/LanguageContext';

import { ThemeProvider } from 'next-themes';

/**
 * Composes every domain provider in one place so
 * `app/layout.tsx` stays a thin shell.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <LanguageProvider>
        <AuthProvider>
          <DashboardProvider>
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
          </DashboardProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
