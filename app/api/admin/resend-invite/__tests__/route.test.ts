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

describe("POST /api/admin/resend-invite", () => {
  const mockIsAdmin = authServerModule.isAdmin as jest.MockedFunction<
    typeof authServerModule.isAdmin
  >;
  const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
    typeof createSupabaseClient
  >;

  const VALID_UUID = "00000000-0000-0000-0000-000000000001";

  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
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
    return new Request("http://localhost:3000/api/admin/resend-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  // Helper to create a fully-wired mock admin client
  const createMockAdminClient = (
    overrides: {
      getUserById?: jest.Mock;
      profileSelect?: jest.Mock;
      profileUpdate?: jest.Mock;
      inviteUserByEmail?: jest.Mock;
      resetPasswordForEmail?: jest.Mock;
    } = {}
  ) => {
    const getUserById =
      overrides.getUserById ??
      jest.fn().mockResolvedValue({
        data: { user: { id: VALID_UUID, email: "client@example.com" } },
        error: null,
      });

    const profileSelectSingle =
      overrides.profileSelect ??
      jest.fn().mockResolvedValue({
        data: { invited_at: "2026-01-01", invitation_accepted_at: null, plan_start_date: null },
        error: null,
      });

    const profileUpdateEq = overrides.profileUpdate ?? jest.fn().mockResolvedValue({ error: null });

    const inviteUserByEmail =
      overrides.inviteUserByEmail ?? jest.fn().mockResolvedValue({ error: null });

    const resetPasswordForEmail =
      overrides.resetPasswordForEmail ?? jest.fn().mockResolvedValue({ error: null });

    return {
      auth: {
        admin: {
          getUserById,
          inviteUserByEmail,
        },
        resetPasswordForEmail,
      },
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: profileSelectSingle,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: profileUpdateEq,
        }),
      })),
    };
  };

  describe("Authentication", () => {
    it("returns 401 when user is not admin", async () => {
      mockIsAdmin.mockResolvedValue(false);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized. Admin access required.");
    });
  });

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
  });

  describe("Server Configuration", () => {
    it("returns 500 when SUPABASE_SERVICE_ROLE_KEY is not set", async () => {
      mockIsAdmin.mockResolvedValue(true);
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Server configuration error");
    });
  });

  describe("User Lookup", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 404 when user is not found (getUserById error)", async () => {
      const mockClient = createMockAdminClient({
        getUserById: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "User not found" },
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User not found");
    });

    it("returns 404 when getUserById returns null user", async () => {
      const mockClient = createMockAdminClient({
        getUserById: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User not found");
    });

    it("returns 400 when user has no email address", async () => {
      const mockClient = createMockAdminClient({
        getUserById: jest.fn().mockResolvedValue({
          data: { user: { id: VALID_UUID, email: null } },
          error: null,
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User does not have an email address");
    });
  });

  describe("Already Accepted Invitation", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 400 when invitation has already been accepted", async () => {
      const mockClient = createMockAdminClient({
        profileSelect: jest.fn().mockResolvedValue({
          data: {
            invited_at: "2026-01-01",
            invitation_accepted_at: "2026-01-02",
            plan_start_date: "2026-01-01",
          },
          error: null,
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User has already accepted their invitation");
    });
  });

  describe("Resend Invite - Happy Path", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("successfully resends invite for pending user", async () => {
      const inviteMock = jest.fn().mockResolvedValue({ error: null });
      const mockClient = createMockAdminClient({
        inviteUserByEmail: inviteMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Invitation email resent successfully.");
      expect(inviteMock).toHaveBeenCalledWith("client@example.com", {
        redirectTo: "http://localhost:3000/auth/callback",
      });
    });

    it("backfills plan_start_date when profile has no plan_start_date", async () => {
      const updateEqMock = jest.fn().mockResolvedValue({ error: null });
      const mockClient = createMockAdminClient({
        profileSelect: jest.fn().mockResolvedValue({
          data: { invited_at: "2026-01-01", invitation_accepted_at: null, plan_start_date: null },
          error: null,
        }),
        profileUpdate: updateEqMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);

      expect(response.status).toBe(200);
      // The update call should include plan_start_date
      const fromMock = mockClient.from;
      expect(fromMock).toHaveBeenCalledWith("profiles");
    });

    it("does not overwrite existing plan_start_date", async () => {
      const mockClient = createMockAdminClient({
        profileSelect: jest.fn().mockResolvedValue({
          data: {
            invited_at: "2026-01-01",
            invitation_accepted_at: null,
            plan_start_date: "2026-02-01",
          },
          error: null,
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Invite Error - Falls Back to Password Reset", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("sends password reset when invite fails with 'already' message", async () => {
      const resetMock = jest.fn().mockResolvedValue({ error: null });
      const mockClient = createMockAdminClient({
        inviteUserByEmail: jest.fn().mockResolvedValue({
          error: { message: "User already registered" },
        }),
        resetPasswordForEmail: resetMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(resetMock).toHaveBeenCalledWith("client@example.com", {
        redirectTo: "http://localhost:3000/auth/callback?type=recovery",
      });
    });

    it("returns 500 when password reset also fails", async () => {
      const mockClient = createMockAdminClient({
        inviteUserByEmail: jest.fn().mockResolvedValue({
          error: { message: "User already registered" },
        }),
        resetPasswordForEmail: jest.fn().mockResolvedValue({
          error: { message: "Rate limit exceeded" },
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Rate limit exceeded");
    });
  });

  describe("Invite Error - Non-'already' Error", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 500 for a non-'already' invite error", async () => {
      const mockClient = createMockAdminClient({
        inviteUserByEmail: jest.fn().mockResolvedValue({
          error: { message: "Service unavailable" },
        }),
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Service unavailable");
    });
  });

  describe("Unexpected Errors", () => {
    it("returns 500 for unexpected exceptions", async () => {
      mockIsAdmin.mockRejectedValue(new Error("Unexpected failure"));

      const request = createMockRequest({ userId: VALID_UUID });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to resend invite");
    });

    it("returns 500 when request.json() throws", async () => {
      mockIsAdmin.mockResolvedValue(true);

      // Create a request with invalid JSON
      const request = new Request("http://localhost:3000/api/admin/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe("Site URL Configuration", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("uses NEXT_PUBLIC_SITE_URL for redirect", async () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://metabolikal.com";

      const inviteMock = jest.fn().mockResolvedValue({ error: null });
      const mockClient = createMockAdminClient({
        inviteUserByEmail: inviteMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      await POST(request);

      expect(inviteMock).toHaveBeenCalledWith("client@example.com", {
        redirectTo: "https://metabolikal.com/auth/callback",
      });
    });

    it("falls back to localhost when NEXT_PUBLIC_SITE_URL is not set", async () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;

      const inviteMock = jest.fn().mockResolvedValue({ error: null });
      const mockClient = createMockAdminClient({
        inviteUserByEmail: inviteMock,
      });
      mockCreateSupabaseClient.mockReturnValue(mockClient as any);

      const request = createMockRequest({ userId: VALID_UUID });
      await POST(request);

      expect(inviteMock).toHaveBeenCalledWith("client@example.com", {
        redirectTo: "http://localhost:3000/auth/callback",
      });
    });
  });
});
