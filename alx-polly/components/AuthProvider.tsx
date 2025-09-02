"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export type AuthContextValue = {
  user: { id: string; email: string | null; username?: string | null } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
    let isMounted = true;
    const init = async () => {
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
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signUp = async (email: string, password: string, username: string) => {
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
      setUser(null);
    }
  };

  const value: AuthContextValue = { user, loading, signIn, signUp, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
