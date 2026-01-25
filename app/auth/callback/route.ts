import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth callback handler for Supabase
 * Handles email confirmation, password reset, and invite acceptance
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const type = requestUrl.searchParams.get("type"); // 'recovery', 'signup', 'invite', etc.

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      // Redirect to login with error
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // If user successfully authenticated, check profile status
    let isInvitedUser = false;
    if (data.user) {
      try {
        // Check profile status including deactivation and invitation
        const { data: profile } = await supabase
          .from("profiles")
          .select("invited_at, invitation_accepted_at, is_deactivated, role")
          .eq("id", data.user.id)
          .single();

        // Block deactivated users from logging in (except admins)
        if (profile?.is_deactivated && profile?.role !== "admin") {
          // Sign out the deactivated user
          await supabase.auth.signOut();
          return NextResponse.redirect(
            new URL("/login?error=account_deactivated", requestUrl.origin)
          );
        }

        // If user was invited but hasn't accepted yet, mark as accepted
        if (profile?.invited_at && !profile?.invitation_accepted_at) {
          isInvitedUser = true;
          await supabase
            .from("profiles")
            .update({ invitation_accepted_at: new Date().toISOString() })
            .eq("id", data.user.id);
        }
      } catch (profileError) {
        // Log but don't fail the auth flow
        console.error("Error checking profile status:", profileError);
      }
    }

    // For password recovery or newly invited users, redirect to password setup page
    if (type === "recovery" || isInvitedUser) {
      const message = isInvitedUser
        ? "Welcome! Please set your password to complete your account setup."
        : "";
      const redirectUrl = new URL("/reset-password", requestUrl.origin);
      if (message) {
        redirectUrl.searchParams.set("message", message);
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect to the next page (dashboard by default)
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
