-- 004_recruitment_interviews_offers.sql
--
-- HOW TO RUN (Supabase Dashboard > SQL Editor on umerwaseem1235_project):
--   1. Copy the ENTIRE file content into the SQL Editor.
--   2. Press Run (Ctrl+Enter). This executes everything above section 5.
--   3. To VERIFY afterwards: run the two queries in section 5 — but first
--      delete the leading "-- " on each line (lines starting with "--" are
--      comments and do nothing; running only comments gives
--      "Success. No rows returned").
--
-- WHAT IT DOES:
--   `jobs` + `candidates` already exist (001). This migration adds the two
--   missing recruitment tables so EVERYTHING on the Recruitment page persists:
--     1. `candidates.source` column (Referral / Walk-in / Internal / Other)
--     2. `interviews` table (Reminders tab: schedule, feedback, rating, cancel)
--     3. `offers` table (Offers Noted tab: salary, joining date, status, notes)
-- All statements are idempotent — safe to re-run.

-- =====================================================
-- 1. candidates.source column
-- =====================================================
alter table public.candidates
  add column if not exists source text default 'Other';

-- =====================================================
-- 2. interviews table
-- =====================================================
create table if not exists public.interviews (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  date date not null,
  time text not null default '10:00',
  mode text not null default 'In-person',
  interviewer text not null default '',
  interviewer_id uuid references public.employees(id) on delete set null,
  round text not null default 'Round 1',
  status text not null default 'Scheduled',
  feedback text,
  rating integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.interviews enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'interviews' and policyname = 'authenticated read interviews') then
    create policy "authenticated read interviews" on public.interviews
      for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'interviews' and policyname = 'authenticated write interviews') then
    create policy "authenticated write interviews" on public.interviews
      for all using (auth.role() = 'authenticated');
  end if;
end $$;

-- =====================================================
-- 3. offers table (one row per candidate: upsert on candidate_id)
-- =====================================================
create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null unique references public.candidates(id) on delete cascade,
  salary numeric(12,2) not null default 0,
  joining_date date,
  status text not null default 'Sent',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.offers enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'offers' and policyname = 'authenticated read offers') then
    create policy "authenticated read offers" on public.offers
      for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'offers' and policyname = 'authenticated write offers') then
    create policy "authenticated write offers" on public.offers
      for all using (auth.role() = 'authenticated');
  end if;
end $$;

-- =====================================================
-- 4. VERIFY (check the result grids after running)
-- =====================================================
-- Should return FOUR rows (jobs, candidates, interviews, offers):
-- select table_name from information_schema.tables
--   where table_schema = 'public'
--   and table_name in ('jobs', 'candidates', 'interviews', 'offers')
--   order by table_name;
--
-- Should return one row (source column):
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'candidates' and column_name = 'source';
