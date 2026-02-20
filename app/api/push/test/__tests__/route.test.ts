/**
 * @jest-environment node
 */

import { POST } from "../route";
import * as authServerModule from "@/lib/auth-server";
import * as pushServiceModule from "@/lib/push-service";

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  getUser: jest.fn(),
  createServerSupabaseClient: jest.fn(),
}));

// Mock the push-service module
jest.mock("@/lib/push-service", () => ({
  sendPushToUser: jest.fn(),
}));

describe("POST /api/push/test", () => {
  const mockGetUser = authServerModule.getUser as jest.MockedFunction<
    typeof authServerModule.getUser
  >;
  const mockCreateServerSupabaseClient =
    authServerModule.createServerSupabaseClient as jest.MockedFunction<
      typeof authServerModule.createServerSupabaseClient
    >;
  const mockSendPushToUser = pushServiceModule.sendPushToUser as jest.MockedFunction<
    typeof pushServiceModule.sendPushToUser
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  describe("Authentication", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue(null);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });
  });

  // ---------------------------------------------------------------------------
  // No subscriptions
  // ---------------------------------------------------------------------------

  describe("No subscriptions", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("returns 400 when user has zero subscriptions", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 0,
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("No push subscriptions found. Please enable notifications first.");
    });

    it("returns 400 when count is null", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: null,
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("No push subscriptions found. Please enable notifications first.");
    });

    it("queries push_subscriptions with correct user_id and count options", async () => {
      const eqMock = jest.fn().mockResolvedValue({ count: 0 });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: selectMock,
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      await POST();

      expect(mockSupabase.from).toHaveBeenCalledWith("push_subscriptions");
      expect(selectMock).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(eqMock).toHaveBeenCalledWith("user_id", "user-123");
    });
  });

  // ---------------------------------------------------------------------------
  // Sending test notification
  // ---------------------------------------------------------------------------

  describe("Sending test notification", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("sends a test notification and returns success", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 2,
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      mockSendPushToUser.mockResolvedValue({
        success: true,
        sent: 2,
        failed: 0,
        errors: [],
      });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deviceCount).toBe(2);
      expect(data.sent).toBe(2);
      expect(data.failed).toBe(0);
      expect(data.message).toBe("Test notification sent to 2 device(s)");
    });

    it("calls sendPushToUser with correct notification payload", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 1,
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      mockSendPushToUser.mockResolvedValue({
        success: true,
        sent: 1,
        failed: 0,
        errors: [],
      });

      await POST();

      expect(mockSendPushToUser).toHaveBeenCalledWith("user-123", {
        title: "Test Notification",
        body: "This is a test push notification from Metabolikal!",
        data: {
          url: "/dashboard",
          type: "test",
        },
      });
    });

    it("returns partial success when some devices fail", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 3,
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      mockSendPushToUser.mockResolvedValue({
        success: true,
        sent: 2,
        failed: 1,
        errors: ["Subscription expired"],
      });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deviceCount).toBe(3);
      expect(data.sent).toBe(2);
      expect(data.failed).toBe(1);
      expect(data.message).toBe("Test notification sent to 2 device(s)");
    });

    it("handles single device correctly in message", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 1,
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      mockSendPushToUser.mockResolvedValue({
        success: true,
        sent: 1,
        failed: 0,
        errors: [],
      });

      const response = await POST();
      const data = await response.json();

      expect(data.message).toBe("Test notification sent to 1 device(s)");
    });
  });

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  describe("Error handling", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: "user-123" } as any);
    });

    it("returns 500 when sendPushToUser throws an exception", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 1,
            }),
          }),
        }),
      };
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase as any);

      mockSendPushToUser.mockRejectedValue(new Error("VAPID keys not configured"));

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to send test notification");
    });

    it("returns 500 when getUser throws an exception", async () => {
      mockGetUser.mockRejectedValue(new Error("Server crash"));

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to send test notification");
    });

    it("returns 500 when createServerSupabaseClient throws", async () => {
      mockCreateServerSupabaseClient.mockRejectedValue(
        new Error("Failed to create Supabase client")
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to send test notification");
    });
  });
});
