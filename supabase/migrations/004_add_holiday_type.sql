-- =====================================================
-- Add missing `type` column to holidays
-- =====================================================
-- The app (HolidayManager + attendance actions + generated types)
-- reads/writes holidays.type ('Public' | 'Optional' | 'Company'),
-- but 001_initial_schema.sql never created the column, so adding a
-- holiday failed with:
--   "Could not find the 'type' column of 'holidays' in the schema cache"
--
-- HOW TO APPLY: paste this whole file into Supabase SQL Editor -> Run.
-- Safe to re-run (IF NOT EXISTS).
-- =====================================================

alter table public.holidays
  add column if not exists type text not null default 'Public';

-- Backfill existing rows (all seeded holidays) explicitly
update public.holidays set type = 'Public' where type is null;

NOTIFY pgrst, 'reload schema';
