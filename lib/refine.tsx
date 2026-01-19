import routerProvider from "@refinedev/nextjs-router";
import { dataProvider } from "@refinedev/supabase";
import { getSupabaseClient } from "./supabase";
import { getEnvSafe } from "./env";

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
 */
export function createRefineDataProvider() {
  const env = getEnvSafe();

  // During build or when env is not configured, return null
  // This allows the app to build without failing
  if (!env) {
    return null;
  }

  const client = getSupabaseClient();
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
  // Add your resources here
  // See ARCHITECTURE.md for examples
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
