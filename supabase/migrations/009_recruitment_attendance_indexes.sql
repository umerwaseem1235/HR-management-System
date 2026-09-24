-- Recruitment + attendance performance indexes (safe, idempotent).
-- Complements 008_dashboard_indexes.sql. IF NOT EXISTS = no-op where present.

-- Recruitment list + single-call loader
CREATE INDEX IF NOT EXISTS idx_jobs_status
  ON public.jobs(status);

CREATE INDEX IF NOT EXISTS idx_candidates_job
  ON public.candidates(job_id);

CREATE INDEX IF NOT EXISTS idx_candidates_stage
  ON public.candidates(stage);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate
  ON public.interviews(candidate_id);

CREATE INDEX IF NOT EXISTS idx_interviews_date
  ON public.interviews(date);

CREATE INDEX IF NOT EXISTS idx_offers_candidate
  ON public.offers(candidate_id);

CREATE INDEX IF NOT EXISTS idx_candidate_history_candidate
  ON public.candidate_history(candidate_id);

-- Attendance single-call loader
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
  ON public.attendance(employee_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_date_status
  ON public.attendance(date, status);

CREATE INDEX IF NOT EXISTS idx_attendance_corrections_status
  ON public.attendance_corrections(status);

CREATE INDEX IF NOT EXISTS idx_holidays_date
  ON public.holidays(date);

-- Bounded audit trail query (module + recency)
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_created
  ON public.audit_logs(module, created_at DESC);
