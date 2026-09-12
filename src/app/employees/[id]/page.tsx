'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Tabs from '../../../components/ui/Tabs';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { Mail, Phone, MapPin, Calendar, Building2, Briefcase, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { mockEmployees, mockAttendance, mockLeaveBalances, mockPayslips, mockGoals, mockAssets } from '../../../lib/mock-data';

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

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      Active: 'success', Inactive: 'danger', 'On Notice': 'warning', Probation: 'info',
    };
    return <Badge variant={map[status] || 'neutral'} size="md">{status}</Badge>;
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-[#D6E4E8] last:border-0">
      <span className="text-sm text-gray-500 sm:w-48 mb-1 sm:mb-0">{label}</span>
      <span className="text-sm font-medium text-[#263238]">{value || '—'}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Link href="/employees" className="inline-flex items-center gap-2 text-sm text-[#0F8B8D] hover:underline">
          <ArrowLeft size={16} /> Back to Employees
        </Link>

        {/* Profile Header */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar name={`${employee.firstName} ${employee.lastName}`} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-[#17324D]">{employee.firstName} {employee.lastName}</h1>
                {statusBadge(employee.status)}
              </div>
              <p className="text-gray-500">{employee.designation} · {employee.department}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Mail size={14} /> {employee.email}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {employee.phone}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {employee.branch}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> Joined {employee.joiningDate}</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Edit size={14} /> Edit
            </Button>
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
            {activeTab === 'attendance' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Recent Attendance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-[#EAF2F4]">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Check In</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Check Out</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#17324D]">Hours</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#D6E4E8]">
                      {mockAttendance.filter(a => a.employeeId === employee.id).map(att => (
                        <tr key={att.id}>
                          <td className="px-4 py-3 text-sm">{att.date}</td>
                          <td className="px-4 py-3 text-sm">{att.checkIn || '—'}</td>
                          <td className="px-4 py-3 text-sm">{att.checkOut || '—'}</td>
                          <td className="px-4 py-3"><Badge variant={att.status === 'Present' ? 'success' : att.status === 'Late' ? 'warning' : 'danger'} size="sm">{att.status}</Badge></td>
                          <td className="px-4 py-3 text-sm">{att.workHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'leave' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Leave Balances</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockLeaveBalances.map(bal => (
                    <div key={bal.leaveType} className="p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{bal.leaveType}</span>
                        <span className="text-sm font-bold text-[#17324D]">{bal.remaining}/{bal.total}</span>
                      </div>
                      <div className="w-full bg-[#D6E4E8] rounded-full h-2">
                        <div className="bg-[#0F8B8D] h-2 rounded-full" style={{ width: `${(bal.used / bal.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'payroll' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Payslip History</h3>
                {employeeSlips.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">No payslips generated for this employee yet.</p>
                ) : (
                <div className="space-y-3">
                  {employeeSlips.map(slip => (
                    <div key={slip.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                      <div>
                        <p className="text-sm font-medium text-[#263238]">{slip.month} {slip.year}</p>
                        <p className="text-xs text-gray-500">Generated: {slip.generatedOn}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#17324D]">${slip.netSalary.toLocaleString()}</p>
                        <Badge variant="success" size="sm">{slip.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}
            {activeTab === 'documents' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Employee documents will be displayed here.</p>
                <Button variant="outline" size="sm" className="mt-4">Upload Document</Button>
              </div>
            )}
            {activeTab === 'assets' && (
              <div>
                <h3 className="text-base font-semibold text-[#17324D] mb-4">Assigned Assets</h3>
                <div className="space-y-3">
                  {mockAssets.filter(a => a.assignedTo === employee.id).map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                      <div>
                        <p className="text-sm font-medium text-[#263238]">{asset.name}</p>
                        <p className="text-xs text-gray-500">{asset.type} · {asset.serialNumber}</p>
                      </div>
                      <Badge variant={asset.condition === 'New' ? 'success' : asset.condition === 'Good' ? 'info' : 'warning'} size="sm">{asset.condition}</Badge>
                    </div>
                  ))}
                  {mockAssets.filter(a => a.assignedTo === employee.id).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">No assets assigned.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
