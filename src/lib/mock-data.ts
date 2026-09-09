import { Employee, AttendanceRecord, LeaveRequest, LeaveBalance, Payslip, Job, Candidate, ExpenseClaim, Notification, DashboardStats, PerformanceReview, Goal, Asset, AuditLog } from './types';

export const mockEmployees: Employee[] = [
  {
    id: '1', employeeCode: 'EMP001', firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@codeqor.com', phone: '+1-555-0101', avatar: 'MC',
    dateOfBirth: '1990-05-15', gender: 'Male', address: '123 Tech Street', city: 'New York', country: 'USA',
    emergencyContactName: 'Lisa Chen', emergencyContactPhone: '+1-555-0102',
    department: 'Engineering', designation: 'Senior Software Engineer', branch: 'Headquarters', reportingManager: 'David Kim',
    employmentType: 'Full-time', joiningDate: '2022-03-01', probationEndDate: '2022-09-01', confirmationDate: '2022-09-15', status: 'Active', shift: 'Morning Shift', salary: 95000,
  },
  {
    id: '2', employeeCode: 'EMP002', firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@codeqor.com', phone: '+1-555-0201', avatar: 'SW',
    dateOfBirth: '1988-09-22', gender: 'Female', address: '456 HR Lane', city: 'New York', country: 'USA',
    emergencyContactName: 'John Williams', emergencyContactPhone: '+1-555-0202',
    department: 'Human Resources', designation: 'HR Manager', branch: 'Headquarters', reportingManager: 'Alex Johnson',
    employmentType: 'Full-time', joiningDate: '2021-01-15', status: 'Active', shift: 'Morning Shift', salary: 85000,
  },
  {
    id: '3', employeeCode: 'EMP003', firstName: 'David', lastName: 'Kim', email: 'david.kim@codeqor.com', phone: '+1-555-0301', avatar: 'DK',
    dateOfBirth: '1985-12-10', gender: 'Male', address: '789 Lead Avenue', city: 'San Francisco', country: 'USA',
    emergencyContactName: 'Jenny Kim', emergencyContactPhone: '+1-555-0302',
    department: 'Engineering', designation: 'Engineering Manager', branch: 'West Coast Office', reportingManager: 'Alex Johnson',
    employmentType: 'Full-time', joiningDate: '2020-06-01', status: 'Active', shift: 'Flexible', salary: 120000,
  },
  {
    id: '4', employeeCode: 'EMP004', firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.rodriguez@codeqor.com', phone: '+1-555-0401', avatar: 'ER',
    dateOfBirth: '1992-07-08', gender: 'Female', address: '321 Design Blvd', city: 'New York', country: 'USA',
    emergencyContactName: 'Carlos Rodriguez', emergencyContactPhone: '+1-555-0402',
    department: 'Design', designation: 'Senior Designer', branch: 'Headquarters', reportingManager: 'Alex Johnson',
    employmentType: 'Full-time', joiningDate: '2022-09-15', status: 'Active', shift: 'Morning Shift', salary: 80000,
  },
  {
    id: '5', employeeCode: 'EMP005', firstName: 'James', lastName: 'Anderson', email: 'james.anderson@codeqor.com', phone: '+1-555-0501', avatar: 'JA',
    dateOfBirth: '1991-03-25', gender: 'Male', address: '654 Sales Road', city: 'Austin', country: 'USA',
    emergencyContactName: 'Mary Anderson', emergencyContactPhone: '+1-555-0502',
    department: 'Sales', designation: 'Sales Manager', branch: 'South Office', reportingManager: 'Alex Johnson',
    employmentType: 'Full-time', joiningDate: '2021-08-01', status: 'Active', shift: 'Morning Shift', salary: 90000,
  },
  {
    id: '6', employeeCode: 'EMP006', firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@codeqor.com', phone: '+1-555-0601', avatar: 'PS',
    dateOfBirth: '1994-11-30', gender: 'Female', address: '987 Market Way', city: 'New York', country: 'USA',
    emergencyContactName: 'Raj Sharma', emergencyContactPhone: '+1-555-0602',
    department: 'Marketing', designation: 'Marketing Executive', branch: 'Headquarters', reportingManager: 'Sarah Williams',
    employmentType: 'Full-time', joiningDate: '2023-02-01', status: 'Probation', shift: 'Morning Shift', salary: 60000,
  },
  {
    id: '7', employeeCode: 'EMP007', firstName: 'Robert', lastName: 'Taylor', email: 'robert.taylor@codeqor.com', phone: '+1-555-0701', avatar: 'RT',
    dateOfBirth: '1987-06-14', gender: 'Male', address: '147 Finance Street', city: 'New York', country: 'USA',
    emergencyContactName: 'Susan Taylor', emergencyContactPhone: '+1-555-0702',
    department: 'Finance', designation: 'Finance Manager', branch: 'Headquarters', reportingManager: 'Alex Johnson',
    employmentType: 'Full-time', joiningDate: '2019-04-01', status: 'Active', shift: 'Morning Shift', salary: 100000,
  },
  {
    id: '8', employeeCode: 'EMP008', firstName: 'Jessica', lastName: 'Lee', email: 'jessica.lee@codeqor.com', phone: '+1-555-0801', avatar: 'JL',
    dateOfBirth: '1993-01-20', gender: 'Female', address: '258 Product Lane', city: 'San Francisco', country: 'USA',
    emergencyContactName: 'Tom Lee', emergencyContactPhone: '+1-555-0802',
    department: 'Product', designation: 'Product Manager', branch: 'West Coast Office', reportingManager: 'David Kim',
    employmentType: 'Full-time', joiningDate: '2022-01-10', status: 'Active', shift: 'Flexible', salary: 105000,
  },
  {
    id: '9', employeeCode: 'EMP009', firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed.hassan@codeqor.com', phone: '+1-555-0901', avatar: 'AH',
    dateOfBirth: '1995-08-05', gender: 'Male', address: '369 Dev Court', city: 'Austin', country: 'USA',
    emergencyContactName: 'Fatima Hassan', emergencyContactPhone: '+1-555-0902',
    department: 'Engineering', designation: 'Software Engineer', branch: 'South Office', reportingManager: 'David Kim',
    employmentType: 'Full-time', joiningDate: '2023-06-15', status: 'Probation', shift: 'Morning Shift', salary: 75000,
  },
  {
    id: '10', employeeCode: 'EMP010', firstName: 'Olivia', lastName: 'Brown', email: 'olivia.brown@codeqor.com', phone: '+1-555-1001', avatar: 'OB',
    dateOfBirth: '1989-04-18', gender: 'Female', address: '741 Support Way', city: 'New York', country: 'USA',
    emergencyContactName: 'Mark Brown', emergencyContactPhone: '+1-555-1002',
    department: 'Customer Support', designation: 'Support Lead', branch: 'Headquarters', reportingManager: 'Sarah Williams',
    employmentType: 'Full-time', joiningDate: '2021-11-01', status: 'Active', shift: 'Afternoon Shift', salary: 65000,
  },
  {
    id: '11', employeeCode: 'EMP011', firstName: 'William', lastName: 'Martinez', email: 'william.martinez@codeqor.com', phone: '+1-555-1101', avatar: 'WM',
    dateOfBirth: '1996-02-28', gender: 'Male', address: '852 Ops Drive', city: 'New York', country: 'USA',
    emergencyContactName: 'Carmen Martinez', emergencyContactPhone: '+1-555-1102',
    department: 'Operations', designation: 'Operations Coordinator', branch: 'Headquarters', reportingManager: 'Alex Johnson',
    employmentType: 'Full-time', joiningDate: '2023-09-01', status: 'Active', shift: 'Morning Shift', salary: 55000,
  },
  {
    id: '12', employeeCode: 'EMP012', firstName: 'Sophia', lastName: 'Davis', email: 'sophia.davis@codeqor.com', phone: '+1-555-1201', avatar: 'SD',
    dateOfBirth: '1990-10-12', gender: 'Female', address: '963 Legal Lane', city: 'New York', country: 'USA',
    emergencyContactName: 'Richard Davis', emergencyContactPhone: '+1-555-1202',
    department: 'Legal', designation: 'Legal Counsel', branch: 'Headquarters', reportingManager: 'Alex Johnson',
    employmentType: 'Full-time', joiningDate: '2020-02-15', status: 'Active', shift: 'Morning Shift', salary: 110000,
  },
  {
    id: '13', employeeCode: 'EMP013', firstName: 'Daniel', lastName: 'Wilson', email: 'daniel.wilson@codeqor.com', phone: '+1-555-1301', avatar: 'DW',
    dateOfBirth: '1993-07-07', gender: 'Male', address: '159 Recruit Road', city: 'New York', country: 'USA',
    emergencyContactName: 'Grace Wilson', emergencyContactPhone: '+1-555-1302',
    department: 'Human Resources', designation: 'Recruiter', branch: 'Headquarters', reportingManager: 'Sarah Williams',
    employmentType: 'Full-time', joiningDate: '2022-05-01', status: 'Active', shift: 'Morning Shift', salary: 58000,
  },
  {
    id: '14', employeeCode: 'EMP014', firstName: 'Emma', lastName: 'Garcia', email: 'emma.garcia@codeqor.com', phone: '+1-555-1401', avatar: 'EG',
    dateOfBirth: '1997-12-03', gender: 'Female', address: '753 Intern Ave', city: 'San Francisco', country: 'USA',
    emergencyContactName: 'Maria Garcia', emergencyContactPhone: '+1-555-1402',
    department: 'Engineering', designation: 'Software Engineer', branch: 'West Coast Office', reportingManager: 'David Kim',
    employmentType: 'Intern', joiningDate: '2024-01-08', status: 'Probation', shift: 'Flexible', salary: 45000,
  },
  {
    id: '15', employeeCode: 'EMP015', firstName: 'Alex', lastName: 'Johnson', email: 'admin@codeqor.com', phone: '+1-555-1501', avatar: 'AJ',
    dateOfBirth: '1983-09-01', gender: 'Male', address: '100 Admin Plaza', city: 'New York', country: 'USA',
    emergencyContactName: 'Linda Johnson', emergencyContactPhone: '+1-555-1502',
    department: 'Operations', designation: 'CEO', branch: 'Headquarters', reportingManager: '-',
    employmentType: 'Full-time', joiningDate: '2018-01-01', status: 'Active', shift: 'Flexible', salary: 180000,
  },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: '1', employeeId: '1', employeeName: 'Michael Chen', date: '2024-01-08', checkIn: '09:02', checkOut: '18:15', status: 'Present', workHours: 9.2, overtime: 0.2 },
  { id: '2', employeeId: '2', employeeName: 'Sarah Williams', date: '2024-01-08', checkIn: '08:55', checkOut: '18:00', status: 'Present', workHours: 9.1, overtime: 0 },
  { id: '3', employeeId: '3', employeeName: 'David Kim', date: '2024-01-08', checkIn: '09:35', checkOut: '18:30', status: 'Late', workHours: 8.9, overtime: 0 },
  { id: '4', employeeId: '4', employeeName: 'Emily Rodriguez', date: '2024-01-08', checkIn: '09:00', checkOut: '13:00', status: 'Half Day', workHours: 4, overtime: 0 },
  { id: '5', employeeId: '5', employeeName: 'James Anderson', date: '2024-01-08', checkIn: '', checkOut: '', status: 'Leave', workHours: 0, overtime: 0 },
  { id: '6', employeeId: '6', employeeName: 'Priya Sharma', date: '2024-01-08', checkIn: '08:50', checkOut: '18:10', status: 'Present', workHours: 9.3, overtime: 0.3 },
  { id: '7', employeeId: '7', employeeName: 'Robert Taylor', date: '2024-01-08', checkIn: '09:00', checkOut: '18:00', status: 'Present', workHours: 9, overtime: 0 },
  { id: '8', employeeId: '8', employeeName: 'Jessica Lee', date: '2024-01-08', checkIn: '', checkOut: '', status: 'Absent', workHours: 0, overtime: 0 },
  { id: '9', employeeId: '9', employeeName: 'Ahmed Hassan', date: '2024-01-08', checkIn: '09:10', checkOut: '18:20', status: 'Present', workHours: 9.2, overtime: 0.2 },
  { id: '10', employeeId: '10', employeeName: 'Olivia Brown', date: '2024-01-08', checkIn: '14:00', checkOut: '23:00', status: 'Present', workHours: 9, overtime: 0 },
  { id: '11', employeeId: '11', employeeName: 'William Martinez', date: '2024-01-08', checkIn: '09:00', checkOut: '18:00', status: 'Present', workHours: 9, overtime: 0 },
  { id: '12', employeeId: '12', employeeName: 'Sophia Davis', date: '2024-01-08', checkIn: '08:45', checkOut: '17:45', status: 'Present', workHours: 9, overtime: 0 },
];

