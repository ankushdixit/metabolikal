import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { UserRole, UserProfile, AuthResponse } from "./auth";

/**
 * Server-side Authentication utilities for METABOLI-K-AL
 *
 * This file contains server-only functions that must be called from
 * Server Components, Route Handlers, or Server Actions only.
 */

// =============================================================================
// Server-side Supabase Client
// =============================================================================

/**
 * Creates a Supabase client for server-side usage with cookie storage.
 * Must be called from a Server Component or Route Handler.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

// =============================================================================
// Session & User Functions
// =============================================================================

/**
 * Gets the current user session from the server.
 */
export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error.message);
    return null;
  }

  return session;
}

/**
 * Gets the current authenticated user from the server.
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }

  return user;
}

/**
 * Gets the user profile including role information.
 * Returns null if user is not authenticated.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (error) {
    console.error("Error getting user profile:", error.message);
    return null;
  }

  return data as UserProfile;
}

/**
 * Gets the user's role from their profile.
 */
export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getUserProfile();
  return profile?.role ?? null;
}

/**
 * Checks if the current user has admin role.
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

// =============================================================================
// Authentication Actions
// =============================================================================

/**
 * Signs in a user with email and password.
 * Returns the redirect path based on user role.
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  // Get user role for redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = (profile?.role as UserRole) ?? "client";
  const redirectTo = role === "admin" ? "/admin" : "/dashboard";

  return {
    success: true,
    redirectTo,
  };
}

/**
 * Signs up a new user with email, password, and full name.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    // Handle specific error cases
    if (error.message.includes("already registered")) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: "Registration failed. Please try again.",
    };
  }

  return {
    success: true,
    redirectTo: "/login?message=Account created. Please log in.",
  };
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(email: string): Promise<AuthResponse> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}

/**
 * Updates the user's password.
 */
export async function updatePassword(password: string): Promise<AuthResponse> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    redirectTo: "/login?message=Password reset successful",
  };
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<AuthResponse> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    redirectTo: "/login",
  };
}
