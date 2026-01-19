"use client";

import { Refine, type DataProvider } from "@refinedev/core";
import {
  refineDataProvider,
  refineRouterProvider,
  refineResources,
  refineOptions,
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
 * Wraps the application with Refine context and configuration
 */
export function RefineProvider({ children }: { children: React.ReactNode }) {
  // Use the configured data provider or fallback to placeholder
  const dataProvider = refineDataProvider ?? placeholderDataProvider;

  return (
    <Refine
      dataProvider={dataProvider}
      routerProvider={refineRouterProvider}
      resources={refineResources}
      options={refineOptions}
    >
      {children}
    </Refine>
  );
}
