import { NavItem, UserRole } from './types';

export const APP_NAME = 'CodeQor HRMS';
export const APP_DESCRIPTION = 'Human Resource Management System';

export const NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Employees', href: '/employees', icon: 'Users', roles: ['super_admin', 'hr_manager'] },
  { name: 'Recruitment', href: '/recruitment', icon: 'UserPlus', roles: ['super_admin', 'hr_manager'] },
  { name: 'Attendance', href: '/attendance', icon: 'Clock', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Leave', href: '/leave', icon: 'CalendarDays', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Payroll', href: '/payroll', icon: 'Wallet', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Performance', href: '/performance', icon: 'TrendingUp', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Expenses', href: '/expenses', icon: 'Receipt', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Documents', href: '/documents', icon: 'FileText', roles: ['super_admin', 'hr_manager', 'employee'] },
  { name: 'Reports', href: '/reports', icon: 'BarChart3', roles: ['super_admin', 'hr_manager'] },
  { name: 'Settings', href: '/settings', icon: 'Settings', roles: ['super_admin'] },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
  employee: 'Employee',
};

export const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-700',
  'On Notice': 'bg-orange-100 text-orange-700',
  Probation: 'bg-yellow-100 text-yellow-700',
  Present: 'bg-green-100 text-green-700',
  Absent: 'bg-red-100 text-red-700',
  Late: 'bg-orange-100 text-orange-700',
  'Half Day': 'bg-yellow-100 text-yellow-700',
  Leave: 'bg-blue-100 text-blue-700',
  Holiday: 'bg-purple-100 text-purple-700',
  Weekend: 'bg-gray-100 text-gray-600',
  Pending: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-600',
  Reimbursed: 'bg-teal-100 text-teal-700',
  Open: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-600',
  'On Hold': 'bg-yellow-100 text-yellow-700',
  Draft: 'bg-gray-100 text-gray-600',
  Processed: 'bg-blue-100 text-blue-700',
  Finalized: 'bg-green-100 text-green-700',
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
  { id: '1', name: 'Headquarters', city: 'New York' },
  { id: '2', name: 'West Coast Office', city: 'San Francisco' },
  { id: '3', name: 'South Office', city: 'Austin' },
];

export const SHIFTS = [
  { id: '1', name: 'Morning Shift', startTime: '09:00', endTime: '18:00' },
  { id: '2', name: 'Afternoon Shift', startTime: '14:00', endTime: '23:00' },
  { id: '3', name: 'Night Shift', startTime: '22:00', endTime: '07:00' },
  { id: '4', name: 'Flexible', startTime: '08:00', endTime: '17:00' },
];

export const LEAVE_TYPES = [
  { id: '1', name: 'Annual Leave', daysAllowed: 20, carryForward: true, color: '#0F8B8D' },
  { id: '2', name: 'Sick Leave', daysAllowed: 12, carryForward: false, color: '#ef4444' },
  { id: '3', name: 'Personal Leave', daysAllowed: 5, carryForward: false, color: '#f59e0b' },
  { id: '4', name: 'Maternity Leave', daysAllowed: 90, carryForward: false, color: '#ec4899' },
  { id: '5', name: 'Paternity Leave', daysAllowed: 15, carryForward: false, color: '#8b5cf6' },
  { id: '6', name: 'Unpaid Leave', daysAllowed: 30, carryForward: false, color: '#6b7280' },
];

export const EXPENSE_CATEGORIES = [
  'Travel', 'Meals', 'Office Supplies', 'Software', 'Equipment', 'Other'
];

export const MOCK_USERS: Array<{ email: string; password: string; name: string; role: UserRole; avatar: string }> = [
  { email: 'admin@codeqor.com', password: 'admin123', name: 'Alex Johnson', role: 'super_admin', avatar: 'AJ' },
  { email: 'hr@codeqor.com', password: 'hr123', name: 'Sarah Williams', role: 'hr_manager', avatar: 'SW' },
  { email: 'employee@codeqor.com', password: 'emp123', name: 'Michael Chen', role: 'employee', avatar: 'MC' },
];
