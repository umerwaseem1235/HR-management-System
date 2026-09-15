'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DetailHeader from '../../../components/employees/EmployeeDetail/DetailHeader';
import DetailTabs from '../../../components/employees/EmployeeDetail/DetailTabs';
import { mockEmployees, mockPayslips } from '../../../lib/mock-data';

export default function EmployeeProfilePage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('personal');
  const employee = mockEmployees.find(e => e.id === params.id) || mockEmployees[0];
  const employeeSlips = mockPayslips.filter(s => s.employeeId === employee.id);

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'employment', label: 'Employment' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'documents', label: 'Documents' },
    { id: 'assets', label: 'Assets' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Link href="/employees" className="inline-flex items-center gap-2 text-sm text-[#024fa7] hover:underline">
          <ArrowLeft size={16} /> Back to Employees
        </Link>

        {/* Profile Header */}
        <DetailHeader employee={employee} />

        {/* Tabs */}
        <DetailTabs
          tabs={tabs}
          activeTab={activeTab}
          employee={employee}
          employeeSlips={employeeSlips}
          onTabChange={setActiveTab}
        />
      </div>
    </DashboardLayout>
  );
}
