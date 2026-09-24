-- Dashboard performance indexes (safe, idempotent).
-- Some of these already exist from 001_initial_schema.sql; IF NOT EXISTS makes this a no-op for those.
-- Missing ones speed up getDashboardData() count queries and trend window.

CREATE INDEX IF NOT EXISTS idx_employees_status
  ON public.employees(status);

CREATE INDEX IF NOT EXISTS idx_employees_joining_date
  ON public.employees(joining_date);

CREATE INDEX IF NOT EXISTS idx_attendance_date_status
  ON public.attendance(date, status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status
  ON public.leave_requests(status);

CREATE INDEX IF NOT EXISTS idx_expense_claims_status
  ON public.expense_claims(status);

CREATE INDEX IF NOT EXISTS idx_jobs_status
  ON public.jobs(status);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_latest
  ON public.payroll_runs(year DESC, month_index DESC);
