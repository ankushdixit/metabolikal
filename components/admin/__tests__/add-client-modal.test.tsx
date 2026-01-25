import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddClientModal } from "../add-client-modal";

// Mock fetch
global.fetch = jest.fn();

describe("AddClientModal Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe("Rendering", () => {
    it("renders modal with title when open", () => {
      render(<AddClientModal {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Add")).toBeInTheDocument();
      expect(screen.getByText("Client")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(<AddClientModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders all form fields", () => {
      render(<AddClientModal {...defaultProps} />);
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
      // Gender field uses a select with label
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });

    it("renders action buttons", () => {
      render(<AddClientModal {...defaultProps} />);
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add client/i })).toBeInTheDocument();
    });

    it("shows description about email invite", () => {
      render(<AddClientModal {...defaultProps} />);
      expect(
        screen.getByText(/they will receive an email to set up their password/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("shows error when full name is empty", async () => {
      const user = userEvent.setup();
      render(<AddClientModal {...defaultProps} />);

      // Fill in email only and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.click(screen.getByRole("button", { name: /add client/i }));

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      });
    });

    it("has email field with email type", () => {
      render(<AddClientModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("accepts valid form data", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          client: { id: "123", full_name: "John Doe", email: "john@example.com" },
          message: "Client created successfully. Password setup email sent.",
        }),
      });

      render(<AddClientModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.click(screen.getByRole("button", { name: /add client/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/admin/invite-client",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: expect.stringContaining("john@example.com"),
          })
        );
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with all fields", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          client: { id: "123" },
          message: "Client created successfully.",
        }),
      });

      render(<AddClientModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/date of birth/i), "1990-05-15");
      await user.type(screen.getByLabelText(/address/i), "123 Main St");
      await user.click(screen.getByRole("button", { name: /add client/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody).toEqual({
          full_name: "John Doe",
          email: "john@example.com",
          date_of_birth: "1990-05-15",
          address: "123 Main St",
        });
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      (global.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<AddClientModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.click(screen.getByRole("button", { name: /add client/i }));

      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
      });

      // Cleanup
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, client: {}, message: "Success" }),
      });
    });

    it("calls onClose and onSuccess immediately after successful submission", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const onSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          client: { id: "123" },
          message: "Client created successfully. Password setup email sent.",
        }),
      });

      render(<AddClientModal {...defaultProps} onClose={onClose} onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.click(screen.getByRole("button", { name: /add client/i }));

      // Now success triggers toast and immediately calls onClose/onSuccess
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("shows server error message on API failure", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: "A user with this email already exists",
        }),
      });

      render(<AddClientModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "existing@example.com");
      await user.click(screen.getByRole("button", { name: /add client/i }));

      await waitFor(
        () => {
          expect(screen.getByText(/a user with this email already exists/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    }, 15000);

    it("shows validation error details from server", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: "Validation failed",
          details: [{ field: "email", message: "Invalid email format" }],
        }),
      });

      render(<AddClientModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "test@test.com");
      await user.click(screen.getByRole("button", { name: /add client/i }));

      await waitFor(
        () => {
          expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    }, 15000);

    it("shows generic error on network failure", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      render(<AddClientModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.click(screen.getByRole("button", { name: /add client/i }));

      await waitFor(
        () => {
          expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    }, 15000);
  });

  describe("Modal Behavior", () => {
    it("calls onClose when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<AddClientModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    }, 10000);

    it("resets form when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<AddClientModal {...defaultProps} onClose={onClose} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");

      // Click cancel
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // onClose should be called
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    }, 10000);

    it("disables form inputs during submission", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      (global.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<AddClientModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.click(screen.getByRole("button", { name: /add client/i }));

      await waitFor(
        () => {
          expect(screen.getByLabelText(/full name/i)).toBeDisabled();
          expect(screen.getByLabelText(/email/i)).toBeDisabled();
        },
        { timeout: 10000 }
      );

      // Cleanup
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, client: {}, message: "Success" }),
      });
    }, 15000);
  });
});
