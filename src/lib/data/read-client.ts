/**
 * Client transport for read-only data: batches, de-duplicates and ships every
 * read issued in the same tick to `POST /api/data` as ONE request.
 *
 * Before: each read was a Server Action, and Next.js runs Server Actions one
 * at a time per client — a module loading 6 datasets paid 6 sequential round
 * trips, and background reads (avatars, notifications) queued in front of it.
 *
 * After: all reads fired while a view mounts (from any hook, context or
 * component) are coalesced into a single HTTP request that the server
 * fans out in parallel. Mutations remain Server Actions and are no longer
 * stuck behind reads either.
 */

import type { ReadName, ReadRegistry } from './read-registry';

const ENDPOINT = '/api/data';
/** Must stay ≤ MAX_CALLS_PER_BATCH in the route handler. */
const MAX_BATCH_SIZE = 32;

interface PendingCall {
  fn: ReadName;
  args: unknown[];
  /** Identity for de-duplication: same fn + same args → one server call. */
  signature: string;
  waiters: Array<{ resolve: (value: unknown) => void; reject: (reason: unknown) => void }>;
}

type ReadResult = { ok: true; data?: unknown } | { ok: false; error?: string };

let queue: PendingCall[] = [];
let bySignature = new Map<string, PendingCall>();
let flushScheduled = false;

/** Drops trailing `undefined`s so `fn()` and `fn(undefined)` share a signature. */
function trimArgs(args: unknown[]): unknown[] {
  let end = args.length;
  while (end > 0 && args[end - 1] === undefined) end--;
  return args.slice(0, end);
}

function scheduleFlush(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  // A macrotask (not a microtask) so every effect in the current React
  // commit — plus any immediately chained follow-up reads — joins the batch.
  setTimeout(flush, 0);
}

function flush(): void {
  flushScheduled = false;
  const calls = queue;
  queue = [];
  bySignature = new Map();
  for (let i = 0; i < calls.length; i += MAX_BATCH_SIZE) {
    void send(calls.slice(i, i + MAX_BATCH_SIZE));
  }
}

function settle(call: PendingCall, result: ReadResult | undefined): void {
  if (result && result.ok) {
    call.waiters.forEach((w) => w.resolve(result.data));
  } else {
    const message = (result && !result.ok && result.error) || 'Request failed';
    call.waiters.forEach((w) => w.reject(new Error(message)));
  }
}

async function send(calls: PendingCall[]): Promise<void> {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({ calls: calls.map(({ fn, args }) => ({ fn, args })) }),
    });

    if (!response.ok) {
      let message = response.status === 401 ? 'Not authenticated' : `Request failed (${response.status})`;
      try {
        const body = (await response.json()) as { message?: string };
        if (body?.message) message = body.message;
      } catch {
        // Non-JSON error body — keep the status-based message.
      }
      calls.forEach((c) => settle(c, { ok: false, error: message }));
      return;
    }

    const { results } = (await response.json()) as { results?: ReadResult[] };
    calls.forEach((c, i) => settle(c, results?.[i]));
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : 'Network error';
    calls.forEach((c) => settle(c, { ok: false, error: message }));
  }
}

function enqueue(fn: ReadName, rawArgs: unknown[]): Promise<unknown> {
  const args = trimArgs(rawArgs);
  const signature = `${fn}:${JSON.stringify(args)}`;
  return new Promise((resolve, reject) => {
    const existing = bySignature.get(signature);
    if (existing) {
      existing.waiters.push({ resolve, reject });
      return;
    }
    const call: PendingCall = { fn, args, signature, waiters: [{ resolve, reject }] };
    bySignature.set(signature, call);
    queue.push(call);
    scheduleFlush();
  });
}

/**
 * Typed client stub for a registered read. The returned function has the
 * exact signature of the server function, so call sites are unchanged.
 */
export function remoteRead<N extends ReadName>(name: N): ReadRegistry[N] {
  return ((...args: unknown[]) => enqueue(name, args)) as unknown as ReadRegistry[N];
}
