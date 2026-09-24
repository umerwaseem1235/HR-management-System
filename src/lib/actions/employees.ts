'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Employee } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';
import { validateEmployeePhotoPayload } from '@/lib/employee-photo';

type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

/** Rejects avatars larger than the shared photo limit (defence in depth). */
function assertAvatarWithinLimit(avatar: string | null | undefined): void {
  const error = validateEmployeePhotoPayload(avatar);
  if (error) throw new Error(error);
}

interface LookupItem {
  id: string;
  name: string;
}

interface EmployeeInput {
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  city?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  departmentId?: string;
  designationId?: string;
  branchId?: string;
  shiftId?: string;
  reportingManagerId?: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  joiningDate: string;
  probationEndDate?: string;
  confirmationDate?: string;
  status?: 'Active' | 'Inactive' | 'On Notice' | 'Probation';
  bankName?: string;
  bankAccount?: string;
  taxId?: string;
  salary?: number;
  avatar?: string;
}

interface LookupData {
  departments: LookupItem[];
  designations: LookupItem[];
  branches: LookupItem[];
  shifts: LookupItem[];
  managers: LookupItem[];
}

function mapEmployee(db: any): Employee {
  return {
    id: db.id,
    employeeCode: db.employee_code,
    firstName: db.first_name,
    lastName: db.last_name,
    email: db.email,
    phone: db.phone,
    avatar: db.avatar,
    dateOfBirth: db.date_of_birth,
    gender: db.gender,
    address: db.address,
    city: db.city,
    country: db.country,
    emergencyContactName: db.emergency_contact_name,
    emergencyContactPhone: db.emergency_contact_phone,
    department: db.departments?.name || '',
    departmentId: db.department_id,
    designation: db.designations?.name || '',
    designationId: db.designation_id,
    branch: db.branches?.name || '',
    branchId: db.branch_id,
    shift: db.shifts?.name || '',
    shiftId: db.shift_id,
    reportingManager: db.reporting_manager?.first_name
      ? `${db.reporting_manager.first_name} ${db.reporting_manager.last_name}`
      : '',
    reportingManagerId: db.reporting_manager_id,
    employmentType: db.employment_type,
    joiningDate: db.joining_date,
    probationEndDate: db.probation_end_date,
    confirmationDate: db.confirmation_date,
    status: db.status,
    bankName: db.bank_name,
    bankAccount: db.bank_account,
    taxId: db.tax_id,
    salary: db.salary,
  };
}

async function getNextEmployeeCode(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data, error } = await supabase
    .from('employees')
    .select('employee_code')
    .ilike('employee_code', 'EMP%')
    .order('employee_code', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return 'EMP001';
  }

  const lastCode = data[0].employee_code;
  const match = lastCode.match(/^EMP(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `EMP${nextNum.toString().padStart(3, '0')}`;
  }
  return 'EMP001';
}

async function resolveFKs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: EmployeeInput
): Promise<Partial<EmployeeInput>> {
  const resolved: Partial<EmployeeInput> = {};

  if (input.departmentId) {
    const { data } = await supabase.from('departments').select('id').eq('id', input.departmentId).single();
    if (data) resolved.departmentId = data.id;
  }

  if (input.designationId) {
    const { data } = await supabase.from('designations').select('id').eq('id', input.designationId).single();
    if (data) resolved.designationId = data.id;
  }

  if (input.branchId) {
    const { data } = await supabase.from('branches').select('id').eq('id', input.branchId).single();
    if (data) resolved.branchId = data.id;
  }

  if (input.shiftId) {
    const { data } = await supabase.from('shifts').select('id').eq('id', input.shiftId).single();
    if (data) resolved.shiftId = data.id;
  }

  if (input.reportingManagerId) {
    const { data } = await supabase.from('employees').select('id').eq('id', input.reportingManagerId).single();
    if (data) resolved.reportingManagerId = data.id;
  }

  return resolved;
}

