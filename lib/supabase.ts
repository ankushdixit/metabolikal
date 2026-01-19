import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { validateEnv, validateClientEnv, getEnvSafe } from "./env";

/**
 * Supabase client configuration
 *
 * This module provides Supabase client instances for both server-side
 * and client-side usage. Environment validation ensures the client
 * only initializes with valid configuration.
 */

// Singleton instances
let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

/**
 * Creates a Supabase client for server-side usage.
 * Uses the full environment validation to ensure all required vars are present.
 *
 * @throws Error if required environment variables are missing
 */
export function createServerSupabaseClient(): SupabaseClient {
  if (serverClient) {
    return serverClient;
  }

  const env = validateEnv();

  serverClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}

/**
 * Creates a Supabase client for browser/client-side usage.
 * Uses only NEXT_PUBLIC_ environment variables.
 *
 * @throws Error if required NEXT_PUBLIC_ environment variables are missing
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const env = validateClientEnv();

  browserClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return browserClient;
}

/**
 * Get the appropriate Supabase client based on the environment.
 * Automatically detects server vs browser context.
 */
export function getSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return createServerSupabaseClient();
  }
  return createBrowserSupabaseClient();
}

/**
 * Tests database connectivity by performing a simple query.
 * Returns true if the database is reachable, false otherwise.
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const env = getEnvSafe();
    if (!env) {
      return false;
    }

    const client = createServerSupabaseClient();

    // Perform a simple query to test connectivity
    // Using a raw RPC call to check database connection
    const { error } = await client.from("_health_check").select("*").limit(1);

    // If the table doesn't exist, that's fine - we just care about connectivity
    // A connection error would be different from a "relation does not exist" error
    if (error) {
      // PGRST116 = relation does not exist, which means DB is connected but table doesn't exist
      // This is acceptable for a health check
      if (error.code === "PGRST116" || error.code === "42P01") {
        return true;
      }
      // For any other errors, try a simpler approach
      // Check if we can at least reach the database
      const { error: rpcError } = await client.rpc("version");
      if (rpcError) {
        // If version RPC fails, it might not be installed - try one more thing
        // Just verify the client was created successfully and can make any request
        return error.message.includes("does not exist");
      }
      return true;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Resets the singleton instances (useful for testing)
 */
export function resetSupabaseClients(): void {
  serverClient = null;
  browserClient = null;
}

// Export the client for use with Refine data provider
export const supabaseClient = getSupabaseClient;
