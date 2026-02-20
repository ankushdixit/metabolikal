"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { resetUser } from "@/lib/posthog";

interface AuthProfile {
  avatar_url: string | null;
  full_name: string | null;
  role: string;
  // Plan-related fields used by PlanCycleProvider (Task 1.4)
  plan_duration_days: number | null;
  plan_start_date: string | null;
  challenge_start_date: string | null;
  current_plan_cycle: number | null;
  created_at: string | null;
}

export type { AuthProfile };

/**
 * Module-level auth state cache for non-React consumers (e.g., Refine authProvider).
 * Populated by AuthProvider on every state change. Avoids redundant getUser() calls.
 */
export const authStateCache = {
  userId: null as string | null,
  profile: null as AuthProfile | null,
  isLoading: true,
};

interface AuthContextValue {
  userId: string | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let didTimeout = false;
    // Track which user the initial getUser() fetched, so onAuthStateChange
    // can skip the redundant SIGNED_IN event that fires immediately after.
    let fetchedUserId: string | null = null;

    // Safety timeout — if auth takes too long, stop loading and let the user retry
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      setIsLoading(false);
      setAuthError("Authentication timed out. Please refresh the page.");
    }, 10_000);

    // Initial fetch
    supabase.auth
      .getUser()
      .then(async ({ data }: { data: { user: { id: string } | null } }) => {
        if (didTimeout) return;
        clearTimeout(timeoutId);

        if (data.user) {
          fetchedUserId = data.user.id;
          setUserId(data.user.id);

          try {
            const { data: profileData } = await supabase
              .from("profiles")
              .select(
                "avatar_url, full_name, role, plan_duration_days, plan_start_date, challenge_start_date, current_plan_cycle, created_at"
              )
              .eq("id", data.user.id)
              .single();

            if (profileData) {
              setProfile({
                avatar_url: profileData.avatar_url,
                full_name: profileData.full_name,
                role: profileData.role,
                plan_duration_days: profileData.plan_duration_days ?? null,
                plan_start_date: profileData.plan_start_date ?? null,
                challenge_start_date: profileData.challenge_start_date ?? null,
                current_plan_cycle: profileData.current_plan_cycle ?? null,
                created_at: profileData.created_at ?? null,
              });
            }
          } catch (err) {
            console.error("Failed to fetch profile:", err);
            // User is authenticated but profile fetch failed — keep userId, skip profile
          }
        }
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (didTimeout) return;
        clearTimeout(timeoutId);
        console.error("Auth getUser failed:", err);
        setIsLoading(false);
        setAuthError("Failed to verify authentication. Please refresh.");
      });

    // Listen for auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user: { id: string } } | null) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          setUserId(null);
          setProfile(null);
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          // Profile data hasn't changed — just update userId in case it differs
          setUserId(session.user.id);
          return;
        }

        if (event === "SIGNED_IN") {
          // Skip if the initial getUser() already fetched this user's profile
          if (fetchedUserId === session.user.id) return;

          setUserId(session.user.id);

          try {
            const { data: profileData } = await supabase
              .from("profiles")
              .select(
                "avatar_url, full_name, role, plan_duration_days, plan_start_date, challenge_start_date, current_plan_cycle, created_at"
              )
              .eq("id", session.user.id)
              .single();

            if (profileData) {
              setProfile({
                avatar_url: profileData.avatar_url,
                full_name: profileData.full_name,
                role: profileData.role,
                plan_duration_days: profileData.plan_duration_days ?? null,
                plan_start_date: profileData.plan_start_date ?? null,
                challenge_start_date: profileData.challenge_start_date ?? null,
                current_plan_cycle: profileData.current_plan_cycle ?? null,
                created_at: profileData.created_at ?? null,
              });
            }
          } catch (err) {
            console.error("Failed to fetch profile on auth change:", err);
          }
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Task 0.2: Timeout-protected signOut with PostHog reset
  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();

    // Race signOut against a timeout — don't let it hang forever
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Sign out timed out")), 5000)),
      ]);
    } catch (err) {
      console.error("Sign out error:", err);
      // Force redirect even if the server call failed/timed out
    }

    // Reset PostHog identity before redirect
    resetUser();

    // Always redirect, even if signOut() threw/timed out
    window.location.href = "/login";
  }, []);

  // Sync to module-level cache so non-React consumers (Refine authProvider) can read
  useEffect(() => {
    authStateCache.userId = userId;
    authStateCache.profile = profile;
    authStateCache.isLoading = isLoading;
  }, [userId, profile, isLoading]);

  const value = useMemo<AuthContextValue>(
    () => ({ userId, profile, isLoading, authError, signOut }),
    [userId, profile, isLoading, authError, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Like useAuth() but returns null instead of throwing when outside AuthProvider.
 * Use this in hooks/components that may render both inside and outside AuthProvider.
 */
export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext) ?? null;
}
