import routerProvider from "@refinedev/nextjs-router";
import { dataProvider } from "@refinedev/supabase";
import type { AuthProvider } from "@refinedev/core";
import { getEnvSafe } from "./env";
import { createBrowserSupabaseClient, type UserRole } from "./auth";

/**
 * Refine configuration
 * This file centralizes all Refine-related configuration
 */

/**
 * Data Provider Configuration
 *
 * Configured to use Supabase as the data provider.
 * Ensure the following environment variables are set:
 * - SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Documentation: https://refine.dev/docs/data/data-provider/
 */

/**
 * Creates the Supabase data provider for Refine.
 * Returns null if environment is not configured (useful for build time).
 *
 * IMPORTANT: Uses the SSR-compatible client from lib/auth.ts to share
 * authentication session with the rest of the application.
 */
export function createRefineDataProvider() {
  const env = getEnvSafe();

  // During build or when env is not configured, return null
  // This allows the app to build without failing
  if (!env) {
    return null;
  }

  // Use the SSR-compatible client that shares auth cookies
  const client = createBrowserSupabaseClient();
  return dataProvider(client);
}

// Create the data provider instance
export const refineDataProvider = createRefineDataProvider();

/**
 * Router provider configuration
 * Integrates Refine with Next.js App Router
 */
export const refineRouterProvider = routerProvider;

/**
 * Auth Provider Configuration
 *
 * Handles authentication state for Refine components.
 * Uses Supabase Auth with role-based redirects.
 */
export const refineAuthProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Invalid email or password",
        },
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Invalid email or password",
        },
      };
    }

    // Get user profile including deactivation status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_deactivated")
      .eq("id", data.user.id)
      .single();

    const role = (profile?.role as UserRole) ?? "client";
    const isDeactivated = profile?.is_deactivated ?? false;

    // Block deactivated users from logging in (except admins)
    if (isDeactivated && role !== "admin") {
      // Sign out the deactivated user
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Your account has been deactivated. Please contact support.",
        },
      };
    }

    const redirectTo = role === "admin" ? "/admin" : "/dashboard";

    return {
      success: true,
      redirectTo,
    };
  },

  logout: async () => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          name: "LogoutError",
          message: error.message,
        },
      };
    }

    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },

  getPermissions: async () => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role ?? "client";
  },

  getIdentity: async () => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return {
        id: user.id,
        name: user.email,
        email: user.email,
      };
    }

    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      avatar: profile.avatar_url,
      role: profile.role,
    };
  },

  onError: async (error) => {
    return { error };
  },
};

/**
 * Resource definitions
 *
 * Define your resources here. Each resource maps to a backend endpoint.
 *
 * Example:
 * export const refineResources = [
 *   {
 *     name: "users",
 *     list: "/users",
 *     create: "/users/create",
 *     edit: "/users/edit/:id",
 *     show: "/users/show/:id",
 *     meta: { canDelete: true },
 *   },
 *   {
 *     name: "products",
 *     list: "/products",
 *     create: "/products/create",
 *     edit: "/products/edit/:id",
 *   },
 * ];
 */
export const refineResources: {
  name: string;
  list?: string;
  create?: string;
  edit?: string;
  show?: string;
  meta?: Record<string, unknown>;
}[] = [
  // Plan Templates
  {
    name: "plan_templates",
    list: "/admin/config/templates",
    create: "/admin/config/templates/create",
    edit: "/admin/config/templates/:id/edit",
    meta: { canDelete: true },
  },
  // Template item tables (no routes - managed through template editor)
  {
    name: "template_diet_items",
    meta: { canDelete: true },
  },
  {
    name: "template_supplement_items",
    meta: { canDelete: true },
  },
  {
    name: "template_workout_items",
    meta: { canDelete: true },
  },
  {
    name: "template_lifestyle_items",
    meta: { canDelete: true },
  },
];

/**
 * Refine options
 * Global configuration for Refine behavior
 */
export const refineOptions = {
  syncWithLocation: true,
  warnWhenUnsavedChanges: true,
  useNewQueryKeys: true,
  projectId: "refine-dashboard",
};
