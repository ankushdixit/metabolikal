"use client";

import { Refine, type DataProvider } from "@refinedev/core";
import {
  refineDataProvider,
  refineRouterProvider,
  refineResources,
  refineOptions,
  refineAuthProvider,
} from "@/lib/refine";

/**
 * Placeholder data provider for when Supabase is not configured.
 * This allows the app to build and run without throwing during SSR/build.
 */
const placeholderDataProvider: DataProvider = {
  getList: async ({ resource }) => {
    throw new Error(
      `Supabase not configured. Attempted getList for "${resource}". ` +
        `Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.`
    );
  },
  getOne: async ({ resource, id }) => {
    throw new Error(
      `Supabase not configured. Attempted getOne for "${resource}" with id "${id}". ` +
        `Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.`
    );
  },
  create: async ({ resource }) => {
    throw new Error(
      `Supabase not configured. Attempted create for "${resource}". ` +
        `Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.`
    );
  },
  update: async ({ resource, id }) => {
    throw new Error(
      `Supabase not configured. Attempted update for "${resource}" with id "${id}". ` +
        `Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.`
    );
  },
  deleteOne: async ({ resource, id }) => {
    throw new Error(
      `Supabase not configured. Attempted deleteOne for "${resource}" with id "${id}". ` +
        `Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.`
    );
  },
  getApiUrl: () => "",
};

/**
 * Refine Provider Component
 * Wraps the application with Refine context and configuration.
 *
 * React Query defaults are passed via Refine's reactQuery.clientConfig:
 * - staleTime: 2 minutes — data is considered fresh, no refetch on mount
 * - gcTime: 5 minutes — cached data garbage collected after 5 min of no observers
 * - refetchOnWindowFocus: false — don't refetch when user switches back to tab
 * - retry: 1 — retry failed queries once before surfacing the error
 *
 * Individual hooks can override these defaults with their own queryOptions.
 */
export function RefineProvider({ children }: { children: React.ReactNode }) {
  // Use the configured data provider or fallback to placeholder
  const dataProvider = refineDataProvider ?? placeholderDataProvider;

  return (
    <Refine
      dataProvider={dataProvider}
      authProvider={refineAuthProvider}
      routerProvider={refineRouterProvider}
      resources={refineResources}
      options={{
        ...refineOptions,
        reactQuery: {
          clientConfig: {
            defaultOptions: {
              queries: {
                staleTime: 2 * 60 * 1000,
                gcTime: 5 * 60 * 1000,
                refetchOnWindowFocus: false,
                retry: 1,
              },
            },
          },
        },
      }}
    >
      {children}
    </Refine>
  );
}
