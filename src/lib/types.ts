export type UserRole = 'super_admin' | 'hr_manager' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  employeeId?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  city: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  department: string;
  designation: string;
  branch: string;
  reportingManager: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  joiningDate: string;
  probationEndDate?: string;
  confirmationDate?: string;
  status: 'Active' | 'Inactive' | 'On Notice' | 'Probation';
  shift: string;
  bankName?: string;
  bankAccount?: string;
  taxId?: string;
  salary?: number;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
}

export interface Designation {
  id: string;
  name: string;
  department: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend';
  workHours: number;
  overtime: number;
  notes?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  daysAllowed: number;
  carryForward: boolean;
  color: string;
}

export interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
  pending: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  appliedOn: string;
  approvedBy?: string;
  comments?: string;
}

export interface SalaryStructure {
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number;
  netSalary: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number;
  netSalary: number;
  status: 'Draft' | 'Processed' | 'Finalized';
  generatedOn: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  branch: string;
  vacancies: number;
  applicants: number;
  status: 'Open' | 'Closed' | 'On Hold';
  postedDate: string;
  closingDate: string;
  description: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Selected' | 'Rejected' | 'Offer' | 'Hired';
  appliedDate: string;
  resume?: string;
  notes?: string;
  rating?: number;
}

export interface PerformanceCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Upcoming';
}

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  dueDate: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  cycleId: string;
  cycleName: string;
  selfRating?: number;
  managerRating?: number;
  status: 'Pending Self Review' | 'Pending Manager Review' | 'Completed';
  comments?: string;
}

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
  receipt?: string;
  submittedOn: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  assignedTo?: string;
  assignedToName?: string;
  issueDate?: string;
  returnDate?: string;
  condition: 'New' | 'Good' | 'Fair' | 'Damaged';
  status: 'Available' | 'Assigned' | 'Returned' | 'Retired';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  module: string;
  action: string;
  record: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  roles: UserRole[];
  badge?: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  lateToday: number;
  pendingLeaveApprovals: number;
  pendingExpenseApprovals: number;
  openVacancies: number;
  newJoinersThisMonth: number;
  upcomingExits: number;
  payrollStatus: string;
}

export type DailyWorkStatus = 'Submitted' | 'Approved' | 'Needs Revision';

export interface DailyWork {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  date: string;
  fileData?: string;
  fileName?: string;
  link?: string;
  status: DailyWorkStatus;
  submittedOn: string;
}
