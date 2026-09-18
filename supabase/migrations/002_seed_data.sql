-- HRMS Seed Data for Supabase
-- Run this AFTER 001_initial_schema.sql in Supabase SQL Editor
-- NOTE: This temporarily disables the auto leave-balance trigger so we can
-- insert explicit balances, then re-enables it.

-- =====================================================
-- BRANCHES
-- =====================================================
insert into public.branches (id, name, address, city) values
  ('11111111-1111-1111-1111-111111111111', 'Mumtaz Market', '100 Main Plaza', 'New York'),
  ('22222222-2222-2222-2222-222222222222', 'San Francisco Office', '200 Bay Street', 'San Francisco'),
  ('33333333-3333-3333-3333-333333333333', 'Austin Office', '300 Tech Road', 'Austin')
on conflict (id) do nothing;

-- =====================================================
-- DEPARTMENTS
-- =====================================================
insert into public.departments (id, name) values
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Engineering'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Human Resources'),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Design'),
  ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Sales'),
  ('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'Marketing'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'Finance'),
  ('a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', 'Product'),
  ('b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8', 'Customer Support'),
  ('c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9', 'Operations'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Legal')
on conflict (id) do nothing;

-- =====================================================
-- DESIGNATIONS
-- =====================================================
insert into public.designations (id, name, department_id) values
  ('dd000001-0000-0000-0000-000000000001', 'Senior Software Engineer', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('dd000002-0000-0000-0000-000000000002', 'Engineering Manager', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('dd000003-0000-0000-0000-000000000003', 'Software Engineer', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('dd000004-0000-0000-0000-000000000004', 'HR Manager', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'),
  ('dd000005-0000-0000-0000-000000000005', 'Recruiter', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'),
  ('dd000006-0000-0000-0000-000000000006', 'Senior Designer', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3'),
  ('dd000007-0000-0000-0000-000000000007', 'Sales Manager', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4'),
  ('dd000008-0000-0000-0000-000000000008', 'Marketing Executive', 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5'),
  ('dd000009-0000-0000-0000-000000000009', 'Finance Manager', 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6'),
  ('dd000010-0000-0000-0000-000000000010', 'Product Manager', 'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7'),
  ('dd000011-0000-0000-0000-000000000011', 'Support Lead', 'b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8'),
  ('dd000012-0000-0000-0000-000000000012', 'Operations Coordinator', 'c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9'),
  ('dd000013-0000-0000-0000-000000000013', 'Legal Counsel', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0'),
  ('dd000014-0000-0000-0000-000000000014', 'CEO', 'c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9')
on conflict (id) do nothing;

-- =====================================================
-- SHIFTS
-- =====================================================
insert into public.shifts (id, name, start_time, end_time) values
  ('5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f', 'Morning Shift', '09:00', '18:00'),
  ('6a6a6a6a-6a6a-6a6a-6a6a-6a6a6a6a6a6a', 'Afternoon Shift', '14:00', '23:00'),
  ('7b7b7b7b-7b7b-7b7b-7b7b-7b7b7b7b7b7b', 'Flexible', null, null)
on conflict (id) do nothing;

-- =====================================================
-- LEAVE TYPES
-- =====================================================
insert into public.leave_types (id, name, days_allowed, carry_forward, color, period, description) values
  ('11e11e11-1e11-1e11-1e11-1e11e11e11e1', 'Monthly Leave', 2, false, '#024fa7', 'month', 'Paid short leaves · resets every month'),
  ('22e22e22-2e22-2e22-2e22-2e22e22e22e2', 'Annual Leave', 20, true, '#024fa7', 'year', 'Planned vacations & long leaves'),
  ('33e33e33-3e33-3e33-3e33-3e33e33e33e3', 'Maternity Leave', 90, false, '#ec4899', 'year', 'Statutory maternity benefit'),
  ('44e44e44-4e44-4e44-4e44-4e44e44e44e4', 'Paternity Leave', 15, false, '#8b5cf6', 'year', 'Statutory paternity benefit')
on conflict (id) do nothing;

-- =====================================================
-- EMPLOYEES (managers first so reporting lines resolve)
-- =====================================================
-- Disable auto-balance trigger during seeding; we insert explicit balances below
alter table public.employees disable trigger employee_after_insert;

insert into public.employees (
  id, employee_code, first_name, last_name, email, phone, avatar,
  date_of_birth, gender, address, city, country,
  emergency_contact_name, emergency_contact_phone,
  department_id, designation_id, branch_id, shift_id, reporting_manager_id,
  employment_type, joining_date, status, salary
) values
  -- CEO (no manager)
  ('e0000000-0000-0000-0000-000000000015', 'EMP015', 'Alex', 'Johnson', 'admin@codqor.com', '+1-555-1501', 'AJ',
   '1983-09-01', 'Male', '100 Admin Plaza', 'New York', 'USA', 'Linda Johnson', '+1-555-1502',
   'c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9', 'dd000014-0000-0000-0000-000000000014',
   '11111111-1111-1111-1111-111111111111', '7b7b7b7b-7b7b-7b7b-7b7b-7b7b7b7b7b7b', null,
   'Full-time', '2018-01-01', 'Active', 180000),

  -- Engineering Manager (reports to CEO)
  ('e0000000-0000-0000-0000-000000000003', 'EMP003', 'David', 'Kim', 'david.kim@codqor.com', '+1-555-0301', 'DK',
   '1985-12-10', 'Male', '789 Lead Avenue', 'San Francisco', 'USA', 'Jenny Kim', '+1-555-0302',
   'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'dd000002-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111', '7b7b7b7b-7b7b-7b7b-7b7b-7b7b7b7b7b7b',
   'e0000000-0000-0000-0000-000000000015',
   'Full-time', '2020-06-01', 'Active', 120000),

  -- HR Manager (reports to CEO)
  ('e0000000-0000-0000-0000-000000000002', 'EMP002', 'Sarah', 'Williams', 'sarah.williams@codqor.com', '+1-555-0201', 'SW',
   '1988-09-22', 'Female', '456 HR Lane', 'New York', 'USA', 'John Williams', '+1-555-0202',
   'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'dd000004-0000-0000-0000-000000000004',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000015',
   'Full-time', '2021-01-15', 'Active', 85000),

  -- Senior Software Engineer (reports to David Kim)
  ('e0000000-0000-0000-0000-000000000001', 'EMP001', 'Michael', 'Chen', 'michael.chen@codqor.com', '+1-555-0101', 'MC',
   '1990-05-15', 'Male', '123 Tech Street', 'New York', 'USA', 'Lisa Chen', '+1-555-0102',
   'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'dd000001-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000003',
   'Full-time', '2022-03-01', 'Active', 95000),

  -- Senior Designer (reports to CEO)
  ('e0000000-0000-0000-0000-000000000004', 'EMP004', 'Emily', 'Rodriguez', 'emily.rodriguez@codqor.com', '+1-555-0401', 'ER',
   '1992-07-08', 'Female', '321 Design Blvd', 'New York', 'USA', 'Carlos Rodriguez', '+1-555-0402',
   'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'dd000006-0000-0000-0000-000000000006',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000015',
   'Full-time', '2022-09-15', 'Active', 80000),

  -- Sales Manager (reports to CEO)
  ('e0000000-0000-0000-0000-000000000005', 'EMP005', 'James', 'Anderson', 'james.anderson@codqor.com', '+1-555-0501', 'JA',
   '1991-03-25', 'Male', '654 Sales Road', 'Austin', 'USA', 'Mary Anderson', '+1-555-0502',
   'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'dd000007-0000-0000-0000-000000000007',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000015',
   'Full-time', '2021-08-01', 'Active', 90000),

  -- Marketing Executive (reports to Sarah Williams)
  ('e0000000-0000-0000-0000-000000000006', 'EMP006', 'Priya', 'Sharma', 'priya.sharma@codqor.com', '+1-555-0601', 'PS',
   '1994-11-30', 'Female', '987 Market Way', 'New York', 'USA', 'Raj Sharma', '+1-555-0602',
   'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'dd000008-0000-0000-0000-000000000008',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000002',
   'Full-time', '2023-02-01', 'Probation', 60000),

  -- Finance Manager (reports to CEO)
  ('e0000000-0000-0000-0000-000000000007', 'EMP007', 'Robert', 'Taylor', 'robert.taylor@codqor.com', '+1-555-0701', 'RT',
   '1987-06-14', 'Male', '147 Finance Street', 'New York', 'USA', 'Susan Taylor', '+1-555-0702',
   'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'dd000009-0000-0000-0000-000000000009',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000015',
   'Full-time', '2019-04-01', 'Active', 100000),

  -- Product Manager (reports to David Kim)
  ('e0000000-0000-0000-0000-000000000008', 'EMP008', 'Jessica', 'Lee', 'jessica.lee@codqor.com', '+1-555-0801', 'JL',
   '1993-01-20', 'Female', '258 Product Lane', 'San Francisco', 'USA', 'Tom Lee', '+1-555-0802',
   'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', 'dd000010-0000-0000-0000-000000000010',
   '11111111-1111-1111-1111-111111111111', '7b7b7b7b-7b7b-7b7b-7b7b-7b7b7b7b7b7b',
   'e0000000-0000-0000-0000-000000000003',
   'Full-time', '2022-01-10', 'Active', 105000),

  -- Software Engineer (reports to David Kim)
  ('e0000000-0000-0000-0000-000000000009', 'EMP009', 'Ahmed', 'Hassan', 'ahmed.hassan@codqor.com', '+1-555-0901', 'AH',
   '1995-08-05', 'Male', '369 Dev Court', 'Austin', 'USA', 'Fatima Hassan', '+1-555-0902',
   'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'dd000003-0000-0000-0000-000000000003',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000003',
   'Full-time', '2023-06-15', 'Probation', 75000),

  -- Support Lead (reports to Sarah Williams)
  ('e0000000-0000-0000-0000-000000000010', 'EMP010', 'Olivia', 'Brown', 'olivia.brown@codqor.com', '+1-555-1001', 'OB',
   '1989-04-18', 'Female', '741 Support Way', 'New York', 'USA', 'Mark Brown', '+1-555-1002',
   'b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8', 'dd000011-0000-0000-0000-000000000011',
   '11111111-1111-1111-1111-111111111111', '6a6a6a6a-6a6a-6a6a-6a6a-6a6a6a6a6a6a',
   'e0000000-0000-0000-0000-000000000002',
   'Full-time', '2021-11-01', 'Active', 65000),

  -- Operations Coordinator (reports to CEO)
  ('e0000000-0000-0000-0000-000000000011', 'EMP011', 'William', 'Martinez', 'william.martinez@codqor.com', '+1-555-1101', 'WM',
   '1996-02-28', 'Male', '852 Ops Drive', 'New York', 'USA', 'Carmen Martinez', '+1-555-1102',
   'c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9', 'dd000012-0000-0000-0000-000000000012',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000015',
   'Full-time', '2023-09-01', 'Active', 55000),

  -- Legal Counsel (reports to CEO)
  ('e0000000-0000-0000-0000-000000000012', 'EMP012', 'Sophia', 'Davis', 'sophia.davis@codqor.com', '+1-555-1201', 'SD',
   '1990-10-12', 'Female', '963 Legal Lane', 'New York', 'USA', 'Richard Davis', '+1-555-1202',
   'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'dd000013-0000-0000-0000-000000000013',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000015',
   'Full-time', '2020-02-15', 'Active', 110000),

  -- Recruiter (reports to Sarah Williams)
  ('e0000000-0000-0000-0000-000000000013', 'EMP013', 'Daniel', 'Wilson', 'daniel.wilson@codqor.com', '+1-555-1301', 'DW',
   '1993-07-07', 'Male', '159 Recruit Road', 'New York', 'USA', 'Grace Wilson', '+1-555-1302',
   'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'dd000005-0000-0000-0000-000000000005',
   '11111111-1111-1111-1111-111111111111', '5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f',
   'e0000000-0000-0000-0000-000000000002',
   'Full-time', '2022-05-01', 'Active', 58000),

  -- Intern (reports to David Kim)
  ('e0000000-0000-0000-0000-000000000014', 'EMP014', 'Emma', 'Garcia', 'emma.garcia@codqor.com', '+1-555-1401', 'EG',
   '1997-12-03', 'Female', '753 Intern Ave', 'San Francisco', 'USA', 'Maria Garcia', '+1-555-1402',
   'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'dd000003-0000-0000-0000-000000000003',
   '11111111-1111-1111-1111-111111111111', '7b7b7b7b-7b7b-7b7b-7b7b-7b7b7b7b7b7b',
   'e0000000-0000-0000-0000-000000000003',
   'Intern', '2024-01-08', 'Probation', 45000)
on conflict (id) do nothing;

-- Re-enable auto-balance trigger for future inserts
alter table public.employees enable trigger employee_after_insert;

-- =====================================================
-- LEAVE BALANCES (explicit seed; matches old mock)
-- =====================================================
insert into public.leave_balances (employee_id, leave_type_id, year, total, used, remaining, pending)
select e.id, lt.id, 2024,
  case lt.name
    when 'Monthly Leave' then 2
    when 'Annual Leave' then 20
    when 'Maternity Leave' then 90
    when 'Paternity Leave' then 15
  end,
  case lt.name
    when 'Monthly Leave' then 1
    when 'Annual Leave' then 8
    else 0
  end,
  case lt.name
    when 'Monthly Leave' then 1
    when 'Annual Leave' then 12
    when 'Maternity Leave' then 90
    when 'Paternity Leave' then 15
  end,
  case lt.name
    when 'Monthly Leave' then 2
    when 'Annual Leave' then 4
    else 0
  end
from public.employees e
cross join public.leave_types lt
on conflict (employee_id, leave_type_id, year) do nothing;

-- =====================================================
-- ATTENDANCE (sample day)
-- =====================================================
insert into public.attendance (employee_id, date, check_in, check_out, status, work_hours, overtime) values
  ('e0000000-0000-0000-0000-000000000001', '2024-01-08', '09:02', '18:15', 'Present', 9.2, 0.2),
  ('e0000000-0000-0000-0000-000000000002', '2024-01-08', '08:55', '18:00', 'Present', 9.1, 0),
  ('e0000000-0000-0000-0000-000000000003', '2024-01-08', '09:35', '18:30', 'Late', 8.9, 0),
  ('e0000000-0000-0000-0000-000000000004', '2024-01-08', '09:00', '13:00', 'Half Day', 4, 0),
  ('e0000000-0000-0000-0000-000000000005', '2024-01-08', null, null, 'Leave', 0, 0),
  ('e0000000-0000-0000-0000-000000000006', '2024-01-08', '08:50', '18:10', 'Present', 9.3, 0.3),
  ('e0000000-0000-0000-0000-000000000007', '2024-01-08', '09:00', '18:00', 'Present', 9, 0),
  ('e0000000-0000-0000-0000-000000000008', '2024-01-08', null, null, 'Absent', 0, 0),
  ('e0000000-0000-0000-0000-000000000009', '2024-01-08', '09:10', '18:20', 'Present', 9.2, 0.2),
  ('e0000000-0000-0000-0000-000000000010', '2024-01-08', '14:00', '23:00', 'Present', 9, 0),
  ('e0000000-0000-0000-0000-000000000011', '2024-01-08', '09:00', '18:00', 'Present', 9, 0),
  ('e0000000-0000-0000-0000-000000000012', '2024-01-08', '08:45', '17:45', 'Present', 9, 0)
on conflict (employee_id, date) do nothing;

-- =====================================================
-- LEAVE REQUESTS
-- =====================================================
insert into public.leave_requests (employee_id, leave_type_id, start_date, end_date, days, reason, status, applied_on, approved_by, comments) values
  ('e0000000-0000-0000-0000-000000000005', '22e22e22-2e22-2e22-2e22-2e22e22e22e2', '2024-01-08', '2024-01-12', 5, 'Family vacation', 'Approved', '2024-01-02', 'e0000000-0000-0000-0000-000000000002', null),
  ('e0000000-0000-0000-0000-000000000001', '11e11e11-1e11-1e11-1e11-1e11e11e11e1', '2024-01-15', '2024-01-16', 2, 'Not feeling well', 'Pending', '2024-01-08', null, null),
  ('e0000000-0000-0000-0000-000000000004', '11e11e11-1e11-1e11-1e11-1e11e11e11e1', '2024-01-22', '2024-01-22', 1, 'Personal appointment', 'Pending', '2024-01-08', null, null),
  ('e0000000-0000-0000-0000-000000000009', '22e22e22-2e22-2e22-2e22-2e22e22e22e2', '2024-01-25', '2024-01-30', 4, 'Travel plans', 'Pending', '2024-01-07', null, null),
  ('e0000000-0000-0000-0000-000000000006', '11e11e11-1e11-1e11-1e11-1e11e11e11e1', '2024-01-03', '2024-01-03', 1, 'Medical checkup', 'Approved', '2024-01-02', 'e0000000-0000-0000-0000-000000000002', null),
  ('e0000000-0000-0000-0000-000000000010', '22e22e22-2e22-2e22-2e22-2e22e22e22e2', '2024-02-01', '2024-02-05', 5, 'Personal trip', 'Rejected', '2024-01-05', null, 'Team understaffed during that period');

-- =====================================================
-- EXPENSE CLAIMS
-- =====================================================
insert into public.expense_claims (employee_id, category, amount, date, description, status, submitted_on) values
  ('e0000000-0000-0000-0000-000000000001', 'Travel', 450, '2024-01-05', 'Client meeting travel', 'Pending', '2024-01-06'),
  ('e0000000-0000-0000-0000-000000000005', 'Meals', 85, '2024-01-04', 'Client dinner', 'Approved', '2024-01-05'),
  ('e0000000-0000-0000-0000-000000000003', 'Software', 199, '2024-01-03', 'IDE license renewal', 'Approved', '2024-01-04'),
  ('e0000000-0000-0000-0000-000000000008', 'Training', 599, '2024-01-07', 'Online course subscription', 'Pending', '2024-01-08'),
  ('e0000000-0000-0000-0000-000000000004', 'Equipment', 120, '2024-01-02', 'Ergonomic mouse', 'Reimbursed', '2024-01-03');

-- =====================================================
-- JOBS & CANDIDATES
-- =====================================================
insert into public.jobs (title, department_id, branch_id, vacancies, applicants, status, posted_date, closing_date, description) values
  ('Senior Frontend Developer', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11111111-1111-1111-1111-111111111111', 2, 15, 'Open', '2024-01-02', '2024-02-02', 'Looking for an experienced frontend developer with React/Next.js expertise.'),
  ('Marketing Specialist', 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', '11111111-1111-1111-1111-111111111111', 1, 8, 'Open', '2024-01-05', '2024-02-05', 'Digital marketing specialist with social media expertise.'),
  ('DevOps Engineer', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11111111-1111-1111-1111-111111111111', 1, 12, 'Open', '2023-12-20', '2024-01-31', 'DevOps engineer with cloud infrastructure experience.'),
  ('Sales Executive', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '11111111-1111-1111-1111-111111111111', 3, 20, 'On Hold', '2023-12-15', '2024-01-30', 'Sales executive with B2B experience.');

-- =====================================================
-- ASSETS
-- =====================================================
insert into public.assets (name, type, serial_number, assigned_to, issue_date, condition, status) values
  ('MacBook Pro 16"', 'Laptop', 'MBP-2023-001', 'e0000000-0000-0000-0000-000000000001', '2022-03-01', 'Good', 'Assigned'),
  ('Dell Monitor 27"', 'Monitor', 'DM-2023-002', 'e0000000-0000-0000-0000-000000000001', '2022-03-01', 'Good', 'Assigned'),
  ('iPhone 15 Pro', 'Phone', 'IP-2023-003', 'e0000000-0000-0000-0000-000000000003', '2023-10-01', 'New', 'Assigned'),
  ('ThinkPad X1 Carbon', 'Laptop', 'TP-2023-004', null, null, 'Good', 'Available'),
  ('Logitech MX Keys', 'Keyboard', 'LG-2023-005', 'e0000000-0000-0000-0000-000000000004', '2022-09-15', 'Good', 'Assigned')
on conflict (serial_number) do nothing;

-- =====================================================
-- PERFORMANCE CYCLE + GOALS + REVIEWS
-- =====================================================
insert into public.performance_cycles (id, name, start_date, end_date, status) values
  ('c1c0c1c0-c1c0-4000-8000-c1c0c1c0c1c0', 'H2 2023', '2023-07-01', '2023-12-31', 'Completed')
on conflict (id) do nothing;

insert into public.goals (employee_id, cycle_id, title, description, progress, status, due_date) values
  ('e0000000-0000-0000-0000-000000000001', 'c1c0c1c0-c1c0-4000-8000-c1c0c1c0c1c0', 'Complete API migration', 'Migrate legacy REST APIs to GraphQL', 75, 'In Progress', '2024-03-31'),
  ('e0000000-0000-0000-0000-000000000001', 'c1c0c1c0-c1c0-4000-8000-c1c0c1c0c1c0', 'Mentor junior developers', 'Conduct weekly code reviews and knowledge sharing', 60, 'In Progress', '2024-06-30'),
  ('e0000000-0000-0000-0000-000000000001', 'c1c0c1c0-c1c0-4000-8000-c1c0c1c0c1c0', 'AWS certification', 'Complete AWS Solutions Architect certification', 30, 'In Progress', '2024-04-30');

insert into public.performance_reviews (employee_id, cycle_id, self_rating, manager_rating, status, comments) values
  ('e0000000-0000-0000-0000-000000000001', 'c1c0c1c0-c1c0-4000-8000-c1c0c1c0c1c0', 4, 4, 'Completed', 'Excellent technical contributions.'),
  ('e0000000-0000-0000-0000-000000000004', 'c1c0c1c0-c1c0-4000-8000-c1c0c1c0c1c0', 4, null, 'Pending Manager Review', 'Led design system overhaul.'),
  ('e0000000-0000-0000-0000-000000000009', 'c1c0c1c0-c1c0-4000-8000-c1c0c1c0c1c0', null, null, 'Pending Self Review', null),
  ('e0000000-0000-0000-0000-000000000006', 'c1c0c1c0-c1c0-4000-8000-c1c0c1c0c1c0', 3, 3, 'Completed', 'Good progress, needs more initiative.');

-- =====================================================
-- HOLIDAYS
-- =====================================================
insert into public.holidays (name, date, is_recurring) values
  ('New Year''s Day', '2024-01-01', true),
  ('Independence Day', '2024-07-04', true),
  ('Christmas Day', '2024-12-25', true);

-- =====================================================
-- NOTIFICATIONS need auth users; insert sample rows with null user (admin broadcast)
-- =====================================================
insert into public.notifications (user_id, title, message, type, read, link) values
  (null, 'Leave Request', 'Michael Chen has requested monthly leave for Jan 15-16.', 'info', false, '/leave'),
  (null, 'Expense Submitted', 'Jessica Lee submitted an expense claim of $599.', 'info', false, '/expenses'),
  (null, 'Payslip Generated', 'December 2023 payslips have been generated.', 'success', true, '/payroll');

-- =====================================================
-- AUDIT LOGS (sample)
-- =====================================================
insert into public.audit_logs (user_name, module, action, record, previous_value, new_value) values
  ('Sarah Williams', 'Leave', 'Approved', 'LR-001', 'Pending', 'Approved'),
  ('Alex Johnson', 'Employee', 'Created', 'EMP014', null, 'Emma Garcia'),
  ('Sarah Williams', 'Payroll', 'Finalized', 'PR-DEC-2023', 'Draft', 'Finalized');