'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';

const DOCUMENTS_BUCKET = 'documents';

export interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  employee: string;
  uploadedDate: string;
  expiryDate: string | null;
  status: string;
  fileData?: string;
  filePath?: string;
  fileName?: string;
}

function mapDoc(db: any): DocumentRecord {
  return {
    id: db.id,
    name: db.name,
    type: db.type,
    employee: db.employee,
    uploadedDate: db.uploaded_date,
    expiryDate: db.expiry_date,
    status: db.status,
    fileData: db.file_data || undefined,
    filePath: db.file_path || undefined,
    fileName: db.file_name || undefined,
  };
}

export async function getDocuments(): Promise<DocumentRecord[]> {
  const supabase = await createClient();
  // Lean list query: file_data holds base64 blobs (MBs per row) and is never
  // needed for the table — receipts resolve via signed URLs (file_path) or
  // fall back to file_data for legacy rows only. Excluding it keeps the
  // documents module paint fast even with hundreds of rows.
  const { data, error } = await supabase
    .from('documents')
    .select('id, name, type, employee, uploaded_date, expiry_date, status, file_path, file_name, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapDoc);
}

export async function createDocument(data: {
  name: string;
  type: string;
  employee: string;
  expiryDate?: string;
  fileData?: string;
  filePath?: string;
  fileName?: string;
  uploadedBy?: string;
}): Promise<DocumentRecord> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('documents')
    .insert([{
      name: data.name,
      type: data.type,
      employee: data.employee,
      expiry_date: data.expiryDate || null,
      status: 'Active',
      file_data: data.fileData || null,
      file_path: data.filePath || null,
      file_name: data.fileName || null,
      uploaded_by: data.uploadedBy || null,
    }])
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/documents');
  return mapDoc(row);
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .single();
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw new Error(error.message);
  // Best-effort cleanup of the bucket object; row delete already succeeded
  const path = (row as any)?.file_path as string | undefined;
  if (path) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
  }
  revalidatePath('/documents');
}

/** Short-lived download URL for a bucket-backed document. */
export async function getDocumentDownloadUrl(id: string): Promise<string> {
  const supabase = await createClient();
  const { data: row, error: rowErr } = await supabase
    .from('documents')
    .select('file_path, file_name')
    .eq('id', id)
    .single();
  if (rowErr || !(row as any)?.file_path) throw new Error('No file stored for this document');
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl((row as any).file_path, 120);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Failed to create download link');
  return data.signedUrl;
}
