/**
 * Integration test setup helpers.
 *
 * Integration tests run in the `node` Jest environment and test multi-step
 * flows by calling API route handlers directly with realistic mocked
 * Supabase responses.
 */

import { createMockSupabaseClient, createMockProfile } from "@/__tests__/test-utils";

/**
 * Create a mock admin Supabase client that returns different data
 * depending on which table is queried. Add table-specific overrides
 * to customise per-test.
 */
export function createMockAdminClient(tableOverrides?: Record<string, Record<string, unknown>>) {
  const baseClient = createMockSupabaseClient({
    user: { id: "admin-user-id" },
    profileData: createMockProfile({ role: "admin" }),
  });

  // Override from() to route by table name
  baseClient.from = jest.fn((table: string) => {
    const chainable = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      ...tableOverrides?.[table],
    };
    return chainable;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

  return baseClient;
}

/**
 * Build a Request object for testing API route handlers.
 */
export function buildRequest(
  path: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): Request {
  return new Request(`http://localhost:3000${path}`, {
    method: options?.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

/**
 * Parse a Response and return { status, body }.
 */
export async function parseResponse(response: Response) {
  const body = await response.json();
  return { status: response.status, body };
}
