import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export const supabaseBrowser = (): SupabaseClient | null => {
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
        storageKey: "alx-polly-auth",
      },
    });
  }
  return browserClient;
};
