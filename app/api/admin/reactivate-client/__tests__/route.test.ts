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

describe("POST /api/admin/reactivate-client", () => {
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
    return new Request("http://localhost:3000/api/admin/reactivate-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const VALID_USER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const VALID_BODY = {
    userId: VALID_USER_ID,
    plan_start_date: "2026-03-01",
    plan_duration_days: 30,
  };

  // ---------------------------------------------------------------------------
  // Helper: build a mock Supabase client with configurable per-table behavior
  // ---------------------------------------------------------------------------
  const buildMockSupabase = (overrides?: {
    profileSelectResult?: { data: unknown; error: unknown };
    profileUpdateResult?: { error: unknown };
    planCyclesOverlapResult?: { data: unknown; error: unknown };
    planCyclesOldUpdateResult?: { error: unknown };
    planCyclesInsertResult?: { error: unknown };
  }) => {
    const defaults = {
      profileSelectResult: {
        data: {
          id: VALID_USER_ID,
          role: "client",
          is_deactivated: true,
          full_name: "Jane Doe",
          email: "jane@example.com",
          current_plan_cycle: 2,
        },
        error: null,
      },
      profileUpdateResult: { error: null },
      planCyclesOverlapResult: { data: null, error: { code: "PGRST116" } }, // no overlap
      planCyclesOldUpdateResult: { error: null },
      planCyclesInsertResult: { error: null },
    };
    const cfg = { ...defaults, ...overrides };

    // We need to track plan_cycles call ordering: first call is the overlap check (select),
    // second is old cycle update, third is insert.
    let planCyclesCallIndex = 0;

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
          planCyclesCallIndex++;
          const callNum = planCyclesCallIndex;

          if (callNum === 1) {
            // Overlap check: select().eq().lte().gte().limit().single()
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    gte: jest.fn().mockReturnValue({
                      limit: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue(cfg.planCyclesOverlapResult),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }

          if (callNum === 2) {
            // Old cycle mark completed: update().eq().eq()
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue(cfg.planCyclesOldUpdateResult),
                }),
              }),
            };
          }

          if (callNum === 3) {
            // Insert new cycle: insert()
            return {
              insert: jest.fn().mockResolvedValue(cfg.planCyclesInsertResult),
            };
          }

          // Fallback
          return {};
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

    it("returns 400 when userId is missing", async () => {
      const request = createMockRequest({
        plan_start_date: "2026-03-01",
        plan_duration_days: 30,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "userId" })])
      );
    });

    it("returns 400 when plan_start_date is missing", async () => {
      const request = createMockRequest({
        userId: VALID_USER_ID,
        plan_duration_days: 30,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "plan_start_date" })])
      );
    });

    it("returns 400 when plan_start_date has wrong format", async () => {
      const request = createMockRequest({
        userId: VALID_USER_ID,
        plan_start_date: "March 1, 2026",
        plan_duration_days: 30,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 when plan_duration_days is missing", async () => {
      const request = createMockRequest({
        userId: VALID_USER_ID,
        plan_start_date: "2026-03-01",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "plan_duration_days" })])
      );
    });

    it("returns 400 when plan_duration_days is 0", async () => {
      const request = createMockRequest({
        userId: VALID_USER_ID,
        plan_start_date: "2026-03-01",
        plan_duration_days: 0,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 when plan_duration_days exceeds 365", async () => {
      const request = createMockRequest({
        userId: VALID_USER_ID,
        plan_start_date: "2026-03-01",
        plan_duration_days: 366,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 when userId is not a valid UUID", async () => {
      const request = createMockRequest({
        userId: "invalid-uuid",
        plan_start_date: "2026-03-01",
        plan_duration_days: 30,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
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

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User not found");
    });
  });

  // ===========================================================================
  // Already active
  // ===========================================================================
  describe("Already active client", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 400 when user is already active (not deactivated)", async () => {
      const mockClient = buildMockSupabase({
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
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User is already active");
    });
  });

  // ===========================================================================
  // Overlap prevention
  // ===========================================================================
  describe("Overlap prevention", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 400 when new plan overlaps with an existing cycle", async () => {
      const mockClient = buildMockSupabase({
        planCyclesOverlapResult: {
          data: {
            cycle_number: 2,
            start_date: "2026-02-15",
            end_date: "2026-03-15",
          },
          error: null,
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("overlaps with cycle 2");
      expect(data.error).toContain("2026-02-15");
      expect(data.error).toContain("2026-03-15");
    });
  });

  // ===========================================================================
  // Happy path
  // ===========================================================================
  describe("Happy path", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("reactivates the client and returns success with new cycle number", async () => {
      const mockClient = buildMockSupabase();
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Successfully reactivated Jane Doe");
      expect(data.newCycle).toBe(3); // oldCycle=2 + 1
    });

    it("falls back to email when full_name is empty", async () => {
      const mockClient = buildMockSupabase({
        profileSelectResult: {
          data: {
            id: VALID_USER_ID,
            role: "client",
            is_deactivated: true,
            full_name: "",
            email: "jane@example.com",
            current_plan_cycle: 1,
          },
          error: null,
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Successfully reactivated jane@example.com");
    });

    it("increments cycle from 1 to 2 when current_plan_cycle is null (defaults to 1)", async () => {
      const mockClient = buildMockSupabase({
        profileSelectResult: {
          data: {
            id: VALID_USER_ID,
            role: "client",
            is_deactivated: true,
            full_name: "Jane Doe",
            email: "jane@example.com",
            current_plan_cycle: null,
          },
          error: null,
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.newCycle).toBe(2); // null defaults to 1, +1 = 2
    });

    it("calls profile update with correct reactivation fields", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      let planCyclesCallIndex = 0;
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
                      is_deactivated: true,
                      full_name: "Jane Doe",
                      email: "jane@example.com",
                      current_plan_cycle: 2,
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          if (table === "plan_cycles") {
            planCyclesCallIndex++;
            if (planCyclesCallIndex === 1) {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    lte: jest.fn().mockReturnValue({
                      gte: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                          single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: "PGRST116" },
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              };
            }
            if (planCyclesCallIndex === 2) {
              return {
                update: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }
            if (planCyclesCallIndex === 3) {
              return {
                insert: jest.fn().mockResolvedValue({ error: null }),
              };
            }
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      await POST(request);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deactivated: false,
          deactivated_at: null,
          deactivation_reason: null,
          current_plan_cycle: 3,
          plan_start_date: "2026-03-01",
          plan_duration_days: 30,
        })
      );
    });
  });

  // ===========================================================================
  // Database errors
  // ===========================================================================
  describe("Database errors", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 500 when plan cycle insert fails (non-overlap error)", async () => {
      const mockClient = buildMockSupabase({
        planCyclesInsertResult: {
          error: { message: "Disk full" },
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create new plan cycle");
    });

    it("returns 400 when plan cycle insert fails with overlap message", async () => {
      const mockClient = buildMockSupabase({
        planCyclesInsertResult: {
          error: { message: "New plan cycle overlaps with existing cycle" },
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("overlaps");
    });

    it("returns 500 when profile update fails", async () => {
      const mockClient = buildMockSupabase({
        profileUpdateResult: { error: { message: "Update failed" } },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const request = createMockRequest(VALID_BODY);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to reactivate user");
    });

    it("returns 500 on unexpected errors (e.g., JSON parse failure)", async () => {
      mockIsAdmin.mockResolvedValue(true);

      const request = new Request("http://localhost:3000/api/admin/reactivate-client", {
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
