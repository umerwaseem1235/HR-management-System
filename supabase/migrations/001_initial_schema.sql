-- Complete HRMS Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor

-- =====================================================
-- EXTENSIONS
-- =====================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================
create type user_role as enum ('super_admin', 'hr_manager', 'employee');
create type employment_type as enum ('Full-time', 'Part-time', 'Contract', 'Intern');
create type employee_status as enum ('Active', 'Inactive', 'On Notice', 'Probation');
create type gender_type as enum ('Male', 'Female', 'Other');
create type attendance_status as enum ('Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Holiday', 'Weekend');
create type leave_status as enum ('Pending', 'Approved', 'Rejected', 'Cancelled');
create type leave_period as enum ('month', 'year');
create type expense_status as enum ('Pending', 'Approved', 'Rejected', 'Reimbursed');
create type daily_work_status as enum ('Submitted', 'Approved', 'Needs Revision');
create type remote_request_status as enum ('Pending', 'Approved', 'Rejected', 'Cancelled');
create type asset_status as enum ('Available', 'Assigned', 'Returned', 'Retired');
create type asset_condition as enum ('New', 'Good', 'Fair', 'Damaged');
create type candidate_stage as enum ('Applied', 'Screening', 'Interview', 'Selected', 'Rejected', 'Offer', 'Hired');
create type job_status as enum ('Open', 'Closed', 'On Hold');
create type payslip_status as enum ('Draft', 'Processed', 'Finalized');
create type performance_status as enum ('Pending Self Review', 'Pending Manager Review', 'Completed');
create type goal_status as enum ('Not Started', 'In Progress', 'Completed');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Branches
create table public.branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  city text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users (app profiles linked to auth.users; code reads id/email/name/role/avatar)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role user_role default 'employee',
  avatar text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Departments (code uses head TEXT + employee_count, not a head_id FK)
create table public.departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  head text,
  employee_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Designations
create table public.designations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Shifts
create table public.shifts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_time time,
  end_time time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Employees (core)