export const mockLeaveRequests: LeaveRequest[] = [
  { id: '1', employeeId: '5', employeeName: 'James Anderson', leaveType: 'Annual Leave', startDate: '2024-01-08', endDate: '2024-01-12', days: 5, reason: 'Family vacation', status: 'Approved', appliedOn: '2024-01-02', approvedBy: 'Sarah Williams' },
  { id: '2', employeeId: '1', employeeName: 'Michael Chen', leaveType: 'Sick Leave', startDate: '2024-01-15', endDate: '2024-01-16', days: 2, reason: 'Not feeling well', status: 'Pending', appliedOn: '2024-01-08' },
  { id: '3', employeeId: '4', employeeName: 'Emily Rodriguez', leaveType: 'Personal Leave', startDate: '2024-01-22', endDate: '2024-01-22', days: 1, reason: 'Personal appointment', status: 'Pending', appliedOn: '2024-01-08' },
  { id: '4', employeeId: '9', employeeName: 'Ahmed Hassan', leaveType: 'Annual Leave', startDate: '2024-01-25', endDate: '2024-01-30', days: 4, reason: 'Travel plans', status: 'Pending', appliedOn: '2024-01-07' },
  { id: '5', employeeId: '6', employeeName: 'Priya Sharma', leaveType: 'Sick Leave', startDate: '2024-01-03', endDate: '2024-01-03', days: 1, reason: 'Medical checkup', status: 'Approved', appliedOn: '2024-01-02', approvedBy: 'Sarah Williams' },
  { id: '6', employeeId: '10', employeeName: 'Olivia Brown', leaveType: 'Annual Leave', startDate: '2024-02-01', endDate: '2024-02-05', days: 5, reason: 'Personal trip', status: 'Rejected', appliedOn: '2024-01-05', comments: 'Team understaffed during that period' },
];

