import { createBrowserClient } from "@supabase/ssr";
import { z } from "zod";

/**
 * Client-side Authentication utilities for METABOLI-K-AL
 *
 * This file contains client-safe exports that can be used in both
 * client and server components. Server-only functions are in auth-server.ts.
 */

// =============================================================================
// Validation Schemas
// =============================================================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// =============================================================================
// Types
// =============================================================================

export type UserRole = "admin" | "client" | "challenger";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

// =============================================================================
// Role Helper Functions
// =============================================================================

/**
 * Check if a user can access the client dashboard
 * Only clients and admins have access, challengers cannot
 */
export function canAccessDashboard(role: UserRole): boolean {
  return role === "admin" || role === "client";
}

/**
 * Check if a user can access the admin portal
 * Only admins have access
 */
export function canAccessAdmin(role: UserRole): boolean {
  return role === "admin";
}

/**
 * Check if a user is a challenger (free 30-day challenge participant)
 */
export function isChallenger(role: UserRole): boolean {
  return role === "challenger";
}

// =============================================================================
// Client-side Supabase Client
// =============================================================================

// Singleton instance for browser client to prevent connection exhaustion
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Mutex-based lock fallback for environments where Navigator Locks API
 * causes "signal is aborted without reason" errors.
 * Unlike a no-op, this properly serializes concurrent lock requests
 * to prevent race conditions on token refresh within a single tab.
 */
const fallbackLock = (() => {
  const locks = new Map<string, Promise<void>>();
  return async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
    const existing = locks.get(_name);
    if (existing) await existing;
    let resolve: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    locks.set(_name, promise);
    try {
      return await fn();
    } finally {
      resolve!();
      locks.delete(_name);
    }
  };
})();

/**
 * Creates a Supabase client for browser/client-side usage with cookie storage.
 * Safe to use in client components.
 *
 * Uses singleton pattern to prevent creating multiple connections.
 * Configured with lock settings to prevent "signal is aborted" errors.
 */
export function createBrowserSupabaseClient() {
  if (browserClientInstance) {
    return browserClientInstance;
  }

  browserClientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use mutex fallback instead of Navigator Locks to prevent "signal is aborted" errors
        lock: fallbackLock,
      },
    }
  );

  return browserClientInstance;
}
