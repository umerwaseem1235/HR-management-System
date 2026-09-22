-- =====================================================
-- Document file storage: private bucket + policies
-- =====================================================
-- WHY: storing files as base64 text inside public.documents bloats
-- the table and hits API payload limits. Files belong in Supabase
-- Storage; the table keeps only metadata + the storage path.
--
-- Design:
--   bucket  : documents (private)
--   path    : <employee-slug>/<timestamp>_<filename>
--   table   : public.documents.file_path -> path in bucket
--   legacy  : public.documents.file_data stays for any rows that
--             already embed files (read path supports both)
--
-- HOW TO APPLY: paste this whole file into Supabase SQL Editor -> Run.
-- Safe to re-run.
-- =====================================================

-- 1. Private bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- 2. Path column on metadata table
alter table public.documents
  add column if not exists file_path text;

-- 3. Dev-open storage policies (consistent with 003_dev_open_policies).
--    Production: scope these to authenticated + role checks.
DROP POLICY IF EXISTS "dev open documents" ON storage.objects;
CREATE POLICY "dev open documents" ON storage.objects
  FOR ALL TO anon, authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

NOTIFY pgrst, 'reload schema';
