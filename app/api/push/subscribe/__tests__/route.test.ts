/**
 * @jest-environment node
 */

import { POST } from "../route";
import * as authServerModule from "@/lib/auth-server";

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  getUser: jest.fn(),
  createServerSupabaseClient: jest.fn(),
}));

describe("POST /api/push/subscribe", () => {
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
    return new Request("http://localhost:3000/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const validSubscriptionBody = {
    subscription: {
      endpoint: "https://fcm.googleapis.com/fcm/send/some-endpoint-id",
      keys: {
        p256dh:
          "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8p8REfGzA",
        auth: "tBHItJI5svbpC7htF2Cp2A",
      },
    },
    deviceType: "desktop",
    browser: "Chrome",
  };

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  describe("Authentication", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockRequest(validSubscriptionBody);
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

    it("returns 400 when subscription endpoint is missing", async () => {
      const request = createMockRequest({
        subscription: {
          keys: { p256dh: "key1", auth: "key2" },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid subscription data");
    });

    it("returns 400 when p256dh key is missing", async () => {
      const request = createMockRequest({
        subscription: {
          endpoint: "https://fcm.googleapis.com/fcm/send/some-id",
          keys: { auth: "key2" },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid subscription data");
    });

    it("returns 400 when auth key is missing", async () => {
      const request = createMockRequest({
        subscription: {
          endpoint: "https://fcm.googleapis.com/fcm/send/some-id",
          keys: { p256dh: "key1" },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid subscription data");
    });

    it("returns 400 when subscription object is entirely missing", async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid subscription data");
    });

    it("returns 400 when keys object is missing", async () => {
      const request = createMockRequest({
        subscription: {
          endpoint: "https://fcm.googleapis.com/fcm/send/some-id",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid subscription data");
    });
  });

  // ---------------------------------------------------------------------------
  // New subscription creation
  // ---------------------------------------------------------------------------

  describe("New subscription creation", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("creates a new subscription when none exists for the endpoint", async () => {
      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "sub-new-001" },
            error: null,
          }),
        }),
      });

      const mockSupabase = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "push_subscriptions") {
            return {
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
              insert: insertMock,
            };
          }
          return {};
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest(validSubscriptionBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscriptionId).toBe("sub-new-001");
      expect(data.message).toBe("Subscription created");

      expect(insertMock).toHaveBeenCalledWith({
        user_id: "user-123",
        endpoint: validSubscriptionBody.subscription.endpoint,
        p256dh: validSubscriptionBody.subscription.keys.p256dh,
        auth: validSubscriptionBody.subscription.keys.auth,
        device_type: "desktop",
        browser: "Chrome",
      });
    });

    it("sets device_type and browser to null when not provided", async () => {
      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "sub-new-002" },
            error: null,
          }),
        }),
      });

      const mockSupabase = {
        from: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" },
                }),
              }),
            }),
          }),
          insert: insertMock,
        })),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const bodyWithoutOptionals = {
        subscription: validSubscriptionBody.subscription,
      };

      const request = createMockRequest(bodyWithoutOptionals);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          device_type: null,
          browser: null,
        })
      );
    });

    it("returns 500 when insert fails", async () => {
      const mockSupabase = {
        from: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" },
                }),
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database constraint violation", code: "23505" },
              }),
            }),
          }),
        })),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest(validSubscriptionBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to save subscription");
    });
  });

  // ---------------------------------------------------------------------------
  // Updating existing subscription
  // ---------------------------------------------------------------------------

  describe("Updating existing subscription", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("updates keys when subscription already exists for the endpoint", async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // We need the first from("push_subscriptions") call to return the select chain
      // (which finds an existing subscription), and the second call to return the update chain.
      let callCount = 0;
      const mockSupabase = {
        from: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call: checking for existing subscription
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: "existing-sub-001" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          // Second call: update
          return {
            update: updateMock,
          };
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest(validSubscriptionBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscriptionId).toBe("existing-sub-001");
      expect(data.message).toBe("Subscription updated");

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          p256dh: validSubscriptionBody.subscription.keys.p256dh,
          auth: validSubscriptionBody.subscription.keys.auth,
          device_type: "desktop",
          browser: "Chrome",
        })
      );
    });

    it("returns 500 when update fails", async () => {
      let callCount = 0;
      const mockSupabase = {
        from: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: "existing-sub-001" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: { message: "Update failed", code: "42501" },
              }),
            }),
          };
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const request = createMockRequest(validSubscriptionBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to update subscription");
    });
  });

  // ---------------------------------------------------------------------------
  // Unexpected errors
  // ---------------------------------------------------------------------------

  describe("Unexpected errors", () => {
    it("returns 500 when an unexpected exception is thrown", async () => {
      mockGetUser.mockRejectedValue(new Error("Unexpected server crash"));

      const request = createMockRequest(validSubscriptionBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to subscribe");
    });

    it("returns 500 when request body is not valid JSON", async () => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);

      const request = new Request("http://localhost:3000/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to subscribe");
    });
  });
});
