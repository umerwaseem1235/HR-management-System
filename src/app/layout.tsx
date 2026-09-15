import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { LeaveProvider } from '../contexts/LeaveContext';
import { ExpenseProvider } from '../contexts/ExpenseContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { WorkProvider } from '../contexts/WorkContext';
import { RemoteProvider } from '../contexts/RemoteContext';

export const metadata: Metadata = {
  title: 'CodeQor HRMS',
  description: 'Human Resource Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <LeaveProvider>
            <ExpenseProvider>
              <NotificationProvider>
                <WorkProvider>
                  <RemoteProvider>
                    {children}
                  </RemoteProvider>
                </WorkProvider>
              </NotificationProvider>
            </ExpenseProvider>
          </LeaveProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
