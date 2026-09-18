/**
 * Fix + Seed Demo Users for CodQor HRMS
 * ======================================
 * Cleans up broken auth data, then creates users properly.
 *
 * Usage:  node supabase/fix-and-seed-users.mjs
 */

import { createClient } from '@supabase/supabase-js';

// NEVER hardcode the service-role key here — read it from the environment.
// Local:  $env:SUPABASE_SECRET_KEY="sb_secret_..." ; node supabase/fix-and-seed-users.mjs
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eneesqsotfgffdxncumw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SECRET_KEY env var. Refusing to run.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  {
    email: 'admin@codqor.com',
    password: 'admin123',
    name: 'Alex Johnson',
    role: 'super_admin',
    employeeId: 'e0000000-0000-0000-0000-000000000015',
  },
  {
    email: 'hr@codqor.com',
    password: 'hr123',
    name: 'Sarah Williams',
    role: 'hr_manager',
    employeeId: 'e0000000-0000-0000-0000-000000000002',
  },
  {
    email: 'employee@codqor.com',
    password: 'emp123',
    name: 'Michael Chen',
    role: 'employee',
    employeeId: 'e0000000-0000-0000-0000-000000000001',
  },
];

async function fixAndSeed() {
  console.log('🔧 Step 1: Cleaning up broken auth data...\n');

  // List all existing auth users and delete the demo ones
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.log(`   ⚠️ Could not list users: ${listError.message}`);
    console.log('   → The auth tables likely have corrupt data from the raw SQL insert.');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚡ YOU MUST RUN THE CLEANUP SQL FIRST:');
    console.log('');
    console.log('   1. Go to: https://supabase.com/dashboard/project/eneesqsotfgffdxncumw/sql');
    console.log('   2. Open a New Query');
    console.log('   3. Paste and run this SQL:');
    console.log('');
    console.log(`-- Clean up broken auth data
DELETE FROM auth.identities WHERE provider_id IN ('admin@codqor.com', 'hr@codqor.com', 'employee@codqor.com');
DELETE FROM auth.users WHERE email IN ('admin@codqor.com', 'hr@codqor.com', 'employee@codqor.com');
DELETE FROM public.users WHERE email IN ('admin@codqor.com', 'hr@codqor.com', 'employee@codqor.com');
UPDATE public.employees SET user_id = NULL WHERE id IN ('e0000000-0000-0000-0000-000000000015','e0000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000001');
NOTIFY pgrst, 'reload schema';`);
    console.log('');
    console.log('   4. After running, come back and run this script again:');
    console.log('      node supabase/fix-and-seed-users.mjs');
    console.log('═══════════════════════════════════════════════════════════════');
    return;
  }

  // Delete existing demo users if found
  const demoEmails = DEMO_USERS.map((u) => u.email);
  const existingDemoUsers = listData.users.filter((u) => demoEmails.includes(u.email));

  for (const existing of existingDemoUsers) {
    console.log(`   Deleting existing user: ${existing.email} (${existing.id})`);
    const { error: delError } = await supabase.auth.admin.deleteUser(existing.id);
    if (delError) {
      console.error(`   ❌ Delete failed: ${delError.message}`);
    } else {
      console.log(`   ✅ Deleted`);
    }
  }

  // Also clean public.users
  await supabase.from('users').delete().in('email', demoEmails);
  // Unlink employees
  await supabase
    .from('employees')
    .update({ user_id: null })
    .in('id', DEMO_USERS.map((u) => u.employeeId));

  console.log('\n🚀 Step 2: Creating demo users...\n');

  for (const user of DEMO_USERS) {
    console.log(`── ${user.email} (${user.role}) ──`);

    // Create auth user via Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name },
    });

    if (authError) {
      console.error(`   ❌ Auth error: ${authError.message}`);
      continue;
    }

    const authUserId = authData.user.id;
    console.log(`   ✅ Auth user created (id: ${authUserId})`);

    // Create public.users profile
    const { error: profileError } = await supabase.from('users').upsert(
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
      console.log(`   ✅ Profile created (role: ${user.role})`);
    }

    // Link employee
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
  console.log('🎉 All done! Login with:');
  console.log('   admin@codqor.com    / admin123   → Super Admin');
  console.log('   hr@codqor.com       / hr123      → HR Manager');
  console.log('   employee@codqor.com / emp123     → Employee');
  console.log('═══════════════════════════════════════════');
}

fixAndSeed().catch(console.error);