// Columns for list queries. `avatar` is deliberately excluded: photos are
// stored as base64 data URLs and a full table scan with avatars weighed
// tens of megabytes (75s+ loads). The table shows initials via Avatar
// fallback; the photo loads on demand in getEmployee (detail/edit).
const EMPLOYEE_LIST_COLUMNS = [
  'id', 'user_id', 'employee_code', 'first_name', 'last_name', 'email', 'phone',
  'date_of_birth', 'gender', 'address', 'city', 'country',
  'emergency_contact_name', 'emergency_contact_phone',
  'department_id', 'designation_id', 'branch_id', 'shift_id', 'reporting_manager_id',
  'employment_type', 'joining_date', 'probation_end_date', 'confirmation_date',
  'status', 'bank_name', 'bank_account', 'tax_id', 'salary',
  'created_at', 'updated_at',
].join(', ');

export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient();

  // Single lean query: explicit columns (no avatar) + N:1 joins.
  const { data, error } = await supabase
    .from('employees')
    .select(`
      ${EMPLOYEE_LIST_COLUMNS},
      departments(name),
      designations(name),
      branches(name),
      shifts(name),
      reporting_manager:employees(first_name, last_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
  
  return (data || []).map(mapEmployee);
}

export async function getEmployee(id: string): Promise<Employee> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      shifts(name),
      reporting_manager:employees(first_name, last_name)
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return mapEmployee(data);
}

/**
 * Batched avatar loader for list views.
 *
 * The list query omits `avatar` (base64 blobs) to keep the table fast.
 * Call this AFTER the table renders with initials — it fetches only
 * `id + avatar` in one query and the UI swaps initials → photo with
 * zero layout shift (same fixed-size circle).
 * Pass `ids` to limit to the visible page; omit to fetch all.
 */
export async function getEmployeeAvatars(ids?: string[]): Promise<Record<string, string>> {
  const supabase = await createClient();
  let query = supabase.from('employees').select('id, avatar').not('avatar', 'is', null);
  if (ids && ids.length > 0) query = query.in('id', ids);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as Array<{ id: string; avatar: string | null }>) {
    if (row.avatar) map[row.id] = row.avatar;
  }
  return map;
}

export async function getLookupData(): Promise<LookupData> {
  const supabase = await createClient();

  const [departments, designations, branches, shifts, managers] = await Promise.all([
    supabase.from('departments').select('id, name').order('name'),
    supabase.from('designations').select('id, name').order('name'),
    supabase.from('branches').select('id, name, city').order('name'),
    supabase.from('shifts').select('id, name, start_time, end_time').order('name'),
    supabase.from('employees').select('id, first_name, last_name, employee_code').eq('status', 'Active').order('first_name'),
  ]);

  return {
    departments: departments.data?.map(d => ({ id: d.id, name: d.name })) || [],
    designations: designations.data?.map(d => ({ id: d.id, name: d.name })) || [],
    branches: branches.data?.map(b => ({ id: b.id, name: `${b.name} - ${b.city}` })) || [],
    shifts: shifts.data?.map(s => ({ id: s.id, name: `${s.name} (${s.start_time} - ${s.end_time})` })) || [],
    managers: managers.data?.map(m => ({ id: m.id, name: `${m.first_name} ${m.last_name} (${m.employee_code})` })) || [],
  };
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  assertAvatarWithinLimit(input.avatar);
  const supabase = await createClient();

  const employeeCode = input.employeeCode || await getNextEmployeeCode(supabase);

  const { data: existingCode } = await supabase
    .from('employees')
    .select('id')
    .eq('employee_code', employeeCode)
    .single();
  if (existingCode) {
    throw new Error(`Employee code "${employeeCode}" already exists`);
  }

  const { data: existingEmail } = await supabase
    .from('employees')
    .select('id')
    .eq('email', input.email)
    .single();
  if (existingEmail) {
    throw new Error(`Email "${input.email}" is already registered`);
  }

  const resolved = await resolveFKs(supabase, input);

  const insertData: EmployeeInsert = {
    employee_code: employeeCode,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone || null,
    date_of_birth: input.dateOfBirth || null,
    gender: input.gender || null,
    address: input.address || null,
    city: input.city || null,
    country: input.country || 'USA',
    emergency_contact_name: input.emergencyContactName || null,
    emergency_contact_phone: input.emergencyContactPhone || null,
    department_id: resolved.departmentId || null,
    designation_id: resolved.designationId || null,
    branch_id: resolved.branchId || null,
    shift_id: resolved.shiftId || null,
    reporting_manager_id: resolved.reportingManagerId || null,
    employment_type: input.employmentType,
    joining_date: input.joiningDate,
    probation_end_date: input.probationEndDate || null,
    confirmation_date: input.confirmationDate || null,
    status: input.status || 'Active',
    bank_name: input.bankName || null,
    bank_account: input.bankAccount || null,
    tax_id: input.taxId || null,
    salary: input.salary || null,
    avatar: input.avatar || null,
  };

  const { data, error } = await supabase
    .from('employees')
    .insert([insertData])
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      shifts(name),
      reporting_manager:employees(first_name, last_name)
    `)
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/employees');
  return mapEmployee(data);
}

