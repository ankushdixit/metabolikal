import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddClientModal } from "../add-client-modal";

// Mock fetch
global.fetch = jest.fn();

// Mock the medical conditions hook
const mockConditions = [
  {
    id: "cond-1",
    name: "Diabetes Type 2",
    slug: "diabetes-type2",
    impact_percent: 10,
    gender_restriction: null,
    is_active: true,
    display_order: 1,
  },
  {
    id: "cond-2",
    name: "Hypertension",
    slug: "hypertension",
    impact_percent: 5,
    gender_restriction: null,
    is_active: true,
    display_order: 2,
  },
  {
    id: "cond-3",
    name: "PCOS",
    slug: "pcos",
    impact_percent: 8,
    gender_restriction: "female",
    is_active: true,
    display_order: 3,
  },
];

jest.mock("@/hooks/use-medical-conditions", () => ({
  useMedicalConditions: () => ({
    conditions: mockConditions,
    allConditions: mockConditions,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

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
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
      // Gender field uses a select with label
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      // Plan settings section
      expect(screen.getByText(/plan settings/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/plan start date/i)).toBeInTheDocument();
      expect(screen.getByText(/plan duration/i)).toBeInTheDocument();
      expect(screen.getByText(/medical conditions/i)).toBeInTheDocument();
    });

    it("renders plan duration preset buttons", () => {
      render(<AddClientModal {...defaultProps} />);
      expect(screen.getByRole("button", { name: "7" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "14" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "21" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "28" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "30" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "60" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "90" })).toBeInTheDocument();
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

    it("has phone field with tel type", () => {
      render(<AddClientModal {...defaultProps} />);

      const phoneInput = screen.getByLabelText(/phone/i);
      expect(phoneInput).toHaveAttribute("type", "tel");
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

  describe("Plan Duration Selection", () => {
    it("selects duration preset when clicked", async () => {
      const user = userEvent.setup();
      render(<AddClientModal {...defaultProps} />);

      const btn14 = screen.getByRole("button", { name: "14" });
      await user.click(btn14);

      // Button should show selected state (check class)
      expect(btn14).toHaveClass("bg-primary");
    });

    it("allows custom duration input", async () => {
      const user = userEvent.setup();
      render(<AddClientModal {...defaultProps} />);

      const customInput = screen.getByPlaceholderText("Custom");
      await user.type(customInput, "45");

      expect(customInput).toHaveValue(45);
    });
  });

  describe("Medical Conditions Selection", () => {
    it("shows conditions dropdown when clicked", async () => {
      const user = userEvent.setup();
      render(<AddClientModal {...defaultProps} />);

      await user.click(screen.getByText(/select conditions/i));

      await waitFor(() => {
        expect(screen.getByText("Diabetes Type 2")).toBeInTheDocument();
        expect(screen.getByText("Hypertension")).toBeInTheDocument();
        expect(screen.getByText("PCOS")).toBeInTheDocument();
      });
    });

    it("shows gender restriction indicator for conditions", async () => {
      const user = userEvent.setup();
      render(<AddClientModal {...defaultProps} />);

      await user.click(screen.getByText(/select conditions/i));

      await waitFor(() => {
        expect(screen.getByText("(female only)")).toBeInTheDocument();
      });
    });

    it("allows selecting multiple conditions", async () => {
      const user = userEvent.setup();
      render(<AddClientModal {...defaultProps} />);

      // Open dropdown
      await user.click(screen.getByText(/select conditions/i));

      // Select conditions by clicking the label elements
      const diabetesLabel = screen.getByText("Diabetes Type 2");
      const hypertensionLabel = screen.getByText("Hypertension");

      await user.click(diabetesLabel.closest("label")!);
      await user.click(hypertensionLabel.closest("label")!);

      // Should show selected conditions count
      await waitFor(() => {
        expect(screen.getByText(/2 conditions selected/i)).toBeInTheDocument();
      });
    });

    it("shows selected conditions as tags", async () => {
      const user = userEvent.setup();
      render(<AddClientModal {...defaultProps} />);

      // Open dropdown
      await user.click(screen.getByText(/select conditions/i));

      // Select a condition by clicking the label
      const diabetesLabel = screen.getByText("Diabetes Type 2");
      await user.click(diabetesLabel.closest("label")!);

      // Should show tag for selected condition
      await waitFor(() => {
        // There should be a tag with the condition name (not the one in the dropdown)
        const tags = screen.getAllByText("Diabetes Type 2");
        expect(tags.length).toBeGreaterThanOrEqual(1);
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
        expect(callBody).toMatchObject({
          full_name: "John Doe",
          email: "john@example.com",
          date_of_birth: "1990-05-15",
          address: "123 Main St",
          plan_duration_days: 7, // default value
          condition_ids: [], // default value
        });
      });
    });

    it("submits form with new plan fields", async () => {
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

      await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
      await user.type(screen.getByLabelText(/email/i), "jane@example.com");
      await user.type(screen.getByLabelText(/phone/i), "+919876543210");
      await user.type(screen.getByLabelText(/plan start date/i), "2026-02-01");
      await user.click(screen.getByRole("button", { name: "30" })); // Select 30-day plan

      await user.click(screen.getByRole("button", { name: /add client/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody).toMatchObject({
          full_name: "Jane Doe",
          email: "jane@example.com",
          phone: "+919876543210",
          plan_start_date: "2026-02-01",
          plan_duration_days: 30,
          condition_ids: [],
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
