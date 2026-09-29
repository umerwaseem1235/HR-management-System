/**
 * Clean demo data for client handover
 * ===================================
 * Removes, for a completed project being handed to the client:
 *   1. Every login account that is NOT super_admin / hr_manager
 *      (public.users row + Supabase auth user).
 *   2. Every employee EXCEPT those linked to a kept super_admin/hr_manager
 *      account (unlinked demo rows go too). Postgres ON DELETE CASCADE
 *      automatically clears their attendance, leaves, balances, expenses,
 *      progress, daily work, remote requests, asset assignments, goals,
 *      reviews, corrections, payslips and payroll items; SET NULL refs
 *      (managers, approvers, assignees) are nulled automatically.
 *   3. ALL payroll summary data (every payroll_runs row — payroll_items
 *      cascade from it) and every payslip.
 *
 * Kept untouched: master/config data (departments, designations, branches,
 * shifts, leave_types, holidays, jobs, candidates, salary_components,
 * settings, documents, assets), audit_logs, and keeper notifications.
 *
 * Safety:
 *   - Default is DRY-RUN (counts + doomed accounts only, writes nothing).
 *   - `--apply` executes. A timestamped JSON backup of every deleted primary
 *     row (plus cascaded child rows) is written to supabase/ first.
 *   - Refuses to run when no super_admin would remain (no lockout).
 *   - The service-role secret is never printed.
 *
 * Usage:
 *   node supabase/clean-demo-data.mjs            # dry run
 *   node supabase/clean-demo-data.mjs --apply    # backup + delete
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(resolve(HERE, '..', '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m && process.env[m[1]] === undefined) {
    process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SECRET_KEY. Refusing to run.');
  process.exit(1);
}

const apply = process.argv.includes('--apply');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const KEEPER_ROLES = ['super_admin', 'hr_manager'];
// Children with employee_id CASCADE FKs — backed up before their parent goes.
const CHILD_TABLES = [
  'attendance',
  'attendance_corrections',
  'leave_balances',
  'leave_requests',
  'expense_claims',
  'progress_entries',
  'daily_work',
  'remote_requests',
  'asset_assignments',
  'goals',
  'performance_reviews',
];

// Tables we could not read (e.g. never migrated). A table that does not
// exist cannot hold rows, so it is safe; any other read failure aborts.
const tableIssues = {};

async function count(table, filter, required = true) {
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: n, error } = await q;
  if (error) {
    if (!required && /could not find the table/i.test(error.message)) {
      tableIssues[table] = 'table not present in schema — nothing to lose';
      return 0;
    }
    throw new Error(`${table} count failed: ${error.message}`);
  }
  return n ?? 0;
}

async function main() {
  const { data: users, error: uErr } = await supabase.from('users').select('id, email, name, role');
  if (uErr) throw new Error(`users select failed: ${uErr.message}`);
  const { data: employees, error: eErr } = await supabase.from('employees').select('*');
  if (eErr) throw new Error(`employees select failed: ${eErr.message}`);

  const keepers = (users || []).filter((u) => KEEPER_ROLES.includes(u.role));
  const removedUsers = (users || []).filter((u) => !KEEPER_ROLES.includes(u.role));

  const superKeepers = keepers.filter((u) => u.role === 'super_admin');
  if (superKeepers.length === 0) {
    console.error('REFUSING TO RUN: no super_admin would remain — this would lock everyone out.');
    process.exit(1);
  }

  const keeperIds = new Set(keepers.map((u) => u.id));
  const keptEmployees = (employees || []).filter((e) => e.user_id && keeperIds.has(e.user_id));
  const removedEmployees = (employees || []).filter((e) => !(e.user_id && keeperIds.has(e.user_id)));
  const removedIds = removedEmployees.map((e) => e.id);
  const removedAuthIds = [
    ...new Set([
      ...removedUsers.map((u) => u.id),
      ...removedEmployees.map((e) => e.user_id).filter(Boolean),
    ]),
  ];

  const runs = await count('payroll_runs');
  const items = await count('payroll_items');
  const slips = await count('payslips');

  console.log(`KEEPERS (${keepers.length} logins, ${keptEmployees.length} employee rows):`);
  for (const u of keepers) console.log(`  + ${u.email} [${u.role}]`);

  console.log(`\nREMOVE logins (${removedUsers.length}):`);
  for (const u of removedUsers) console.log(`  - ${u.email} [${u.role}]`);

  console.log(`\nREMOVE employees (${removedEmployees.length}, keepers' rows spared):`);
  const unlinked = removedEmployees.filter((e) => !e.user_id).length;
  for (const e of removedEmployees.slice(0, 25)) {
    console.log(`  - ${e.first_name} ${e.last_name} <${e.email}>${e.user_id ? '' : ' (no login)'}`);
  }
  if (removedEmployees.length > 25) console.log(`  ... and ${removedEmployees.length - 25} more`);
  console.log(`  (${unlinked} of these have no linked login)`);

  console.log(`\nREMOVE payroll data: ${runs} runs, ${items} items, ${slips} payslips (all of them)`);

  console.log('\nCASCADE preview (auto-deleted with the employees above):');
  for (const t of CHILD_TABLES) {
    const n = removedIds.length
      ? await count(t, (q) => q.in('employee_id', removedIds), false)
      : 0;
    if (n > 0) console.log(`  - ${t}: ${n} rows`);
  }
  for (const [t, note] of Object.entries(tableIssues)) {
    console.log(`  (note: ${t} — ${note})`);
  }

  if (!apply) {
    console.log('\n(dry run — nothing written. Re-run with --apply to back up + delete.)');
    return;
  }

  // ---- Backup everything primary before deleting ----
  const backup = {
    takenAt: new Date().toISOString(),
    keepers: keepers.map((u) => ({ email: u.email, role: u.role })),
    removedUsers,
    removedEmployees,
    children: {},
  };
  const [runsRows, itemsRows, slipsRows] = await Promise.all([
    supabase.from('payroll_runs').select('*'),
    supabase.from('payroll_items').select('*'),
    supabase.from('payslips').select('*'),
  ]);
  backup.payrollRuns = runsRows.data || [];
  backup.payrollItems = itemsRows.data || [];
  backup.payslips = slipsRows.data || [];
  for (const t of CHILD_TABLES) {
    if (!removedIds.length) {
      backup.children[t] = [];
      continue;
    }
    const { data, error } = await supabase.from(t).select('*').in('employee_id', removedIds);
    if (error) {
      if (/could not find the table/i.test(error.message)) {
        backup.children[t] = [];
        backup.children[`${t}__note`] = 'table not present in schema — nothing to lose';
        continue;
      }
      throw new Error(`backup of ${t} failed: ${error.message} (aborting: rows could be deleted without backup)`);
    }
    backup.children[t] = data || [];
  }
  const backupPath = join(HERE, `backup-cleanup-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(backup));
  console.log(`\nBackup written: ${backupPath}`);

  const must = async (label, fn) => {
    const { error } = await fn();
    if (error) throw new Error(`${label} failed: ${error.message}`);
    console.log(`  ok: ${label}`);
  };

  // ---- Deletes (order: leaves -> runs wipe items -> slips -> employees -> users -> auth) ----
  if (runs > 0) await must(`deleted ${runs} payroll_runs (items cascaded)`, () => supabase.from('payroll_runs').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
  const slipsLeft = await count('payslips');
  if (slipsLeft > 0) await must(`deleted ${slipsLeft} payslips`, () => supabase.from('payslips').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
  if (removedEmployees.length > 0) {
    await must(`deleted ${removedEmployees.length} employees (dependents cascaded)`, () =>
      supabase.from('employees').delete().in('id', removedIds),
    );
  }
  if (removedUsers.length > 0) {
    await must(`deleted ${removedUsers.length} users rows`, () =>
      supabase.from('users').delete().in('id', removedUsers.map((u) => u.id)),
    );
  }
  let authDeleted = 0;
  for (const authId of removedAuthIds) {
    const { error } = await supabase.auth.admin.deleteUser(authId);
    if (error) {
      console.log(`  WARN: auth user ${authId} not deleted: ${error.message}`);
    } else {
      authDeleted += 1;
    }
  }
  console.log(`  ok: deleted ${authDeleted}/${removedAuthIds.length} auth users`);

  // ---- Verify ----
  const [uLeft, eLeft, rLeft, iLeft, sLeft] = await Promise.all([
    count('users'),
    count('employees'),
    count('payroll_runs'),
    count('payroll_items'),
    count('payslips'),
  ]);
  console.log(`\nVERIFY — users: ${uLeft} (keepers ${keepers.length}), employees: ${eLeft} (keepers ${keptEmployees.length}), runs: ${rLeft}, items: ${iLeft}, payslips: ${sLeft}`);
  if (rLeft !== 0 || iLeft !== 0 || sLeft !== 0) {
    console.error('Payroll wipe incomplete — investigate before handover.');
    process.exitCode = 1;
  } else {
    console.log('Handover state reached: only super_admin/hr_manager accounts remain, payroll is empty.');
  }
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
