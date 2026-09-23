import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

let cachedClient: SupabaseClient<Database> | null = null

/**
 * Returns a cached Supabase browser client (singleton).
 * Safe to call from any component — always returns the same instance,
 * preventing duplicate realtime subscriptions and wasted memory.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'Supabase env vars missing in the browser. ' +
        'Make sure .env.local defines NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (NEXT_PUBLIC_ prefix is required for client components), ' +
        'then restart `npm run dev`.'
    )
  }

  // Reuse a single browser client to avoid multiple GoTrueClient instances.
  if (!cachedClient) {
    cachedClient = createBrowserClient<Database>(url, key)
  }
  return cachedClient
}
