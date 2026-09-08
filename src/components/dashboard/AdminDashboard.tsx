'use client';

import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, CalendarOff, ClipboardCheck, TrendingUp, Briefcase, DollarSign, UserPlus, Clock, CheckCircle2, XCircle, ArrowUpRight, Gift, Building2, ImagePlus, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import { mockDashboardStats, mockLeaveRequests, mockNotifications, mockEmployees, mockAttendance } from '../../lib/mock-data';
import { BRANCHES, DEPARTMENTS, DESIGNATIONS, SHIFTS } from '../../lib/constants';

export default function AdminDashboard() {
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const stats = mockDashboardStats;
  const pendingLeaves = mockLeaveRequests.filter(l => l.status === 'Pending');

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Profile photo must be smaller than 5 MB.');
      return;
    }

    setPhotoError('');
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Attendance trend data (mock 7 days)
  const attendanceTrend = [
    { day: 'Mon', present: 11, total: 15 },
    { day: 'Tue', present: 13, total: 15 },
    { day: 'Wed', present: 12, total: 15 },
    { day: 'Thu', present: 14, total: 15 },
    { day: 'Fri', present: 10, total: 15 },
    { day: 'Sat', present: 0, total: 15 },
    { day: 'Sun', present: 0, total: 15 },
  ];

  // Department headcount
  const deptCounts = [
    { name: 'Engineering', count: 5, color: 'bg-[#0F8B8D]' },
    { name: 'Human Resources', count: 2, color: 'bg-[#17324D]' },
    { name: 'Marketing', count: 1, color: 'bg-orange-500' },
    { name: 'Sales', count: 1, color: 'bg-blue-500' },
    { name: 'Finance', count: 1, color: 'bg-purple-500' },
    { name: 'Design', count: 1, color: 'bg-pink-500' },
    { name: 'Product', count: 1, color: 'bg-indigo-500' },
    { name: 'Customer Support', count: 1, color: 'bg-yellow-500' },
    { name: 'Operations', count: 1, color: 'bg-emerald-500' },
    { name: 'Legal', count: 1, color: 'bg-red-500' },
  ];
  const maxDeptCount = Math.max(...deptCounts.map(d => d.count));

  const upcomingEvents = [
    { type: 'birthday', name: 'Ahmed Hassan', date: 'Tomorrow', icon: Gift },
    { type: 'anniversary', name: 'Sarah Williams', date: 'Jan 15', icon: Gift },
    { type: 'probation', name: 'Priya Sharma', date: 'Feb 01', icon: Clock },
    { type: 'probation', name: 'Emma Garcia', date: 'Apr 08', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D]">Good Morning! 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening in your organization today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => setIsAddEmployeeOpen(true)}>
            <UserPlus size={16} /> Add Employee
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Users size={22} className="text-[#17324D]" />}
          change="+1 this month"
          changeType="positive"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={<UserCheck size={22} className="text-green-600" />}
          iconBg="bg-green-50"
          change={`${Math.round((stats.presentToday / stats.totalEmployees) * 100)}% attendance`}
          changeType="positive"
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          icon={<UserX size={22} className="text-red-600" />}
          iconBg="bg-red-50"
          change={`${Math.round((stats.absentToday / stats.totalEmployees) * 100)}% absent`}
          changeType="negative"
        />
        <StatCard
          title="On Leave Today"
          value={stats.onLeaveToday}
          icon={<CalendarOff size={22} className="text-orange-500" />}
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingLeaveApprovals + stats.pendingExpenseApprovals}
          icon={<ClipboardCheck size={22} className="text-[#0F8B8D]" />}
          iconBg="bg-[#EAF2F4]"
          change={`${stats.pendingLeaveApprovals} leave, ${stats.pendingExpenseApprovals} expense`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#17324D]">Attendance Trend</h3>
            <Badge variant="default">This Week</Badge>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {attendanceTrend.map(day => (
              <div key={day.day} className="flex flex-col items-center flex-1 gap-2">
                <span className="text-xs font-medium text-[#17324D]">{day.present}</span>
                <div className="w-full bg-[#EAF2F4] rounded-t-md relative" style={{ height: '140px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-[#0F8B8D] rounded-t-md transition-all duration-500"
                    style={{ height: `${day.total > 0 ? (day.present / day.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Department Headcount */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#17324D]">Department Headcount</h3>
            <Badge variant="default">{stats.totalEmployees} Total</Badge>
          </div>
          <div className="space-y-3">
            {deptCounts.slice(0, 6).map(dept => (
              <div key={dept.name} className="flex items-center gap-3">
                <span className="text-sm text-[#263238] w-32 truncate">{dept.name}</span>
                <div className="flex-1 bg-[#EAF2F4] rounded-full h-6 relative overflow-hidden">
                  <div
                    className={`${dept.color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${(dept.count / maxDeptCount) * 100}%`, minWidth: '32px' }}
                  >
                    <span className="text-xs font-semibold text-white">{dept.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Approvals */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#17324D]">Pending Leave Approvals</h3>
            <button className="text-sm text-[#0F8B8D] hover:underline font-medium flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No pending approvals</p>
            ) : (
              pendingLeaves.map(leave => (
                <div key={leave.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                  <div className="flex items-center gap-3">
                    <Avatar name={leave.employeeName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[#263238]">{leave.employeeName}</p>
                      <p className="text-xs text-gray-500">
                        {leave.leaveType} · {leave.startDate} to {leave.endDate} · {leave.days} day{leave.days > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors">
                      <CheckCircle2 size={18} />
                    </button>
                    <button className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <h3 className="text-base font-semibold text-[#17324D] mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#EAF2F4]/50 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  event.type === 'birthday' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <event.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#263238] truncate">{event.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{event.type === 'birthday' ? '🎂 Birthday' : event.type === 'anniversary' ? '🎉 Anniversary' : '📋 Probation End'}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{event.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <Briefcase size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.openVacancies}</p>
              <p className="text-xs text-gray-500">Open Vacancies</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <UserPlus size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.newJoinersThisMonth}</p>
              <p className="text-xs text-gray-500">New Joiners</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-lg">
              <Clock size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.lateToday}</p>
              <p className="text-xs text-gray-500">Late Today</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-[#EAF2F4] p-2 rounded-lg">
              <DollarSign size={18} className="text-[#0F8B8D]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.payrollStatus}</p>
              <p className="text-xs text-gray-500">Payroll Status</p>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        title="Add New Employee"
        size="lg"
      >
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            setIsAddEmployeeOpen(false);
          }}
        >
          <div>
            <h4 className="text-sm font-semibold text-[#17324D] mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <span className="block text-sm font-medium text-[#263238] mb-1.5">Profile Photo</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-dashed border-[#B9D0D6] bg-[#F8FBFC] p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF2F4] border border-[#D6E4E8]">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus size={24} className="text-[#0F8B8D]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#263238]">Upload a profile photo</p>
                    <p className="text-xs text-gray-500 mt-1">Use a clear JPG, PNG or WEBP image up to 5 MB.</p>
                    {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}
                    <div className="flex items-center gap-3 mt-3">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#D6E4E8] bg-white px-3 py-1.5 text-sm font-medium text-[#263238] hover:bg-[#EAF2F4] transition-colors">
                        <ImagePlus size={15} />
                        {photoPreview ? 'Replace Photo' : 'Choose Photo'}
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} className="sr-only" />
                      </label>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setPhotoError('');
                          }}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={15} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Input label="First Name" placeholder="Enter first name" required />
              <Input label="Last Name" placeholder="Enter last name" required />
              <Input label="Employee ID" placeholder="EMP016" required />
              <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" />
              <Input label="Email" type="email" placeholder="name@company.com" required />
              <Input label="Date of Birth" type="date" />
              <Input label="Address" placeholder="Street address" className="sm:col-span-2" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#17324D] mb-3">Employment Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Department" options={[{ value: '', label: 'Select Department' }, ...DEPARTMENTS.map(department => ({ value: department, label: department }))]} required />
              <Select label="Designation" options={[{ value: '', label: 'Select Designation' }, ...DESIGNATIONS.map(designation => ({ value: designation, label: designation }))]} required />
              <Select label="Branch" options={[{ value: '', label: 'Select Branch' }, ...BRANCHES.map(branch => ({ value: branch.id, label: `${branch.name} - ${branch.city}` }))]} required />
              <Input label="Reporting Manager" placeholder="Manager name" />
              <Select
                label="Employment Type"
                options={[
                  { value: '', label: 'Select Type' },
                  { value: 'Full-time', label: 'Full-time' },
                  { value: 'Part-time', label: 'Part-time' },
                  { value: 'Contract', label: 'Contract' },
                  { value: 'Intern', label: 'Intern' },
                ]}
                required
              />
              <Input label="Joining Date" type="date" required />
              <Input label="Probation End Date" type="date" />
              <Select label="Shift" options={[{ value: '', label: 'Select Shift' }, ...SHIFTS.map(shift => ({ value: shift.id, label: `${shift.name} (${shift.startTime} - ${shift.endTime})` }))]} required />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#17324D] mb-3">Payroll Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Bank Name" placeholder="Bank name" />
              <Input label="Account Number" placeholder="Account number" />
              <Input label="Tax ID" placeholder="Tax identification number" />
              <Input label="Basic Salary" type="number" placeholder="Annual salary" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Payroll information is restricted to authorized administrators.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
            <Button type="button" variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <UserPlus size={16} /> Save Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
