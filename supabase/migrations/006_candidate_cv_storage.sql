-- 006_candidate_cv_storage.sql
--
-- HOW TO RUN (Supabase Dashboard > SQL Editor on umerwaseem1235_project):
--   1. Copy the ENTIRE file content into the SQL Editor.
--   2. Press Run (Ctrl+Enter).
--
-- WHAT IT DOES:
--   Creates a private Storage bucket `candidate-cvs` for CVs uploaded from
--   Recruitment > Note Candidate (PDF/DOC, max 10 MB), with RLS policies so
--   only logged-in (authenticated) users can upload / download / delete.
--   The app stores the file path in `candidates.resume`; downloads use
--   short-lived signed URLs, so the bucket stays private.

-- =====================================================
-- 1. Bucket (private, PDF/DOC only, 10 MB limit)
-- =====================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-cvs',
  'candidate-cvs',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =====================================================
-- 2. RLS policies on storage.objects for this bucket
-- =====================================================
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'authenticated read candidate cvs') then
    create policy "authenticated read candidate cvs" on storage.objects
      for select to authenticated using (bucket_id = 'candidate-cvs');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'authenticated upload candidate cvs') then
    create policy "authenticated upload candidate cvs" on storage.objects
      for insert to authenticated with check (bucket_id = 'candidate-cvs');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'authenticated update candidate cvs') then
    create policy "authenticated update candidate cvs" on storage.objects
      for update to authenticated using (bucket_id = 'candidate-cvs');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'authenticated delete candidate cvs') then
    create policy "authenticated delete candidate cvs" on storage.objects
      for delete to authenticated using (bucket_id = 'candidate-cvs');
  end if;
end $$;

-- =====================================================
-- 3. VERIFY (uncomment the lines below, then Run)
-- =====================================================
-- Should return ONE row (candidate-cvs, public = false):
-- select id, public, file_size_limit from storage.buckets where id = 'candidate-cvs';
--
-- Should return FOUR rows (read/upload/update/delete policies):
-- select policyname from pg_policies
--   where schemaname = 'storage' and tablename = 'objects'
--   and policyname like '%candidate cvs%';
