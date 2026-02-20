/**
 * @jest-environment node
 */

import { POST } from "../route";
import * as authServerModule from "@/lib/auth-server";

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  isAdmin: jest.fn(),
  createServerSupabaseClient: jest.fn(),
}));

describe("POST /api/admin/deactivate-client", () => {
  const mockIsAdmin = authServerModule.isAdmin as jest.MockedFunction<
    typeof authServerModule.isAdmin
  >;
  const mockCreateServerSupabaseClient =
    authServerModule.createServerSupabaseClient as jest.MockedFunction<
      typeof authServerModule.createServerSupabaseClient
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return new Request("http://localhost:3000/api/admin/deactivate-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const VALID_USER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  // ---------------------------------------------------------------------------
  // Helper: build a mock Supabase client with configurable per-table behavior
  // ---------------------------------------------------------------------------
  const buildMockSupabase = (overrides?: {
    profileSelectResult?: { data: unknown; error: unknown };
    profileUpdateResult?: { error: unknown };
    planCyclesUpdateResult?: { error: unknown };
  }) => {
    const defaults = {
      profileSelectResult: {
        data: {
          id: VALID_USER_ID,
          role: "client",
          is_deactivated: false,
          full_name: "Jane Doe",
          email: "jane@example.com",
          current_plan_cycle: 2,
        },
        error: null,
      },
      profileUpdateResult: { error: null },
      planCyclesUpdateResult: { error: null },
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
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue(cfg.planCyclesUpdateResult),
              }),
            }),
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

      const request = createMockRequest({ userId: VALID_USER_ID });
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

    it("returns 400 when userId is missing", async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "userId" })])
      );
    });

    it("returns 400 when userId is not a valid UUID", async () => {
      const request = createMockRequest({ userId: "not-a-uuid" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
    });

    it("accepts request with only userId (reason is optional)", async () => {
      const mockClient = buildMockSupabase();
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("accepts request with userId and reason", async () => {
      const mockClient = buildMockSupabase();
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({
        userId: VALID_USER_ID,
        reason: "Non-payment",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ===========================================================================
  // User not found
  // ===========================================================================
  describe("User not found", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 404 when profile does not exist", async () => {
      const mockClient = buildMockSupabase({
        profileSelectResult: { data: null, error: { message: "not found" } },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User not found");
    });

    it("returns 404 when profile query returns error", async () => {
      const mockClient = buildMockSupabase({
        profileSelectResult: { data: null, error: { message: "DB error" } },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });

  // ===========================================================================
  // Prevent admin deactivation
  // ===========================================================================
  describe("Admin self-deactivation prevention", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 400 when trying to deactivate an admin user", async () => {
      const mockClient = buildMockSupabase({
        profileSelectResult: {
          data: {
            id: VALID_USER_ID,
            role: "admin",
            is_deactivated: false,
            full_name: "Admin User",
            email: "admin@example.com",
            current_plan_cycle: null,
          },
          error: null,
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Cannot deactivate admin users");
    });
  });

  // ===========================================================================
  // Already deactivated
  // ===========================================================================
  describe("Already deactivated client", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 400 when user is already deactivated", async () => {
      const mockClient = buildMockSupabase({
        profileSelectResult: {
          data: {
            id: VALID_USER_ID,
            role: "client",
            is_deactivated: true,
            full_name: "Jane Doe",
            email: "jane@example.com",
            current_plan_cycle: 1,
          },
          error: null,
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User is already deactivated");
    });
  });

  // ===========================================================================
  // Happy path
  // ===========================================================================
  describe("Happy path", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("deactivates the client and returns success message with full_name", async () => {
      const mockClient = buildMockSupabase();
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({
        userId: VALID_USER_ID,
        reason: "Account requested closure",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Successfully deactivated Jane Doe");
    });

    it("falls back to email when full_name is empty", async () => {
      const mockClient = buildMockSupabase({
        profileSelectResult: {
          data: {
            id: VALID_USER_ID,
            role: "client",
            is_deactivated: false,
            full_name: "",
            email: "jane@example.com",
            current_plan_cycle: 1,
          },
          error: null,
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Successfully deactivated jane@example.com");
    });

    it("calls profile update with deactivation fields", async () => {
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
                      id: VALID_USER_ID,
                      role: "client",
                      is_deactivated: false,
                      full_name: "Jane Doe",
                      email: "jane@example.com",
                      current_plan_cycle: 1,
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          if (table === "plan_cycles") {
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({
        userId: VALID_USER_ID,
        reason: "Non-payment",
      });
      await POST(request);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deactivated: true,
          deactivation_reason: "Non-payment",
        })
      );
      // deactivated_at should be an ISO string
      const updateArg = updateMock.mock.calls[0][0];
      expect(updateArg.deactivated_at).toBeDefined();
      expect(typeof updateArg.deactivated_at).toBe("string");
    });

    it("sets deactivation_reason to null when no reason provided", async () => {
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
                      id: VALID_USER_ID,
                      role: "client",
                      is_deactivated: false,
                      full_name: "Jane Doe",
                      email: "jane@example.com",
                      current_plan_cycle: null,
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      await POST(request);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          deactivation_reason: null,
        })
      );
    });
  });

  // ===========================================================================
  // Plan cycle cleanup
  // ===========================================================================
  describe("Plan cycle cleanup", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("marks the current plan cycle as completed when current_plan_cycle exists", async () => {
      const planCycleUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      role: "client",
                      is_deactivated: false,
                      full_name: "Jane Doe",
                      email: "jane@example.com",
                      current_plan_cycle: 3,
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
            return {
              update: planCycleUpdateMock,
            };
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      await POST(request);

      expect(planCycleUpdateMock).toHaveBeenCalledWith({ status: "completed" });
    });

    it("skips plan cycle update when current_plan_cycle is null", async () => {
      const planCycleUpdateMock = jest.fn();

      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      role: "client",
                      is_deactivated: false,
                      full_name: "Jane Doe",
                      email: "jane@example.com",
                      current_plan_cycle: null,
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
            return {
              update: planCycleUpdateMock,
            };
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      await POST(request);

      // plan_cycles table should never have been accessed
      expect(planCycleUpdateMock).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Database errors
  // ===========================================================================
  describe("Database errors", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 500 when profile update fails", async () => {
      const mockClient = buildMockSupabase({
        profileUpdateResult: { error: { message: "DB write failed" } },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_USER_ID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to deactivate user");
    });

    it("returns 500 on unexpected errors (e.g., JSON parse failure)", async () => {
      mockIsAdmin.mockResolvedValue(true);

      // Create a request with invalid JSON
      const request = new Request("http://localhost:3000/api/admin/deactivate-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("An unexpected error occurred");
    });
  });
});
