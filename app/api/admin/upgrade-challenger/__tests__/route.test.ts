/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { POST } from "../route";
import * as authServerModule from "@/lib/auth-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  isAdmin: jest.fn(),
  getUser: jest.fn(),
}));

// Mock @supabase/supabase-js
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

describe("POST /api/admin/upgrade-challenger", () => {
  const mockIsAdmin = authServerModule.isAdmin as jest.MockedFunction<
    typeof authServerModule.isAdmin
  >;
  const mockGetUser = authServerModule.getUser as jest.MockedFunction<
    typeof authServerModule.getUser
  >;
  const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
    typeof createSupabaseClient
  >;

  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up env
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    };
    // Default: getUser returns an admin user
    mockGetUser.mockResolvedValue({ id: "admin-user-id" } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const VALID_CHALLENGER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const ADMIN_USER_ID = "admin-user-id";

  const VALID_BODY = {
    challenger_id: VALID_CHALLENGER_ID,
    full_name: "Jane Challenger",
    email: "jane@example.com",
    plan_start_date: "2026-03-01",
    plan_duration_days: 60,
  };

  const createMockRequest = (body: Record<string, unknown>) => {
    return new Request("http://localhost:3000/api/admin/upgrade-challenger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  // ---------------------------------------------------------------------------
  // Helper: build a mock Supabase admin client with configurable per-table behavior
  // ---------------------------------------------------------------------------
  const buildMockAdminClient = (overrides?: {
    profileSelectResult?: { data: unknown; error: unknown };
    profileUpdateResult?: { error: unknown };
    planCyclesInsertResult?: { error: unknown };
    clientConditionsInsertResult?: { error: unknown };
    notificationsInsertResult?: { error: unknown };
  }) => {
    const defaults = {
      profileSelectResult: {
        data: {
          id: VALID_CHALLENGER_ID,
          email: "jane@example.com",
          role: "challenger",
          plan_start_date: "2026-01-15",
          created_at: "2026-01-10T00:00:00Z",
        },
        error: null,
      },
      profileUpdateResult: { error: null },
      planCyclesInsertResult: { error: null },
      clientConditionsInsertResult: { error: null },
      notificationsInsertResult: { error: null },
    };
    const cfg = { ...defaults, ...overrides };

    const mockClient = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(cfg.profileSelectResult),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(cfg.profileUpdateResult),
            }),
          };
        }
        if (table === "plan_cycles") {
          return {
            insert: jest.fn().mockResolvedValue(cfg.planCyclesInsertResult),
          };
        }
        if (table === "client_conditions") {
          return {
            insert: jest.fn().mockResolvedValue(cfg.clientConditionsInsertResult),
          };
        }
        if (table === "notifications") {
          return {
            insert: jest.fn().mockResolvedValue(cfg.notificationsInsertResult),
          };
        }
        return {};
      }),
    };

    return mockClient;
  };

  // ===========================================================================
  // Authentication
  // ===========================================================================
  describe("Authentication", () => {
    it("returns 401 when user is not admin", async () => {
      mockIsAdmin.mockResolvedValue(false);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized. Admin access required.");
    });
  });

  // ===========================================================================
  // Validation
  // ===========================================================================
  describe("Validation", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 400 when challenger_id is missing", async () => {
      const request = createMockRequest({
        full_name: "Jane",
        email: "jane@example.com",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "challenger_id" })])
      );
    });

    it("returns 400 when full_name is missing", async () => {
      const request = createMockRequest({
        challenger_id: VALID_CHALLENGER_ID,
        email: "jane@example.com",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "full_name" })])
      );
    });

    it("returns 400 when email is missing", async () => {
      const request = createMockRequest({
        challenger_id: VALID_CHALLENGER_ID,
        full_name: "Jane",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "email" })])
      );
    });

    it("returns 400 when email is invalid", async () => {
      const request = createMockRequest({
        challenger_id: VALID_CHALLENGER_ID,
        full_name: "Jane",
        email: "not-an-email",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });
  });

  // ===========================================================================
  // Server configuration
  // ===========================================================================
  describe("Server configuration", () => {
    it("returns 500 when SUPABASE_SERVICE_ROLE_KEY is not set", async () => {
      mockIsAdmin.mockResolvedValue(true);
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Server configuration error");
    });
  });

  // ===========================================================================
  // Challenger not found
  // ===========================================================================
  describe("Challenger not found", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 404 when challenger profile does not exist", async () => {
      const mockClient = buildMockAdminClient({
        profileSelectResult: { data: null, error: { message: "not found" } },
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Challenger not found");
    });
  });

  // ===========================================================================
  // Non-challenger rejection
  // ===========================================================================
  describe("Non-challenger rejection", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 400 when user is already a client", async () => {
      const mockClient = buildMockAdminClient({
        profileSelectResult: {
          data: {
            id: VALID_CHALLENGER_ID,
            email: "jane@example.com",
            role: "client",
            plan_start_date: "2026-01-15",
            created_at: "2026-01-10T00:00:00Z",
          },
          error: null,
        },
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User is already a client, not a challenger");
    });

    it("returns 400 when user is an admin", async () => {
      const mockClient = buildMockAdminClient({
        profileSelectResult: {
          data: {
            id: VALID_CHALLENGER_ID,
            email: "admin@example.com",
            role: "admin",
            plan_start_date: null,
            created_at: "2026-01-10T00:00:00Z",
          },
          error: null,
        },
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User is already a admin, not a challenger");
    });
  });

  // ===========================================================================
  // Happy path
  // ===========================================================================
  describe("Happy path", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("upgrades challenger and returns success message", async () => {
      const mockClient = buildMockAdminClient();
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Jane Challenger upgraded to client successfully.");
    });

    it("calls profile update with correct upgrade fields", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_CHALLENGER_ID,
                      email: "jane@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          if (table === "plan_cycles") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          if (table === "notifications") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      await POST(request);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "client",
          full_name: "Jane Challenger",
          plan_start_date: "2026-03-01",
          plan_duration_days: 60,
          current_plan_cycle: 1,
          challenge_start_date: "2026-01-15", // preserved from existing plan_start_date
        })
      );
    });

    it("preserves challenge_start_date from existing plan_start_date", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_CHALLENGER_ID,
                      email: "jane@example.com",
                      role: "challenger",
                      plan_start_date: "2026-02-01",
                      created_at: "2026-01-05T12:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          if (table === "plan_cycles") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          if (table === "notifications") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      await POST(request);

      const updateArg = updateMock.mock.calls[0][0];
      expect(updateArg.challenge_start_date).toBe("2026-02-01");
    });

    it("falls back to created_at date when plan_start_date is null", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_CHALLENGER_ID,
                      email: "jane@example.com",
                      role: "challenger",
                      plan_start_date: null,
                      created_at: "2026-01-20T14:30:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          if (table === "plan_cycles") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          if (table === "notifications") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      await POST(request);

      const updateArg = updateMock.mock.calls[0][0];
      expect(updateArg.challenge_start_date).toBe("2026-01-20");
    });

    it("includes optional fields (phone, dob, gender, address) when provided", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_CHALLENGER_ID,
                      email: "jane@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          if (table === "plan_cycles") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          if (table === "notifications") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({
        ...VALID_BODY,
        phone: "+1234567890",
        date_of_birth: "1990-05-15",
        gender: "female",
        address: "123 Main St",
      });
      await POST(request);

      const updateArg = updateMock.mock.calls[0][0];
      expect(updateArg.phone).toBe("+1234567890");
      expect(updateArg.date_of_birth).toBe("1990-05-15");
      expect(updateArg.gender).toBe("female");
      expect(updateArg.address).toBe("123 Main St");
    });

    it("creates plan cycle with correct data", async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_CHALLENGER_ID,
                      email: "jane@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === "plan_cycles") {
            return { insert: insertMock };
          }
          if (table === "notifications") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      await POST(request);

      expect(insertMock).toHaveBeenCalledWith({
        client_id: VALID_CHALLENGER_ID,
        cycle_number: 1,
        start_date: "2026-03-01",
        duration_days: 60,
        status: "active",
      });
    });

    it("creates a notification for the upgraded user", async () => {
      const notifInsertMock = jest.fn().mockResolvedValue({ error: null });

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_CHALLENGER_ID,
                      email: "jane@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === "plan_cycles") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          if (table === "client_conditions") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          if (table === "notifications") {
            return { insert: notifInsertMock };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      await POST(request);

      expect(notifInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: VALID_CHALLENGER_ID,
          sender_id: ADMIN_USER_ID,
          type: "system",
          title: "Welcome to your personalized plan!",
        })
      );
      // Check that the message contains relevant info
      const notifArg = notifInsertMock.mock.calls[0][0];
      expect(notifArg.message).toContain("60-day plan");
      expect(notifArg.message).toContain("2026-03-01");
      expect(notifArg.message).toContain("challenge progress has been preserved");
    });

    it("inserts client conditions when condition_ids are provided", async () => {
      const conditionsInsertMock = jest.fn().mockResolvedValue({ error: null });

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_CHALLENGER_ID,
                      email: "jane@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === "plan_cycles") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          if (table === "client_conditions") {
            return { insert: conditionsInsertMock };
          }
          if (table === "notifications") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const conditionUuids = [
        "11111111-1111-4111-a111-111111111111",
        "22222222-2222-4222-a222-222222222222",
      ];
      const request = createMockRequest({
        ...VALID_BODY,
        condition_ids: conditionUuids,
      });
      await POST(request);

      expect(conditionsInsertMock).toHaveBeenCalledWith([
        {
          client_id: VALID_CHALLENGER_ID,
          condition_id: "11111111-1111-4111-a111-111111111111",
          created_by: ADMIN_USER_ID,
        },
        {
          client_id: VALID_CHALLENGER_ID,
          condition_id: "22222222-2222-4222-a222-222222222222",
          created_by: ADMIN_USER_ID,
        },
      ]);
    });

    it("uses default duration of 7 when plan_duration_days is not provided", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const planInsertMock = jest.fn().mockResolvedValue({ error: null });

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_CHALLENGER_ID,
                      email: "jane@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          if (table === "plan_cycles") {
            return { insert: planInsertMock };
          }
          if (table === "notifications") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      // Omit plan_duration_days from the body
      const request = createMockRequest({
        challenger_id: VALID_CHALLENGER_ID,
        full_name: "Jane Challenger",
        email: "jane@example.com",
        plan_start_date: "2026-03-01",
      });
      await POST(request);

      const updateArg = updateMock.mock.calls[0][0];
      expect(updateArg.plan_duration_days).toBe(7);

      expect(planInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_days: 7,
        })
      );
    });
  });

  // ===========================================================================
  // Partial success (non-fatal errors)
  // ===========================================================================
  describe("Partial success (non-fatal errors)", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("succeeds even when plan cycle insert fails (non-fatal)", async () => {
      const mockClient = buildMockAdminClient({
        planCyclesInsertResult: { error: { message: "Insert failed" } },
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      // The upgrade still succeeds despite plan cycle error
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("succeeds even when client conditions insert fails (non-fatal)", async () => {
      const mockClient = buildMockAdminClient({
        clientConditionsInsertResult: { error: { message: "Conditions insert failed" } },
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({
        ...VALID_BODY,
        condition_ids: ["11111111-1111-4111-a111-111111111111"],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("succeeds even when notification insert fails (non-fatal)", async () => {
      const mockClient = buildMockAdminClient({
        notificationsInsertResult: { error: { message: "Notification insert failed" } },
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ===========================================================================
  // Database errors (fatal)
  // ===========================================================================
  describe("Database errors (fatal)", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 500 when profile update fails", async () => {
      const mockClient = buildMockAdminClient({
        profileUpdateResult: { error: { message: "Permission denied" } },
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Failed to upgrade challenger");
      expect(data.error).toContain("Permission denied");
    });

    it("returns 500 on unexpected errors (e.g., JSON parse failure)", async () => {
      mockIsAdmin.mockResolvedValue(true);

      const request = new Request("http://localhost:3000/api/admin/upgrade-challenger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to upgrade challenger");
    });
  });
});
