/**
 * @jest-environment node
 */

import { POST } from "../route";
import * as authServerModule from "@/lib/auth-server";

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  isAdmin: jest.fn(),
  getUser: jest.fn(),
  createServerSupabaseClient: jest.fn(),
}));

describe("POST /api/admin/send-message", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return new Request("http://localhost:3000/api/admin/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  describe("Authentication", () => {
    it("returns 401 when user is not admin", async () => {
      mockIsAdmin.mockResolvedValue(false);

      const request = createMockRequest({
        clientId: "client-uuid",
        title: "Hello",
        message: "Test message",
      });

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
      mockGetUser.mockResolvedValue({ id: "admin-id" } as any);
    });

    it("returns 400 when clientId is missing", async () => {
      const request = createMockRequest({
        title: "Hello",
        message: "Test message",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("clientId, title, and message are required");
    });

    it("returns 400 when title is missing", async () => {
      const request = createMockRequest({
        clientId: "client-uuid",
        message: "Test message",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("clientId, title, and message are required");
    });

    it("returns 400 when message is missing", async () => {
      const request = createMockRequest({
        clientId: "client-uuid",
        title: "Hello",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("clientId, title, and message are required");
    });

    it("returns 400 when title is whitespace only", async () => {
      const request = createMockRequest({
        clientId: "client-uuid",
        title: "   ",
        message: "Test message",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("clientId, title, and message are required");
    });

    it("returns 400 when message is whitespace only", async () => {
      const request = createMockRequest({
        clientId: "client-uuid",
        title: "Hello",
        message: "   ",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("clientId, title, and message are required");
    });

    it("returns 400 when title is empty string", async () => {
      const request = createMockRequest({
        clientId: "client-uuid",
        title: "",
        message: "Test message",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe("Happy Path", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("successfully creates a notification and returns success", async () => {
      const adminUser = { id: "admin-uuid-123" };
      mockGetUser.mockResolvedValue(adminUser as any);

      const insertMock = jest.fn().mockResolvedValue({ error: null });
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          insert: insertMock,
        }),
      } as any);

      const request = createMockRequest({
        clientId: "client-uuid-456",
        title: "Weekly Check-in",
        message: "How are you progressing this week?",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(insertMock).toHaveBeenCalledWith({
        user_id: "client-uuid-456",
        sender_id: "admin-uuid-123",
        type: "message",
        title: "Weekly Check-in",
        message: "How are you progressing this week?",
      });
    });

    it("trims whitespace from title and message", async () => {
      mockGetUser.mockResolvedValue({ id: "admin-id" } as any);

      const insertMock = jest.fn().mockResolvedValue({ error: null });
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          insert: insertMock,
        }),
      } as any);

      const request = createMockRequest({
        clientId: "client-id",
        title: "  Trimmed Title  ",
        message: "  Trimmed Message  ",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Trimmed Title",
          message: "Trimmed Message",
        })
      );
    });
  });

  describe("Sender Tracking", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
    });

    it("stores admin user id as sender_id", async () => {
      const adminUser = { id: "admin-uuid-789" };
      mockGetUser.mockResolvedValue(adminUser as any);

      const insertMock = jest.fn().mockResolvedValue({ error: null });
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          insert: insertMock,
        }),
      } as any);

      const request = createMockRequest({
        clientId: "client-uuid",
        title: "Check-in",
        message: "How are you?",
      });

      await POST(request);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          sender_id: "admin-uuid-789",
        })
      );
    });

    it("handles null user gracefully (sender_id is undefined)", async () => {
      mockGetUser.mockResolvedValue(null as any);

      const insertMock = jest.fn().mockResolvedValue({ error: null });
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          insert: insertMock,
        }),
      } as any);

      const request = createMockRequest({
        clientId: "client-uuid",
        title: "Check-in",
        message: "How are you?",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // When user is null, sender_id should be undefined (null?.id)
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          sender_id: undefined,
        })
      );
    });
  });

  describe("Database Errors", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
      mockGetUser.mockResolvedValue({ id: "admin-id" } as any);
    });

    it("returns 500 when notification insert fails", async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockResolvedValue({
            error: { message: "Foreign key violation" },
          }),
        }),
      } as any);

      const request = createMockRequest({
        clientId: "nonexistent-client",
        title: "Hello",
        message: "Test message",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create notification");
    });
  });

  describe("Unexpected Errors", () => {
    it("returns 500 for unexpected exceptions", async () => {
      mockIsAdmin.mockRejectedValue(new Error("Auth service down"));

      const request = createMockRequest({
        clientId: "client-uuid",
        title: "Hello",
        message: "Test",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to send message");
    });

    it("returns 500 when request.json() throws", async () => {
      mockIsAdmin.mockResolvedValue(true);
      mockGetUser.mockResolvedValue({ id: "admin-id" } as any);

      const request = new Request("http://localhost:3000/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to send message");
    });

    it("returns 500 when createServerSupabaseClient throws", async () => {
      mockIsAdmin.mockResolvedValue(true);
      mockGetUser.mockResolvedValue({ id: "admin-id" } as any);
      mockCreateServerSupabaseClient.mockRejectedValue(new Error("Connection failed"));

      const request = createMockRequest({
        clientId: "client-uuid",
        title: "Hello",
        message: "Test",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to send message");
    });
  });

  describe("Notification Shape", () => {
    beforeEach(() => {
      mockIsAdmin.mockResolvedValue(true);
      mockGetUser.mockResolvedValue({ id: "admin-id" } as any);
    });

    it("inserts into notifications table with type 'message'", async () => {
      const fromMock = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: fromMock,
      } as any);

      const request = createMockRequest({
        clientId: "client-uuid",
        title: "Test",
        message: "Body",
      });

      await POST(request);

      expect(fromMock).toHaveBeenCalledWith("notifications");
    });
  });
});
