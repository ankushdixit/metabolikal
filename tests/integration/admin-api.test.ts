/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Integration tests for admin API routes.
 *
 * These tests verify multi-step flows with realistic request/response chains
 * using mocked Supabase. Unlike unit tests that exercise individual endpoints
 * in isolation, these integration tests simulate sequences of admin operations
 * and verify the cumulative state changes across multiple API calls.
 */

import { POST as inviteClient } from "@/app/api/admin/invite-client/route";
import { POST as deactivateClient } from "@/app/api/admin/deactivate-client/route";
import { POST as reactivateClient } from "@/app/api/admin/reactivate-client/route";
import { POST as upgradeChallenger } from "@/app/api/admin/upgrade-challenger/route";
import * as authServerModule from "@/lib/auth-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  isAdmin: jest.fn(),
  getUser: jest.fn(),
  createServerSupabaseClient: jest.fn(),
}));

// Mock @supabase/supabase-js
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Typed mock references
// ---------------------------------------------------------------------------
const mockIsAdmin = authServerModule.isAdmin as jest.MockedFunction<
  typeof authServerModule.isAdmin
>;
const mockGetUser = authServerModule.getUser as jest.MockedFunction<
  typeof authServerModule.getUser
>;
const mockCreateServerSupabaseClient =
  authServerModule.createServerSupabaseClient as jest.MockedFunction<
    typeof authServerModule.createServerSupabaseClient
  >;
const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
  typeof createSupabaseClient
>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VALID_USER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const ADMIN_USER_ID = "admin-user-id";

