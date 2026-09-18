/**
 * Seed Demo Users for CodQor HRMS
 * ================================
 * This script uses the Supabase Admin API (service_role key) to create
 * 3 demo users with auto-confirmed emails — the proper, supported way.
 *
 * Usage:
 *   node supabase/seed-demo-users.mjs
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js   (already in your package.json)
 */

import { createClient } from '@supabase/supabase-js';

// ─── Config ──────────────────────────────────────────────────────────
// NEVER hardcode the service-role key here — read it from the environment.
// Local:  $env:SUPABASE_SECRET_KEY="sb_secret_..." ; node supabase/seed-demo-users.mjs
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eneesqsotfgffdxncumw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SECRET_KEY env var. Refusing to run.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Demo users to create ────────────────────────────────────────────
const DEMO_USERS = [
  {
    email: 'admin@codqor.com',
    password: 'admin123',
    name: 'Alex Johnson',
    role: 'super_admin',
    employeeId: 'e0000000-0000-0000-0000-000000000015', // CEO
  },
  {
    email: 'hr@codqor.com',
    password: 'hr123',
    name: 'Sarah Williams',
    role: 'hr_manager',
    employeeId: 'e0000000-0000-0000-0000-000000000002', // HR Manager
  },
  {
    email: 'employee@codqor.com',
    password: 'emp123',
    name: 'Michael Chen',
    role: 'employee',
    employeeId: 'e0000000-0000-0000-0000-000000000001', // Sr. Software Engineer
  },
];

// ─── Main ────────────────────────────────────────────────────────────
async function seedDemoUsers() {
  console.log('🚀 Seeding demo users for CodQor HRMS...\n');

  for (const user of DEMO_USERS) {
    console.log(`── Creating ${user.email} (${user.role}) ──`);

    // Step 1: Check if user already exists by trying to get user by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === user.email);

    let authUserId;

    if (existing) {
      console.log(`   ⚠️  Auth user already exists (id: ${existing.id}), skipping auth creation.`);
      authUserId = existing.id;
    } else {
      // Step 2: Create auth user via Admin API (auto-confirms email)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // ✅ Auto-confirm — no verification email needed
        user_metadata: { name: user.name },
      });

      if (authError) {
        console.error(`   ❌ Auth error: ${authError.message}`);
        continue;
      }

      authUserId = authData.user.id;
      console.log(`   ✅ Auth user created (id: ${authUserId})`);
    }

    // Step 3: Upsert into public.users (profile table)
    const { error: profileError } = await supabase
      .from('users')
      .upsert(
        {
          id: authUserId,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: null,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error(`   ❌ Profile error: ${profileError.message}`);
    } else {
      console.log(`   ✅ Profile upserted (role: ${user.role})`);
    }

    // Step 4: Link employee to auth user
    const { error: linkError } = await supabase
      .from('employees')
      .update({ user_id: authUserId })
      .eq('id', user.employeeId);

    if (linkError) {
      console.error(`   ❌ Employee link error: ${linkError.message}`);
    } else {
      console.log(`   ✅ Employee linked (${user.employeeId})`);
    }

    console.log('');
  }

  console.log('═══════════════════════════════════════════');
  console.log('🎉 Done! Demo accounts ready:');
  console.log('   admin@codqor.com    / admin123   → Super Admin');
  console.log('   hr@codqor.com       / hr123      → HR Manager');
  console.log('   employee@codqor.com / emp123     → Employee');
  console.log('═══════════════════════════════════════════');
}

seedDemoUsers().catch(console.error);