export const mockLeaveBalances: LeaveBalance[] = [
  { leaveType: 'Annual Leave', total: 20, used: 8, remaining: 12, pending: 0 },
  { leaveType: 'Sick Leave', total: 12, used: 3, remaining: 9, pending: 2 },
  { leaveType: 'Personal Leave', total: 5, used: 1, remaining: 4, pending: 1 },
  { leaveType: 'Unpaid Leave', total: 30, used: 0, remaining: 30, pending: 0 },
];

export const mockPayslips: Payslip[] = [
  {
    id: '1', employeeId: '1', employeeName: 'Michael Chen', month: 'December', year: 2023,
    basicSalary: 7917, allowances: [{ name: 'Housing', amount: 1500 }, { name: 'Transport', amount: 500 }, { name: 'Meal', amount: 300 }],
    deductions: [{ name: 'Tax', amount: 1580 }, { name: 'Health Insurance', amount: 250 }, { name: 'Retirement Fund', amount: 475 }],
    grossSalary: 10217, netSalary: 7912, status: 'Finalized', generatedOn: '2024-01-01',
  },
  {
    id: '2', employeeId: '1', employeeName: 'Michael Chen', month: 'November', year: 2023,
    basicSalary: 7917, allowances: [{ name: 'Housing', amount: 1500 }, { name: 'Transport', amount: 500 }, { name: 'Meal', amount: 300 }],
    deductions: [{ name: 'Tax', amount: 1580 }, { name: 'Health Insurance', amount: 250 }, { name: 'Retirement Fund', amount: 475 }],
    grossSalary: 10217, netSalary: 7912, status: 'Finalized', generatedOn: '2023-12-01',
  },
  {
    id: '3', employeeId: '1', employeeName: 'Michael Chen', month: 'October', year: 2023,
    basicSalary: 7917, allowances: [{ name: 'Housing', amount: 1500 }, { name: 'Transport', amount: 500 }, { name: 'Meal', amount: 300 }],
    deductions: [{ name: 'Tax', amount: 1580 }, { name: 'Health Insurance', amount: 250 }, { name: 'Retirement Fund', amount: 475 }],
    grossSalary: 10217, netSalary: 7912, status: 'Finalized', generatedOn: '2023-11-01',
  },
];

