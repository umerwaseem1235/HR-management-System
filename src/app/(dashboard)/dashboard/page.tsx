'use client';

import React from 'react';
import AdminDashboard from '../../../components/dashboard/AdminDashboard';
import EmployeeDashboard from '../../../components/dashboard/EmployeeDashboard';
import { useAuth } from '../../../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      {user?.role === 'employee' ? <EmployeeDashboard /> : <AdminDashboard />}
    </>
  );
}
