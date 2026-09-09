'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Plus, CheckCircle2, XCircle } from 'lucide-react';
import { mockLeaveBalances, mockEmployees } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useLeave } from '../../contexts/LeaveContext';

export default function LeavePage() {
  const { user } = useAuth();
  const { leaveRequests, updateLeaveStatus } = useLeave();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('requests');
  const isEmployee = user?.role === 'employee';

  // Resolve the logged-in user to an employee record (same matching as profile page)
  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  // Employees only see their own leave records; admins/HR see everything
  const visibleRequests = useMemo(() => {
    if (!isEmployee) return leaveRequests;
    if (!user) return [];
    return leaveRequests.filter((l) =>
      employee ? l.employeeId === employee.id : l.employeeName.toLowerCase() === user.name.toLowerCase()
    );
  }, [leaveRequests, isEmployee, employee, user]);

  if (!user) return null;

  const tabs = [
    { id: 'requests', label: isEmployee ? 'My Requests' : 'Leave Requests', count: visibleRequests.filter(l => l.status === 'Pending').length },
    { id: 'balances', label: 'Leave Balances' },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
      Pending: 'warning', Approved: 'success', Rejected: 'danger', Cancelled: 'neutral',
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#17324D]">{isEmployee ? 'My Leave' : 'Leave Management'}</h1>
          <Button variant="primary" onClick={() => router.push('/leave/request')}>
            <Plus size={16} /> Request Leave
          </Button>
        </div>

        <Card padding="none">
          <div className="px-6 pt-4">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
          <div className="p-6">
            {activeTab === 'requests' && (
              <div className="space-y-3">
                {visibleRequests.length === 0 ? (
                  <EmptyState
                    title="No leave requests"
                    description={isEmployee ? 'You have no leave requests yet. Click "Request Leave" to submit one.' : 'No leave requests found.'}
                  />
                ) : (
                  visibleRequests.map(leave => (
                    <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8] gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={leave.employeeName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-[#263238]">{leave.employeeName}</p>
                          <p className="text-xs text-gray-500">{leave.leaveType} · {leave.startDate} to {leave.endDate} · {leave.days} day{leave.days > 1 ? 's' : ''}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Reason: {leave.reason}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Applied on {leave.appliedOn}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(leave.status)}
                        {!isEmployee && leave.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              title="Approve"
                              onClick={() => updateLeaveStatus(leave.id, 'Approved', user.name)}
                              className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              title="Reject"
                              onClick={() => updateLeaveStatus(leave.id, 'Rejected', user.name)}
                              className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === 'balances' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockLeaveBalances.map(bal => (
                  <div key={bal.leaveType} className="p-4 rounded-lg border border-[#D6E4E8]">
                    <h4 className="text-sm font-semibold text-[#17324D] mb-3">{bal.leaveType}</h4>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-3xl font-bold text-[#0F8B8D]">{bal.remaining}</span>
                      <span className="text-sm text-gray-500 mb-1">/ {bal.total} days</span>
                    </div>
                    <div className="w-full bg-[#D6E4E8] rounded-full h-2 mb-2">
                      <div className="bg-[#0F8B8D] h-2 rounded-full" style={{ width: `${(bal.used / bal.total) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Used: {bal.used}</span>
                      {bal.pending > 0 && <span className="text-orange-500">Pending: {bal.pending}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