export const mockJobs: Job[] = [
  { id: '1', title: 'Senior Frontend Developer', department: 'Engineering', branch: 'Headquarters', vacancies: 2, applicants: 15, status: 'Open', postedDate: '2024-01-02', closingDate: '2024-02-02', description: 'Looking for an experienced frontend developer with React/Next.js expertise.' },
  { id: '2', title: 'Marketing Specialist', department: 'Marketing', branch: 'Headquarters', vacancies: 1, applicants: 8, status: 'Open', postedDate: '2024-01-05', closingDate: '2024-02-05', description: 'Digital marketing specialist with social media expertise.' },
  { id: '3', title: 'DevOps Engineer', department: 'Engineering', branch: 'West Coast Office', vacancies: 1, applicants: 12, status: 'Open', postedDate: '2023-12-20', closingDate: '2024-01-31', description: 'DevOps engineer with cloud infrastructure experience.' },
  { id: '4', title: 'Sales Executive', department: 'Sales', branch: 'South Office', vacancies: 3, applicants: 20, status: 'On Hold', postedDate: '2023-12-15', closingDate: '2024-01-30', description: 'Sales executive with B2B experience.' },
];

export const mockCandidates: Candidate[] = [
  { id: '1', name: 'John Smith', email: 'john.smith@email.com', phone: '+1-555-9001', jobId: '1', jobTitle: 'Senior Frontend Developer', stage: 'Interview', appliedDate: '2024-01-03', rating: 4 },
  { id: '2', name: 'Anna Wilson', email: 'anna.w@email.com', phone: '+1-555-9002', jobId: '1', jobTitle: 'Senior Frontend Developer', stage: 'Screening', appliedDate: '2024-01-05', rating: 3 },
  { id: '3', name: 'Carlos Mendez', email: 'carlos.m@email.com', phone: '+1-555-9003', jobId: '2', jobTitle: 'Marketing Specialist', stage: 'Applied', appliedDate: '2024-01-06' },
  { id: '4', name: 'Lisa Park', email: 'lisa.park@email.com', phone: '+1-555-9004', jobId: '1', jobTitle: 'Senior Frontend Developer', stage: 'Selected', appliedDate: '2024-01-02', rating: 5 },
  { id: '5', name: 'Mark Johnson', email: 'mark.j@email.com', phone: '+1-555-9005', jobId: '3', jobTitle: 'DevOps Engineer', stage: 'Interview', appliedDate: '2023-12-22', rating: 4 },
  { id: '6', name: 'Rachel Green', email: 'rachel.g@email.com', phone: '+1-555-9006', jobId: '1', jobTitle: 'Senior Frontend Developer', stage: 'Rejected', appliedDate: '2024-01-03', rating: 2 },
];

