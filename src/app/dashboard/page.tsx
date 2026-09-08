'use client';

import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminDashboard from '../../components/dashboard/AdminDashboard';
import EmployeeDashboard from '../../components/dashboard/EmployeeDashboard';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      {user?.role === 'employee' ? <EmployeeDashboard /> : <AdminDashboard />}
    </DashboardLayout>
  );
}
