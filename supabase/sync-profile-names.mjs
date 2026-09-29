/**
 * Sync profile names between public.users and public.employees
 * =============================================================
 * One-time repair for drifted identity rows: the profile page renders
 * employees.first_name/last_name, while the topbar/sidebar render
 * users.name — if they disagree the UI shows two different names for
 * the same person. `updateProfile`/`updateEmployee` now keep both in
 * sync going forward; this script fixes rows that drifted before that.
 *
 * Direction: employees <- users (the account row holds the name/email
 * the user last chose in Edit Profile / login identity). Avatars are
 * hole-fills only: employees.avatar is set from users.avatar solely when
 * it is NULL, so an HR-uploaded photo is never overwritten.
 *
 * Usage:
 *   node supabase/sync-profile-names.mjs --dry-run          # show drift only
 *   node supabase/sync-profile-names.mjs --only <email>     # one account
 *   node supabase/sync-profile-names.mjs                    # apply all
 *
 * Needs SUPABASE_SECRET_KEY (service role). Read from the environment
 * first; falls back to .env.local so it runs out of the box.
 * The secret is never printed.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env.local');
try {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
} catch {
  // .env.local optional if the vars are already exported
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL / SUPABASE_SECRET_KEY. Refusing to run.');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const onlyArg = process.argv.indexOf('--only');
const onlyEmail = onlyArg !== -1 ? (process.argv[onlyArg + 1] || '').toLowerCase() : null;
if (onlyArg !== -1 && !onlyEmail) {
  console.error('❌ --only requires an email, e.g. --only admin@codqor.com');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const splitFullName = (full) => {
  const [first, ...rest] = (full || '').trim().split(/\s+/);
  return { first_name: first || full || '', last_name: rest.join(' ') || '' };
};

async function main() {
  const [{ data: users, error: usersErr }, { data: employees, error: empErr }] = await Promise.all([
    supabase.from('users').select('id, email, name, avatar'),
    supabase
      .from('employees')
      .select('id, user_id, first_name, last_name, email, avatar')
      .not('user_id', 'is', null),
  ]);
  if (usersErr) throw new Error(`users select failed: ${usersErr.message}`);
  if (empErr) throw new Error(`employees select failed: ${empErr.message}`);

  const userById = new Map((users || []).map((u) => [u.id, u]));
  const drift = [];

  for (const emp of employees || []) {
    const user = userById.get(emp.user_id);
    if (!user) continue;
    if (onlyEmail && (user.email ?? '').toLowerCase() !== onlyEmail) continue;
    const empFullName = `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();
    const nameDiff = empFullName.toLowerCase() !== (user.name ?? '').trim().toLowerCase();
    const emailDiff = (emp.email ?? '').toLowerCase() !== (user.email ?? '').toLowerCase();
    const avatarDiff = !emp.avatar && !!user.avatar;
    if (nameDiff || emailDiff || avatarDiff) {
      drift.push({ emp, user, empFullName, nameDiff, emailDiff, avatarDiff });
    }
  }

  if (drift.length === 0) {
    console.log(
      onlyEmail
        ? `✅ No drift found for ${onlyEmail} — nothing to do.`
        : '✅ employees and users are already in sync — nothing to do.',
    );
    return;
  }

  console.log(`Found ${drift.length} drifted row(s):\n`);
  for (const d of drift) {
    const namePart = d.nameDiff ? `name "${d.empFullName}" -> "${d.user.name}"` : '';
    const emailPart = d.emailDiff ? `email "${d.emp.email}" -> "${d.user.email}"` : '';
    const avatarPart = d.avatarDiff ? 'profile photo missing on employee row' : '';
    console.log(`  • ${d.user.email}: ${[namePart, emailPart, avatarPart].filter(Boolean).join(', ')}`);
  }

  if (dryRun) {
    console.log('\n(dry run — no changes written. Re-run without --dry-run to apply.)');
    return;
  }

  let applied = 0;
  for (const d of drift) {
    const patch = {};
    if (d.nameDiff) Object.assign(patch, splitFullName(d.user.name));
    if (d.emailDiff) patch.email = d.user.email;
    if (d.avatarDiff) patch.avatar = d.user.avatar;
    const { error } = await supabase.from('employees').update(patch).eq('id', d.emp.id);
    if (error) {
      console.error(`  ❌ ${d.user.email}: ${error.message}`);
      process.exitCode = 1;
    } else {
      applied += 1;
    }
  }

  console.log(`\n✅ Synced ${applied}/${drift.length} row(s). Profile page and topbar now agree.`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
