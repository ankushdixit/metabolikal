/**
 * Tests for NotificationSettings component
 *
 * Focus on function coverage: all event handlers, callbacks, and
 * conditional branches are exercised.
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationSettings } from "../notification-settings";

// ---------------------------------------------------------------------------
// Mock toast
// ---------------------------------------------------------------------------

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

// ---------------------------------------------------------------------------
// Mock push subscription hook
// ---------------------------------------------------------------------------

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

const defaultPushHook = {
  isSupported: true,
  permission: "granted" as globalThis.NotificationPermission,
  isSubscribed: true,
  isLoading: false,
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  error: null as string | null,
};

let pushHookOverrides: Partial<typeof defaultPushHook> = {};

jest.mock("@/hooks/use-push-subscription", () => ({
  usePushSubscription: () => ({
    ...defaultPushHook,
    ...pushHookOverrides,
  }),
}));

// ---------------------------------------------------------------------------
// Mock Supabase (for preference loading/saving)
// ---------------------------------------------------------------------------

let mockPreferencesData: Record<string, unknown> | null = null;
let mockPreferencesError: { message: string; code?: string } | null = null;
let mockUpsertError: { message: string } | null = null;

const mockSingle = jest.fn();
const mockUpsert = jest.fn();

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
      upsert: mockUpsert,
    })),
  }),
}));

// ---------------------------------------------------------------------------
// Mock fetch (for test notification)
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NotificationSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pushHookOverrides = {};
    mockPreferencesData = {
      user_id: "user-123",
      push_enabled: true,
      notify_checkin_review: true,
      notify_messages: true,
      notify_system: true,
      notify_plan_updates: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
    };
    mockPreferencesError = null;
    mockUpsertError = null;

    mockSingle.mockResolvedValue({
      data: mockPreferencesData,
      error: mockPreferencesError,
    });

    mockUpsert.mockResolvedValue({
      data: null,
      error: mockUpsertError,
    });
  });

  // =========================================================================
  // Loading state
  // =========================================================================

  describe("loading state", () => {
    it("shows loader while preferences are loading", () => {
      // Make the single() hang
      mockSingle.mockReturnValue(new Promise(() => {}));

      render(<NotificationSettings userId="user-123" />);

      // Loader2 spinner should be visible
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("removes loader after preferences are loaded", async () => {
      mockSingle.mockResolvedValue({
        data: mockPreferencesData,
        error: null,
      });

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Push Notifications")).toBeInTheDocument();
      });

      // Spinner should be gone
      expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Push not supported
  // =========================================================================

  describe("push not supported", () => {
    it("shows unsupported message", async () => {
      pushHookOverrides = { isSupported: false };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(
          screen.getByText("Push notifications are not supported in this browser.")
        ).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Permission denied
  // =========================================================================

  describe("permission denied", () => {
    it("shows blocked notification message", async () => {
      pushHookOverrides = { permission: "denied" };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Notifications Blocked")).toBeInTheDocument();
        expect(
          screen.getByText(/You have blocked notifications for this site/)
        ).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Subscribed state
  // =========================================================================

  describe("subscribed state", () => {
    it("shows 'Notifications Enabled' when subscribed", async () => {
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Notifications Enabled")).toBeInTheDocument();
        expect(
          screen.getByText("You will receive push notifications on this device")
        ).toBeInTheDocument();
      });
    });

    it("shows 'Disable' button when subscribed", async () => {
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Disable")).toBeInTheDocument();
      });
    });

    it("shows notification type toggles when subscribed", async () => {
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Notification Types")).toBeInTheDocument();
        expect(screen.getByText("Check-in Reviews")).toBeInTheDocument();
        expect(screen.getByText("Messages")).toBeInTheDocument();
        expect(screen.getByText("Plan Updates")).toBeInTheDocument();
        expect(screen.getByText("System Notifications")).toBeInTheDocument();
      });
    });

    it("shows quiet hours section when subscribed", async () => {
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Quiet Hours")).toBeInTheDocument();
        expect(
          screen.getByText("No notifications will be sent during these hours.")
        ).toBeInTheDocument();
      });
    });

    it("shows 'Send Test Notification' button when subscribed", async () => {
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Send Test Notification")).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Unsubscribed state
  // =========================================================================

  describe("unsubscribed state", () => {
    it("shows 'Notifications Disabled' when not subscribed", async () => {
      pushHookOverrides = { isSubscribed: false, permission: "default" };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Notifications Disabled")).toBeInTheDocument();
        expect(screen.getByText("Enable to receive alerts on this device")).toBeInTheDocument();
      });
    });

    it("shows 'Enable' button when not subscribed", async () => {
      pushHookOverrides = { isSubscribed: false, permission: "default" };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Enable")).toBeInTheDocument();
      });
    });

    it("does not show notification type toggles when unsubscribed", async () => {
      pushHookOverrides = { isSubscribed: false, permission: "default" };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Push Notifications")).toBeInTheDocument();
      });

      expect(screen.queryByText("Notification Types")).not.toBeInTheDocument();
      expect(screen.queryByText("Quiet Hours")).not.toBeInTheDocument();
    });

    it("does not show 'Send Test Notification' when unsubscribed", async () => {
      pushHookOverrides = { isSubscribed: false, permission: "default" };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Push Notifications")).toBeInTheDocument();
      });

      expect(screen.queryByText("Send Test Notification")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Push toggle (subscribe/unsubscribe)
  // =========================================================================

  describe("handlePushToggle", () => {
    it("calls unsubscribe when currently subscribed and Disable is clicked", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };
      mockUnsubscribe.mockResolvedValue(true);

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Disable")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Disable"));

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("Push notifications disabled");
    });

    it("does not toast on failed unsubscribe", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };
      mockUnsubscribe.mockResolvedValue(false);

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Disable")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Disable"));

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it("calls subscribe when not subscribed and Enable is clicked", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: false, permission: "default" };
      mockSubscribe.mockResolvedValue(true);

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Enable")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Enable"));

      expect(mockSubscribe).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("Push notifications enabled");
    });

    it("does not toast on failed subscribe", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: false, permission: "default" };
      mockSubscribe.mockResolvedValue(false);

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Enable")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Enable"));

      expect(mockSubscribe).toHaveBeenCalled();
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it("disables button while subscription is loading", async () => {
      pushHookOverrides = { isSubscribed: false, isLoading: true, permission: "default" };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        // The button should render a spinner instead of text
        const buttons = screen.getAllByRole("button");
        const toggleButton = buttons.find((btn) => btn.querySelector(".animate-spin") !== null);
        expect(toggleButton).toBeDefined();
        expect(toggleButton).toBeDisabled();
      });
    });
  });

  // =========================================================================
  // Subscription error display
  // =========================================================================

  describe("subscription error", () => {
    it("shows subscription error message", async () => {
      pushHookOverrides = { error: "Something went wrong" };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Toggle preferences
  // =========================================================================

  describe("togglePreference", () => {
    it("toggles check-in reviews off and saves", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Check-in Reviews")).toBeInTheDocument();
      });

      const toggle = screen.getByRole("switch", { name: /check-in reviews/i });
      expect(toggle).toHaveAttribute("aria-checked", "true");

      await user.click(toggle);

      // Should call upsert with notify_checkin_review: false
      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: "user-123",
            notify_checkin_review: false,
          }),
          { onConflict: "user_id" }
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("Settings saved");
    });

    it("toggles messages preference", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Messages")).toBeInTheDocument();
      });

      const toggle = screen.getByRole("switch", { name: /messages/i });
      await user.click(toggle);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ notify_messages: false }),
          { onConflict: "user_id" }
        );
      });
    });

    it("toggles plan updates preference", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Plan Updates")).toBeInTheDocument();
      });

      const toggle = screen.getByRole("switch", { name: /plan updates/i });
      await user.click(toggle);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ notify_plan_updates: false }),
          { onConflict: "user_id" }
        );
      });
    });

    it("toggles system notifications preference", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("System Notifications")).toBeInTheDocument();
      });

      const toggle = screen.getByRole("switch", { name: /system notifications/i });
      await user.click(toggle);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ notify_system: false }), {
          onConflict: "user_id",
        });
      });
    });

    it("shows error toast when save fails", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };
      mockUpsert.mockResolvedValue({ data: null, error: { message: "DB error" } });

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Check-in Reviews")).toBeInTheDocument();
      });

      const toggle = screen.getByRole("switch", { name: /check-in reviews/i });
      await user.click(toggle);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to save settings");
      });
    });
  });

  // =========================================================================
  // Quiet hours
  // =========================================================================

  describe("quiet hours", () => {
    it("renders time inputs for quiet hours start and end", async () => {
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText("Start")).toBeInTheDocument();
        expect(screen.getByLabelText("End")).toBeInTheDocument();
      });
    });

    it("saves quiet_hours_start when changed", async () => {
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText("Start")).toBeInTheDocument();
      });

      const startInput = screen.getByLabelText("Start");
      // fireEvent is more reliable for time inputs
      await act(async () => {
        startInput.dispatchEvent(new Event("input", { bubbles: true }));
        // Use native event dispatching for input type="time"
      });

      // Directly trigger the onChange
      const inputEl = screen.getByLabelText("Start") as HTMLInputElement;
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set?.call(
        inputEl,
        "22:00"
      );
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ quiet_hours_start: "22:00" }),
          { onConflict: "user_id" }
        );
      });
    });

    it("saves quiet_hours_end when changed", async () => {
      pushHookOverrides = { isSubscribed: true };

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText("End")).toBeInTheDocument();
      });

      const inputEl = screen.getByLabelText("End") as HTMLInputElement;
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set?.call(
        inputEl,
        "07:00"
      );
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ quiet_hours_end: "07:00" }),
          { onConflict: "user_id" }
        );
      });
    });

    it("saves null when quiet hours value is cleared", async () => {
      pushHookOverrides = { isSubscribed: true };
      mockPreferencesData = {
        ...mockPreferencesData,
        quiet_hours_start: "22:00",
      };
      mockSingle.mockResolvedValue({
        data: mockPreferencesData,
        error: null,
      });

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText("Start")).toBeInTheDocument();
      });

      const inputEl = screen.getByLabelText("Start") as HTMLInputElement;
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set?.call(
        inputEl,
        ""
      );
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ quiet_hours_start: null }),
          { onConflict: "user_id" }
        );
      });
    });
  });

  // =========================================================================
  // Send test notification
  // =========================================================================

  describe("sendTestNotification", () => {
    it("sends a test notification successfully", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true, message: "Sent!" }),
      });

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Send Test Notification")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Send Test Notification"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/push/test", { method: "POST" });
        expect(mockToastSuccess).toHaveBeenCalledWith("Sent!");
      });
    });

    it("uses default message when server returns no message", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Send Test Notification")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Send Test Notification"));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Test notification sent");
      });
    });

    it("shows error toast when test notification fails (API error)", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: false, error: "No active subscription" }),
      });

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Send Test Notification")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Send Test Notification"));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("No active subscription");
      });
    });

    it("uses default error message when server returns no error", async () => {
      const user = userEvent.setup();
      pushHookOverrides = { isSubscribed: true };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: false }),
      });

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Send Test Notification")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Send Test Notification"));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to send test notification");
      });
    });

    it("shows error toast when fetch throws", async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      pushHookOverrides = { isSubscribed: true };
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Send Test Notification")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Send Test Notification"));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to send test notification");
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error sending test notification:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // Preference loading edge cases
  // =========================================================================

  describe("preference loading edge cases", () => {
    it("handles first-time user (PGRST116 row not found)", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Row not found", code: "PGRST116" },
      });

      render(<NotificationSettings userId="user-123" />);

      // Should still render with defaults
      await waitFor(() => {
        expect(screen.getByText("Push Notifications")).toBeInTheDocument();
      });
    });

    it("logs error for non-PGRST116 errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Permission denied", code: "42501" },
      });

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error loading preferences:",
          expect.objectContaining({ message: "Permission denied" })
        );
      });

      consoleSpy.mockRestore();
    });

    it("handles preferences load throw", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockSingle.mockRejectedValue(new Error("Connection lost"));

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error loading preferences:", expect.any(Error));
      });

      // Should still render (with defaults)
      await waitFor(() => {
        expect(screen.getByText("Push Notifications")).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("populates preferences from loaded data", async () => {
      pushHookOverrides = { isSubscribed: true };
      mockSingle.mockResolvedValue({
        data: {
          user_id: "user-123",
          push_enabled: true,
          notify_checkin_review: false,
          notify_messages: true,
          notify_system: false,
          notify_plan_updates: true,
          quiet_hours_start: "22:00",
          quiet_hours_end: "07:00",
        },
        error: null,
      });

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        // Check-in Reviews should be unchecked
        const checkinToggle = screen.getByRole("switch", { name: /check-in reviews/i });
        expect(checkinToggle).toHaveAttribute("aria-checked", "false");

        // System should be unchecked
        const systemToggle = screen.getByRole("switch", { name: /system notifications/i });
        expect(systemToggle).toHaveAttribute("aria-checked", "false");

        // Messages should be checked
        const msgToggle = screen.getByRole("switch", { name: /messages/i });
        expect(msgToggle).toHaveAttribute("aria-checked", "true");
      });
    });
  });

  // =========================================================================
  // Save preferences error handling
  // =========================================================================

  describe("save preferences error", () => {
    it("logs error and shows toast on save throw", async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      pushHookOverrides = { isSubscribed: true };
      mockUpsert.mockRejectedValue(new Error("DB write failed"));

      render(<NotificationSettings userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Check-in Reviews")).toBeInTheDocument();
      });

      const toggle = screen.getByRole("switch", { name: /check-in reviews/i });
      await user.click(toggle);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error saving preferences:", expect.any(Error));
        expect(mockToastError).toHaveBeenCalledWith("Failed to save settings");
      });

      consoleSpy.mockRestore();
    });
  });
});
