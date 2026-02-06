"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/auth";

const POLL_INTERVAL_MS = 30_000;

/**
 * Polls the current user's `is_deactivated` flag every 30 seconds.
 * If deactivated, signs the user out and redirects to login with an error message.
 */
export function useDeactivationGuard() {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function checkDeactivation() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_deactivated")
        .eq("id", user.id)
        .single();

      if (profile?.is_deactivated) {
        // Stop polling immediately
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        await supabase.auth.signOut();
        router.push("/login?error=account_deactivated");
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
  }, [router]);
}