export async function updateEmployee(id: string, input: Partial<EmployeeInput>): Promise<Employee> {
  if (input.avatar !== undefined) assertAvatarWithinLimit(input.avatar);
  const supabase = await createClient();

  if (input.employeeCode) {
    const { data: existingCode } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_code', input.employeeCode)
      .neq('id', id)
      .single();
    if (existingCode) {
      throw new Error(`Employee code "${input.employeeCode}" already exists`);
    }
  }

  if (input.email) {
    const { data: existingEmail } = await supabase
      .from('employees')
      .select('id')
      .eq('email', input.email)
      .neq('id', id)
      .single();
    if (existingEmail) {
      throw new Error(`Email "${input.email}" is already registered`);
    }
  }

  const resolved = await resolveFKs(supabase, input as EmployeeInput);

  const updateData: EmployeeUpdate = {} as EmployeeUpdate;
  if (input.employeeCode) updateData.employee_code = input.employeeCode;
  if (input.firstName) updateData.first_name = input.firstName;
  if (input.lastName) updateData.last_name = input.lastName;
  if (input.email) updateData.email = input.email;
  if (input.phone !== undefined) updateData.phone = input.phone || null;
  if (input.dateOfBirth !== undefined) updateData.date_of_birth = input.dateOfBirth || null;
  if (input.gender) updateData.gender = input.gender;
  if (input.address !== undefined) updateData.address = input.address || null;
  if (input.city !== undefined) updateData.city = input.city || null;
  if (input.country !== undefined) updateData.country = input.country || 'USA';
  if (input.emergencyContactName !== undefined) updateData.emergency_contact_name = input.emergencyContactName || null;
  if (input.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = input.emergencyContactPhone || null;
  if (resolved.departmentId !== undefined) updateData.department_id = resolved.departmentId;
  if (resolved.designationId !== undefined) updateData.designation_id = resolved.designationId;
  if (resolved.branchId !== undefined) updateData.branch_id = resolved.branchId;
  if (resolved.shiftId !== undefined) updateData.shift_id = resolved.shiftId;
  if (resolved.reportingManagerId !== undefined) updateData.reporting_manager_id = resolved.reportingManagerId;
  if (input.employmentType) updateData.employment_type = input.employmentType;
  if (input.joiningDate) updateData.joining_date = input.joiningDate;
  if (input.probationEndDate !== undefined) updateData.probation_end_date = input.probationEndDate || null;
  if (input.confirmationDate !== undefined) updateData.confirmation_date = input.confirmationDate || null;
  if (input.status) updateData.status = input.status;
  if (input.bankName !== undefined) updateData.bank_name = input.bankName || null;
  if (input.bankAccount !== undefined) updateData.bank_account = input.bankAccount || null;
  if (input.taxId !== undefined) updateData.tax_id = input.taxId || null;
  if (input.salary !== undefined) updateData.salary = input.salary || null;
  if (input.avatar !== undefined) updateData.avatar = input.avatar || null;

  const { data, error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      shifts(name),
      reporting_manager:employees(first_name, last_name)
    `)
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/employees');
  revalidatePath(`/employees/${id}`);
  return mapEmployee(data);
}

export async function deleteEmployee(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/employees');
}

export async function createEmployeeWithAuth(input: EmployeeInput & { 
  password: string; 
  loginEmail: string 
}): Promise<{ employee: Employee; authUserId: string }> {
  assertAvatarWithinLimit(input.avatar);
  const supabase = await createClient();

  const employeeCode = input.employeeCode || await getNextEmployeeCode(supabase);

  const { data: existingCode } = await supabase
    .from('employees')
    .select('id')
    .eq('employee_code', employeeCode)
    .single();
  if (existingCode) {
    throw new Error(`Employee code "${employeeCode}" already exists`);
  }

  const { data: existingEmail } = await supabase
    .from('employees')
    .select('id')
    .eq('email', input.email)
    .single();
  if (existingEmail) {
    throw new Error(`Email "${input.email}" is already registered`);
  }

  const resolved = await resolveFKs(supabase, input);

  // Step 1: Create the Supabase Auth user via the admin API.
  // Uses the service-role key so the user is created with a confirmed
  // email — no confirmation email is ever sent, and the employee can
  // log in immediately with the credentials set here by the admin.
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: input.loginEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: `${input.firstName} ${input.lastName}`, role: 'employee' },
  });

  if (authError) {
    const msg = authError.message || '';
    if (/already (registered|exists)|already been registered|duplicate/i.test(msg)) {
      throw new Error(`An account with email "${input.loginEmail}" already exists`);
    }
    throw new Error(`Failed to create employee account: ${msg}`);
  }
  if (!authData.user) {
    throw new Error('Failed to create employee account: no user returned');
  }

  const authUserId = authData.user.id;

  // Step 2: Create employee record linked to auth user
  const insertData: EmployeeInsert = {
    employee_code: input.employeeCode || employeeCode,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone || null,
    date_of_birth: input.dateOfBirth || null,
    gender: input.gender || null,
    address: input.address || null,
    city: input.city || null,
    country: input.country || 'USA',
    emergency_contact_name: input.emergencyContactName || null,
    emergency_contact_phone: input.emergencyContactPhone || null,
    department_id: resolved.departmentId || null,
    designation_id: resolved.designationId || null,
    branch_id: resolved.branchId || null,
    shift_id: resolved.shiftId || null,
    reporting_manager_id: resolved.reportingManagerId || null,
    employment_type: input.employmentType,
    joining_date: input.joiningDate,
    probation_end_date: input.probationEndDate || null,
    confirmation_date: input.confirmationDate || null,
    status: input.status || 'Active',
    bank_name: input.bankName || null,
    bank_account: input.bankAccount || null,
    tax_id: input.taxId || null,
    salary: input.salary || null,
    avatar: input.avatar || null,
    user_id: authUserId,
  };

  const { data, error } = await supabase
    .from('employees')
    .insert([insertData])
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      shifts(name),
      reporting_manager:employees(first_name, last_name)
    `)
    .single();

  if (error) {
    // Rollback: delete the auth user if employee creation fails
    await adminClient.auth.admin.deleteUser(authUserId);
    throw new Error(error.message);
  }

  // Create user profile in public.users
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authUserId,
      email: input.loginEmail,
      name: `${input.firstName} ${input.lastName}`,
      role: 'employee',
      avatar: null
    });

  if (userError) {
    console.error('Failed to create user profile:', userError);
  }

  // Create leave balances for the new employee
  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('id, days_allowed');
  
  if (leaveTypes) {
    const yr = new Date(input.joiningDate).getFullYear();
    const leaveBalances = leaveTypes.map(lt => ({
      employee_id: data.id,
      leave_type_id: lt.id,
      year: new Date(input.joiningDate).getFullYear(),
      total: lt.days_allowed,
      remaining: lt.days_allowed,
    }));
    await supabase.from('leave_balances').insert(leaveBalances);
  }

  revalidatePath('/employees');
  return { employee: mapEmployee(data), authUserId };
}

export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      shifts(name),
      reporting_manager:employees(first_name, last_name)
    `)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  if (!data) return null;
  return mapEmployee(data);
}