/**
 * @jest-environment node
 */

/**
 * Push Service Tests
 *
 * Comprehensive tests for the push notification service library.
 * Covers sendPushToUser, sendPushToUsers, sendPushToAdmins,
 * quiet hours, notification type preferences, VAPID config,
 * subscription cleanup, and mixed success/failure scenarios.
 */

// Mock web-push before any imports
jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

// Mock the auth-server module
jest.mock("@/lib/auth-server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

import webpush from "web-push";
import { createServerSupabaseClient } from "@/lib/auth-server";

// ---------------------------------------------------------------------------
// Helper: build a detailed mock Supabase client
// ---------------------------------------------------------------------------

function createDetailedMockSupabase(options: {
  prefsData?: Record<string, unknown> | null;
  prefsError?: { code?: string; message?: string } | null;
  subscriptionsData?: Array<{
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }> | null;
  subscriptionsError?: { message?: string } | null;
  adminsData?: Array<{ id: string }> | null;
}) {
  const {
    prefsData = null,
    prefsError = null,
    subscriptionsData = null,
    subscriptionsError = null,
    adminsData = null,
  } = options;

  // Track delete calls for assertions
  const deleteCalls: { table: string; endpoints: string[] }[] = [];

  const mockFrom = jest.fn().mockImplementation((table: string) => {
    if (table === "notification_preferences") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: prefsData,
              error: prefsError,
            }),
          }),
        }),
      };
    }

    if (table === "push_subscriptions") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: subscriptionsData,
            error: subscriptionsError,
          }),
        }),
        delete: jest.fn().mockReturnValue({
          in: jest.fn().mockImplementation((_col: string, endpoints: string[]) => {
            deleteCalls.push({ table, endpoints });
            return Promise.resolve({ data: null, error: null });
          }),
        }),
        update: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => {
            return {
              then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
            };
          }),
        })),
      };
    }

    if (table === "profiles") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: adminsData,
              error: null,
            }),
          }),
        }),
      };
    }

    // fallback
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };
  });

  return { from: mockFrom, _deleteCalls: deleteCalls };
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    relatedId?: string;
  };
  requireInteraction?: boolean;
}

interface PushResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

const baseNotification: PushNotification = {
  title: "Test Notification",
  body: "This is a test message",
  data: { url: "/dashboard", type: "message", relatedId: "abc" },
};

const mockSubscription = (id: string, endpoint?: string) => ({
  id,
  user_id: "user-1",
  endpoint: endpoint || `https://push.example.com/sub/${id}`,
  p256dh: `p256dh-key-${id}`,
  auth: `auth-key-${id}`,
});

