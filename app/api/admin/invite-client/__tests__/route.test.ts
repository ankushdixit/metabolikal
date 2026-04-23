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
  createServerSupabaseClient: jest.fn(),
}));

// Mock @supabase/supabase-js
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

describe("POST /api/admin/invite-client", () => {
  const mockIsAdmin = authServerModule.isAdmin as jest.MockedFunction<
    typeof authServerModule.isAdmin
  >;
  const mockCreateServerSupabaseClient =
    authServerModule.createServerSupabaseClient as jest.MockedFunction<
      typeof authServerModule.createServerSupabaseClient
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
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return new Request("http://localhost:3000/api/admin/invite-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  describe("Authentication", () => {
    it("returns 401 when user is not admin", async () => {
      mockIsAdmin.mockResolvedValue(false);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized. Admin access required.");
    });

    it("proceeds when user is admin", async () => {
      mockIsAdmin.mockResolvedValue(true);

      // Mock admin client - needs to handle multiple from() calls
      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: jest.fn().mockResolvedValue({
              data: { user: { id: "new-user-id" } },
              error: null,
            }),
          },
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: "new-user-id", email: "john@example.com", role: "client" },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: "new-user-id", email: "john@example.com" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      // Mock server client for fetching profile
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "new-user-id", email: "john@example.com" },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe("Validation", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
      // Mock Supabase client for all validation tests (needed for service role check)
      // The validation should fail before these are called
    });

    it("returns 400 when full_name is missing", async () => {
      const request = createMockRequest({
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toContainEqual(expect.objectContaining({ field: "full_name" }));
    });

    it("returns 400 when email is missing", async () => {
      const request = createMockRequest({
        full_name: "John Doe",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toContainEqual(expect.objectContaining({ field: "email" }));
    });

    it("returns 400 when email is invalid", async () => {
      const request = createMockRequest({
        full_name: "John Doe",
        email: "not-an-email",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("accepts valid data with only required fields", async () => {
      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: jest.fn().mockResolvedValue({
              data: { user: { id: "new-user-id" } },
              error: null,
            }),
          },
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: "new-user-id", email: "john@example.com", role: "client" },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: "new-user-id", email: "john@example.com" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "new-user-id", email: "john@example.com" },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("accepts valid data with all optional fields", async () => {
      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: jest.fn().mockResolvedValue({
              data: { user: { id: "new-user-id" } },
              error: null,
            }),
          },
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: "new-user-id", email: "john@example.com", role: "client" },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: "new-user-id" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "new-user-id" },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        date_of_birth: "1990-05-15",
        gender: "male",
        address: "123 Main St",
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe("Duplicate Email", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 409 when email already exists (from inviteUserByEmail)", async () => {
      // inviteUserByEmail returns an error when email already exists
      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: jest.fn().mockResolvedValue({
              data: { user: null },
              error: { message: "User already registered" },
            }),
          },
        },
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "existing@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe("A user with this email already exists");
    });
  });

  describe("Server Configuration", () => {
    it("returns 500 when SUPABASE_SERVICE_ROLE_KEY is not set", async () => {
      mockIsAdmin.mockResolvedValue(true);
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Server configuration error");
    });
  });

  describe("User Creation", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("invites user with correct data", async () => {
      const inviteUserMock = jest.fn().mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      });

      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: inviteUserMock,
          },
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: "new-user-id", email: "john@example.com", role: "client" },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: "new-user-id" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "new-user-id" },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      await POST(request);

      expect(inviteUserMock).toHaveBeenCalledWith(
        "john@example.com",
        expect.objectContaining({
          data: expect.objectContaining({
            full_name: "John Doe",
            // invited_at is now passed through metadata so the
            // on_auth_user_created trigger can write it atomically.
            invited_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          }),
        })
      );
    });

    it("updates profile with additional fields", async () => {
      const selectAfterUpdateMock = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: "new-user-id" },
          error: null,
        }),
      });
      const eqMock = jest.fn().mockReturnValue({
        select: selectAfterUpdateMock,
      });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });

      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: jest.fn().mockResolvedValue({
              data: { user: { id: "new-user-id" } },
              error: null,
            }),
          },
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: "new-user-id", email: "john@example.com", role: "client" },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            };
          }
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "new-user-id" },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        date_of_birth: "1990-05-15",
        gender: "male",
        address: "123 Main St",
      });

      await POST(request);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: "John Doe",
          date_of_birth: "1990-05-15",
          gender: "male",
          address: "123 Main St",
        })
      );
      expect(eqMock).toHaveBeenCalledWith("id", "new-user-id");
    });
  });

  describe("Response Format", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns success response with client data", async () => {
      const mockProfile = {
        id: "new-user-id",
        email: "john@example.com",
        full_name: "John Doe",
        role: "client",
      };

      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: jest.fn().mockResolvedValue({
              data: { user: { id: "new-user-id" } },
              error: null,
            }),
          },
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: "new-user-id", email: "john@example.com", role: "client" },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockProfile,
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.client).toEqual(mockProfile);
      expect(data.message).toContain("Client created successfully");
    });
  });

  // =========================================================================
  // Additional tests to improve coverage from 71.4% to 90%+
  // =========================================================================

  // Helper: creates a standard mock admin client for the additional tests
  // that need the full happy-path chain but with specific overrides.
  const buildFullMockAdminClient = (
    overrides: {
      inviteUserByEmail?: jest.Mock;
      profileSelectSingle?: jest.Mock;
      profileUpdateSingle?: jest.Mock;
      profileInsertSingle?: jest.Mock;
      deleteUser?: jest.Mock;
      planCycleInsert?: jest.Mock;
      clientConditionsInsert?: jest.Mock;
    } = {}
  ) => {
    const inviteUserByEmail =
      overrides.inviteUserByEmail ??
      jest.fn().mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      });
    const deleteUser = overrides.deleteUser ?? jest.fn().mockResolvedValue({ error: null });

    // We track calls to from() so we can differentiate by table
    const profileSelectSingle =
      overrides.profileSelectSingle ??
      jest.fn().mockResolvedValue({
        data: { id: "new-user-id", email: "john@example.com", role: "client" },
        error: null,
      });
    const profileUpdateSingle =
      overrides.profileUpdateSingle ??
      jest.fn().mockResolvedValue({
        data: { id: "new-user-id" },
        error: null,
      });
    const profileInsertSingle =
      overrides.profileInsertSingle ??
      jest.fn().mockResolvedValue({
        data: { id: "new-user-id" },
        error: null,
      });
    const planCycleInsert =
      overrides.planCycleInsert ?? jest.fn().mockResolvedValue({ error: null });
    const clientConditionsInsert =
      overrides.clientConditionsInsert ?? jest.fn().mockResolvedValue({ error: null });

    return {
      auth: {
        admin: {
          inviteUserByEmail,
          deleteUser,
        },
      },
      from: jest.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: profileSelectSingle,
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: profileUpdateSingle,
                }),
              }),
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: profileInsertSingle,
              }),
            }),
          };
        }
        if (table === "plan_cycles") {
          return { insert: planCycleInsert };
        }
        if (table === "client_conditions") {
          return { insert: clientConditionsInsert };
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      }),
    };
  };

  const setupServerSupabaseMock = () => {
    mockCreateServerSupabaseClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "new-user-id", email: "john@example.com" },
              error: null,
            }),
          }),
        }),
      }),
    } as any);
  };

  describe("Invite Error (non-duplicate)", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 500 for generic invite error (not 'already')", async () => {
      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: jest.fn().mockResolvedValue({
              data: { user: null },
              error: { message: "Email sending failed" },
            }),
          },
        },
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Email sending failed");
    });
  });

  describe("Null User After Invite", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 500 when authData.user is null despite no error", async () => {
      const mockAdminClient = {
        auth: {
          admin: {
            inviteUserByEmail: jest.fn().mockResolvedValue({
              data: { user: null },
              error: null,
            }),
          },
        },
      };
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create client");
    });
  });

  describe("Profile Insert (no trigger)", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("inserts profile when trigger did not create one", async () => {
      const profileInsertSingle = jest.fn().mockResolvedValue({
        data: { id: "new-user-id" },
        error: null,
      });

      const mockAdminClient = buildFullMockAdminClient({
        // Return null for the existing profile check => insert path
        profileSelectSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        profileInsertSingle,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe("Profile Error Handling", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 500 with migration message when profile error mentions column 'date_of_birth'", async () => {
      const deleteUserMock = jest.fn().mockResolvedValue({ error: null });

      const mockAdminClient = buildFullMockAdminClient({
        profileUpdateSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'column "date_of_birth" of relation "profiles" does not exist' },
        }),
        deleteUser: deleteUserMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        date_of_birth: "1990-01-01",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Database migration required");
      // Should clean up auth user
      expect(deleteUserMock).toHaveBeenCalledWith("new-user-id");
    });

    it("returns 500 with migration message when profile error mentions column 'gender'", async () => {
      const deleteUserMock = jest.fn().mockResolvedValue({ error: null });

      const mockAdminClient = buildFullMockAdminClient({
        profileUpdateSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'column "gender" of relation "profiles" does not exist' },
        }),
        deleteUser: deleteUserMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        gender: "female",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Database migration required");
    });

    it("returns 500 with migration message when profile error mentions column 'address'", async () => {
      const mockAdminClient = buildFullMockAdminClient({
        profileUpdateSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'column "address" of relation "profiles" does not exist' },
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Database migration required");
    });

    it("returns 500 with generic profile error when not a column error", async () => {
      const deleteUserMock = jest.fn().mockResolvedValue({ error: null });

      const mockAdminClient = buildFullMockAdminClient({
        profileUpdateSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Permission denied" },
        }),
        deleteUser: deleteUserMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Permission denied");
      // Should clean up auth user
      expect(deleteUserMock).toHaveBeenCalledWith("new-user-id");
    });

    it("returns 500 when profile insert fails (no trigger path)", async () => {
      const deleteUserMock = jest.fn().mockResolvedValue({ error: null });

      const mockAdminClient = buildFullMockAdminClient({
        profileSelectSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        profileInsertSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Unique violation" },
        }),
        deleteUser: deleteUserMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unique violation");
      expect(deleteUserMock).toHaveBeenCalledWith("new-user-id");
    });
  });

  describe("Plan Cycle Errors", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("still succeeds when plan cycle insert fails (non-fatal)", async () => {
      const mockAdminClient = buildFullMockAdminClient({
        planCycleInsert: jest.fn().mockResolvedValue({
          error: { message: "Duplicate cycle" },
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return 201 despite plan_cycles error
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe("Client Conditions", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("inserts client conditions when condition_ids are provided", async () => {
      mockGetUser.mockResolvedValue({ id: "admin-user-id" } as any);

      const conditionsInsertMock = jest.fn().mockResolvedValue({ error: null });
      const mockAdminClient = buildFullMockAdminClient({
        clientConditionsInsert: conditionsInsertMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const conditionIds = [
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      ];

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        condition_ids: conditionIds,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(conditionsInsertMock).toHaveBeenCalledWith([
        {
          client_id: "new-user-id",
          condition_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          created_by: "admin-user-id",
        },
        {
          client_id: "new-user-id",
          condition_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          created_by: "admin-user-id",
        },
      ]);
    });

    it("handles null admin user in condition records", async () => {
      mockGetUser.mockResolvedValue(null as any);

      const conditionsInsertMock = jest.fn().mockResolvedValue({ error: null });
      const mockAdminClient = buildFullMockAdminClient({
        clientConditionsInsert: conditionsInsertMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        condition_ids: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(conditionsInsertMock).toHaveBeenCalledWith([
        {
          client_id: "new-user-id",
          condition_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          created_by: null,
        },
      ]);
    });

    it("still succeeds when conditions insert fails (non-fatal)", async () => {
      mockGetUser.mockResolvedValue({ id: "admin-id" } as any);

      const mockAdminClient = buildFullMockAdminClient({
        clientConditionsInsert: jest.fn().mockResolvedValue({
          error: { message: "FK violation" },
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        condition_ids: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return 201 despite conditions error
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it("does not insert conditions when condition_ids is empty array", async () => {
      const conditionsInsertMock = jest.fn().mockResolvedValue({ error: null });
      const mockAdminClient = buildFullMockAdminClient({
        clientConditionsInsert: conditionsInsertMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        condition_ids: [],
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      // client_conditions insert should not be called for empty array
      expect(conditionsInsertMock).not.toHaveBeenCalled();
    });
  });

  describe("Unexpected Errors", () => {
    it("returns 500 for unexpected exceptions in the catch block", async () => {
      mockIsAdmin.mockRejectedValue(new Error("Unexpected auth failure"));

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create client");
    });

    it("returns 500 when request.json() throws", async () => {
      mockIsAdmin.mockResolvedValue(true);

      const request = new Request("http://localhost:3000/api/admin/invite-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create client");
    });
  });

  describe("Site URL Fallback", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("uses origin header when NEXT_PUBLIC_SITE_URL is not set", async () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;

      const inviteMock = jest.fn().mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      });

      const mockAdminClient = buildFullMockAdminClient({
        inviteUserByEmail: inviteMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const request = new Request("http://localhost:3000/api/admin/invite-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost:4000",
        },
        body: JSON.stringify({
          full_name: "John Doe",
          email: "john@example.com",
        }),
      });

      await POST(request);

      expect(inviteMock).toHaveBeenCalledWith(
        "john@example.com",
        expect.objectContaining({
          redirectTo: "http://localhost:4000/auth/callback",
        })
      );
    });

    it("strips trailing slash from origin header", async () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;

      const inviteMock = jest.fn().mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      });

      const mockAdminClient = buildFullMockAdminClient({
        inviteUserByEmail: inviteMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const request = new Request("http://localhost:3000/api/admin/invite-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost:4000/",
        },
        body: JSON.stringify({
          full_name: "John Doe",
          email: "john@example.com",
        }),
      });

      await POST(request);

      expect(inviteMock).toHaveBeenCalledWith(
        "john@example.com",
        expect.objectContaining({
          redirectTo: "http://localhost:4000/auth/callback",
        })
      );
    });

    it("falls back to localhost when no SITE_URL and no origin/referer", async () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;

      const inviteMock = jest.fn().mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      });

      const mockAdminClient = buildFullMockAdminClient({
        inviteUserByEmail: inviteMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      // Request with no origin or referer headers
      const request = new Request("http://localhost:3000/api/admin/invite-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: "John Doe",
          email: "john@example.com",
        }),
      });

      await POST(request);

      expect(inviteMock).toHaveBeenCalledWith(
        "john@example.com",
        expect.objectContaining({
          redirectTo: "http://localhost:3000/auth/callback",
        })
      );
    });
  });

  describe("Plan Start Date and Duration", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("uses provided plan_start_date and plan_duration_days", async () => {
      const planCycleInsertMock = jest.fn().mockResolvedValue({ error: null });

      const mockAdminClient = buildFullMockAdminClient({
        planCycleInsert: planCycleInsertMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
        plan_start_date: "2026-03-01",
        plan_duration_days: 14,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(planCycleInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "new-user-id",
          cycle_number: 1,
          start_date: "2026-03-01",
          duration_days: 14,
          status: "active",
        })
      );
    });

    it("defaults plan_duration_days to 7 when not provided", async () => {
      const planCycleInsertMock = jest.fn().mockResolvedValue({ error: null });

      const mockAdminClient = buildFullMockAdminClient({
        planCycleInsert: planCycleInsertMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockAdminClient as any);
      setupServerSupabaseMock();

      const request = createMockRequest({
        full_name: "John Doe",
        email: "john@example.com",
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(planCycleInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_days: 7,
        })
      );
    });
  });
});
