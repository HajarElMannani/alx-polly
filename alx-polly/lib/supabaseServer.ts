import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase server-side client that forwards the user's access token from cookies.
 * Why: Server Actions and server components need an authenticated client without exposing tokens
 *  to the browser. We read the access token from cookies (if present) and attach it as a bearer
 *  token to all requests. If no token exists, the client behaves as anon.
 * Assumptions: Supabase sets an access token cookie (commonly 'sb-access-token').
 * Edge cases: Missing env vars or cookie → falls back to anon client; ensure RLS permits reads.
 * Connects: Used by server actions like create/edit poll and server-rendered pages.
 */
export function supabaseServer(
  cookieStore?: { get: (name: string) => { value: string } | undefined },
  accessTokenOverride?: string
): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) {
    throw new Error("Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  // Try common cookie names used by Supabase auth helpers. If not present, client will be anon.
  const accessToken =
    accessTokenOverride ||
    cookieStore?.get("sb-access-token")?.value ||
    cookieStore?.get("supabase-access-token")?.value ||
    undefined;

  return createClient(url, anon, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}


