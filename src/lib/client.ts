import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

let cachedClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Returns a cached Supabase browser client (singleton).
 * Safe to call from any component — always returns the same instance,
 * preventing duplicate realtime subscriptions and wasted memory.
 */
export function createClient() {
  if (!cachedClient) {
    cachedClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
  }
  return cachedClient
}
