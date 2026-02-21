/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { POST } from "../route";
import * as authServerModule from "@/lib/auth-server";

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  getUser: jest.fn(),
  createServerSupabaseClient: jest.fn(),
}));

describe("POST /api/push/unsubscribe", () => {
  const mockGetUser = authServerModule.getUser as jest.MockedFunction<
    typeof authServerModule.getUser
  >;
  const mockCreateServerSupabaseClient =
    authServerModule.createServerSupabaseClient as jest.MockedFunction<
      typeof authServerModule.createServerSupabaseClient
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return new Request("http://localhost:3000/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const testEndpoint = "https://fcm.googleapis.com/fcm/send/some-endpoint-id";

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  describe("Authentication", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockRequest({ endpoint: testEndpoint });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });
  });

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  describe("Validation", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("returns 400 when endpoint is missing", async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Endpoint is required");
    });

    it("returns 400 when endpoint is empty string", async () => {
      const request = createMockRequest({ endpoint: "" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Endpoint is required");
    });
  });

  // ---------------------------------------------------------------------------
  // Successful unsubscribe
  // ---------------------------------------------------------------------------

  describe("Successful unsubscribe", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("deletes the subscription and returns removed count", async () => {
      const deleteMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
            count: 1,
          }),
        }),
      });

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          delete: deleteMock,
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({ endpoint: testEndpoint });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.removed).toBe(1);
      expect(data.message).toBe("Subscription removed");

      expect(deleteMock).toHaveBeenCalledWith({ count: "exact" });
    });

    it("scopes the delete to the authenticated user", async () => {
      const eqEndpointMock = jest.fn().mockResolvedValue({
        error: null,
        count: 1,
      });
      const eqUserIdMock = jest.fn().mockReturnValue({
        eq: eqEndpointMock,
      });
      const deleteMock = jest.fn().mockReturnValue({
        eq: eqUserIdMock,
      });

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          delete: deleteMock,
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({ endpoint: testEndpoint });
      await POST(request);

      expect(eqUserIdMock).toHaveBeenCalledWith("user_id", "user-123");
      expect(eqEndpointMock).toHaveBeenCalledWith("endpoint", testEndpoint);
    });
  });

  // ---------------------------------------------------------------------------
  // Non-existent subscription
  // ---------------------------------------------------------------------------

  describe("Non-existent subscription", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("returns success with removed=0 when subscription does not exist", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
                count: 0,
              }),
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({ endpoint: testEndpoint });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.removed).toBe(0);
      expect(data.message).toBe("No subscription found");
    });

    it("returns removed=0 when count is null", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
                count: null,
              }),
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({ endpoint: testEndpoint });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.removed).toBe(0);
      expect(data.message).toBe("No subscription found");
    });
  });

  // ---------------------------------------------------------------------------
  // Database errors
  // ---------------------------------------------------------------------------

  describe("Database errors", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("returns 500 when delete operation fails", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: { message: "Database error", code: "42501" },
                count: null,
              }),
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({ endpoint: testEndpoint });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to unsubscribe");
    });
  });

  // ---------------------------------------------------------------------------
  // Unexpected errors
  // ---------------------------------------------------------------------------

  describe("Unexpected errors", () => {
    it("returns 500 when an unexpected exception is thrown", async () => {
      mockGetUser.mockRejectedValue(new Error("Connection lost"));

      const request = createMockRequest({ endpoint: testEndpoint });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to unsubscribe");
    });

    it("returns 500 when request body is not valid JSON", async () => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);

      const request = new Request("http://localhost:3000/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to unsubscribe");
    });
  });
});
