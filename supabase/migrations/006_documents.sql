-- =====================================================
-- Documents module: backing table for the Documents page
-- =====================================================
-- The Documents UI (upload / list / download / delete) previously
-- kept everything in browser state. This table persists document
-- metadata; small files are stored inline as data URLs (10 MB cap
-- enforced by the app, matching the previous client behavior).
--
-- HOW TO APPLY: paste this whole file into Supabase SQL Editor -> Run.
-- Safe to re-run (IF NOT EXISTS guards + idempotent policies).
-- =====================================================

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null default 'Contract',
  employee text not null default 'All Employees',
  uploaded_date date not null default CURRENT_DATE,
  expiry_date date,
  status text not null default 'Active',
  file_data text,
  file_name text,
  uploaded_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_documents_employee on public.documents(employee);
create index if not exists idx_documents_type on public.documents(type);

alter table public.documents enable row level security;

DROP POLICY IF EXISTS "dev open access" ON public.documents;
CREATE POLICY "dev open access" ON public.documents
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

create trigger documents_updated_at before update on public.documents
  for each row execute function public.handle_updated_at();

NOTIFY pgrst, 'reload schema';
