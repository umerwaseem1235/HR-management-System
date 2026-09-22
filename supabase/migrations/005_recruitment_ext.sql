-- =====================================================
-- Recruitment extension: interviews, offers, history, source
-- =====================================================
-- The Recruitment UI tracks interviews, offers, per-candidate history
-- and source channel, but 001 only created jobs + candidates.
-- This migration adds the missing pieces so the whole module is
-- backed by Supabase.
--
-- HOW TO APPLY: paste this whole file into Supabase SQL Editor -> Run.
-- Safe to re-run (IF NOT EXISTS guards + idempotent policies).
-- =====================================================

-- 1. Source channel on candidates (Referral / Walk-in / Internal / Other)
alter table public.candidates
  add column if not exists source text not null default 'Other';

-- 2. Interviews
create table if not exists public.interviews (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  date date not null,
  time text not null default '10:00',
  mode text not null default 'In-person',
  interviewer_name text not null default '',
  interviewer_id uuid references public.employees(id) on delete set null,
  round text not null default 'Round 1',
  status text not null default 'Scheduled',
  feedback text,
  rating integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_interviews_candidate on public.interviews(candidate_id);
create index if not exists idx_interviews_date on public.interviews(date);

-- 3. Offers (one active offer row per candidate)
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
create index if not exists idx_offers_candidate on public.offers(candidate_id);

-- 4. Candidate history / timeline
create table if not exists public.candidate_history (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  date date not null default CURRENT_DATE,
  action text not null,
  note text,
  created_at timestamptz default now()
);
create index if not exists idx_candidate_history_candidate on public.candidate_history(candidate_id);

-- 5. RLS enable + dev open policies (consistent with 003_dev_open_policies)
alter table public.interviews enable row level security;
alter table public.offers enable row level security;
alter table public.candidate_history enable row level security;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['interviews', 'offers', 'candidate_history'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "dev open access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "dev open access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- 6. updated_at triggers (same helper from 001)
create trigger interviews_updated_at before update on public.interviews
  for each row execute function public.handle_updated_at();
create trigger offers_updated_at before update on public.offers
  for each row execute function public.handle_updated_at();

NOTIFY pgrst, 'reload schema';
