'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { AuditLog } from '@/lib/types';

export async function getAuditLogs(): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    module: row.module,
    action: row.action,
    record: row.record,
    previousValue: row.previous_value,
    newValue: row.new_value,
    timestamp: row.created_at,
  }));
}

export async function getAuditLogsByModule(module: string): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('module', module)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    module: row.module,
    action: row.action,
    record: row.record,
    previousValue: row.previous_value,
    newValue: row.new_value,
    timestamp: row.created_at,
  }));
}

export async function createAuditLog(data: {
  userId?: string;
  userName: string;
  module: string;
  action: string;
  record: string;
  previousValue?: string;
  newValue?: string;
}): Promise<AuditLog> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: data.userId || null,
      user_name: data.userName,
      module: data.module,
      action: data.action,
      record: data.record,
      previous_value: data.previousValue,
      new_value: data.newValue
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: row.id,
    userId: row.user_id || '',
    userName: row.user_name || '',
    module: row.module,
    action: row.action,
    record: row.record || '',
    previousValue: row.previous_value || undefined,
    newValue: row.new_value || undefined,
    timestamp: row.created_at,
  };
}
