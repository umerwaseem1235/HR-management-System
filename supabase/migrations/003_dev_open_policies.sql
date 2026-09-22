-- =====================================================
-- DEV / DEMO open RLS policies for CodeQor HRMS
-- =====================================================
-- WHY THIS FILE EXISTS
-- The base schema (001) gates every table on a live Supabase Auth
-- session (auth.role() = 'authenticated' / auth.uid() = ...).
-- Until real Supabase Auth login is wired up with demo users, the
-- app talks to the database as the `anon` role, which means:
--   * every SELECT silently returns [] (empty lists everywhere)
--   * every INSERT fails with "new row violates row-level
--     security policy" (e.g. adding an employee)
-- These policies open all app tables to `anon` + `authenticated`
-- so the app is fully functional during development/demo.
--
-- ⚠️  PRODUCTION WARNING
-- Do NOT ship this file as-is to production. Before going live:
--   1. Create real users in Authentication -> Users.
--   2. Wire the app to sign in via Supabase Auth (sessions).
--   3. DROP these policies and rely on the role-based policies
--      in 001_initial_schema.sql:
--      DROP POLICY "dev open access" ON public.<table>;  -- per table
--
-- HOW TO APPLY: paste this whole file into Supabase SQL Editor -> Run.
-- Safe to re-run (drops before creating).
-- =====================================================

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users', 'branches', 'departments', 'designations', 'shifts',
    'employees', 'attendance', 'attendance_corrections', 'holidays',
    'leave_types', 'leave_balances', 'leave_requests', 'payslips',
    'payroll_runs', 'payroll_items', 'salary_components', 'jobs',
    'candidates', 'expense_claims', 'progress_entries', 'daily_work',
    'remote_requests', 'assets', 'asset_assignments', 'settings',
    'notifications', 'audit_logs', 'performance_cycles', 'goals',
    'performance_reviews'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "dev open access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "dev open access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- Reload PostgREST schema cache so the new policies take effect immediately
NOTIFY pgrst, 'reload schema';