export const mockExpenses: ExpenseClaim[] = [
  { id: '1', employeeId: '1', employeeName: 'Michael Chen', category: 'Travel', amount: 450, date: '2024-01-05', description: 'Client meeting travel', status: 'Pending', submittedOn: '2024-01-06' },
  { id: '2', employeeId: '5', employeeName: 'James Anderson', category: 'Meals', amount: 85, date: '2024-01-04', description: 'Client dinner', status: 'Approved', submittedOn: '2024-01-05' },
  { id: '3', employeeId: '3', employeeName: 'David Kim', category: 'Software', amount: 199, date: '2024-01-03', description: 'IDE license renewal', status: 'Approved', submittedOn: '2024-01-04' },
  { id: '4', employeeId: '8', employeeName: 'Jessica Lee', category: 'Training', amount: 599, date: '2024-01-07', description: 'Online course subscription', status: 'Pending', submittedOn: '2024-01-08' },
  { id: '5', employeeId: '4', employeeName: 'Emily Rodriguez', category: 'Equipment', amount: 120, date: '2024-01-02', description: 'Ergonomic mouse', status: 'Reimbursed', submittedOn: '2024-01-03' },
];

export const mockNotifications: Notification[] = [
  { id: '1', title: 'Leave Request', message: 'Michael Chen has requested sick leave for Jan 15-16.', type: 'info', read: false, createdAt: '2024-01-08T09:30:00', link: '/leave' },
  { id: '2', title: 'Leave Request', message: 'Emily Rodriguez has requested personal leave for Jan 22.', type: 'info', read: false, createdAt: '2024-01-08T09:15:00', link: '/leave' },
  { id: '3', title: 'Expense Submitted', message: 'Jessica Lee submitted an expense claim of $599.', type: 'info', read: false, createdAt: '2024-01-08T08:45:00', link: '/expenses' },
  { id: '4', title: 'Document Expiry', message: 'Priya Sharma\'s work permit expires in 30 days.', type: 'warning', read: false, createdAt: '2024-01-08T08:00:00', link: '/documents' },
  { id: '5', title: 'Birthday', message: 'Ahmed Hassan\'s birthday is tomorrow!', type: 'success', read: true, createdAt: '2024-01-07T18:00:00' },
  { id: '6', title: 'Payslip Generated', message: 'December 2023 payslips have been generated.', type: 'success', read: true, createdAt: '2024-01-01T10:00:00', link: '/payroll' },
  { id: '7', title: 'Leave Approved', message: 'Your annual leave request (Jan 8-12) has been approved.', type: 'success', read: true, createdAt: '2024-01-03T14:00:00', link: '/leave' },
];

