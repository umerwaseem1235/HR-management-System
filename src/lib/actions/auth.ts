'use server';

import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';
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

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { user: null, error: authError?.message || 'Not authenticated' };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (userError || !userData) {
    return { user: null, error: userError?.message || 'User profile not found' };
  }

  // Find employee linked to this user
  const { data: employeeData } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', authData.user.id)
    .single();

  const user: User = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: (userData.role || 'employee') as UserRole,
    avatar: userData.avatar || undefined,
    employeeId: employeeData?.id || undefined,
  };

  return { user, error: null };
}
