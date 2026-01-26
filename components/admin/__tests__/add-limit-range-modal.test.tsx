import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddLimitRangeModal } from "../add-limit-range-modal";
import type { ClientPlanLimit } from "@/lib/database.types";

// Mock the hook
const mockCreateLimitRange = jest.fn();
const mockUpdateLimitRange = jest.fn();
const mockGetUnavailableDates = jest.fn();
const mockHasOverlap = jest.fn();

jest.mock("@/hooks/use-client-plan-limits", () => ({
  useClientPlanLimits: () => ({
    createLimitRange: mockCreateLimitRange,
    updateLimitRange: mockUpdateLimitRange,
    getUnavailableDates: mockGetUnavailableDates,
    hasOverlap: mockHasOverlap,
  }),
}));

// Helper to create mock limit
function createMockLimit(overrides: Partial<ClientPlanLimit> = {}): ClientPlanLimit {
  return {
    id: "limit-1",
    client_id: "client-1",
    start_date: "2026-02-01",
    end_date: "2026-02-28",
    max_calories_per_day: 2000,
    min_protein_per_day: 100,
    max_protein_per_day: 150,
    min_carbs_per_day: 200,
    max_carbs_per_day: 250,
    min_fats_per_day: 60,
    max_fats_per_day: 80,
    notes: "Test notes",
    created_at: "2026-01-01T00:00:00Z",
    created_by: null,
    ...overrides,
  };
}

describe("AddLimitRangeModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    clientId: "test-client-id",
    editingLimit: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUnavailableDates.mockReturnValue([]);
    mockHasOverlap.mockReturnValue(false);
    mockCreateLimitRange.mockResolvedValue(undefined);
    mockUpdateLimitRange.mockResolvedValue(undefined);
  });

  describe("Rendering", () => {
    it("renders modal when open", () => {
      render(<AddLimitRangeModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(<AddLimitRangeModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders all required form fields", () => {
      render(<AddLimitRangeModal {...defaultProps} />);

      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max calories\/day/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/min protein\/day/i)).toBeInTheDocument();
    });

    it("renders optional form fields", () => {
      render(<AddLimitRangeModal {...defaultProps} />);

      expect(screen.getByLabelText(/max protein\/day/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/min carbs\/day/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max carbs\/day/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/min fats\/day/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max fats\/day/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it("renders action buttons", () => {
      render(<AddLimitRangeModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create range/i })).toBeInTheDocument();
    });

    it("shows Update button when editing", () => {
      render(<AddLimitRangeModal {...defaultProps} editingLimit={createMockLimit()} />);

      expect(screen.getByRole("button", { name: /update range/i })).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("shows error when start date is empty", async () => {
      const user = userEvent.setup();
      render(<AddLimitRangeModal {...defaultProps} />);

      // Fill in required fields except start date
      await user.type(screen.getByLabelText(/end date/i), "2026-02-28");
      await user.click(screen.getByRole("button", { name: /create range/i }));

      await waitFor(() => {
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      });
    });

    it("shows error when end date is empty", async () => {
      const user = userEvent.setup();
      render(<AddLimitRangeModal {...defaultProps} />);

      // Fill in required fields except end date
      await user.type(screen.getByLabelText(/start date/i), "2026-02-01");
      await user.click(screen.getByRole("button", { name: /create range/i }));

      await waitFor(() => {
        expect(screen.getByText(/end date is required/i)).toBeInTheDocument();
      });
    });
  });

  describe("Date Overlap Detection", () => {
    it("shows warning when dates overlap with existing range", async () => {
      const user = userEvent.setup();
      mockHasOverlap.mockReturnValue(true);

      render(<AddLimitRangeModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/start date/i), "2026-02-01");
      await user.type(screen.getByLabelText(/end date/i), "2026-02-28");

      await waitFor(() => {
        expect(screen.getByText(/date range overlaps/i)).toBeInTheDocument();
      });
    });

    it("disables submit button when dates overlap", async () => {
      const user = userEvent.setup();
      mockHasOverlap.mockReturnValue(true);

      render(<AddLimitRangeModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/start date/i), "2026-02-01");
      await user.type(screen.getByLabelText(/end date/i), "2026-02-28");

      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /create range/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("Form Submission - Edit", () => {
    it("populates form with existing data when editing", () => {
      const editingLimit = createMockLimit({
        start_date: "2026-03-01",
        end_date: "2026-03-31",
        max_calories_per_day: 2500,
        min_protein_per_day: 150,
      });

      render(<AddLimitRangeModal {...defaultProps} editingLimit={editingLimit} />);

      expect(screen.getByLabelText(/start date/i)).toHaveValue("2026-03-01");
      expect(screen.getByLabelText(/end date/i)).toHaveValue("2026-03-31");
      expect(screen.getByLabelText(/max calories\/day/i)).toHaveValue(2500);
      expect(screen.getByLabelText(/min protein\/day/i)).toHaveValue(150);
    });

    it("renders update form with editing limit", () => {
      const editingLimit = createMockLimit();

      render(<AddLimitRangeModal {...defaultProps} editingLimit={editingLimit} />);

      // Verify form is populated and update button exists
      expect(screen.getByRole("button", { name: /update range/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/max calories\/day/i)).toHaveValue(2000);
    });
  });

  describe("Modal Behavior", () => {
    it("calls onClose when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<AddLimitRangeModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it("resets form when modal is reopened", async () => {
      const { rerender } = render(<AddLimitRangeModal {...defaultProps} />);

      // Close and reopen
      rerender(<AddLimitRangeModal {...defaultProps} isOpen={false} />);
      rerender(<AddLimitRangeModal {...defaultProps} isOpen={true} />);

      // Default values should be set
      expect(screen.getByLabelText(/max calories\/day/i)).toHaveValue(2000);
      expect(screen.getByLabelText(/min protein\/day/i)).toHaveValue(100);
    });
  });
});
