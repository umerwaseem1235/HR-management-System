'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/constants';
import { mockEmployees } from '../../lib/mock-data';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');

  if (!user) return null;

  // Match logged-in user to an employee record (by email first, then by name)
  const employee =
    mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
    mockEmployees.find(
      (e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase()
    );

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'employment', label: 'Employment' },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      Active: 'success',
      Inactive: 'danger',
      'On Notice': 'warning',
      Probation: 'info',
    };
    return <Badge variant={map[status] || 'neutral'} size="md">{status}</Badge>;
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-[#D6E4E8] last:border-0">
      <span className="text-sm text-gray-500 sm:w-48 mb-1 sm:mb-0">{label}</span>
      <span className="text-sm font-medium text-[#263238]">{value || '—'}</span>
    </div>
  );

  // Fallback when no matching employee record exists: show basic account profile
  if (!employee) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-[#17324D]">My Profile</h1>
          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar name={user.name} size="xl" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#17324D]">{user.name}</h2>
                <p className="text-gray-500 mt-1">{ROLE_LABELS[user.role]}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-[#17324D] mb-4">Account Information</h3>
            <InfoRow label="Full Name" value={user.name} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Role" value={ROLE_LABELS[user.role]} />
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#17324D]">My Profile</h1>

        {/* Profile Header */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar name={`${employee.firstName} ${employee.lastName}`} size="xl" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-[#17324D]">
                  {employee.firstName} {employee.lastName}
                </h2>
                {statusBadge(employee.status)}
                <Badge variant="info" size="md">{ROLE_LABELS[user.role]}</Badge>
              </div>
              <p className="text-gray-500">{employee.designation} · {employee.department}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Mail size={14} /> {employee.email}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {employee.phone}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {employee.branch}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> Joined {employee.joiningDate}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card padding="none">
          <div className="px-6 pt-4">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
          <div className="p-6">
            {activeTab === 'personal' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Personal Information</h3>
                <InfoRow label="Full Name" value={`${employee.firstName} ${employee.lastName}`} />
                <InfoRow label="Employee Code" value={employee.employeeCode} />
                <InfoRow label="Email" value={employee.email} />
                <InfoRow label="Phone" value={employee.phone} />
                <InfoRow label="Date of Birth" value={employee.dateOfBirth} />
                <InfoRow label="Gender" value={employee.gender} />
                <InfoRow label="Address" value={`${employee.address}, ${employee.city}, ${employee.country}`} />
                <h3 className="text-base font-semibold text-[#17324D] mt-6 mb-4">Emergency Contact</h3>
                <InfoRow label="Name" value={employee.emergencyContactName} />
                <InfoRow label="Phone" value={employee.emergencyContactPhone} />
              </div>
            )}
            {activeTab === 'employment' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Employment Details</h3>
                <InfoRow label="Department" value={employee.department} />
                <InfoRow label="Designation" value={employee.designation} />
                <InfoRow label="Branch" value={employee.branch} />
                <InfoRow label="Reporting Manager" value={employee.reportingManager} />
                <InfoRow label="Employment Type" value={employee.employmentType} />
                <InfoRow label="Joining Date" value={employee.joiningDate} />
                <InfoRow label="Shift" value={employee.shift} />
                <InfoRow label="Status" value={employee.status} />
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
