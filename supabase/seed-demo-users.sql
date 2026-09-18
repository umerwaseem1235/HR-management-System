-- =====================================================
-- SEED DEMO AUTH USERS
-- =====================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates 3 demo users directly in auth.users with confirmed emails
-- and links them to public.users + public.employees.
--
-- Credentials:
--   admin@codqor.com    / admin123
--   hr@codqor.com       / hr123
--   employee@codqor.com / emp123
-- =====================================================

-- Fixed UUIDs so we can reference them consistently
-- (generated offline; change if they clash with existing rows)
DO $$
DECLARE
  v_admin_id    uuid := 'a0000000-0000-4000-8000-000000000001';
  v_hr_id       uuid := 'a0000000-0000-4000-8000-000000000002';
  v_employee_id uuid := 'a0000000-0000-4000-8000-000000000003';
BEGIN

  -- ── 1. Insert into auth.users (Supabase internal table) ──
  --    We use crypt() + gen_salt() from pgcrypto to hash passwords the
  --    same way Supabase GoTrue does (bcrypt).

  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password,
    email_confirmed_at, confirmation_sent_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES
    -- admin@codqor.com / admin123
    (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id, 'authenticated', 'authenticated',
      'admin@codqor.com',
      crypt('admin123', gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Alex Johnson"}'::jsonb,
      now(), now()
    ),
    -- hr@codqor.com / hr123
    (
      '00000000-0000-0000-0000-000000000000',
      v_hr_id, 'authenticated', 'authenticated',
      'hr@codqor.com',
      crypt('hr123', gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Sarah Williams"}'::jsonb,
      now(), now()
    ),
    -- employee@codqor.com / emp123
    (
      '00000000-0000-0000-0000-000000000000',
      v_employee_id, 'authenticated', 'authenticated',
      'employee@codqor.com',
      crypt('emp123', gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Michael Chen"}'::jsonb,
      now(), now()
    )
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Create matching identities (required for email/password login) ──
  INSERT INTO auth.identities (
    id, user_id, provider_id, provider,
    identity_data, last_sign_in_at, created_at, updated_at
  ) VALUES
    (
      v_admin_id, v_admin_id, 'admin@codqor.com', 'email',
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@codqor.com'),
      now(), now(), now()
    ),
    (
      v_hr_id, v_hr_id, 'hr@codqor.com', 'email',
      jsonb_build_object('sub', v_hr_id::text, 'email', 'hr@codqor.com'),
      now(), now(), now()
    ),
    (
      v_employee_id, v_employee_id, 'employee@codqor.com', 'email',
      jsonb_build_object('sub', v_employee_id::text, 'email', 'employee@codqor.com'),
      now(), now(), now()
    )
  ON CONFLICT DO NOTHING;

  -- ── 3. Insert into public.users (app profile table) ──
  INSERT INTO public.users (id, email, name, role, avatar) VALUES
    (v_admin_id,    'admin@codqor.com',    'Alex Johnson',    'super_admin', null),
    (v_hr_id,       'hr@codqor.com',       'Sarah Williams',  'hr_manager',  null),
    (v_employee_id, 'employee@codqor.com', 'Michael Chen',    'employee',    null)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;

  -- ── 4. Link employees to their auth user accounts ──
  -- Admin (Alex Johnson, CEO) → EMP015
  UPDATE public.employees
     SET user_id = v_admin_id
   WHERE id = 'e0000000-0000-0000-0000-000000000015'
     AND (user_id IS NULL OR user_id = v_admin_id);

  -- HR Manager (Sarah Williams) → EMP002
  UPDATE public.employees
     SET user_id = v_hr_id
   WHERE id = 'e0000000-0000-0000-0000-000000000002'
     AND (user_id IS NULL OR user_id = v_hr_id);

  -- Employee (Michael Chen, Senior Software Engineer) → EMP001
  UPDATE public.employees
     SET user_id = v_employee_id
   WHERE id = 'e0000000-0000-0000-0000-000000000001'
     AND (user_id IS NULL OR user_id = v_employee_id);

  RAISE NOTICE '✅ Demo users created and linked successfully!';
  RAISE NOTICE '   admin@codqor.com    / admin123  → Super Admin (Alex Johnson)';
  RAISE NOTICE '   hr@codqor.com       / hr123     → HR Manager  (Sarah Williams)';
  RAISE NOTICE '   employee@codqor.com / emp123    → Employee    (Michael Chen)';

END $$;
