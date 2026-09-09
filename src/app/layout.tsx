import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { LeaveProvider } from '../contexts/LeaveContext';

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
            {children}
          </LeaveProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
