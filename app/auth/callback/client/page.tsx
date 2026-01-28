"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { Loader2 } from "lucide-react";

/**
 * Client-side auth callback handler
 * Handles invite links where tokens are returned in URL hash fragments
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserSupabaseClient();

      // Check for hash fragments (invite/magic link flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      // If we have tokens in the hash, set the session
      if (accessToken && refreshToken) {
        setStatus("Setting up your session...");
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setStatus("Authentication failed. Redirecting to login...");
          setTimeout(() => router.push(`/login?error=${encodeURIComponent(error.message)}`), 2000);
          return;
        }

        // Check if this is an invited user
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("invited_at, invitation_accepted_at, role")
            .eq("id", data.user.id)
            .single();

          const isInvitedUser = profile?.invited_at && !profile?.invitation_accepted_at;

          if (isInvitedUser) {
            // Mark invitation as accepted
            await supabase
              .from("profiles")
              .update({ invitation_accepted_at: new Date().toISOString() })
              .eq("id", data.user.id);

            setStatus("Welcome! Redirecting to password setup...");
            router.push(
              "/reset-password?message=Welcome! Please set your password to complete your account setup."
            );
            return;
          }
        }

        // Regular login - redirect to dashboard
        setStatus("Redirecting to dashboard...");
        router.push("/dashboard");
        return;
      }

      // Check for code in query params (PKCE flow)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        setStatus("Exchanging authorization code...");
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setStatus("Authentication failed. Redirecting to login...");
          setTimeout(() => router.push(`/login?error=${encodeURIComponent(error.message)}`), 2000);
          return;
        }

        // Check profile and redirect
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("invited_at, invitation_accepted_at, role")
            .eq("id", data.user.id)
            .single();

          const isInvitedUser = profile?.invited_at && !profile?.invitation_accepted_at;

          if (isInvitedUser) {
            await supabase
              .from("profiles")
              .update({ invitation_accepted_at: new Date().toISOString() })
              .eq("id", data.user.id);

            router.push(
              "/reset-password?message=Welcome! Please set your password to complete your account setup."
            );
            return;
          }
        }

        router.push("/dashboard");
        return;
      }

      // Try to get existing session (might have been set by Supabase automatically)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("invited_at, invitation_accepted_at, role")
          .eq("id", session.user.id)
          .single();

        const isInvitedUser = profile?.invited_at && !profile?.invitation_accepted_at;

        if (isInvitedUser) {
          await supabase
            .from("profiles")
            .update({ invitation_accepted_at: new Date().toISOString() })
            .eq("id", session.user.id);

          router.push(
            "/reset-password?message=Welcome! Please set your password to complete your account setup."
          );
          return;
        }

        router.push("/dashboard");
        return;
      }

      // No auth data found
      setStatus("No authentication data found. Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground font-bold">{status}</p>
      </div>
    </div>
  );
}
