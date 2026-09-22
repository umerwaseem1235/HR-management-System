'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import SettingsForm from '../../components/settings/SettingsForm';
import ChangePasswordForm from '../../components/settings/ChangePasswordForm';
import { BranchList, DepartmentList, LeaveTypeList, ShiftList } from '../../components/settings/SettingsLists';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('company');

  const isSuperAdmin = user?.role === 'super_admin';

  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'departments', label: 'Departments' },
    { id: 'branches', label: 'Branches' },
    { id: 'shifts', label: 'Shifts' },
    { id: 'leave', label: 'Leave Policies' },
    { id: 'password', label: 'Change Password' },
  ];

  // Employees (and HR managers) may only change their own password —
  // company/department/branch/shift/leave configuration is super-admin only.
  if (user && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title="Settings" />
          <Card>
            <ChangePasswordForm />
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
        />

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'company' && (
              <SettingsForm />
            )}
            {activeTab === 'departments' && (
              <DepartmentList />
            )}
            {activeTab === 'branches' && (
              <BranchList />
            )}
            {activeTab === 'shifts' && (
              <ShiftList />
            )}
            {activeTab === 'leave' && (
              <LeaveTypeList />
            )}
            {activeTab === 'password' && (
              <ChangePasswordForm />
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
