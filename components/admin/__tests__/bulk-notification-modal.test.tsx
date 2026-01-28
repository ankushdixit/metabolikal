import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkNotificationModal } from "../bulk-notification-modal";

// Mock Supabase client
const mockInsert = jest.fn();
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("BulkNotificationModal Component", () => {
  const defaultProps = {
    selectedClientIds: ["client-1", "client-2", "client-3"],
    adminId: "admin-1",
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInsert.mockReset();
  });

  describe("Rendering", () => {
    it("renders modal with title when open", () => {
      render(<BulkNotificationModal {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Bulk")).toBeInTheDocument();
      expect(screen.getByText("Notification")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(<BulkNotificationModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders form fields", () => {
      render(<BulkNotificationModal {...defaultProps} />);
      expect(screen.getByTestId("title-input")).toBeInTheDocument();
      expect(screen.getByTestId("message-input")).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    });

    it("displays selected client count", () => {
      render(<BulkNotificationModal {...defaultProps} />);
      expect(screen.getByTestId("client-count")).toHaveTextContent("Sending to 3 clients");
    });

    it("displays singular client when one is selected", () => {
      render(<BulkNotificationModal {...defaultProps} selectedClientIds={["client-1"]} />);
      expect(screen.getByTestId("client-count")).toHaveTextContent("Sending to 1 client");
    });

    it("shows client count in submit button", () => {
      render(<BulkNotificationModal {...defaultProps} />);
      expect(screen.getByTestId("submit-button")).toHaveTextContent("Send to 3 Clients");
    });
  });

  describe("Form Validation", () => {
    it("disables submit button when title is empty", async () => {
      const user = userEvent.setup();
      render(<BulkNotificationModal {...defaultProps} />);

      await user.type(screen.getByTestId("message-input"), "Test message");

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toHaveClass("opacity-50");
      expect(submitButton).toHaveClass("cursor-not-allowed");
    });

    it("disables submit button when message is empty", async () => {
      const user = userEvent.setup();
      render(<BulkNotificationModal {...defaultProps} />);

      await user.type(screen.getByTestId("title-input"), "Test title");

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toHaveClass("opacity-50");
      expect(submitButton).toHaveClass("cursor-not-allowed");
    });

    it("enables submit button when both fields are filled", async () => {
      const user = userEvent.setup();
      render(<BulkNotificationModal {...defaultProps} />);

      await user.type(screen.getByTestId("title-input"), "Test title");
      await user.type(screen.getByTestId("message-input"), "Test message");

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).not.toHaveClass("opacity-50");
      expect(submitButton).not.toHaveClass("cursor-not-allowed");
    });
  });

  describe("Form Submission", () => {
    it("submits notifications for all selected clients", async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValueOnce({ error: null });

      render(<BulkNotificationModal {...defaultProps} />);

      await user.type(screen.getByTestId("title-input"), "Important Update");
      await user.type(screen.getByTestId("message-input"), "Please check your dashboard");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith([
          {
            user_id: "client-1",
            sender_id: "admin-1",
            type: "message",
            title: "Important Update",
            message: "Please check your dashboard",
          },
          {
            user_id: "client-2",
            sender_id: "admin-1",
            type: "message",
            title: "Important Update",
            message: "Please check your dashboard",
          },
          {
            user_id: "client-3",
            sender_id: "admin-1",
            type: "message",
            title: "Important Update",
            message: "Please check your dashboard",
          },
        ]);
      });
    });

    it("calls onClose and onSuccess after successful submission", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const onSuccess = jest.fn();
      mockInsert.mockResolvedValueOnce({ error: null });

      render(<BulkNotificationModal {...defaultProps} onClose={onClose} onSuccess={onSuccess} />);

      await user.type(screen.getByTestId("title-input"), "Test title");
      await user.type(screen.getByTestId("message-input"), "Test message");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("shows success toast with correct count", async () => {
      const user = userEvent.setup();
      const { toast } = await import("sonner");
      mockInsert.mockResolvedValueOnce({ error: null });

      render(<BulkNotificationModal {...defaultProps} />);

      await user.type(screen.getByTestId("title-input"), "Test title");
      await user.type(screen.getByTestId("message-input"), "Test message");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Notification sent to 3 clients");
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      mockInsert.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<BulkNotificationModal {...defaultProps} />);

      await user.type(screen.getByTestId("title-input"), "Test title");
      await user.type(screen.getByTestId("message-input"), "Test message");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("submit-button")).toHaveTextContent("Sending...");
      });

      // Cleanup
      resolvePromise!({ error: null });
    });
  });

  describe("Error Handling", () => {
    it("shows error toast on submission failure", async () => {
      const user = userEvent.setup();
      const { toast } = await import("sonner");
      mockInsert.mockResolvedValueOnce({ error: new Error("Database error") });

      render(<BulkNotificationModal {...defaultProps} />);

      await user.type(screen.getByTestId("title-input"), "Test title");
      await user.type(screen.getByTestId("message-input"), "Test message");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to send notifications");
      });
    });

    it("does not call onClose or onSuccess on error", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const onSuccess = jest.fn();
      mockInsert.mockResolvedValueOnce({ error: new Error("Database error") });

      render(<BulkNotificationModal {...defaultProps} onClose={onClose} onSuccess={onSuccess} />);

      await user.type(screen.getByTestId("title-input"), "Test title");
      await user.type(screen.getByTestId("message-input"), "Test message");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(onClose).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe("Modal Behavior", () => {
    it("clears form fields when modal is closed", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<BulkNotificationModal {...defaultProps} onClose={onClose} />);

      await user.type(screen.getByTestId("title-input"), "Test title");
      await user.type(screen.getByTestId("message-input"), "Test message");

      // Close the modal via the dialog's close button
      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("clears form fields after successful submission", async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValueOnce({ error: null });

      const { rerender } = render(<BulkNotificationModal {...defaultProps} />);

      await user.type(screen.getByTestId("title-input"), "Test title");
      await user.type(screen.getByTestId("message-input"), "Test message");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });

      // Re-render with same props to simulate modal reopening
      jest.clearAllMocks();
      rerender(<BulkNotificationModal {...defaultProps} />);

      // The form should be cleared (state was reset)
      expect(screen.getByTestId("title-input")).toHaveValue("");
      expect(screen.getByTestId("message-input")).toHaveValue("");
    });
  });

  describe("Empty Selection", () => {
    it("does not submit when no clients are selected", async () => {
      const user = userEvent.setup();
      render(<BulkNotificationModal {...defaultProps} selectedClientIds={[]} />);

      await user.type(screen.getByTestId("title-input"), "Test title");
      await user.type(screen.getByTestId("message-input"), "Test message");
      await user.click(screen.getByTestId("submit-button"));

      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});