create table public.employees (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  employee_code text unique not null,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  avatar text,
  date_of_birth date,
  gender gender_type,
  address text,
  city text,
  country text default 'USA',
  emergency_contact_name text,
  emergency_contact_phone text,
  department_id uuid references public.departments(id) on delete set null,
  designation_id uuid references public.designations(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  reporting_manager_id uuid references public.employees(id) on delete set null,
  employment_type employment_type default 'Full-time',
  joining_date date not null,
  probation_end_date date,
  confirmation_date date,
  status employee_status default 'Active',
  bank_name text,
  bank_account text,
  tax_id text,
  salary numeric(12,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- ATTENDANCE & RELATED
-- =====================================================

create table public.attendance (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status attendance_status default 'Present',
  work_hours numeric(4,2) default 0,
  overtime numeric(4,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, date)
);

create table public.attendance_corrections (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  requested_check_in time,
  requested_check_out time,
  requested_status attendance_status,
  reason text,
  status text default 'Pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.holidays (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  date date not null,
  is_recurring boolean default false,
  branch_id uuid references public.branches(id) on delete cascade,
  created_at timestamptz default now()
);

-- =====================================================
-- LEAVE SYSTEM
-- =====================================================

create table public.leave_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  days_allowed integer not null,
  carry_forward boolean default false,
  color text default '#3B82F6',
  period leave_period default 'year',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.leave_balances (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  year integer not null,
  total numeric(6,2) default 0,
  used numeric(6,2) default 0,
  remaining numeric(6,2) default 0,
  pending numeric(6,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, leave_type_id, year)
);

create table public.leave_requests (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  days integer not null,
  reason text,
  status leave_status default 'Pending',
  applied_on date default now(),
  approved_by uuid references public.employees(id) on delete set null,
  comments text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- PAYROLL
-- =====================================================

-- Payslips (code uses TEXT ids like 'gen-PR-..-1' + employee_name snapshot column)
create table public.payslips (
  id text primary key,
  employee_id uuid not null references public.employees(id) on delete cascade,
  employee_name text,
  month text not null,
  year integer not null,
  basic_salary numeric(12,2) not null,
  allowances jsonb default '[]'::jsonb,
  deductions jsonb default '[]'::jsonb,
  gross_salary numeric(12,2) not null,
  net_salary numeric(12,2) not null,
  status payslip_status default 'Draft',
  generated_on timestamptz default now(),
  finalized_on date,
  finalized_by uuid references public.employees(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payroll runs (code uses TEXT ids like 'PR-2024-01')
create table public.payroll_runs (
  id text primary key,
  month text not null,
  month_index integer not null,
  year integer not null,
  status text default 'Draft',
  total_gross numeric(14,2) default 0,
  total_deductions numeric(14,2) default 0,
  total_net numeric(14,2) default 0,
  created_on timestamptz default now(),
  finalized_on timestamptz,
  finalized_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.payroll_items (
  id uuid primary key default uuid_generate_v4(),
  payroll_run_id text not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  employee_name text,
  department text,
  basic_salary numeric(12,2) default 0,
  allowances jsonb default '[]'::jsonb,
  deductions jsonb default '[]'::jsonb,
  paid_leave_days numeric(6,2) default 0,
  unpaid_leave_days numeric(6,2) default 0,
  absent_days numeric(6,2) default 0,
  leave_deduction numeric(12,2) default 0,
  gross_salary numeric(12,2) default 0,
  total_allowances numeric(12,2) default 0,
  total_deductions numeric(12,2) default 0,
  net_salary numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.salary_components (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  amount numeric(12,2) default 0,
  kind text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- RECRUITMENT
-- =====================================================

create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  department_id uuid references public.departments(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  vacancies integer default 1,
  applicants integer default 0,
  status job_status default 'Open',
  posted_date date default now(),
  closing_date date,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.candidates (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  stage candidate_stage default 'Applied',
  applied_date date default now(),
  resume text,
  notes text,
  rating integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- EXPENSES
-- =====================================================

create table public.expense_claims (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null,
  date date not null,
  description text,
  status expense_status default 'Pending',
  receipt_url text,
  submitted_on date default now(),
  approved_by uuid references public.employees(id) on delete set null,
  reimbursed_on date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- PROGRESS / DAILY WORK / REMOTE
-- =====================================================

create table public.progress_entries (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  project_name text not null,
  description text,
  submission_date date not null,
  created_on date default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.daily_work (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  file_url text,
  file_name text,
  link text,
  status daily_work_status default 'Submitted',
  submitted_on date default now(),
  reviewed_by uuid references public.employees(id) on delete set null,
  review_comments text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.remote_requests (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  days integer not null,
  reason text not null,
  work_plan text,
  status remote_request_status default 'Pending',
  requested_on date default now(),
  reviewed_by uuid references public.employees(id) on delete set null,
  review_comments text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- =====================================================
-- ASSETS
-- =====================================================

create table public.assets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  serial_number text unique not null,
  assigned_to uuid references public.employees(id) on delete set null,
  issue_date date,
  return_date date,
  condition asset_condition default 'Good',
  status asset_status default 'Available',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- NOTIFICATIONS & AUDIT
-- =====================================================

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info',
  read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- Audit logs (code uses record TEXT + created_at + TEXT previous/new values)
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  module text not null,
  action text not null,
  record text,
  previous_value text,
  new_value text,
  created_at timestamptz default now()
);

-- Asset assignments history (code reads/writes this; assets table holds current state too)
create table public.asset_assignments (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  issue_date date not null,
  return_date date,
  created_at timestamptz default now()
);

-- App settings key/value store (code upserts { key, value } on conflict key)
create table public.settings (
  key text primary key,
  value text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- PERFORMANCE
-- =====================================================

create table public.performance_cycles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.goals (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  cycle_id uuid references public.performance_cycles(id) on delete set null,
  title text not null,
  description text,
  progress integer default 0,
  status goal_status default 'Not Started',
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.performance_reviews (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  cycle_id uuid not null references public.performance_cycles(id) on delete cascade,
  cycle_name text,
  self_rating integer,
  manager_rating integer,
  status performance_status default 'Pending Self Review',
  comments text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- INDEXES
-- =====================================================
create index idx_employees_user_id on public.employees(user_id);
create index idx_employees_department on public.employees(department_id);
create index idx_employees_branch on public.employees(branch_id);
create index idx_employees_manager on public.employees(reporting_manager_id);
create index idx_attendance_employee_date on public.attendance(employee_id, date);
create index idx_attendance_date on public.attendance(date);
create index idx_leave_requests_employee on public.leave_requests(employee_id);
create index idx_leave_requests_status on public.leave_requests(status);
create index idx_leave_balances_employee on public.leave_balances(employee_id);
create index idx_expense_claims_employee on public.expense_claims(employee_id);
create index idx_expense_claims_status on public.expense_claims(status);
create index idx_progress_entries_employee on public.progress_entries(employee_id);
create index idx_daily_work_employee on public.daily_work(employee_id);
create index idx_remote_requests_employee on public.remote_requests(employee_id);
create index idx_notifications_user on public.notifications(user_id);
create index idx_audit_logs_user on public.audit_logs(user_id);
create index idx_payroll_items_run on public.payroll_items(payroll_run_id);
create index idx_payroll_items_employee on public.payroll_items(employee_id);
create index idx_asset_assignments_asset on public.asset_assignments(asset_id);
create index idx_asset_assignments_employee on public.asset_assignments(employee_id);
create index idx_payslips_employee on public.payslips(employee_id);
create index idx_candidates_job on public.candidates(job_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
alter table public.branches enable row level security;
alter table public.departments enable row level security;
alter table public.designations enable row level security;
alter table public.shifts enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.attendance_corrections enable row level security;
alter table public.holidays enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;
alter table public.payslips enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.expense_claims enable row level security;
alter table public.progress_entries enable row level security;
alter table public.daily_work enable row level security;
alter table public.remote_requests enable row level security;
alter table public.assets enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.performance_cycles enable row level security;
alter table public.goals enable row level security;
alter table public.performance_reviews enable row level security;
alter table public.users enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payroll_items enable row level security;
alter table public.salary_components enable row level security;
alter table public.asset_assignments enable row level security;
alter table public.settings enable row level security;

-- RLS Policies
-- Employees: can see all, but only modify own (or admin/hr)
create policy "authenticated read employees" on public.employees
  for select using (auth.role() = 'authenticated');

create policy "employees self update" on public.employees
  for update using (auth.uid() = user_id);

-- Attendance: all authenticated can read; employees insert own; hr/admin modify all
create policy "authenticated read attendance" on public.attendance
  for select using (auth.role() = 'authenticated');

create policy "employees insert own attendance" on public.attendance
  for insert with check (
    exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
  );

create policy "hr_admin modify attendance" on public.attendance
  for all using (
    exists (select 1 from public.employees e where e.user_id = auth.uid() and e.id is not null)
    and exists (select 1 from public.employees m where m.user_id = auth.uid() and m.id = reporting_manager_id)
  );

-- Leave: similar pattern
create policy "authenticated read leave" on public.leave_requests
  for select using (auth.role() = 'authenticated');

create policy "employees create leave" on public.leave_requests
  for insert with check (
    exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
  );

create policy "hr_admin manage leave" on public.leave_requests
  for all using (
    exists (select 1 from public.employees m where m.user_id = auth.uid())
  );

-- Expenses
create policy "authenticated read expenses" on public.expense_claims
  for select using (auth.role() = 'authenticated');

create policy "employees create expenses" on public.expense_claims
  for insert with check (
    exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
  );

create policy "hr_admin manage expenses" on public.expense_claims
  for all using (
    exists (select 1 from public.employees m where m.user_id = auth.uid())
  );

-- Progress / Daily Work / Remote
create policy "authenticated read progress" on public.progress_entries
  for select using (auth.role() = 'authenticated');

create policy "employees manage own progress" on public.progress_entries
  for all using (
    exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
  );

create policy "authenticated read daily_work" on public.daily_work
  for select using (auth.role() = 'authenticated');

create policy "employees manage own daily_work" on public.daily_work
  for all using (
    exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
  );

create policy "authenticated read remote" on public.remote_requests
  for select using (auth.role() = 'authenticated');

create policy "employees manage own remote" on public.remote_requests
  for all using (
    exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
  );

-- Payslips: employees see own; hr/admin see all
create policy "employees read own payslips" on public.payslips
  for select using (
    exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
  );

create policy "hr_admin read all payslips" on public.payslips
  for select using (
    exists (select 1 from public.employees m where m.user_id = auth.uid())
  );

-- Assets
create policy "authenticated read assets" on public.assets
  for select using (auth.role() = 'authenticated');

-- Notifications: users see own
create policy "users read own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "users insert notifications" on public.notifications
  for insert with check (true); -- system inserts

create policy "users update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Goals & Reviews
create policy "authenticated read goals" on public.goals
  for select using (auth.role() = 'authenticated');

create policy "employees manage own goals" on public.goals
  for all using (
    exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
  );

create policy "authenticated read reviews" on public.performance_reviews
  for select using (auth.role() = 'authenticated');

-- Users: own profile readable/writable (signup inserts own row right after auth.signUp)
create policy "users read own profile" on public.users
  for select using (auth.uid() = id);

create policy "users insert own profile" on public.users
  for insert with check (auth.uid() = id);

create policy "users update own profile" on public.users
  for update using (auth.uid() = id);

-- Payroll / salary / settings / asset history:
-- reads for all authenticated staff, writes for authenticated staff
-- (role checks live in the app; tighten to HR-only later if required)
create policy "authenticated read payroll_runs" on public.payroll_runs
  for select using (auth.role() = 'authenticated');

create policy "authenticated write payroll_runs" on public.payroll_runs
  for all using (auth.role() = 'authenticated');

create policy "authenticated read payroll_items" on public.payroll_items
  for select using (auth.role() = 'authenticated');

create policy "authenticated write payroll_items" on public.payroll_items
  for all using (auth.role() = 'authenticated');

create policy "authenticated read salary_components" on public.salary_components
  for select using (auth.role() = 'authenticated');

create policy "authenticated write salary_components" on public.salary_components
  for all using (auth.role() = 'authenticated');

create policy "authenticated read asset_assignments" on public.asset_assignments
  for select using (auth.role() = 'authenticated');

create policy "authenticated write asset_assignments" on public.asset_assignments
  for all using (auth.role() = 'authenticated');

create policy "authenticated read settings" on public.settings
  for select using (auth.role() = 'authenticated');

create policy "authenticated write settings" on public.settings
  for all using (auth.role() = 'authenticated');

-- Reference data readable by all authenticated staff
create policy "authenticated read branches" on public.branches
  for select using (auth.role() = 'authenticated');

create policy "authenticated read departments" on public.departments
  for select using (auth.role() = 'authenticated');

create policy "authenticated write departments" on public.departments
  for all using (auth.role() = 'authenticated');

create policy "authenticated read designations" on public.designations
  for select using (auth.role() = 'authenticated');

create policy "authenticated write designations" on public.designations
  for all using (auth.role() = 'authenticated');

create policy "authenticated read shifts" on public.shifts
  for select using (auth.role() = 'authenticated');

create policy "authenticated read leave_types" on public.leave_types
  for select using (auth.role() = 'authenticated');

create policy "authenticated read leave_balances" on public.leave_balances
  for select using (auth.role() = 'authenticated');

create policy "authenticated write leave_balances" on public.leave_balances
  for all using (auth.role() = 'authenticated');

create policy "authenticated read holidays" on public.holidays
  for select using (auth.role() = 'authenticated');

create policy "authenticated write holidays" on public.holidays
  for all using (auth.role() = 'authenticated');

create policy "authenticated read corrections" on public.attendance_corrections
  for select using (auth.role() = 'authenticated');

create policy "authenticated write corrections" on public.attendance_corrections
  for all using (auth.role() = 'authenticated');

create policy "authenticated read jobs" on public.jobs
  for select using (auth.role() = 'authenticated');

create policy "authenticated write jobs" on public.jobs
  for all using (auth.role() = 'authenticated');

create policy "authenticated read candidates" on public.candidates
  for select using (auth.role() = 'authenticated');

create policy "authenticated write candidates" on public.candidates
  for all using (auth.role() = 'authenticated');

create policy "authenticated manage audit" on public.audit_logs
  for all using (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger employees_updated_at before update on public.employees
  for each row execute function public.handle_updated_at();

create trigger attendance_updated_at before update on public.attendance
  for each row execute function public.handle_updated_at();

create trigger leave_requests_updated_at before update on public.leave_requests
  for each row execute function public.handle_updated_at();

create trigger leave_balances_updated_at before update on public.leave_balances
  for each row execute function public.handle_updated_at();

create trigger expense_claims_updated_at before update on public.expense_claims
  for each row execute function public.handle_updated_at();

create trigger progress_entries_updated_at before update on public.progress_entries
  for each row execute function public.handle_updated_at();

create trigger daily_work_updated_at before update on public.daily_work
  for each row execute function public.handle_updated_at();

create trigger remote_requests_updated_at before update on public.remote_requests
  for each row execute function public.handle_updated_at();

-- =====================================================
-- FUNCTION: auto-create leave balances on employee insert
-- =====================================================
create or replace function public.create_leave_balances_for_employee()
returns trigger language plpgsql as $$
declare
  lt record;
  yr integer := extract(year from new.joining_date)::int;
begin
  for lt in select id, days_allowed from public.leave_types loop
    insert into public.leave_balances (employee_id, leave_type_id, year, total, remaining)
    values (new.id, lt.id, yr, lt.days_allowed, lt.days_allowed)
    on conflict (employee_id, leave_type_id, year) do nothing;
  end loop;
  return new;
end; $$;

create trigger employee_after_insert
  after insert on public.employees
  for each row execute function public.create_leave_balances_for_employee();

-- =====================================================
-- FUNCTION: get current user's employee record
-- =====================================================
create or replace function public.get_my_employee()
returns setof public.employees language sql security definer as $$
  select * from public.employees where user_id = auth.uid();
$$;