export const mockPerformanceReviews: PerformanceReview[] = [
  { id: '1', employeeId: '1', employeeName: 'Michael Chen', cycleId: '1', cycleName: 'H2 2023', selfRating: 4, managerRating: 4, status: 'Completed', comments: 'Excellent technical contributions.' },
  { id: '2', employeeId: '4', employeeName: 'Emily Rodriguez', cycleId: '1', cycleName: 'H2 2023', selfRating: 4, status: 'Pending Manager Review', comments: 'Led design system overhaul.' },
  { id: '3', employeeId: '9', employeeName: 'Ahmed Hassan', cycleId: '1', cycleName: 'H2 2023', status: 'Pending Self Review' },
  { id: '4', employeeId: '6', employeeName: 'Priya Sharma', cycleId: '1', cycleName: 'H2 2023', selfRating: 3, managerRating: 3, status: 'Completed', comments: 'Good progress, needs more initiative.' },
];

export const mockGoals: Goal[] = [
  { id: '1', employeeId: '1', title: 'Complete API migration', description: 'Migrate legacy REST APIs to GraphQL', progress: 75, status: 'In Progress', dueDate: '2024-03-31' },
  { id: '2', employeeId: '1', title: 'Mentor junior developers', description: 'Conduct weekly code reviews and knowledge sharing', progress: 60, status: 'In Progress', dueDate: '2024-06-30' },
  { id: '3', employeeId: '1', title: 'AWS certification', description: 'Complete AWS Solutions Architect certification', progress: 30, status: 'In Progress', dueDate: '2024-04-30' },
];

export const mockAssets: Asset[] = [
  { id: '1', name: 'MacBook Pro 16"', type: 'Laptop', serialNumber: 'MBP-2023-001', assignedTo: '1', assignedToName: 'Michael Chen', issueDate: '2022-03-01', condition: 'Good', status: 'Assigned' },
  { id: '2', name: 'Dell Monitor 27"', type: 'Monitor', serialNumber: 'DM-2023-002', assignedTo: '1', assignedToName: 'Michael Chen', issueDate: '2022-03-01', condition: 'Good', status: 'Assigned' },
  { id: '3', name: 'iPhone 15 Pro', type: 'Phone', serialNumber: 'IP-2023-003', assignedTo: '3', assignedToName: 'David Kim', issueDate: '2023-10-01', condition: 'New', status: 'Assigned' },
  { id: '4', name: 'ThinkPad X1 Carbon', type: 'Laptop', serialNumber: 'TP-2023-004', condition: 'Good', status: 'Available' },
  { id: '5', name: 'Logitech MX Keys', type: 'Keyboard', serialNumber: 'LG-2023-005', assignedTo: '4', assignedToName: 'Emily Rodriguez', issueDate: '2022-09-15', condition: 'Good', status: 'Assigned' },
];

export const mockDashboardStats: DashboardStats = {
  totalEmployees: 15,
  activeEmployees: 12,
  presentToday: 9,
  absentToday: 1,
  onLeaveToday: 2,
  lateToday: 1,
  pendingLeaveApprovals: 3,
  pendingExpenseApprovals: 2,
  openVacancies: 7,
  newJoinersThisMonth: 1,
  upcomingExits: 0,
  payrollStatus: 'Processed',
};

export const mockAuditLogs: AuditLog[] = [
  { id: '1', userId: '2', userName: 'Sarah Williams', module: 'Leave', action: 'Approved', record: 'LR-001', previousValue: 'Pending', newValue: 'Approved', timestamp: '2024-01-08T10:30:00' },
  { id: '2', userId: '15', userName: 'Alex Johnson', module: 'Employee', action: 'Created', record: 'EMP014', timestamp: '2024-01-08T09:00:00' },
  { id: '3', userId: '2', userName: 'Sarah Williams', module: 'Payroll', action: 'Finalized', record: 'PR-DEC-2023', timestamp: '2024-01-01T15:00:00' },
  { id: '4', userId: '15', userName: 'Alex Johnson', module: 'Settings', action: 'Updated', record: 'Company Info', previousValue: 'Old address', newValue: 'New address', timestamp: '2023-12-28T11:00:00' },
];
