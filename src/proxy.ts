import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Never touch WebSocket upgrade requests (dev HMR at /_next/hmr, etc.).
  // Running getUser()/cookie logic on an upgrade returns a plain HTTP
  // response instead of `101 Switching Protocols`, which kills hot-reload
  // and leaves Turbopack serving a stale module graph.
  if (request.headers.get('upgrade')?.toLowerCase().includes('websocket')) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // If env vars are missing (e.g. fresh clone without .env.local),
  // don't crash every route — just skip session refresh with a clear warning.
  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      'Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local. See .env.example.'
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session when expired — required for server-side auth to work
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // api, static assets, images and the dev HMR websocket endpoints bypass
  // the Supabase session refresh entirely.
  matcher: ['/((?!api|_next/static|_next/image|_next/hmr|_next/webpack-hmr|favicon.ico).*)'],
};
