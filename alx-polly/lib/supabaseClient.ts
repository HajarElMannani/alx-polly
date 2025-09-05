import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * supabaseBrowser
 *
 *  Lazily creates and returns a singleton Supabase client for browser usage.
 *  Shared client ensures consistent session state across components.
 *  Public URL and anon key exist in env; client-side runtime.
 *  Missing env values returns null and logs a console warning instead
 * of throwing, allowing static builds or demos to render.
 *  Consumed by auth provider, pages that read/write polls, and profile flows.
 */
export const supabaseBrowser = (): SupabaseClient | null => {
  /**
   * Why: Centralizes creation of a single browser Supabase client so
   *  the app shares session state and avoids repeated instantiation.
   * Assumptions: Only anon key is used in the browser; service-role keys are never exposed.
   * Edge cases: In dev without env vars, we warn and return null so the UI can still render.
   * Connects: Consumed by `AuthProvider`, forms that need user info, and lightweight reads.
   */
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) {
    if (typeof window !== "undefined") {
      console.warn(
        "Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(url, anon, {
      auth: {
        // Use a custom storage key so auth state doesn't clash with other apps on the same origin.
        storageKey: "alx-polly-auth",
      },
    });
  }
  return browserClient;
};
