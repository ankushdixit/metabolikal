import { z } from "zod";

/**
 * Environment variable validation schema
 *
 * This module validates all required environment variables at startup.
 * The application will fail fast with clear error messages if required
 * variables are missing or invalid.
 */

const envSchema = z.object({
  // Supabase configuration (server-side)
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),

  // Supabase configuration (client-side)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // Optional: Service role key for admin operations (server-side only)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates and returns environment variables.
 * Throws an error with a descriptive message if validation fails.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Environment validation failed:\n${errors}\n\nEnsure all required environment variables are set in .env.local`
    );
  }

  return result.data;
}

/**
 * Validates only the client-safe environment variables.
 * Use this for client-side code that only needs NEXT_PUBLIC_ variables.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validates and returns client-safe environment variables.
 * Throws an error with a descriptive message if validation fails.
 */
export function validateClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Client environment validation failed:\n${errors}\n\nEnsure all required NEXT_PUBLIC_ environment variables are set`
    );
  }

  return result.data;
}

/**
 * Get validated environment variables.
 * Returns null if validation fails (for use in optional contexts).
 * On the client side, only validates NEXT_PUBLIC_ variables since
 * server-side variables are not available in the browser.
 */
export function getEnvSafe(): Env | ClientEnv | null {
  try {
    // On the client, only validate client-safe environment variables
    if (typeof window !== "undefined") {
      return validateClientEnv();
    }
    return validateEnv();
  } catch {
    return null;
  }
}
