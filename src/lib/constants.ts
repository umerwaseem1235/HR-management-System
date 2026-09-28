import { NavItem, UserRole } from './types';

export const APP_NAME = 'CodQor HRMS';
export const APP_DESCRIPTION = 'Human Resource Management System';

export const NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Employees', href: '/employees', icon: 'Users', roles: ['super_admin', 'hr_manager'] },
  { name: 'Attendance', href: '/attendance', icon: 'Clock', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Leave', href: '/leave', icon: 'CalendarDays', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Remote', href: '/remote', icon: 'Wifi', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Payroll', href: '/payroll', icon: 'Wallet', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Progress', href: '/progress', icon: 'TrendingUp', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Expenses', href: '/expenses', icon: 'Receipt', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Recruitment', href: '/recruitment', icon: 'UserPlus', roles: ['super_admin', 'hr_manager'] },
  { name: 'Documents', href: '/documents', icon: 'FileText', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Reports', href: '/reports', icon: 'BarChart3', roles: ['super_admin', 'hr_manager'] },
  { 
    name: 'Configuration', 
    icon: 'Settings2', 
    roles: ['super_admin'],
    subItems: [
      { name: 'Departments', href: '/configuration/departments', roles: ['super_admin'] },
      { name: 'Branches', href: '/configuration/branches', roles: ['super_admin'] },
      { name: 'Shifts', href: '/configuration/shifts', roles: ['super_admin'] },
      { name: 'Leave Policies', href: '/configuration/leave-policies', roles: ['super_admin'] },
    ]
  },
  { name: 'Settings', href: '/settings', icon: 'Settings', roles: ['super_admin', 'hr_manager', 'employee'] },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
  employee: 'Employee',
};

export const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  Inactive: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
  'On Notice': 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
  Probation: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400',
  Present: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  Absent: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
  Late: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
  'Half Day': 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400',
  Leave: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  Holiday: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
  Weekend: 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300',
  Pending: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400',
  Approved: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  Rejected: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
  Cancelled: 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300',
  Reimbursed: 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400',
  Open: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  Closed: 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300',
  'On Hold': 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400',
  Draft: 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300',
  Processed: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  Finalized: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
};

export const DEPARTMENTS = [
  'Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations', 'Design', 'Product', 'Customer Support', 'Legal'
];

export const DESIGNATIONS = [
  'Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'Engineering Manager',
  'HR Executive', 'HR Manager', 'Recruiter',
  'Marketing Executive', 'Marketing Manager',
  'Sales Executive', 'Sales Manager',
  'Financial Analyst', 'Finance Manager',
  'Operations Coordinator', 'Operations Manager',
  'UI/UX Designer', 'Senior Designer',
  'Product Manager', 'Senior Product Manager',
  'Support Executive', 'Support Lead',
];

export const BRANCHES = [
  { id: '1', name: 'Mumtaz Market', city: 'Gujranwala' },
];

export const SHIFTS = [
  { id: '1', name: 'Morning Shift', startTime: '09:00', endTime: '18:00' },
  { id: '2', name: 'Afternoon Shift', startTime: '14:00', endTime: '23:00' },
  { id: '3', name: 'Night Shift', startTime: '22:00', endTime: '07:00' },
  { id: '4', name: 'Flexible', startTime: '08:00', endTime: '17:00' },
];

export const LEAVE_TYPES = [
  { id: '1', name: 'Monthly Leave', daysAllowed: 2, carryForward: false, color: '#024fa7', period: 'month' as const, description: 'Paid short leaves · resets every month' },
  { id: '2', name: 'Annual Leave', daysAllowed: 20, carryForward: true, color: '#024fa7', period: 'year' as const, description: 'Planned vacations & long leaves' },
  { id: '3', name: 'Maternity Leave', daysAllowed: 90, carryForward: false, color: '#ec4899', period: 'year' as const, description: 'Statutory maternity benefit' },
  { id: '4', name: 'Paternity Leave', daysAllowed: 15, carryForward: false, color: '#8b5cf6', period: 'year' as const, description: 'Statutory paternity benefit' },
];

export const EXPENSE_CATEGORIES = [
  'Travel', 'Meals', 'Office Supplies', 'Software', 'Equipment', 'Other'
];



