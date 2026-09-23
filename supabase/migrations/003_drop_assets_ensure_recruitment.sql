-- 003_drop_assets_ensure_recruitment.sql
-- Run this in Supabase Dashboard > SQL Editor on umerwaseem1235_project.
--
-- WHAT IT DOES:
--   1. Permanently drops the legacy `assets` + `asset_assignments` tables
--      (this deletes the 5 asset rows visible in Table Editor — cannot be undone).
--   2. Ensures the recruitment tables (`jobs`, `candidates`) exist with the
--      same shape the app writes to, plus RLS policies so that
--      "Note Free Position" saves persist and show on the webpage.
--
-- NOTE: `jobs` / `candidates` are the recruitment tables. In Table Editor,
-- search the left sidebar for "jobs" — recruitment rows appear there, NOT
-- under "assets".

-- =====================================================
-- 1. DROP legacy assets tables (WARNING: data is deleted)
-- =====================================================
drop table if exists public.asset_assignments cascade;
drop table if exists public.assets cascade;

-- =====================================================
-- 2. ENSURE recruitment enums exist
-- =====================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type job_status as enum ('Open', 'Closed', 'On Hold');
  end if;
  if not exists (select 1 from pg_type where typname = 'candidate_stage') then
    create type candidate_stage as enum ('Applied', 'Screening', 'Interview', 'Selected', 'Rejected', 'Offer', 'Hired');
  end if;
end $$;

-- =====================================================
-- 3. ENSURE recruitment tables exist (same shape as 001)
-- =====================================================
create table if not exists public.jobs (
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

create table if not exists public.candidates (
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

alter table public.jobs enable row level security;
alter table public.candidates enable row level security;

-- =====================================================
-- 4. ENSURE RLS policies (created only if missing)
-- =====================================================
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'jobs' and policyname = 'authenticated read jobs') then
    create policy "authenticated read jobs" on public.jobs
      for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'jobs' and policyname = 'authenticated write jobs') then
    create policy "authenticated write jobs" on public.jobs
      for all using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'candidates' and policyname = 'authenticated read candidates') then
    create policy "authenticated read candidates" on public.candidates
      for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'candidates' and policyname = 'authenticated write candidates') then
    create policy "authenticated write candidates" on public.candidates
      for all using (auth.role() = 'authenticated');
  end if;
end $$;

-- =====================================================
-- 5. VERIFY (check the result grids after running)
-- =====================================================
-- Should return ZERO rows for assets:
-- select table_name from information_schema.tables
--   where table_schema = 'public' and table_name in ('assets', 'asset_assignments');
--
-- Should return TWO rows (jobs, candidates):
-- select table_name from information_schema.tables
--   where table_schema = 'public' and table_name in ('jobs', 'candidates');
