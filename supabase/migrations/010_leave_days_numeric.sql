-- =====================================================
-- 010: Half-day leave support — leave_requests.days integer → numeric
-- =====================================================
-- WHY: The leave form sends days = 0.5 for half leave
-- (src/features/leave/components/LeaveRequestForm.tsx), but this
-- column was created as `integer`, so every half-leave request fails
-- with: invalid input syntax for type integer: "0.5".
-- leave_balances already uses numeric(6,2) for total/used/remaining/
-- pending, so this aligns the request rows with the balance math.
--
-- HOW TO APPLY: paste this whole file into Supabase SQL Editor -> Run.
-- Safe to re-run (guarded by a type check). Existing whole-day rows
-- are preserved via the USING cast.
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leave_requests'
      AND column_name = 'days'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.leave_requests
      ALTER COLUMN days TYPE numeric(6,2) USING days::numeric;
  END IF;
END $$;

-- Reload PostgREST schema cache so the new type takes effect immediately
NOTIFY pgrst, 'reload schema';
