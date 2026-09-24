import { NextResponse } from 'next/server';
import { autoCloseOpenAttendance } from '@/lib/actions/attendance';

/**
 * Midnight scheduler endpoint — closes previous days left open overnight.
 *
 *   GET /api/cron/close-attendance   (Authorization: Bearer <CRON_SECRET>
 *                                    or ?secret=<CRON_SECRET>)
 *
 * SCHEDULING (pick one, daily at 00:05):
 *   1. Vercel Cron — add to vercel.json:
 *        { "crons": [{ "path": "/api/cron/close-attendance?secret=$CRON_SECRET", "schedule": "5 0 * * *" }] }
 *      and set the CRON_SECRET env var in the Vercel dashboard.
 *   2. Any external cron (cron-job.org, GitHub Actions schedule, OS cron):
 *        curl -H "Authorization: Bearer <CRON_SECRET>" https://<host>/api/cron/close-attendance
 *   3. Supabase pg_cron calling the same URL with pg_net (self-hosted only;
 *      Supabase Cloud needs the HTTP call from outside).
 *
 * Backstop: even if no scheduler ever runs, the same rule is applied lazily
 * inside selfCheckInOut / checkInWithLocation on the employee's next
 * check-in, so open days are always eventually closed as Half Day.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not configured. Add it to .env.local (and hosting env) and restart.' },
      { status: 500 },
    );
  }

  const auth = req.headers.get('authorization');
  const url = new URL(req.url);
  const provided =
    (auth?.startsWith('Bearer ') ? auth.slice(7) : null) ||
    url.searchParams.get('secret') ||
    '';
  if (!provided || provided !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await autoCloseOpenAttendance();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Auto-close failed.' },
      { status: 500 },
    );
  }
}
