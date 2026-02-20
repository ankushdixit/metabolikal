"use client";

import { useEffect, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";

const POLL_INTERVAL_MS = 120_000; // 120 seconds (reduced from 30s — Task 1.3)

/**
 * Polls the current user's `is_deactivated` flag every 120 seconds.
 * If deactivated, signs the user out and redirects to login with an error message.
 *
 * Uses userId from AuthContext instead of calling getUser() every poll (Task 1.3).
 */
export function useDeactivationGuard() {
  const { userId, signOut } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserSupabaseClient();

    async function checkDeactivation() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_deactivated")
        .eq("id", userId!)
        .single();

      if (profile?.is_deactivated) {
        // Stop polling immediately
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // signOut() from AuthContext handles the redirect
        signOut();
      }
    }

    // Run once on mount, then poll
    checkDeactivation();
    intervalRef.current = setInterval(checkDeactivation, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, signOut]);
}
