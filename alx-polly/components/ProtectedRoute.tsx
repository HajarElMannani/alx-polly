"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

/**
 * ProtectedRoute
 *
 *  Client-side guard that renders children only when the user is authenticated.
 *  Used around private pages such as profile and poll creation/editing.
 *  Supabase env vars indicate whether redirects should occur.
 *  In environments without env vars, redirection is skipped to support
 *  previews and local demos; loading state renders a placeholder to avoid flashes.
 *  Consumes `useAuth()` and coordinates with Next.js router for redirects.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Only redirect when Supabase is configured; otherwise allow SSR previews/local demos.
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  // While redirecting, render nothing to avoid content flash.
  if (!user && (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) return null;

  return <>{children}</>;
}
