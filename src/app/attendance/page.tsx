'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import { UserCheck, UserX, Clock, AlertTriangle } from 'lucide-react';
import { mockAttendance, mockDashboardStats } from '../../lib/mock-data';

export default function AttendancePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const stats = mockDashboardStats;

  const filtered = mockAttendance.filter(att => {
    const matchSearch = !search || att.employeeName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || att.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
      Present: 'success', Absent: 'danger', Late: 'warning', 'Half Day': 'info', Leave: 'info', Holiday: 'neutral', Weekend: 'neutral',
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#17324D]">Attendance</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Present" value={stats.presentToday} icon={<UserCheck size={22} className="text-green-600" />} iconBg="bg-green-50" />
          <StatCard title="Absent" value={stats.absentToday} icon={<UserX size={22} className="text-red-500" />} iconBg="bg-red-50" />
          <StatCard title="Late" value={stats.lateToday} icon={<Clock size={22} className="text-orange-500" />} iconBg="bg-orange-50" />
          <StatCard title="On Leave" value={stats.onLeaveToday} icon={<AlertTriangle size={22} className="text-blue-500" />} iconBg="bg-blue-50" />
        </div>

        <Card padding="sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search employee..." className="flex-1" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
              { value: '', label: 'All Status' }, { value: 'Present', label: 'Present' }, { value: 'Absent', label: 'Absent' },
              { value: 'Late', label: 'Late' }, { value: 'Half Day', label: 'Half Day' }, { value: 'Leave', label: 'Leave' },
            ]} />
          </div>
        </Card>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Work Hours</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Overtime</th>
              </tr></thead>
              <tbody className="divide-y divide-[#D6E4E8]">
                {filtered.map(att => (
                  <tr key={att.id} className="hover:bg-[#EAF2F4]/50">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={att.employeeName} size="sm" /><span className="text-sm font-medium text-[#263238]">{att.employeeName}</span></div></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{att.date}</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{att.checkIn || '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{att.checkOut || '—'}</td>
                    <td className="px-6 py-4">{statusBadge(att.status)}</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{att.workHours}h</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{att.overtime > 0 ? `${att.overtime}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
