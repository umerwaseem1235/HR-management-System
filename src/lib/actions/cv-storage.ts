'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const CV_BUCKET = 'candidate-cvs';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      'SUPABASE_SECRET_KEY missing. Add it (server-only, no NEXT_PUBLIC prefix) to .env.local and restart `npm run dev`.'
    );
  }
  return createServiceClient(url, secret);
}

async function ensureBucket(supabase: ReturnType<typeof serviceClient>) {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw new Error(listErr.message);
  if ((buckets || []).some(b => b.id === CV_BUCKET || b.name === CV_BUCKET)) return;
  const { error: createErr } = await supabase.storage.createBucket(CV_BUCKET, {
    public: false,
    fileSizeLimit: 10485760,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  });
  // Another request may have created it concurrently — only fail on real errors.
  if (createErr && !/already exists/i.test(createErr.message)) throw new Error(createErr.message);
}

/** Uploads a CV file to private Storage (bucket auto-created). Returns the stored path. */
export async function uploadCvFile(formData: FormData): Promise<string> {
  const file = formData.get('file');
  const rawPath = formData.get('path');
  if (!(file instanceof File) || file.size === 0) throw new Error('No CV file attached.');
  if (typeof rawPath !== 'string' || rawPath.length === 0) throw new Error('Upload path missing.');
  const supabase = serviceClient();
  await ensureBucket(supabase);
  const { error } = await supabase.storage.from(CV_BUCKET).upload(rawPath, file, { upsert: false });
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return rawPath;
}

/** Removes a stored CV file (best effort cleanup). */
export async function removeCvFile(path: string): Promise<void> {
  if (!path) return;
  const supabase = serviceClient();
  const { error } = await supabase.storage.from(CV_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

/** Creates a short-lived download link for a stored CV. */
export async function getCvDownloadUrl(path: string): Promise<string> {
  if (!path) throw new Error('No CV stored for this candidate.');
  const supabase = serviceClient();
  await ensureBucket(supabase);
  const { data, error } = await supabase.storage.from(CV_BUCKET).createSignedUrl(path, 120);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not generate download link.');
  return data.signedUrl;
}