const allEnabledPrefs = {
  push_enabled: true,
  quiet_hours_start: null as string | null,
  quiet_hours_end: null as string | null,
  notify_checkin_review: true,
  notify_messages: true,
  notify_system: true,
  notify_plan_updates: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Push Service", () => {
  const mockCreateServerSupabaseClient = createServerSupabaseClient as jest.MockedFunction<
    typeof createServerSupabaseClient
  >;
  const mockSendNotification = webpush.sendNotification as jest.MockedFunction<
    typeof webpush.sendNotification
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console output in tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  // =========================================================================
  // Interface / Type shape tests
  // =========================================================================

  describe("PushNotification interface", () => {
    it("should accept all optional fields", () => {
      const notification: PushNotification = {
        title: "Test Title",
        body: "Test body",
        icon: "/icon.png",
        badge: "/badge.png",
        tag: "test-tag",
        data: { url: "/test", type: "test", relatedId: "123" },
        requireInteraction: true,
      };
      expect(notification.title).toBe("Test Title");
      expect(notification.data?.url).toBe("/test");
    });

    it("should work with minimal required fields", () => {
      const notification: PushNotification = {
        title: "Minimal",
        body: "Just title and body",
      };
      expect(notification.title).toBeDefined();
      expect(notification.body).toBeDefined();
    });
  });

  describe("PushResult interface", () => {
    it("should have correct shape", () => {
      const result: PushResult = {
        success: true,
        sent: 5,
        failed: 1,
        errors: ["One subscription failed"],
      };
      expect(result.success).toBe(true);
      expect(result.sent).toBe(5);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  // =========================================================================
  // sendPushToUser
  // =========================================================================

  describe("sendPushToUser", () => {
    let sendPushToUser: (userId: string, notification: PushNotification) => Promise<PushResult>;

    beforeEach(async () => {
      const mod = require("../push-service");
      sendPushToUser = mod.sendPushToUser;
    });

    // ----- Happy path: all prefs enabled, single subscription -----
    it("sends notification when all prefs are enabled and subscription exists", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify sendNotification was called with correct subscription shape
      expect(mockSendNotification).toHaveBeenCalledWith(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(baseNotification)
      );
    });

    // ----- push_enabled = false -----
    it("returns early when push_enabled is false", async () => {
      const mockSupa = createDetailedMockSupabase({
        prefsData: { ...allEnabledPrefs, push_enabled: false },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result).toEqual({ success: true, sent: 0, failed: 0, errors: [] });
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    // ----- Notification type disabled: checkin_review -----
    it("skips when checkin_review notification type is disabled", async () => {
      const mockSupa = createDetailedMockSupabase({
        prefsData: { ...allEnabledPrefs, notify_checkin_review: false },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const notification: PushNotification = {
        ...baseNotification,
        data: { type: "checkin_review" },
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Notification type disabled by user");
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    // ----- Notification type disabled: checkin_submitted (maps to checkin_review) -----
    it("skips when checkin_submitted and checkin_review pref is disabled", async () => {
      const mockSupa = createDetailedMockSupabase({
        prefsData: { ...allEnabledPrefs, notify_checkin_review: false },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const notification: PushNotification = {
        ...baseNotification,
        data: { type: "checkin_submitted" },
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Notification type disabled by user");
    });

    // ----- Notification type disabled: message -----
    it("skips when message notification type is disabled", async () => {
      const mockSupa = createDetailedMockSupabase({
        prefsData: { ...allEnabledPrefs, notify_messages: false },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const notification: PushNotification = {
        ...baseNotification,
        data: { type: "message" },
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Notification type disabled by user");
    });

    // ----- Notification type disabled: system -----
    it("skips when system notification type is disabled", async () => {
      const mockSupa = createDetailedMockSupabase({
        prefsData: { ...allEnabledPrefs, notify_system: false },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const notification: PushNotification = {
        ...baseNotification,
        data: { type: "system" },
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Notification type disabled by user");
    });

    // ----- Notification type disabled: plan_update -----
    it("skips when plan_update notification type is disabled", async () => {
      const mockSupa = createDetailedMockSupabase({
        prefsData: { ...allEnabledPrefs, notify_plan_updates: false },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const notification: PushNotification = {
        ...baseNotification,
        data: { type: "plan_update" },
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Notification type disabled by user");
    });

    // ----- Unknown notification type defaults to enabled -----
    it("sends notification for unknown notification type (defaults to enabled)", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const notification: PushNotification = {
        ...baseNotification,
        data: { type: "some_future_type" },
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(1);
      expect(mockSendNotification).toHaveBeenCalled();
    });

    // ----- Quiet hours: normal range, inside -----
    it("skips when inside quiet hours (normal range, e.g. 09:00-17:00)", async () => {
      jest.useFakeTimers();
      // Set time to 12:00 — inside 09:00-17:00
      jest.setSystemTime(new Date("2026-02-20T12:00:00"));

      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "12:00",
          quiet_hours_end: "17:00",
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Quiet hours active");
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    // ----- Quiet hours: normal range, outside -----
    it("sends when outside quiet hours (normal range)", async () => {
      jest.useFakeTimers();
      // Set time to 20:00 — outside 09:00-17:00
      jest.setSystemTime(new Date("2026-02-20T20:00:00"));

      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "09:00",
          quiet_hours_end: "17:00",
        },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(1);
    });

    // ----- Quiet hours: midnight spanning, inside (late night) -----
    it("skips when inside quiet hours spanning midnight (time=23:30)", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T23:30:00"));

      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "22:00",
          quiet_hours_end: "07:00",
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Quiet hours active");
    });

    // ----- Quiet hours: midnight spanning, inside (early morning) -----
    it("skips when inside quiet hours spanning midnight (time=05:00)", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T05:00:00"));

      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "22:00",
          quiet_hours_end: "07:00",
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Quiet hours active");
    });

    // ----- Quiet hours: midnight spanning, outside -----
    it("sends when outside quiet hours spanning midnight (time=15:00)", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T15:00:00"));

      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "22:00",
          quiet_hours_end: "07:00",
        },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(1);
    });

    // ----- Quiet hours: null values mean not in quiet hours -----
    it("sends normally when quiet_hours_start is null", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: null,
          quiet_hours_end: "17:00",
        },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(1);
    });

    it("sends normally when quiet_hours_end is null", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "22:00",
          quiet_hours_end: null,
        },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(1);
    });

    // ----- No subscriptions -----
    it("returns early with sent:0 when user has no subscriptions", async () => {
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result).toEqual({ success: true, sent: 0, failed: 0, errors: [] });
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it("returns early with sent:0 when subscriptions data is null", async () => {
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: null,
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result).toEqual({ success: true, sent: 0, failed: 0, errors: [] });
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    // ----- 410 Gone subscription cleanup -----
    it("deletes expired subscriptions on 410 Gone error", async () => {
      const sub = mockSubscription("sub-1", "https://push.example.com/expired");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      mockSendNotification.mockRejectedValue({
        statusCode: 410,
        message: "Gone",
      } as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toContain("Gone");

      // Verify the delete was called for expired endpoint
      expect(mockSupa._deleteCalls).toHaveLength(1);
      expect(mockSupa._deleteCalls[0].endpoints).toContain("https://push.example.com/expired");
    });

    // ----- Non-410 error does NOT delete subscription -----
    it("does not delete subscription on non-410 errors", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      mockSendNotification.mockRejectedValue({
        statusCode: 500,
        message: "Internal Server Error",
      } as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.failed).toBe(1);
      expect(result.errors).toContain("Internal Server Error");
      expect(mockSupa._deleteCalls).toHaveLength(0);
    });

    // ----- Mixed success/failure with Promise.allSettled -----
    it("handles mixed success and failure across multiple subscriptions", async () => {
      const sub1 = mockSubscription("sub-1");
      const sub2 = mockSubscription("sub-2");
      const sub3 = mockSubscription("sub-3");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub1, sub2, sub3],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      // sub1 succeeds, sub2 fails with 410, sub3 fails with 500
      mockSendNotification
        .mockResolvedValueOnce({} as never)
        .mockRejectedValueOnce({ statusCode: 410, message: "Gone" } as never)
        .mockRejectedValueOnce({
          statusCode: 500,
          message: "Server error",
        } as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain("Gone");
      expect(result.errors).toContain("Server error");

      // Only the 410 subscription should be cleaned up
      expect(mockSupa._deleteCalls).toHaveLength(1);
      expect(mockSupa._deleteCalls[0].endpoints).toContain(sub2.endpoint);
      expect(mockSupa._deleteCalls[0].endpoints).not.toContain(sub3.endpoint);
    });

    // ----- Multiple subscriptions all succeed -----
    it("sends to all subscriptions and counts all successes", async () => {
      const sub1 = mockSubscription("sub-1");
      const sub2 = mockSubscription("sub-2");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub1, sub2],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockSendNotification).toHaveBeenCalledTimes(2);
    });

    // ----- No preferences (PGRST116 error) defaults to enabled -----
    it("defaults to enabled when preferences not found (PGRST116 error)", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: null,
        prefsError: { code: "PGRST116", message: "No rows found" },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      // prefs is null → isNotificationTypeEnabled returns true, push_enabled check skipped
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
    });

    // ----- Preferences fetch error (non-PGRST116) logs and continues -----
    it("logs error and continues when preferences fetch fails with non-PGRST116 error", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: null,
        prefsError: { code: "PGRST500", message: "Database error" },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      const result = await sendPushToUser("user-1", baseNotification);

      // prefs is null → defaults to enabled → should still send
      expect(result.sent).toBe(1);

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Push] Error fetching preferences:"),
        expect.objectContaining({ code: "PGRST500" })
      );
    });

    // ----- last_used_at update on success (fire and forget) -----
    it("fires last_used_at update on successful send", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      await sendPushToUser("user-1", baseNotification);

      // Let microtasks settle for the fire-and-forget .then()
      await new Promise((r) => setTimeout(r, 10));

      // Verify from("push_subscriptions") was called at least for update
      const pushSubCalls = mockSupa.from.mock.calls.filter(
        (call: string[]) => call[0] === "push_subscriptions"
      );
      // Should be at least 2: once for select (get subs), once for update (last_used_at)
      expect(pushSubCalls.length).toBeGreaterThanOrEqual(2);
    });

    // ----- Error with no message -----
    it("handles errors with no message property", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      mockSendNotification.mockRejectedValue({ statusCode: 403 } as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.failed).toBe(1);
      expect(result.errors).toContain("Unknown error");
    });

    // ----- Notification without data.type -----
    it("sends notification when data.type is undefined (defaults to enabled)", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const notification: PushNotification = {
        title: "No type",
        body: "No data.type field",
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(1);
    });

    // ----- Multiple 410 Gone cleaned up in batch -----
    it("cleans up multiple 410 Gone subscriptions in a single delete call", async () => {
      const sub1 = mockSubscription("sub-1", "https://push.example.com/expired1");
      const sub2 = mockSubscription("sub-2", "https://push.example.com/expired2");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub1, sub2],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      mockSendNotification
        .mockRejectedValueOnce({ statusCode: 410, message: "Gone" } as never)
        .mockRejectedValueOnce({ statusCode: 410, message: "Gone" } as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.failed).toBe(2);
      expect(mockSupa._deleteCalls).toHaveLength(1);
      expect(mockSupa._deleteCalls[0].endpoints).toEqual([
        "https://push.example.com/expired1",
        "https://push.example.com/expired2",
      ]);
    });

    // ----- No expired endpoints means no delete call -----
    it("does not call delete when no endpoints are expired", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      await sendPushToUser("user-1", baseNotification);

      expect(mockSupa._deleteCalls).toHaveLength(0);
    });
  });

  // =========================================================================
  // sendPushToUsers
  // =========================================================================

  describe("sendPushToUsers", () => {
    let sendPushToUsers: (userIds: string[], notification: PushNotification) => Promise<PushResult>;

    beforeEach(() => {
      const mod = require("../push-service");
      sendPushToUsers = mod.sendPushToUsers;
    });

    it("aggregates results from multiple users", async () => {
      let callCount = 0;
      mockCreateServerSupabaseClient.mockImplementation(async () => {
        callCount++;
        const sub = mockSubscription(`sub-${callCount}`);
        return createDetailedMockSupabase({
          prefsData: allEnabledPrefs,
          subscriptionsData: [sub],
        }) as never;
      });
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUsers(["user-1", "user-2"], baseNotification);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("counts errors from individual users that fail completely", async () => {
      let callCount = 0;
      mockCreateServerSupabaseClient.mockImplementation(async () => {
        callCount++;
        if (callCount === 2) {
          throw new Error("Connection failed");
        }
        return createDetailedMockSupabase({
          prefsData: allEnabledPrefs,
          subscriptionsData: [mockSubscription("sub-1")],
        }) as never;
      });
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUsers(["user-1", "user-2"], baseNotification);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toContain("Connection failed");
    });

    it("handles empty user list", async () => {
      const result = await sendPushToUsers([], baseNotification);

      expect(result).toEqual({ success: true, sent: 0, failed: 0, errors: [] });
    });

    it("aggregates errors from multiple users with mixed results", async () => {
      let callCount = 0;
      mockCreateServerSupabaseClient.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // User 1: has subscriptions but push fails
          return createDetailedMockSupabase({
            prefsData: allEnabledPrefs,
            subscriptionsData: [mockSubscription("sub-1")],
          }) as never;
        }
        // User 2: push disabled
        return createDetailedMockSupabase({
          prefsData: { ...allEnabledPrefs, push_enabled: false },
        }) as never;
      });
      mockSendNotification.mockRejectedValue({
        statusCode: 500,
        message: "Push failed",
      } as never);

      const result = await sendPushToUsers(["user-1", "user-2"], baseNotification);

      // user-1: 0 sent, 1 failed. user-2: 0 sent, 0 failed (push disabled)
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toContain("Push failed");
    });

    it("handles single user", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUsers(["user-1"], baseNotification);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
    });

    it("uses 'Unknown error' when rejected error has no message property", async () => {
      // This covers the branch at line 258: error.message || "Unknown error"
      // where a user's sendPushToUser call rejects with an error without .message
      mockCreateServerSupabaseClient.mockRejectedValue({} as never);

      const result = await sendPushToUsers(["user-1"], baseNotification);

      expect(result.failed).toBe(1);
      expect(result.errors).toContain("Unknown error");
    });
  });

  // =========================================================================
  // sendPushToAdmins
  // =========================================================================

  describe("sendPushToAdmins", () => {
    let sendPushToAdmins: (notification: PushNotification) => Promise<PushResult>;

    beforeEach(() => {
      const mod = require("../push-service");
      sendPushToAdmins = mod.sendPushToAdmins;
    });

    it("returns early when no admins are found (empty array)", async () => {
      const mockSupa = createDetailedMockSupabase({ adminsData: [] });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToAdmins(baseNotification);

      expect(result).toEqual({ success: true, sent: 0, failed: 0, errors: [] });
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it("returns early when admins data is null", async () => {
      const mockSupa = createDetailedMockSupabase({ adminsData: null });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToAdmins(baseNotification);

      expect(result).toEqual({ success: true, sent: 0, failed: 0, errors: [] });
    });

    it("sends notifications to all active admins", async () => {
      let callCount = 0;
      mockCreateServerSupabaseClient.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First call: fetch admins from profiles
          return createDetailedMockSupabase({
            adminsData: [{ id: "admin-1" }, { id: "admin-2" }],
          }) as never;
        }
        // Subsequent calls: sendPushToUser for each admin
        return createDetailedMockSupabase({
          prefsData: allEnabledPrefs,
          subscriptionsData: [mockSubscription(`sub-admin-${callCount}`)],
        }) as never;
      });
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToAdmins(baseNotification);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("queries profiles table for active admins", async () => {
      const mockSupa = createDetailedMockSupabase({ adminsData: [] });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      await sendPushToAdmins(baseNotification);

      // Verify the profiles table was queried
      expect(mockSupa.from).toHaveBeenCalledWith("profiles");
    });

    it("handles partial admin send failure", async () => {
      let callCount = 0;
      mockCreateServerSupabaseClient.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return createDetailedMockSupabase({
            adminsData: [{ id: "admin-1" }, { id: "admin-2" }],
          }) as never;
        }
        if (callCount === 2) {
          // admin-1 succeeds
          return createDetailedMockSupabase({
            prefsData: allEnabledPrefs,
            subscriptionsData: [mockSubscription("sub-admin-1")],
          }) as never;
        }
        // admin-2 fails
        throw new Error("Supabase timeout");
      });
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToAdmins(baseNotification);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toContain("Supabase timeout");
    });
  });

  // =========================================================================
  // isInQuietHours (tested through sendPushToUser behavior)
  // =========================================================================

  describe("isInQuietHours (via sendPushToUser)", () => {
    let sendPushToUser: (userId: string, notification: PushNotification) => Promise<PushResult>;

    beforeEach(() => {
      const mod = require("../push-service");
      sendPushToUser = mod.sendPushToUser;
    });

    it("is not in quiet hours when both start and end are null", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: null,
          quiet_hours_end: null,
        },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      expect(result.sent).toBe(1);
    });

    it("handles boundary: at exact start of normal quiet hours", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T09:00:00"));

      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "09:00",
          quiet_hours_end: "17:00",
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      // 09:00 >= 09:00 && 09:00 <= 17:00 → in quiet hours
      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Quiet hours active");
    });

    it("handles boundary: at exact end of normal quiet hours", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T17:00:00"));

      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "09:00",
          quiet_hours_end: "17:00",
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      // 17:00 >= 09:00 && 17:00 <= 17:00 → in quiet hours
      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Quiet hours active");
    });

    it("handles boundary: at exact start of midnight-spanning quiet hours", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T22:00:00"));

      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "22:00",
          quiet_hours_end: "07:00",
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      // 22:00 >= 22:00 → in quiet hours (midnight wrapping)
      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Quiet hours active");
    });

    it("handles boundary: at exact end of midnight-spanning quiet hours", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T07:00:00"));

      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "22:00",
          quiet_hours_end: "07:00",
        },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      // 07:00 <= 07:00 → in quiet hours (midnight wrapping)
      expect(result.sent).toBe(0);
      expect(result.errors).toContain("Quiet hours active");
    });

    it("just outside midnight-spanning quiet hours (time=07:01)", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T07:01:00"));

      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "22:00",
          quiet_hours_end: "07:00",
        },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      // 07:01 > 07:00 and 07:01 < 22:00 → NOT in quiet hours
      expect(result.sent).toBe(1);
    });

    it("just outside normal quiet hours (time=17:01)", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T17:01:00"));

      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          quiet_hours_start: "09:00",
          quiet_hours_end: "17:00",
        },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const result = await sendPushToUser("user-1", baseNotification);

      // 17:01 > 17:00 → NOT in quiet hours
      expect(result.sent).toBe(1);
    });
  });

  // =========================================================================
  // isNotificationTypeEnabled (via sendPushToUser behavior)
  // =========================================================================

  describe("isNotificationTypeEnabled (via sendPushToUser)", () => {
    let sendPushToUser: (userId: string, notification: PushNotification) => Promise<PushResult>;

    beforeEach(() => {
      const mod = require("../push-service");
      sendPushToUser = mod.sendPushToUser;
    });

    it("returns true (sends) when prefs is null (no preferences row)", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: null,
        prefsError: { code: "PGRST116", message: "Not found" },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const notification: PushNotification = {
        ...baseNotification,
        data: { type: "checkin_review" },
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(1);
    });

    it("correctly maps checkin_submitted to notify_checkin_review", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: { ...allEnabledPrefs, notify_checkin_review: true },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const notification: PushNotification = {
        ...baseNotification,
        data: { type: "checkin_submitted" },
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(1);
    });

    it("sends for undefined notification type even with strict prefs", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          notify_checkin_review: false,
          notify_messages: false,
          notify_system: false,
          notify_plan_updates: false,
        },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      // No data.type → undefined → default case → true
      const notification: PushNotification = {
        title: "No type",
        body: "Body",
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(1);
    });

    it("sends for notification with data but no type field", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: {
          ...allEnabledPrefs,
          notify_checkin_review: false,
          notify_messages: false,
          notify_system: false,
          notify_plan_updates: false,
        },
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const notification: PushNotification = {
        title: "Has data but no type",
        body: "Body",
        data: { url: "/test" },
      };
      const result = await sendPushToUser("user-1", notification);

      expect(result.sent).toBe(1);
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe("edge cases", () => {
    let sendPushToUser: (userId: string, notification: PushNotification) => Promise<PushResult>;

    beforeEach(() => {
      const mod = require("../push-service");
      sendPushToUser = mod.sendPushToUser;
    });

    it("handles subscription error from supabase gracefully", async () => {
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: null,
        subscriptionsError: { message: "Table not found" },
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);

      const result = await sendPushToUser("user-1", baseNotification);

      // subscriptions is null, should return early
      expect(result).toEqual({ success: true, sent: 0, failed: 0, errors: [] });
    });

    it("logs subscription endpoints for debugging", async () => {
      const sub = mockSubscription(
        "sub-1",
        "https://fcm.googleapis.com/fcm/send/very-long-endpoint-string-here"
      );
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await sendPushToUser("user-1", baseNotification);

      // Verify debug logging of subscription endpoints
      const subLogCalls = logSpy.mock.calls.filter(
        (call) => typeof call[0] === "string" && call[0].includes("[Push] Subscription sub-1:")
      );
      expect(subLogCalls.length).toBe(1);
    });

    it("logs count of subscriptions found", async () => {
      const sub1 = mockSubscription("sub-1");
      const sub2 = mockSubscription("sub-2");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub1, sub2],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await sendPushToUser("user-1", baseNotification);

      const countLogCalls = logSpy.mock.calls.filter(
        (call) => typeof call[0] === "string" && call[0].includes("[Push] Found 2 subscriptions")
      );
      expect(countLogCalls.length).toBe(1);
    });

    it("logs success for each subscription sent", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockResolvedValue({} as never);

      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await sendPushToUser("user-1", baseNotification);

      const successLogCalls = logSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("[Push] Successfully sent to subscription sub-1")
      );
      expect(successLogCalls.length).toBe(1);
    });

    it("logs error details on failure", async () => {
      const sub = mockSubscription("sub-1");
      const mockSupa = createDetailedMockSupabase({
        prefsData: allEnabledPrefs,
        subscriptionsData: [sub],
      });
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupa as never);
      mockSendNotification.mockRejectedValue({
        statusCode: 401,
        message: "Unauthorized",
      } as never);

      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await sendPushToUser("user-1", baseNotification);

      const errorLogCalls = errorSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("[Push] Failed to send to subscription sub-1:")
      );
      expect(errorLogCalls.length).toBe(1);
    });
  });
});

