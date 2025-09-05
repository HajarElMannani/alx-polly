"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

/**
 * AuthProvider
 *
 *  React context provider that exposes the authenticated user, loading state,
 * and helper methods to sign in, sign up, and sign out using Supabase.
 *  Single source of truth for auth consumed via `useAuth()` so state changes
 *  (e.g., sign in/out, tab refresh) propagate throughout the app.
 *  Browser environment with configured Supabase env vars; serverless
 * data fetching is not performed here since this is a client provider.
 *  Missing env vars returns a null client and gracefully disables requests;
 * unsubscribe on unmount prevents state updates after teardown.
 *  Used by `ProtectedRoute`, login/register pages, profile, navbar, and
 * any UI displaying user info or requiring gated access.
 */
export type AuthContextValue = {
  user: { id: string; email: string | null; username?: string | null } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * useAuth
 *
 * Purpose: Convenience hook to access the current auth context value.
 * Context: Guarantees usage inside `AuthProvider` and throws otherwise.
 * Assumptions: Component tree includes `AuthProvider` higher up.
 * Edge cases: Calling outside provider raises an error to prevent undefined behavior.
 * Interactions: Common entrypoint for pages, guards, and UI controls to invoke auth actions.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = supabaseBrowser();
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track mount status so we don't set state after unmount.
    let isMounted = true;
    const init = async () => {
      // If Supabase is not configured, skip network calls and stop loading.
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(
        data.user
          ? {
              id: data.user.id,
              email: data.user.email ?? null,
              username: (data.user.user_metadata as any)?.username ?? null,
            }
          : null
      );
      setLoading(false);
    };
    init();
    if (!supabase) return;
    // Subscribe to Supabase auth changes to keep UI in sync across tabs/actions.
    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const u = session?.user;
      setUser(
        u
          ? { id: u.id, email: u.email ?? null, username: (u.user_metadata as any)?.username ?? null }
          : null
      );
    });
    return () => {
      isMounted = false;
      sub?.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    // Surface a friendly error if the client is unavailable.
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Persist `username` so we can show richer UI beyond email.
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error: error?.message };
  };

  const signOut = async () => {
    try {
      await supabase?.auth.signOut();
    } finally {
      // Always clear local state so UI updates immediately
      // (even if the network request errors or is slow).
      setUser(null);
    }
  };

  const value: AuthContextValue = { user, loading, signIn, signUp, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
