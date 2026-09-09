'use client';

import React from 'react';
import {
  Users, UserCheck, UserX, CalendarOff, ClipboardCheck, TrendingUp, Briefcase,
  DollarSign, UserPlus, Clock, CheckCircle2, XCircle, ArrowUpRight, Gift,
  Building2, FileWarning, Target, Activity, CalendarClock, UserMinus, Receipt,
  Star, AlertTriangle,
} from 'lucide-react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import {
  mockDashboardStats,
  mockLeaveRequests,
  mockNotifications,
  mockEmployees,
  mockAttendance,
  mockExpenses,
  mockCandidates,
  mockJobs,
  mockPerformanceReviews,
} from '../../lib/mock-data';

export default function AdminDashboard() {
  const stats = mockDashboardStats;
  const pendingLeaves = mockLeaveRequests.filter(l => l.status === 'Pending');
  const pendingExpenses = mockExpenses.filter(e => e.status === 'Pending');

  // Recruitment pipeline stages
  const pipeline = ['Screening', 'Interview', 'Selected', 'Offered'];
  const pipelineCounts = pipeline.map(stage => ({
    stage,
    count: mockCandidates.filter(c => c.stage === stage).length || (stage === 'Offered' ? 1 : 0),
  }));
  const openJobs = mockJobs.filter(j => j.status === 'Open');

  // New joiners (most recent)
  const newJoiners = [...mockEmployees]
    .sort((a, b) => b.joiningDate.localeCompare(a.joiningDate))
    .slice(0, 4);

  // Upcoming exits (mock)
  const upcomingExits = [
    { name: 'James Anderson', role: 'Sales Manager', exitDate: 'Mar 31', reason: 'Resignation' },
    { name: 'Olivia Brown', role: 'Support Lead', exitDate: 'Apr 15', reason: 'Retirement' },
  ];

  // Performance reviews pending
  const pendingReviews = mockPerformanceReviews.filter(r => r.status !== 'Completed');

  // Document expiries (mock)
  const documentExpiries = [
    { name: 'Priya Sharma', doc: 'Work Permit', expiry: 'Feb 08' },
    { name: 'Ahmed Hassan', doc: 'Degree Certificate', expiry: 'Mar 01' },
    { name: 'Emily Rodriguez', doc: 'Visa', expiry: 'Jan 28' },
  ];

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
  ];
  const maxDeptCount = Math.max(...deptCounts.map(d => d.count));

  const upcomingEvents = [
    { type: 'birthday', name: 'Ahmed Hassan', date: 'Tomorrow', icon: Gift },
    { type: 'anniversary', name: 'Sarah Williams', date: 'Jan 15', icon: Gift },
    { type: 'probation', name: 'Priya Sharma', date: 'Feb 01', icon: Clock },
    { type: 'probation', name: 'Emma Garcia', date: 'Apr 08', icon: Clock },
  ];

  const typeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
  };

  const notifyIcon = (type: string) => {
    if (type === 'success') return <CheckCircle2 size={16} />;
    if (type === 'warning') return <AlertTriangle size={16} />;
    if (type === 'error') return <XCircle size={16} />;
    return <Activity size={16} />;
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D]">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening in your organization today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">{stats.activeEmployees} Active</Badge>
          <Badge variant="danger">{stats.totalEmployees - stats.activeEmployees} Inactive</Badge>
          <Badge variant="default">{stats.totalEmployees} Total</Badge>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Users size={22} className="text-[#17324D]" />}
          change={`${stats.activeEmployees} active · ${stats.totalEmployees - stats.activeEmployees} inactive`}
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
          value={stats.absentToday + stats.onLeaveToday}
          icon={<UserX size={22} className="text-red-600" />}
          iconBg="bg-red-50"
          change={`${stats.absentToday} absent · ${stats.onLeaveToday} on leave`}
          changeType="negative"
        />
        <StatCard
          title="Late Today"
          value={stats.lateToday}
          icon={<Clock size={22} className="text-orange-500" />}
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
            {deptCounts.map(dept => (
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

      {/* Recruitment Pipeline */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-[#0F8B8D]" />
            <h3 className="text-base font-semibold text-[#17324D]">Recruitment Pipeline</h3>
          </div>
          <Badge variant="info">{stats.openVacancies} Open Vacancies</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {pipelineCounts.map(step => (
            <div key={step.stage} className="rounded-lg border border-[#D6E4E8] bg-[#F8FBFC] p-4 text-center">
              <p className="text-2xl font-bold text-[#17324D]">{step.count}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{step.stage}</p>
              <div className="mt-3 h-1.5 w-full bg-[#EAF2F4] rounded-full overflow-hidden">
                <div className="h-full bg-[#0F8B8D] rounded-full" style={{ width: `${Math.min(100, (step.count / 6) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          {openJobs.map(job => (
            <div key={job.id} className="flex items-center justify-between rounded-lg border border-[#D6E4E8] px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-[#263238]">{job.title}</p>
                <p className="text-xs text-gray-500">{job.department} · {job.branch}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{job.vacancies} open</span>
                <span>{job.applicants} applicants</span>
                <Badge variant="info">{job.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Approvals Row: Leave + Expense */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Approvals */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarOff size={18} className="text-[#0F8B8D]" />
              <h3 className="text-base font-semibold text-[#17324D]">Pending Leave Approvals</h3>
            </div>
            <Badge variant="warning">{pendingLeaves.length}</Badge>
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

        {/* Pending Expense Approvals */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-[#0F8B8D]" />
              <h3 className="text-base font-semibold text-[#17324D]">Pending Expense Approvals</h3>
            </div>
            <Badge variant="warning">{pendingExpenses.length}</Badge>
          </div>
          <div className="space-y-3">
            {pendingExpenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No pending expenses</p>
            ) : (
              pendingExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                  <div className="flex items-center gap-3">
                    <Avatar name={exp.employeeName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[#263238]">{exp.employeeName}</p>
                      <p className="text-xs text-gray-500">{exp.category} · {exp.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#17324D]">${exp.amount}</span>
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
      </div>

      {/* People & Events Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Joiners */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-green-600" />
              <h3 className="text-base font-semibold text-[#17324D]">New Joiners</h3>
            </div>
            <Badge variant="success">+{stats.newJoinersThisMonth} this month</Badge>
          </div>
          <div className="space-y-3">
            {newJoiners.map(emp => (
              <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EAF2F4]/50 transition-colors">
                <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#263238] truncate">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-gray-500">{emp.designation}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-xs font-medium text-[#0F8B8D]">{emp.joiningDate}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Exits */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserMinus size={18} className="text-red-600" />
              <h3 className="text-base font-semibold text-[#17324D]">Upcoming Exits</h3>
            </div>
            <Badge variant={upcomingExits.length > 0 ? 'danger' : 'default'}>{upcomingExits.length}</Badge>
          </div>
          <div className="space-y-3">
            {upcomingExits.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No upcoming exits</p>
            ) : (
              upcomingExits.map((exit, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EAF2F4]/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <UserMinus size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#263238] truncate">{exit.name}</p>
                    <p className="text-xs text-gray-500">{exit.role} · {exit.reason}</p>
                  </div>
                  <span className="text-xs font-medium text-red-600 whitespace-nowrap">{exit.exitDate}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-pink-600" />
              <h3 className="text-base font-semibold text-[#17324D]">Upcoming Events</h3>
            </div>
          </div>
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
                  <p className="text-xs text-gray-500 capitalize">{event.type === 'birthday' ? 'Birthday' : event.type === 'anniversary' ? 'Anniversary' : 'Probation End'}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{event.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Compliance & Growth Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Expiries */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileWarning size={18} className="text-yellow-600" />
              <h3 className="text-base font-semibold text-[#17324D]">Document Expiries</h3>
            </div>
            <Badge variant="warning">{documentExpiries.length}</Badge>
          </div>
          <div className="space-y-3">
            {documentExpiries.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EAF2F4]/50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
                  <FileWarning size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#263238] truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">{doc.doc}</p>
                </div>
                <Badge variant="warning">{doc.expiry}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Review Deadlines */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#0F8B8D]" />
              <h3 className="text-base font-semibold text-[#17324D]">Performance Reviews</h3>
            </div>
            <Badge variant={pendingReviews.length > 0 ? 'warning' : 'success'}>{pendingReviews.length} Pending</Badge>
          </div>
          <div className="space-y-3">
            {pendingReviews.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No pending reviews</p>
            ) : (
              pendingReviews.map(review => (
                <div key={review.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EAF2F4]/50 transition-colors">
                  <Avatar name={review.employeeName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#263238] truncate">{review.employeeName}</p>
                    <p className="text-xs text-gray-500">{review.cycleName}</p>
                  </div>
                  <Badge variant={review.status === 'Pending Self Review' ? 'info' : 'warning'}>{review.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Payroll Status */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-[#0F8B8D]" />
              <h3 className="text-base font-semibold text-[#17324D]">Payroll Status</h3>
            </div>
          </div>
          <div className="rounded-lg border border-[#D6E4E8] bg-[#F8FBFC] p-5 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              stats.payrollStatus === 'Processed' || stats.payrollStatus === 'Finalized'
                ? 'bg-green-100 text-green-600'
                : 'bg-yellow-100 text-yellow-600'
            }`}>
              <CheckCircle2 size={24} />
            </div>
            <p className="mt-3 text-lg font-bold text-[#17324D] capitalize">{stats.payrollStatus}</p>
            <p className="text-xs text-gray-500 mt-1">December 2023 payroll cycle</p>
            <div className="mt-4 flex justify-center">
              <Badge variant={stats.payrollStatus === 'Processed' || stats.payrollStatus === 'Finalized' ? 'success' : 'warning'}>
                {stats.payrollStatus === 'Processed' || stats.payrollStatus === 'Finalized' ? 'On Schedule' : 'In Progress'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#17324D]" />
            <h3 className="text-base font-semibold text-[#17324D]">Recent HR Activity</h3>
          </div>
          <Badge variant="info">{mockNotifications.filter(n => !n.read).length} Unread</Badge>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {mockNotifications.slice(0, 6).map(notification => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg border border-[#D6E4E8] transition-colors ${
                notification.read ? 'bg-white' : 'bg-[#F8FBFC]'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${typeColors[notification.type] || 'bg-gray-100 text-gray-600'}`}>
                {notifyIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#263238]">{notification.title}</p>
                  {!notification.read && <span className="w-2 h-2 rounded-full bg-[#0F8B8D] shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                <p className="text-[11px] text-gray-400 mt-1">{notification.createdAt.slice(5, 16).replace('T', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

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
              <p className="text-lg font-bold text-[#17324D] capitalize">{stats.payrollStatus}</p>
              <p className="text-xs text-gray-500">Payroll Status</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
