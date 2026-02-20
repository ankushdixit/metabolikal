/**
 * @jest-environment node
 */

import { POST } from "../route";
import * as authServerModule from "@/lib/auth-server";
import * as pushServiceModule from "@/lib/push-service";

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  isAdmin: jest.fn(),
}));

// Mock the push-service module
jest.mock("@/lib/push-service", () => ({
  sendPushToUsers: jest.fn(),
  sendPushToAdmins: jest.fn(),
}));

describe("POST /api/push/send", () => {
  const mockIsAdmin = authServerModule.isAdmin as jest.MockedFunction<
    typeof authServerModule.isAdmin
  >;
  const mockSendPushToUsers = pushServiceModule.sendPushToUsers as jest.MockedFunction<
    typeof pushServiceModule.sendPushToUsers
  >;
  const mockSendPushToAdmins = pushServiceModule.sendPushToAdmins as jest.MockedFunction<
    typeof pushServiceModule.sendPushToAdmins
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return new Request("http://localhost:3000/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const validNotification = {
    title: "Test Notification",
    body: "This is a test notification body",
  };

  // ---------------------------------------------------------------------------
  // Authentication (admin-only)
  // ---------------------------------------------------------------------------

  describe("Authentication", () => {
    it("returns 401 when user is not admin", async () => {
      mockIsAdmin.mockResolvedValue(false);

      const request = createMockRequest({
        notification: validNotification,
        userIds: ["user-1"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized. Admin access required.");
    });

    it("returns 401 when isAdmin throws", async () => {
      mockIsAdmin.mockResolvedValue(false);

      const request = createMockRequest({
        notification: validNotification,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  describe("Validation", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 400 when notification title is missing", async () => {
      const request = createMockRequest({
        notification: { body: "Some body" },
        userIds: ["user-1"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Notification title and body are required");
    });

    it("returns 400 when notification body is missing", async () => {
      const request = createMockRequest({
        notification: { title: "Some title" },
        userIds: ["user-1"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Notification title and body are required");
    });

    it("returns 400 when notification object is missing entirely", async () => {
      const request = createMockRequest({
        userIds: ["user-1"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Notification title and body are required");
    });

    it("returns 400 when notification title is empty string", async () => {
      const request = createMockRequest({
        notification: { title: "", body: "Some body" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Notification title and body are required");
    });

    it("returns 400 when notification body is empty string", async () => {
      const request = createMockRequest({
        notification: { title: "Some title", body: "" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Notification title and body are required");
    });
  });

  // ---------------------------------------------------------------------------
  // Sending to specific users
  // ---------------------------------------------------------------------------

  describe("Sending to specific users", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("sends to specified userIds via sendPushToUsers", async () => {
      mockSendPushToUsers.mockResolvedValue({
        success: true,
        sent: 2,
        failed: 0,
        errors: [],
      });

      const request = createMockRequest({
        notification: validNotification,
        userIds: ["user-1", "user-2"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sent).toBe(2);
      expect(data.failed).toBe(0);
      expect(data.errors).toBeUndefined();

      expect(mockSendPushToUsers).toHaveBeenCalledWith(["user-1", "user-2"], validNotification);
      expect(mockSendPushToAdmins).not.toHaveBeenCalled();
    });

    it("includes errors in response when some sends fail", async () => {
      mockSendPushToUsers.mockResolvedValue({
        success: true,
        sent: 1,
        failed: 1,
        errors: ["Subscription expired for user-2"],
      });

      const request = createMockRequest({
        notification: validNotification,
        userIds: ["user-1", "user-2"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sent).toBe(1);
      expect(data.failed).toBe(1);
      expect(data.errors).toEqual(["Subscription expired for user-2"]);
    });
  });

  // ---------------------------------------------------------------------------
  // Sending to admins (no userIds)
  // ---------------------------------------------------------------------------

  describe("Sending to admins (no userIds)", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("sends to admins when userIds is not provided", async () => {
      mockSendPushToAdmins.mockResolvedValue({
        success: true,
        sent: 3,
        failed: 0,
        errors: [],
      });

      const request = createMockRequest({
        notification: validNotification,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sent).toBe(3);
      expect(data.failed).toBe(0);

      expect(mockSendPushToAdmins).toHaveBeenCalledWith(validNotification);
      expect(mockSendPushToUsers).not.toHaveBeenCalled();
    });

    it("sends to admins when userIds is an empty array", async () => {
      mockSendPushToAdmins.mockResolvedValue({
        success: true,
        sent: 1,
        failed: 0,
        errors: [],
      });

      const request = createMockRequest({
        notification: validNotification,
        userIds: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockSendPushToAdmins).toHaveBeenCalledWith(validNotification);
      expect(mockSendPushToUsers).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Send failure handling
  // ---------------------------------------------------------------------------

  describe("Send failure handling", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("returns 500 when sendPushToUsers throws an exception", async () => {
      mockSendPushToUsers.mockRejectedValue(new Error("Push service unavailable"));

      const request = createMockRequest({
        notification: validNotification,
        userIds: ["user-1"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to send notifications");
    });

    it("returns 500 when sendPushToAdmins throws an exception", async () => {
      mockSendPushToAdmins.mockRejectedValue(new Error("Push service unavailable"));

      const request = createMockRequest({
        notification: validNotification,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to send notifications");
    });

    it("omits errors field from response when errors array is empty", async () => {
      mockSendPushToUsers.mockResolvedValue({
        success: true,
        sent: 2,
        failed: 0,
        errors: [],
      });

      const request = createMockRequest({
        notification: validNotification,
        userIds: ["user-1", "user-2"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).not.toHaveProperty("errors");
    });
  });

  // ---------------------------------------------------------------------------
  // Notification with optional fields
  // ---------------------------------------------------------------------------

  describe("Notification with optional fields", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("passes through full notification payload including data and options", async () => {
      mockSendPushToUsers.mockResolvedValue({
        success: true,
        sent: 1,
        failed: 0,
        errors: [],
      });

      const fullNotification = {
        title: "New Check-in",
        body: "A client submitted a check-in",
        icon: "/icon-192x192.png",
        badge: "/badge.png",
        tag: "checkin-review",
        data: {
          url: "/admin/clients/user-1",
          type: "checkin_review",
          relatedId: "checkin-001",
        },
        requireInteraction: true,
      };

      const request = createMockRequest({
        notification: fullNotification,
        userIds: ["admin-1"],
      });

      await POST(request);

      expect(mockSendPushToUsers).toHaveBeenCalledWith(["admin-1"], fullNotification);
    });
  });

  // ---------------------------------------------------------------------------
  // Unexpected errors
  // ---------------------------------------------------------------------------

  describe("Unexpected errors", () => {
    it("returns 500 when request body is not valid JSON", async () => {
      mockIsAdmin.mockResolvedValue(true);

      const request = new Request("http://localhost:3000/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to send notifications");
    });
  });
});
