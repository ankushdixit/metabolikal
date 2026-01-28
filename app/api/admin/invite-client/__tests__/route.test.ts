/**
 * @jest-environment node
 */

import { POST } from "../route";
import * as authServerModule from "@/lib/auth-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  isAdmin: jest.fn(),
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
          return {};
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
          return {};
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
          return {};
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
          return {};
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
          data: { full_name: "John Doe" },
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
          return {};
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
          return {};
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
});
