'use server';

import { createClient } from '@/lib/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { Notification } from '@/lib/types';

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    type: (row.type || 'info') as Notification['type'],
    read: row.read || false,
    createdAt: row.created_at,
    link: row.link,
  }));
}

export async function markAsRead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function markAllAsRead(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw new Error(error.message);
}

export async function createNotification(data: {
  userId?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}): Promise<Notification> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('notifications')
    .insert({
      user_id: data.userId, // can be null if broadcast, though db might require it
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      read: false,
      link: data.link
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: (row.type || 'info') as Notification['type'],
    read: row.read || false,
    createdAt: row.created_at,
    link: row.link || undefined,
  };
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error('SUPABASE_SECRET_KEY missing. Add it to .env.local and restart `npm run dev`.');
  }
  return createServiceClient(url, secret);
}

/** Auth-user ids of everyone with HR or admin role (uses service role since
 *  regular users can only read their own profile row). */
export async function getHrAdminUserIds(): Promise<string[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .in('role', ['hr_manager', 'super_admin']);
  if (error) throw new Error(error.message);
  return (data || []).map((u: { id: string }) => u.id);
}

/** Auth-user id linked to an employee record (employees.user_id). */
export async function getEmployeeUserId(employeeId: string): Promise<string | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from('employees')
    .select('user_id')
    .eq('id', employeeId)
    .single();
  if (error) return null;
  return (data?.user_id as string | null) || null;
}
