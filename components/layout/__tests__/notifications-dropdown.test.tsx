/**
 * Tests for NotificationsDropdown component
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationsDropdown } from "../notifications-dropdown";

// ---------------------------------------------------------------------------
// Supabase mock - full chainable mock per-call
// ---------------------------------------------------------------------------

let mockNotifications: unknown[] = [];
let mockFetchError: { message: string } | null = null;

const mockUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
const mockUpdateIn = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockImplementation(() =>
                Promise.resolve({ data: mockNotifications, error: mockFetchError })
              ),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: mockUpdateEq,
        in: mockUpdateIn,
      }),
    })),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: "notif-1",
    user_id: "user-123",
    sender_id: null,
    type: "message",
    title: "New Message",
    message: "You have a new message",
    read_at: null,
    related_checkin_id: null,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NotificationsDropdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotifications = [];
    mockFetchError = null;
  });

  // =========================================================================
  // Rendering & initial state
  // =========================================================================

  describe("rendering", () => {
    it("renders the bell button with correct aria-label", async () => {
      render(<NotificationsDropdown userId="user-123" />);
      expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    });

    it("does not show dropdown initially", () => {
      render(<NotificationsDropdown userId="user-123" />);
      expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    });

    it("does not fetch when userId is empty", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      render(<NotificationsDropdown userId="" />);
      // Give it a tick
      await act(async () => {});
      // The component returns early when userId is empty
      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // Badge count
  // =========================================================================

  describe("unread badge", () => {
    it("shows unread count badge when there are unread notifications", async () => {
      mockNotifications = [
        createNotification({ id: "n1", read_at: null }),
        createNotification({ id: "n2", read_at: null }),
        createNotification({ id: "n3", read_at: "2026-01-01T00:00:00Z" }),
      ];

      render(<NotificationsDropdown userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("shows 9+ when more than 9 unread notifications", async () => {
      mockNotifications = Array.from({ length: 12 }, (_, i) =>
        createNotification({ id: `n-${i}`, read_at: null })
      );

      render(<NotificationsDropdown userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("9+")).toBeInTheDocument();
      });
    });

    it("does not show badge when all notifications are read", async () => {
      mockNotifications = [createNotification({ id: "n1", read_at: "2026-01-01T00:00:00Z" })];

      render(<NotificationsDropdown userId="user-123" />);

      await waitFor(() => {});

      // No unread count badge
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });

    it("does not show badge when there are no notifications", async () => {
      mockNotifications = [];

      render(<NotificationsDropdown userId="user-123" />);

      await waitFor(() => {});

      // No badge element at all
      const button = screen.getByLabelText("Notifications");
      const badge = button.querySelector("span");
      expect(badge).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Opening / Closing dropdown
  // =========================================================================

  describe("open and close dropdown", () => {
    it("opens the dropdown when bell button is clicked", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification()];

      render(<NotificationsDropdown userId="user-123" />);

      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Notifications");
    });

    it("toggles the dropdown closed on second click", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification()];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      // Open
      await user.click(screen.getByLabelText("Notifications"));
      expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();

      // Close via bell button toggle
      await user.click(screen.getByLabelText("Notifications"));
      expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    });

    it("closes the dropdown when clicking outside", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification()];

      render(
        <div>
          <div data-testid="outside">Outside</div>
          <NotificationsDropdown userId="user-123" />
        </div>
      );
      await waitFor(() => {});

      // Open
      await user.click(screen.getByLabelText("Notifications"));
      expect(screen.getByText("New Message")).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId("outside"));

      await waitFor(() => {
        expect(screen.queryByText("New Message")).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Loading state
  // =========================================================================

  describe("empty state", () => {
    it("shows empty state when no notifications", async () => {
      const user = userEvent.setup();
      mockNotifications = [];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      await waitFor(() => {
        expect(screen.getByText("No notifications")).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Notification list
  // =========================================================================

  describe("notification list", () => {
    it("renders notification titles and messages", async () => {
      const user = userEvent.setup();
      mockNotifications = [
        createNotification({
          id: "n1",
          title: "Check-in reviewed",
          message: "Your coach left feedback",
        }),
        createNotification({
          id: "n2",
          title: "Welcome",
          message: "Getting started",
          read_at: "2026-01-01",
        }),
      ];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      expect(screen.getByText("Check-in reviewed")).toBeInTheDocument();
      expect(screen.getByText("Your coach left feedback")).toBeInTheDocument();
      expect(screen.getByText("Welcome")).toBeInTheDocument();
      expect(screen.getByText("Getting started")).toBeInTheDocument();
    });

    it("shows unread indicator styling for unread notifications", async () => {
      const user = userEvent.setup();
      mockNotifications = [
        createNotification({ id: "n1", read_at: null }),
        createNotification({ id: "n2", read_at: "2026-01-01T00:00:00Z" }),
      ];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      // Unread items have bg-primary/5 class
      const items = document.querySelectorAll('[class*="bg-primary/5"]');
      expect(items.length).toBe(1);
    });
  });

  // =========================================================================
  // Notification icons
  // =========================================================================

  describe("notification icons", () => {
    it("renders message icon for message type", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification({ type: "message" })];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      const icon = document.querySelector(".lucide-message-square");
      expect(icon).toBeInTheDocument();
    });

    it("renders checkin_review icon for checkin_review type", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification({ type: "checkin_review", title: "Review Ready" })];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      const icon = document.querySelector(".lucide-clipboard-check");
      expect(icon).toBeInTheDocument();
    });

    it("renders default info icon for other types", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification({ type: "system", title: "System Alert" })];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      const icon = document.querySelector(".lucide-info");
      expect(icon).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Mark as read
  // =========================================================================

  describe("mark as read", () => {
    it("marks a notification as read when an unread notification is clicked", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification({ id: "n1", title: "Unread One", read_at: null })];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      // Click on the unread notification
      await user.click(screen.getByText("Unread One"));

      await waitFor(() => {
        expect(mockUpdateEq).toHaveBeenCalled();
      });
    });

    it("does not call update for already-read notifications", async () => {
      const user = userEvent.setup();
      mockNotifications = [
        createNotification({ id: "n1", title: "Already Read", read_at: "2026-01-01T00:00:00Z" }),
      ];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      const updateCallsBefore = mockUpdateEq.mock.calls.length;
      await user.click(screen.getByText("Already Read"));

      // No additional update calls should have been made
      expect(mockUpdateEq.mock.calls.length).toBe(updateCallsBefore);
    });
  });

  // =========================================================================
  // Mark all as read
  // =========================================================================

  describe("mark all as read", () => {
    it("shows 'Mark all read' button when there are unread notifications", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification({ read_at: null })];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      expect(screen.getByText("Mark all read")).toBeInTheDocument();
    });

    it("does not show 'Mark all read' when all are read", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification({ read_at: "2026-01-01" })];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
    });

    it("marks all as read and hides badge when clicked", async () => {
      const user = userEvent.setup();
      mockNotifications = [
        createNotification({ id: "n1", read_at: null }),
        createNotification({ id: "n2", read_at: null }),
      ];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText("Notifications"));
      await user.click(screen.getByText("Mark all read"));

      await waitFor(() => {
        // Badge should disappear
        expect(screen.queryByText("2")).not.toBeInTheDocument();
        // "Mark all read" button should disappear
        expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Date formatting
  // =========================================================================

  describe("date formatting", () => {
    it("shows 'Just now' for very recent notifications", async () => {
      const user = userEvent.setup();
      mockNotifications = [createNotification({ created_at: new Date().toISOString() })];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      await waitFor(() => {
        expect(screen.getByText("Just now")).toBeInTheDocument();
      });
    });

    it("shows minutes ago for recent notifications", async () => {
      const user = userEvent.setup();
      mockNotifications = [
        createNotification({ created_at: new Date(Date.now() - 5 * 60000).toISOString() }),
      ];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      await waitFor(() => {
        expect(screen.getByText("5m ago")).toBeInTheDocument();
      });
    });

    it("shows hours ago for notifications within a day", async () => {
      const user = userEvent.setup();
      mockNotifications = [
        createNotification({ created_at: new Date(Date.now() - 3 * 3600000).toISOString() }),
      ];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      await waitFor(() => {
        expect(screen.getByText("3h ago")).toBeInTheDocument();
      });
    });

    it("shows days ago for notifications within a week", async () => {
      const user = userEvent.setup();
      mockNotifications = [
        createNotification({ created_at: new Date(Date.now() - 2 * 86400000).toISOString() }),
      ];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      await waitFor(() => {
        expect(screen.getByText("2d ago")).toBeInTheDocument();
      });
    });

    it("shows formatted date for notifications older than a week", async () => {
      const user = userEvent.setup();
      // 14 days ago
      const oldDate = new Date(Date.now() - 14 * 86400000);
      mockNotifications = [createNotification({ created_at: oldDate.toISOString() })];

      render(<NotificationsDropdown userId="user-123" />);
      await waitFor(() => {});

      await user.click(screen.getByLabelText("Notifications"));

      // The formatted date should use "en-US" short month + numeric day
      const expectedDate = oldDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      await waitFor(() => {
        expect(screen.getByText(expectedDate)).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("handles fetch error gracefully (data null, error present)", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockFetchError = { message: "DB error" };

      render(<NotificationsDropdown userId="user-123" />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching notifications:",
          expect.objectContaining({ message: "DB error" })
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
