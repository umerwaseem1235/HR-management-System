-- =====================================================
-- CLEANUP: Remove broken demo user data (if any)
-- Run this in Supabase SQL Editor FIRST if you get
-- "Database error querying schema" after the previous seed.
-- =====================================================

-- Remove any orphaned identities
DELETE FROM auth.identities 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@codqor.com', 'hr@codqor.com', 'employee@codqor.com')
);

-- Remove the broken auth.users rows
DELETE FROM auth.users 
WHERE email IN ('admin@codqor.com', 'hr@codqor.com', 'employee@codqor.com');

-- Remove orphaned public.users rows (if any)  
DELETE FROM public.users
WHERE email IN ('admin@codqor.com', 'hr@codqor.com', 'employee@codqor.com');

-- Unlink employees so the seed script can re-link them
UPDATE public.employees SET user_id = NULL 
WHERE id IN (
  'e0000000-0000-0000-0000-000000000015',
  'e0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000001'
);

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

SELECT 'Cleanup complete! Now run: node supabase/seed-demo-users.mjs' AS status;
