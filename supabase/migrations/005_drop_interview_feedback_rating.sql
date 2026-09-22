-- 005_drop_interview_feedback_rating.sql
--
-- HOW TO RUN (Supabase Dashboard > SQL Editor on umerwaseem1235_project):
--   1. Copy the ENTIRE file content into the SQL Editor.
--   2. Press Run (Ctrl+Enter).
--   3. To VERIFY afterwards: run the query in section 2 — but first
--      delete the leading "-- " on each line (lines starting with "--" are
--      comments and do nothing).
--
-- WHAT IT DOES:
--   Permanently removes the `feedback` and `rating` columns from the
--   `interviews` table (any stored feedback/rating data is deleted and
--   cannot be undone). The app no longer reads or writes these columns.

-- =====================================================
-- 1. DROP the columns
-- =====================================================
alter table public.interviews drop column if exists feedback;
alter table public.interviews drop column if exists rating;

-- =====================================================
-- 2. VERIFY (uncomment the lines below, then Run)
-- =====================================================
-- Should return ZERO rows:
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'interviews'
--   and column_name in ('feedback', 'rating');
