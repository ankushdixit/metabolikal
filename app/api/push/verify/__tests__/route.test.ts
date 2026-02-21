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

describe("POST /api/push/verify", () => {
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
    return new Request("http://localhost:3000/api/push/verify", {
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
    it("returns 401 with exists=false when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockRequest({ endpoint: testEndpoint });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.exists).toBe(false);
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

    it("returns 400 with exists=false when endpoint is missing", async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.exists).toBe(false);
      expect(data.error).toBe("Endpoint is required");
    });

    it("returns 400 with exists=false when endpoint is empty string", async () => {
      const request = createMockRequest({ endpoint: "" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.exists).toBe(false);
      expect(data.error).toBe("Endpoint is required");
    });
  });

  // ---------------------------------------------------------------------------
  // Subscription exists
  // ---------------------------------------------------------------------------

  describe("Subscription exists", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("returns exists=true when subscription is found for the user and endpoint", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "sub-001" },
                  error: null,
                }),
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
      expect(data.exists).toBe(true);
    });

    it("queries with the correct user_id and endpoint", async () => {
      const eqEndpointMock = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: "sub-001" },
          error: null,
        }),
      });
      const eqUserIdMock = jest.fn().mockReturnValue({
        eq: eqEndpointMock,
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: eqUserIdMock,
      });

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: selectMock,
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({ endpoint: testEndpoint });
      await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith("push_subscriptions");
      expect(selectMock).toHaveBeenCalledWith("id");
      expect(eqUserIdMock).toHaveBeenCalledWith("user_id", "user-123");
      expect(eqEndpointMock).toHaveBeenCalledWith("endpoint", testEndpoint);
    });
  });

  // ---------------------------------------------------------------------------
  // Subscription does not exist
  // ---------------------------------------------------------------------------

  describe("Subscription does not exist", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("returns exists=false when no subscription is found", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116", message: "No rows found" },
                }),
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
      expect(data.exists).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Unexpected errors
  // ---------------------------------------------------------------------------

  describe("Unexpected errors", () => {
    it("returns 500 with exists=false when an exception is thrown", async () => {
      mockGetUser.mockRejectedValue(new Error("Server crash"));

      const request = createMockRequest({ endpoint: testEndpoint });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.exists).toBe(false);
    });

    it("returns 500 with exists=false when request body is invalid JSON", async () => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);

      const request = new Request("http://localhost:3000/api/push/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.exists).toBe(false);
    });

    it("returns 500 when createServerSupabaseClient throws", async () => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
      mockCreateServerSupabaseClient.mockRejectedValue(new Error("Failed to create client"));

      const request = createMockRequest({ endpoint: testEndpoint });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.exists).toBe(false);
    });
  });
});