// =========================================================================
// VAPID configuration (separate describe to use resetModules safely)
// =========================================================================

describe("Push Service - VAPID configuration", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("calls setVapidDetails when all env vars are present", async () => {
    process.env = {
      ...originalEnv,
      VAPID_CONTACT_EMAIL: "test@example.com",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "BLongPublicKeyString",
      VAPID_PRIVATE_KEY: "private-key-value",
    };

    jest.resetModules();
    jest.mock("web-push", () => ({
      setVapidDetails: jest.fn(),
      sendNotification: jest.fn(),
    }));
    jest.mock("@/lib/auth-server", () => ({
      createServerSupabaseClient: jest.fn(),
    }));

    jest.spyOn(console, "log").mockImplementation(() => {});

    const freshWebpush = (await import("web-push")).default;
    await import("../push-service");

    expect(freshWebpush.setVapidDetails).toHaveBeenCalledWith(
      "mailto:test@example.com",
      "BLongPublicKeyString",
      "private-key-value"
    );
  });

  it("logs a warning listing missing env vars", async () => {
    process.env = {
      ...originalEnv,
      VAPID_CONTACT_EMAIL: undefined,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: undefined,
      VAPID_PRIVATE_KEY: undefined,
    };

    jest.resetModules();
    jest.mock("web-push", () => ({
      setVapidDetails: jest.fn(),
      sendNotification: jest.fn(),
    }));
    jest.mock("@/lib/auth-server", () => ({
      createServerSupabaseClient: jest.fn(),
    }));

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});

    const freshWebpush = (await import("web-push")).default;
    await import("../push-service");

    expect(freshWebpush.setVapidDetails).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("[Push] VAPID not configured"));
  });

  it("logs a warning with specific missing variable names", async () => {
    process.env = {
      ...originalEnv,
      VAPID_CONTACT_EMAIL: "test@example.com",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: undefined,
      VAPID_PRIVATE_KEY: "private-key-value",
    };

    jest.resetModules();
    jest.mock("web-push", () => ({
      setVapidDetails: jest.fn(),
      sendNotification: jest.fn(),
    }));
    jest.mock("@/lib/auth-server", () => ({
      createServerSupabaseClient: jest.fn(),
    }));

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});

    await import("../push-service");

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("NEXT_PUBLIC_VAPID_PUBLIC_KEY"));
  });
});
