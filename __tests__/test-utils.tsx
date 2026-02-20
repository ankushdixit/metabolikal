/**
 * Shared test utilities, provider wrappers, and mock factories.
 *
 * Usage:
 *   import { renderWithProviders, createMockProfile, createMockSupabaseClient } from '@/__tests__/test-utils';
 */
import React, { type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import type { AuthProfile } from "@/contexts/auth-context";
import type { Profile } from "@/lib/database.types";
import type { UserRole } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Mock Factories
// ---------------------------------------------------------------------------

/** Create a realistic AuthProfile (the slimmed-down shape from AuthContext). */
export function createMockAuthProfile(overrides?: Partial<AuthProfile>): AuthProfile {
  return {
    avatar_url: null,
    full_name: "Test User",
    role: "client",
    plan_duration_days: 90,
    plan_start_date: "2026-01-01",
    challenge_start_date: null,
    current_plan_cycle: 1,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/** Create a full database Profile row. */
export function createMockProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: "user-123",
    email: "test@example.com",
    full_name: "Test User",
    phone: null,
    role: "client" as UserRole,
    avatar_url: null,
    date_of_birth: "1990-01-01",
    gender: "male",
    address: null,
    invited_at: null,
    invitation_accepted_at: null,
    is_deactivated: false,
    deactivated_at: null,
    deactivation_reason: null,
    plan_start_date: "2026-01-01",
    plan_duration_days: 90,
    current_plan_cycle: 1,
    challenge_start_date: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/** Create a chainable mock Supabase client that can be customised per-test. */
export function createMockSupabaseClient(overrides?: {
  user?: { id: string } | null;
  profileData?: Record<string, unknown> | null;
  profileError?: { message: string } | null;
  fromOverrides?: Record<string, unknown>;
}) {
  const user = overrides?.user ?? null;
  const profileData = overrides?.profileData ?? null;
  const profileError = overrides?.profileError ?? null;

  const chainable = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: profileData,
      error: profileError,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: profileData,
      error: profileError,
    }),
    then: undefined as unknown, // allow async resolution of chain itself
  };

  // Make the chain awaitable (for queries without .single())
  const resolvedChain = { data: profileData ? [profileData] : [], error: profileError };
  chainable.then = jest.fn((resolve: (v: unknown) => void) => resolve(resolvedChain));

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: user ? { user } : null },
        error: null,
      }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user, session: user ? { user } : null },
        error: null,
      }),
      admin: {
        inviteUserByEmail: jest.fn().mockResolvedValue({
          data: { user: { id: "invited-user-id" } },
          error: null,
        }),
      },
    },
    from: jest.fn(() => ({ ...chainable, ...overrides?.fromOverrides })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
}

/** Create a mock Request for API route testing. */
export function createMockRequest(
  url: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
) {
  return new Request(url, {
    method: options?.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

/** Create a mock timeline item matching the shape from use-timeline-data. */
export function createMockTimelineItem(overrides?: Record<string, unknown>) {
  return {
    id: "item-1",
    type: "diet" as const,
    title: "Breakfast",
    subtitle: "Oatmeal with berries",
    startTime: "08:00",
    endTime: "08:30",
    isCompleted: false,
    schedulingType: "fixed" as const,
    period: "morning" as const,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Provider Wrappers
// ---------------------------------------------------------------------------

/**
 * A minimal AuthContext mock provider for tests that need auth context
 * but don't want to test AuthProvider itself.
 */
interface MockAuthProviderProps {
  children: ReactNode;
  value?: {
    userId?: string | null;
    profile?: AuthProfile | null;
    isLoading?: boolean;
    authError?: string | null;
    signOut?: () => Promise<void>;
  };
}

// We re-export this to avoid tests needing to set up the full context manually.
// Instead of importing AuthContext directly (which isn't exported), we create
// a simple wrapper that mimics the same shape.
export function MockAuthProvider({ children, value }: MockAuthProviderProps) {
  // Note: This wrapper documents the expected auth context shape for consistency.
  // Tests that need AuthProvider should mock `@/lib/auth` at the module level.
  // The simplest approach: mock useAuth() in each test file.
  void value; // consumed by callers for documentation; actual injection is via jest.mock
  return <>{children}</>;
}

// For tests needing a basic wrapper (e.g., QueryClient for React Query)
export function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <>{children}</>;
  };
}

/**
 * Render with a basic wrapper. Extend this as needed for more providers.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: createWrapper(), ...options });
}

// ---------------------------------------------------------------------------
// Assertion Helpers
// ---------------------------------------------------------------------------

/** Assert a JSON response has the expected status and body shape. */
export async function expectJsonResponse(
  response: Response,
  expectedStatus: number,
  expectedBodyMatch?: Record<string, unknown>
) {
  expect(response.status).toBe(expectedStatus);
  if (expectedBodyMatch) {
    const body = await response.json();
    expect(body).toMatchObject(expectedBodyMatch);
  }
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------
export { render, screen, waitFor, act } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
