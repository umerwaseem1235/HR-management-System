import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { READ_REGISTRY, isReadName } from '@/lib/data/read-registry';

/**
 * Batched read endpoint — `POST /api/data`.
 *
 * Body:     { calls: [{ fn: ReadName, args: unknown[] }, ...] }
 * Response: { results: [{ ok: true, data } | { ok: false, error }, ...] }
 *
 * Every read issued by the client in the same tick arrives here as one
 * request and runs concurrently, instead of queueing behind each other as
 * Server Actions do. Results are positional and independent: one failing
 * read never fails its siblings.
 *
 * `/api/*` is excluded from `proxy.ts`, so the session check happens here,
 * once per batch (`getClaims()` verifies the JWT locally with asymmetric
 * signing keys and refreshes an expired session before the reads run, so
 * parallel reads never race to refresh the same token).
 */

/** Upper bound per request; the client chunks larger batches. */
const MAX_CALLS_PER_BATCH = 32;

type ReadResult = { ok: true; data: unknown } | { ok: false; error: string };

interface IncomingCall {
  fn?: unknown;
  args?: unknown;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Request failed';
}

/**
 * JSON has no `undefined`: the client sends a skipped optional argument as
 * `null`. Restore it so defaulted parameters (`days = 7`) behave exactly as
 * they did when called directly as a Server Action.
 */
function normalizeArgs(args: unknown): unknown[] {
  if (!Array.isArray(args)) return [];
  return args.map((a) => (a === null ? undefined : a));
}

export async function POST(request: NextRequest) {
  let body: { calls?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const calls = body?.calls;
  if (!Array.isArray(calls) || calls.length === 0 || calls.length > MAX_CALLS_PER_BATCH) {
    return NextResponse.json({ message: 'Invalid batch' }, { status: 400 });
  }

  // One session check (and token refresh, if needed) for the whole batch.
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const results = await Promise.all(
    (calls as IncomingCall[]).map(async ({ fn, args }): Promise<ReadResult> => {
      if (!isReadName(fn)) {
        return { ok: false, error: `Unknown data source: ${String(fn)}` };
      }
      const read = READ_REGISTRY[fn] as (...a: unknown[]) => Promise<unknown>;
      try {
        return { ok: true, data: await read(...normalizeArgs(args)) };
      } catch (err) {
        return { ok: false, error: errorMessage(err) };
      }
    }),
  );

  return NextResponse.json(
    { results },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
