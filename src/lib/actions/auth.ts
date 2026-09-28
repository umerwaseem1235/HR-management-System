'use server';

import { createClient } from '@/lib/server';
import { UserRole, User } from '@/lib/types';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Insert into public.users
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'employee',
        avatar: null
      });

    if (insertError) {
      return { error: insertError.message };
    }
  }

  return { success: true };
}

/** Login is denied for employees whose record is Inactive. */
const DEACTIVATED_ACCOUNT_ERROR =
  'Your account has been deactivated. Please contact HR or your administrator.';

async function isAccountDeactivated(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authUserId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', authUserId)
    .eq('status', 'Inactive')
    .maybeSingle();
  return !!data;
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Enforce deactivation at login: an Inactive employee record must not
  // yield a usable session, even though the Supabase auth user still exists.
  const authUserId = signInData.user?.id;
  if (authUserId && (await isAccountDeactivated(supabase, authUserId))) {
    await supabase.auth.signOut();
    return { error: DEACTIVATED_ACCOUNT_ERROR };
  }

  return { success: true };
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  // NOTE: no redirect() here — redirect() throws and would prevent the
  // caller from clearing client-side auth state. The client navigates itself.
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePassword(
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  if (!oldPassword) {
    return { success: false, error: 'Please enter your old password.' };
  }
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }
  if (oldPassword === newPassword) {
    return { success: false, error: 'Old password and new password should not be same.' };
  }
  const supabase = await createClient();
  const { data: authData, error: userError } = await supabase.auth.getUser();
  const email = authData.user?.email;
  if (userError || !email) {
    return { success: false, error: 'Not authenticated. Please log in again.' };
  }
  // Re-authenticate: verifies the old password is correct.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: oldPassword,
  });
  if (signInError) {
    return { success: false, error: 'Old password is not correct.' };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { user: null, error: authError?.message || 'Not authenticated' };
  }

  // Profile + linked employee are independent reads — one round-trip, not two.
  // This runs on every page load (auth gates all routes), so it must stay lean.
  // Employee status is included so an Inactive record kills the session here
  // too (covers users deactivated while already logged in). Employee avatar
  // is included so the topbar shows the photo HR / Super Admin uploaded —
  // the users-table avatar stays null for employee logins otherwise.
  const [{ data: userData, error: userError }, { data: employeeData }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authData.user.id).single(),
    supabase.from('employees').select('id, status, avatar').eq('user_id', authData.user.id).maybeSingle(),
  ]);

  if (userError || !userData) {
    return { user: null, error: userError?.message || 'User profile not found' };
  }

  if ((employeeData as { status?: string } | null)?.status === 'Inactive') {
    // Clear the session so guards see a logged-out user immediately.
    await supabase.auth.signOut();
    return { user: null, error: DEACTIVATED_ACCOUNT_ERROR };
  }

  const employeeAvatar = (employeeData as { avatar?: string | null } | null)?.avatar || undefined;

  const user: User = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: (userData.role || 'employee') as UserRole,
    avatar: employeeAvatar || userData.avatar || undefined,
    employeeId: employeeData?.id || undefined,
  };

  return { user, error: null };
}

export async function updateProfile(data: { name: string; email: string; avatar?: string | null }): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: authData, error: userError } = await supabase.auth.getUser();

  if (userError || !authData.user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Update email in Auth if it changed
  if (data.email && data.email !== authData.user.email) {
    const { error: updateAuthError } = await supabase.auth.updateUser({ email: data.email });
    if (updateAuthError) {
      return { success: false, error: updateAuthError.message };
    }
  }

  // Update users table
  const { error: updateError } = await supabase
    .from('users')
    .update({
      name: data.name,
      email: data.email,
      avatar: data.avatar,
    })
    .eq('id', authData.user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