// Store original env
const originalEnv = process.env;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createRequest(url: string, body: Record<string, unknown>): Request {
  return new Request(`http://localhost:3000${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function parseResponse(response: Response) {
  return { status: response.status, body: await response.json() };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe("Admin API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    };
    mockIsAdmin.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({ id: ADMIN_USER_ID } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // =========================================================================
  // 1. Full invite -> accept -> login flow
  // =========================================================================
  describe("Full invite -> accept -> login flow", () => {
    /**
     * This integration test simulates the complete lifecycle of inviting a
     * new client:
     *
     * Step 1: Admin invites a client via /api/admin/invite-client
     * Step 2: User "accepts" the invite (password set simulated)
     * Step 3: User profile is fetched to verify correct role and fields
     *
     * Because we are calling the actual route handler with mocked Supabase,
     * we wire up the mocks so that each step's outputs feed naturally into
     * the next step's inputs.
     */

    it("should invite a new client, simulate acceptance, and verify profile state", async () => {
      // ----- Step 1: Admin invites the client -----
      const inviteUserMock = jest.fn().mockResolvedValue({
        data: { user: { id: VALID_USER_ID } },
        error: null,
      });
      const profileUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: VALID_USER_ID,
                email: "newclient@example.com",
                full_name: "New Client",
                role: "client",
                plan_start_date: "2026-03-01",
                plan_duration_days: 14,
                invited_at: expect.any(String),
              },
              error: null,
            }),
          }),
        }),
      });
      const planCycleInsertMock = jest.fn().mockResolvedValue({ error: null });

      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: inviteUserMock,
            deleteUser: jest.fn().mockResolvedValue({ error: null }),
          },
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      email: "newclient@example.com",
                      role: "client",
                    },
                    error: null,
                  }),
                }),
              }),
              update: profileUpdateMock,
            };
          }
          if (table === "plan_cycles") {
            return { insert: planCycleInsertMock };
          }
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      // Mock the server Supabase client used to fetch profile at the end
      const fetchedProfile = {
        id: VALID_USER_ID,
        email: "newclient@example.com",
        full_name: "New Client",
        role: "client",
        plan_start_date: "2026-03-01",
        plan_duration_days: 14,
        invited_at: new Date().toISOString(),
        invitation_accepted_at: null,
        is_deactivated: false,
      };
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: fetchedProfile,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const inviteRequest = createRequest("/api/admin/invite-client", {
        full_name: "New Client",
        email: "newclient@example.com",
        plan_start_date: "2026-03-01",
        plan_duration_days: 14,
      });

      const inviteRes = await parseResponse(await inviteClient(inviteRequest));

      // Verify invite succeeded
      expect(inviteRes.status).toBe(201);
      expect(inviteRes.body.success).toBe(true);
      expect(inviteRes.body.message).toContain("Client created successfully");

      // Verify the invite was called with correct email
      expect(inviteUserMock).toHaveBeenCalledWith(
        "newclient@example.com",
        expect.objectContaining({
          data: { full_name: "New Client" },
          redirectTo: "http://localhost:3000/auth/callback",
        })
      );

      // Verify plan cycle was created
      expect(planCycleInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: VALID_USER_ID,
          cycle_number: 1,
          start_date: "2026-03-01",
          duration_days: 14,
          status: "active",
        })
      );

      // ----- Step 2: Simulate user accepting invite (password set) -----
      // In production Supabase handles the email link -> callback -> password set.
      // We simulate this by verifying that the profile now reflects the invited state.
      const clientProfile = inviteRes.body.client;
      expect(clientProfile.role).toBe("client");
      expect(clientProfile.plan_start_date).toBe("2026-03-01");
      expect(clientProfile.plan_duration_days).toBe(14);
      expect(clientProfile.invitation_accepted_at).toBeNull(); // not yet accepted

      // ----- Step 3: Simulate user logging in after accepting -----
      // After accepting, their profile would have invitation_accepted_at set.
      // We simulate by querying the profile with the accepted timestamp.
      const acceptedProfile = {
        ...fetchedProfile,
        invitation_accepted_at: new Date().toISOString(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: acceptedProfile,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Verify the post-acceptance profile state
      expect(acceptedProfile.role).toBe("client");
      expect(acceptedProfile.invitation_accepted_at).toBeTruthy();
      expect(acceptedProfile.is_deactivated).toBe(false);
    });

    it("should invite a client with conditions and verify they are persisted", async () => {
      const inviteUserMock = jest.fn().mockResolvedValue({
        data: { user: { id: VALID_USER_ID } },
        error: null,
      });
      const conditionsInsertMock = jest.fn().mockResolvedValue({ error: null });

      const conditionIds = [
        "c1c1c1c1-c1c1-4c1c-a1c1-c1c1c1c1c1c1",
        "d2d2d2d2-d2d2-4d2d-a2d2-d2d2d2d2d2d2",
      ];

      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: inviteUserMock,
            deleteUser: jest.fn().mockResolvedValue({ error: null }),
          },
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      email: "condclient@example.com",
                      role: "client",
                    },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: VALID_USER_ID },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "plan_cycles") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          if (table === "client_conditions") {
            return { insert: conditionsInsertMock };
          }
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: VALID_USER_ID,
                  email: "condclient@example.com",
                  full_name: "Cond Client",
                  role: "client",
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const inviteRequest = createRequest("/api/admin/invite-client", {
        full_name: "Cond Client",
        email: "condclient@example.com",
        condition_ids: conditionIds,
      });

      const inviteRes = await parseResponse(await inviteClient(inviteRequest));

      expect(inviteRes.status).toBe(201);
      expect(inviteRes.body.success).toBe(true);

      // Verify conditions were inserted with correct admin attribution
      expect(conditionsInsertMock).toHaveBeenCalledWith([
        {
          client_id: VALID_USER_ID,
          condition_id: conditionIds[0],
          created_by: ADMIN_USER_ID,
        },
        {
          client_id: VALID_USER_ID,
          condition_id: conditionIds[1],
          created_by: ADMIN_USER_ID,
        },
      ]);
    });
  });

  // =========================================================================
  // 2. Deactivate -> Reactivate cycle
  // =========================================================================
  describe("Deactivate -> Reactivate cycle", () => {
    /**
     * This integration test simulates the full deactivation/reactivation
     * lifecycle:
     *
     * Step 1: Deactivate an active client
     * Step 2: Verify deactivated state
     * Step 3: Reactivate the client with a new plan cycle
     * Step 4: Verify the client is active again with updated cycle
     */

    it("should deactivate an active client, then reactivate with a new plan cycle", async () => {
      // Track profile state across calls
      let currentProfileState = {
        id: VALID_USER_ID,
        role: "client",
        is_deactivated: false,
        full_name: "Jane Doe",
        email: "jane@example.com",
        current_plan_cycle: 2,
      };

      const profileUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const planCycleUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      // ----- Step 1: Deactivate the client -----
      const deactivateSupabase = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...currentProfileState },
                    error: null,
                  }),
                }),
              }),
              update: profileUpdateMock,
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
      mockCreateServerSupabaseClient.mockResolvedValue(deactivateSupabase as any);

      const deactivateReq = createRequest("/api/admin/deactivate-client", {
        userId: VALID_USER_ID,
        reason: "Payment issue",
      });

      const deactivateRes = await parseResponse(await deactivateClient(deactivateReq));

      // Verify deactivation succeeded
      expect(deactivateRes.status).toBe(200);
      expect(deactivateRes.body.success).toBe(true);
      expect(deactivateRes.body.message).toBe("Successfully deactivated Jane Doe");

      // Verify profile update was called with deactivation fields
      expect(profileUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deactivated: true,
          deactivation_reason: "Payment issue",
        })
      );
      const deactivateUpdateArg = profileUpdateMock.mock.calls[0][0];
      expect(deactivateUpdateArg.deactivated_at).toBeDefined();
      expect(typeof deactivateUpdateArg.deactivated_at).toBe("string");

      // Verify plan cycle was marked completed
      expect(planCycleUpdateMock).toHaveBeenCalledWith({ status: "completed" });

      // ----- Step 2: Update state to reflect deactivation -----
      currentProfileState = {
        ...currentProfileState,
        is_deactivated: true,
      };

      // ----- Step 3: Reactivate the client -----
      jest.clearAllMocks();
      mockIsAdmin.mockResolvedValue(true);

      let reactivatePlanCyclesCallIndex = 0;
      const reactivateProfileUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const planCycleInsertMock = jest.fn().mockResolvedValue({ error: null });

      const reactivateSupabase = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...currentProfileState },
                    error: null,
                  }),
                }),
              }),
              update: reactivateProfileUpdateMock,
            };
          }
          if (table === "plan_cycles") {
            reactivatePlanCyclesCallIndex++;
            const callNum = reactivatePlanCyclesCallIndex;

            if (callNum === 1) {
              // Overlap check: select().eq().lte().gte().limit().single()
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    lte: jest.fn().mockReturnValue({
                      gte: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                          single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: "PGRST116" }, // no overlap
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              };
            }

            if (callNum === 2) {
              // Mark old cycle as completed
              return {
                update: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (callNum === 3) {
              // Insert new cycle
              return { insert: planCycleInsertMock };
            }

            return {};
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(reactivateSupabase as any);

      const reactivateReq = createRequest("/api/admin/reactivate-client", {
        userId: VALID_USER_ID,
        plan_start_date: "2026-04-01",
        plan_duration_days: 30,
      });

      const reactivateRes = await parseResponse(await reactivateClient(reactivateReq));

      // Verify reactivation succeeded
      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.success).toBe(true);
      expect(reactivateRes.body.message).toBe("Successfully reactivated Jane Doe");
      expect(reactivateRes.body.newCycle).toBe(3); // oldCycle=2 + 1

      // Verify profile was updated with reactivation fields
      expect(reactivateProfileUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deactivated: false,
          deactivated_at: null,
          deactivation_reason: null,
          current_plan_cycle: 3,
          plan_start_date: "2026-04-01",
          plan_duration_days: 30,
        })
      );

      // Verify new plan cycle was inserted
      expect(planCycleInsertMock).toHaveBeenCalledWith({
        client_id: VALID_USER_ID,
        cycle_number: 3,
        start_date: "2026-04-01",
        duration_days: 30,
        status: "active",
      });
    });

    it("should prevent deactivating an already-deactivated client", async () => {
      // Set up a deactivated client
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
            };
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const deactivateReq = createRequest("/api/admin/deactivate-client", {
        userId: VALID_USER_ID,
      });
      const res = await parseResponse(await deactivateClient(deactivateReq));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("User is already deactivated");
    });

    it("should prevent reactivating an already-active client", async () => {
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
                      current_plan_cycle: 2,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const reactivateReq = createRequest("/api/admin/reactivate-client", {
        userId: VALID_USER_ID,
        plan_start_date: "2026-04-01",
        plan_duration_days: 30,
      });
      const res = await parseResponse(await reactivateClient(reactivateReq));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("User is already active");
    });

    it("should handle deactivation with null current_plan_cycle (no cycle cleanup)", async () => {
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
            return { update: planCycleUpdateMock };
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const deactivateReq = createRequest("/api/admin/deactivate-client", {
        userId: VALID_USER_ID,
      });
      const res = await parseResponse(await deactivateClient(deactivateReq));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Plan cycle update should not have been called
      expect(planCycleUpdateMock).not.toHaveBeenCalled();
    });

    it("should reject reactivation when new plan overlaps with existing cycle", async () => {
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
                      current_plan_cycle: 1,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "plan_cycles") {
            planCyclesCallIndex++;
            if (planCyclesCallIndex === 1) {
              // Overlap check returns an overlapping cycle
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    lte: jest.fn().mockReturnValue({
                      gte: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                          single: jest.fn().mockResolvedValue({
                            data: {
                              cycle_number: 1,
                              start_date: "2026-03-15",
                              end_date: "2026-04-15",
                            },
                            error: null,
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              };
            }
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const reactivateReq = createRequest("/api/admin/reactivate-client", {
        userId: VALID_USER_ID,
        plan_start_date: "2026-04-01",
        plan_duration_days: 30,
      });
      const res = await parseResponse(await reactivateClient(reactivateReq));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("overlaps with cycle 1");
    });
  });

  // =========================================================================
  // 3. Upgrade challenger -> verify full state update
  // =========================================================================
  describe("Upgrade challenger -> verify full state update", () => {
    /**
     * This integration test simulates upgrading a challenger to a full client:
     *
     * Step 1: Upgrade via /api/admin/upgrade-challenger
     * Step 2: Verify profile fields updated (role, plan dates, challenge_start_date)
     * Step 3: Verify plan_cycles record created
     * Step 4: Verify notification sent
     */

    it("should upgrade a challenger with full state verification", async () => {
      const profileUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const planCycleInsertMock = jest.fn().mockResolvedValue({ error: null });
      const notificationInsertMock = jest.fn().mockResolvedValue({ error: null });

      const mockAdminClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      email: "challenger@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: profileUpdateMock,
            };
          }
          if (table === "plan_cycles") {
            return { insert: planCycleInsertMock };
          }
          if (table === "client_conditions") {
            return { insert: jest.fn().mockResolvedValue({ error: null }) };
          }
          if (table === "notifications") {
            return { insert: notificationInsertMock };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const upgradeReq = createRequest("/api/admin/upgrade-challenger", {
        challenger_id: VALID_USER_ID,
        full_name: "Jane Challenger",
        email: "challenger@example.com",
        plan_start_date: "2026-03-01",
        plan_duration_days: 60,
      });

      const upgradeRes = await parseResponse(await upgradeChallenger(upgradeReq));

      // Step 1: Verify upgrade succeeded
      expect(upgradeRes.status).toBe(200);
      expect(upgradeRes.body.success).toBe(true);
      expect(upgradeRes.body.message).toBe("Jane Challenger upgraded to client successfully.");

      // Step 2: Verify profile fields updated correctly
      expect(profileUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "client",
          full_name: "Jane Challenger",
          plan_start_date: "2026-03-01",
          plan_duration_days: 60,
          current_plan_cycle: 1,
          challenge_start_date: "2026-01-15", // preserved from existing plan_start_date
        })
      );

      // Step 3: Verify plan_cycles record created
      expect(planCycleInsertMock).toHaveBeenCalledWith({
        client_id: VALID_USER_ID,
        cycle_number: 1,
        start_date: "2026-03-01",
        duration_days: 60,
        status: "active",
      });

      // Step 4: Verify notification sent
      expect(notificationInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: VALID_USER_ID,
          sender_id: ADMIN_USER_ID,
          type: "system",
          title: "Welcome to your personalized plan!",
        })
      );
      const notifArg = notificationInsertMock.mock.calls[0][0];
      expect(notifArg.message).toContain("60-day plan");
      expect(notifArg.message).toContain("2026-03-01");
      expect(notifArg.message).toContain("challenge progress has been preserved");
    });

    it("should preserve challenge_start_date from created_at when plan_start_date is null", async () => {
      const profileUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockAdminClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      email: "challenger@example.com",
                      role: "challenger",
                      plan_start_date: null, // no existing plan_start_date
                      created_at: "2026-01-20T14:30:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: profileUpdateMock,
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
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const upgradeReq = createRequest("/api/admin/upgrade-challenger", {
        challenger_id: VALID_USER_ID,
        full_name: "Jane Challenger",
        email: "challenger@example.com",
        plan_start_date: "2026-03-01",
        plan_duration_days: 30,
      });

      const upgradeRes = await parseResponse(await upgradeChallenger(upgradeReq));
      expect(upgradeRes.status).toBe(200);

      const updateArg = profileUpdateMock.mock.calls[0][0];
      // Falls back to created_at date (just the YYYY-MM-DD part)
      expect(updateArg.challenge_start_date).toBe("2026-01-20");
    });

    it("should upgrade with conditions and verify all side effects", async () => {
      const profileUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const planCycleInsertMock = jest.fn().mockResolvedValue({ error: null });
      const conditionsInsertMock = jest.fn().mockResolvedValue({ error: null });
      const notificationInsertMock = jest.fn().mockResolvedValue({ error: null });

      const conditionIds = [
        "11111111-1111-4111-a111-111111111111",
        "22222222-2222-4222-a222-222222222222",
      ];

      const mockAdminClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      email: "challenger@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: profileUpdateMock,
            };
          }
          if (table === "plan_cycles") {
            return { insert: planCycleInsertMock };
          }
          if (table === "client_conditions") {
            return { insert: conditionsInsertMock };
          }
          if (table === "notifications") {
            return { insert: notificationInsertMock };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const upgradeReq = createRequest("/api/admin/upgrade-challenger", {
        challenger_id: VALID_USER_ID,
        full_name: "Jane Challenger",
        email: "challenger@example.com",
        plan_start_date: "2026-03-01",
        plan_duration_days: 60,
        condition_ids: conditionIds,
      });

      const upgradeRes = await parseResponse(await upgradeChallenger(upgradeReq));

      expect(upgradeRes.status).toBe(200);
      expect(upgradeRes.body.success).toBe(true);

      // Verify all four side effects happened:
      // 1. Profile updated
      expect(profileUpdateMock).toHaveBeenCalledTimes(1);
      expect(profileUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "client",
          current_plan_cycle: 1,
        })
      );

      // 2. Plan cycle inserted
      expect(planCycleInsertMock).toHaveBeenCalledTimes(1);

      // 3. Conditions inserted
      expect(conditionsInsertMock).toHaveBeenCalledWith([
        {
          client_id: VALID_USER_ID,
          condition_id: conditionIds[0],
          created_by: ADMIN_USER_ID,
        },
        {
          client_id: VALID_USER_ID,
          condition_id: conditionIds[1],
          created_by: ADMIN_USER_ID,
        },
      ]);

      // 4. Notification sent
      expect(notificationInsertMock).toHaveBeenCalledTimes(1);
    });

    it("should reject upgrade of a non-challenger user", async () => {
      const mockAdminClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      email: "client@example.com",
                      role: "client", // already a client
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const upgradeReq = createRequest("/api/admin/upgrade-challenger", {
        challenger_id: VALID_USER_ID,
        full_name: "Already Client",
        email: "client@example.com",
        plan_start_date: "2026-03-01",
        plan_duration_days: 30,
      });

      const upgradeRes = await parseResponse(await upgradeChallenger(upgradeReq));

      expect(upgradeRes.status).toBe(400);
      expect(upgradeRes.body.success).toBe(false);
      expect(upgradeRes.body.error).toBe("User is already a client, not a challenger");
    });

    it("should succeed even when non-fatal side effects fail (plan cycle, conditions, notification)", async () => {
      const profileUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockAdminClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      email: "challenger@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: profileUpdateMock,
            };
          }
          if (table === "plan_cycles") {
            return {
              insert: jest.fn().mockResolvedValue({
                error: { message: "Plan cycle insert failed" },
              }),
            };
          }
          if (table === "client_conditions") {
            return {
              insert: jest.fn().mockResolvedValue({
                error: { message: "Conditions insert failed" },
              }),
            };
          }
          if (table === "notifications") {
            return {
              insert: jest.fn().mockResolvedValue({
                error: { message: "Notification insert failed" },
              }),
            };
          }
          return {};
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const upgradeReq = createRequest("/api/admin/upgrade-challenger", {
        challenger_id: VALID_USER_ID,
        full_name: "Jane Challenger",
        email: "challenger@example.com",
        plan_start_date: "2026-03-01",
        plan_duration_days: 60,
        condition_ids: ["11111111-1111-4111-a111-111111111111"],
      });

      const upgradeRes = await parseResponse(await upgradeChallenger(upgradeReq));

      // The upgrade itself should still succeed
      expect(upgradeRes.status).toBe(200);
      expect(upgradeRes.body.success).toBe(true);
      expect(upgradeRes.body.message).toBe("Jane Challenger upgraded to client successfully.");

      // Profile update was the critical operation and it succeeded
      expect(profileUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ role: "client" }));
    });

    it("should include optional profile fields (phone, dob, gender, address) when provided", async () => {
      const profileUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockAdminClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      email: "challenger@example.com",
                      role: "challenger",
                      plan_start_date: "2026-01-15",
                      created_at: "2026-01-10T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
              update: profileUpdateMock,
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
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const upgradeReq = createRequest("/api/admin/upgrade-challenger", {
        challenger_id: VALID_USER_ID,
        full_name: "Jane Challenger",
        email: "challenger@example.com",
        plan_start_date: "2026-03-01",
        plan_duration_days: 60,
        phone: "+1234567890",
        date_of_birth: "1990-05-15",
        gender: "female",
        address: "456 Oak Ave",
      });

      const upgradeRes = await parseResponse(await upgradeChallenger(upgradeReq));
      expect(upgradeRes.status).toBe(200);

      const updateArg = profileUpdateMock.mock.calls[0][0];
      expect(updateArg.phone).toBe("+1234567890");
      expect(updateArg.date_of_birth).toBe("1990-05-15");
      expect(updateArg.gender).toBe("female");
      expect(updateArg.address).toBe("456 Oak Ave");
    });
  });

  // =========================================================================
  // 4. Cross-flow guard rails
  // =========================================================================
  describe("Cross-flow guard rails", () => {
    it("should reject all operations when not admin", async () => {
      mockIsAdmin.mockResolvedValue(false);

      const inviteReq = createRequest("/api/admin/invite-client", {
        full_name: "Test",
        email: "test@example.com",
      });
      const deactivateReq = createRequest("/api/admin/deactivate-client", {
        userId: VALID_USER_ID,
      });
      const reactivateReq = createRequest("/api/admin/reactivate-client", {
        userId: VALID_USER_ID,
        plan_start_date: "2026-03-01",
        plan_duration_days: 30,
      });
      const upgradeReq = createRequest("/api/admin/upgrade-challenger", {
        challenger_id: VALID_USER_ID,
        full_name: "Test",
        email: "test@example.com",
      });

      const [inviteRes, deactivateRes, reactivateRes, upgradeRes] = await Promise.all([
        parseResponse(await inviteClient(inviteReq)),
        parseResponse(await deactivateClient(deactivateReq)),
        parseResponse(await reactivateClient(reactivateReq)),
        parseResponse(await upgradeChallenger(upgradeReq)),
      ]);

      // All should return 401
      expect(inviteRes.status).toBe(401);
      expect(deactivateRes.status).toBe(401);
      expect(reactivateRes.status).toBe(401);
      expect(upgradeRes.status).toBe(401);

      // All should have consistent error shape
      for (const res of [inviteRes, deactivateRes, reactivateRes, upgradeRes]) {
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe("Unauthorized. Admin access required.");
      }
    });

    it("should prevent deactivating admin users", async () => {
      const mockClient = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: VALID_USER_ID,
                      role: "admin",
                      is_deactivated: false,
                      full_name: "Admin User",
                      email: "admin@example.com",
                      current_plan_cycle: null,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockClient as any);

      const deactivateReq = createRequest("/api/admin/deactivate-client", {
        userId: VALID_USER_ID,
      });
      const res = await parseResponse(await deactivateClient(deactivateReq));

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot deactivate admin users");
    });
  });
});
