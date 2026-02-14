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

interface AuthProfile {
  avatar_url: string | null;
  full_name: string | null;
  role: string;
}

interface AuthContextValue {
  userId: string | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Initial fetch
    supabase.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) {
        setUserId(data.user.id);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, full_name, role")
          .eq("id", data.user.id)
          .single();

        if (profileData) {
          setProfile({
            avatar_url: profileData.avatar_url,
            full_name: profileData.full_name,
            role: profileData.role,
          });
        }
      }
      setIsLoading(false);
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

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setUserId(session.user.id);

          const { data: profileData } = await supabase
            .from("profiles")
            .select("avatar_url, full_name, role")
            .eq("id", session.user.id)
            .single();

          if (profileData) {
            setProfile({
              avatar_url: profileData.avatar_url,
              full_name: profileData.full_name,
              role: profileData.role,
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    // Hard redirect — router.push can get swallowed by the re-render
    // triggered by onAuthStateChange clearing userId/profile state
    window.location.href = "/login";
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ userId, profile, isLoading, signOut }),
    [userId, profile, isLoading, signOut]
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
