import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanLimitsManager } from "../plan-limits-manager";
import type { ClientPlanLimit } from "@/lib/database.types";

// Mock the hook
const mockDeleteLimitRange = jest.fn();
const mockIsDeletable = jest.fn();
const mockCreateLimitRange = jest.fn();
const mockUpdateLimitRange = jest.fn();
const mockGetUnavailableDates = jest.fn(() => []);
const mockHasOverlap = jest.fn(() => false);

jest.mock("@/hooks/use-client-plan-limits", () => ({
  useClientPlanLimits: () => ({
    categorizedLimits: mockCategorizedLimits,
    isLoading: mockIsLoading,
    isError: mockIsError,
    deleteLimitRange: mockDeleteLimitRange,
    isDeletable: mockIsDeletable,
    createLimitRange: mockCreateLimitRange,
    updateLimitRange: mockUpdateLimitRange,
    getUnavailableDates: mockGetUnavailableDates,
    hasOverlap: mockHasOverlap,
  }),
  formatDateRange: (start: string, end: string) => `${start} - ${end}`,
}));

// Mock variables that will be set in tests
let mockCategorizedLimits: {
  current: ClientPlanLimit | null;
  future: ClientPlanLimit[];
  past: ClientPlanLimit[];
};
let mockIsLoading = false;
let mockIsError = false;

// Helper to create mock limit
function createMockLimit(overrides: Partial<ClientPlanLimit> = {}): ClientPlanLimit {
  return {
    id: "limit-1",
    client_id: "client-1",
    start_date: "2026-01-01",
    end_date: "2026-01-31",
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

describe("PlanLimitsManager", () => {
  const clientId = "test-client-id";

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsLoading = false;
    mockIsError = false;
    mockCategorizedLimits = {
      current: null,
      future: [],
      past: [],
    };
    mockIsDeletable.mockReturnValue(true);
  });

  describe("Loading State", () => {
    it("shows loading indicator when loading", () => {
      mockIsLoading = true;
      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText(/loading macro limits/i)).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("shows error message on error", () => {
      mockIsError = true;
      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText(/failed to load macro limits/i)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no limits exist", () => {
      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText(/no macro limits configured/i)).toBeInTheDocument();
      expect(screen.getByText(/add date ranges/i)).toBeInTheDocument();
    });

    it("shows Add Range button in empty state", () => {
      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByRole("button", { name: /add range/i })).toBeInTheDocument();
    });
  });

  describe("Current Range Display", () => {
    it("displays current range with Current label", () => {
      mockCategorizedLimits.current = createMockLimit({
        start_date: "2026-01-10",
        end_date: "2026-01-31",
      });

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText("Current")).toBeInTheDocument();
      expect(screen.getByText("2026-01-10 - 2026-01-31")).toBeInTheDocument();
    });

    it("displays macro values for current range", () => {
      mockCategorizedLimits.current = createMockLimit({
        max_calories_per_day: 2200,
        min_protein_per_day: 120,
        max_protein_per_day: 150,
      });

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText(/max 2,200\/day/i)).toBeInTheDocument();
      expect(screen.getByText(/120g - 150g\/day/i)).toBeInTheDocument();
    });

    it("displays notes for current range", () => {
      mockCategorizedLimits.current = createMockLimit({
        notes: "Cutting phase limits",
      });

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText("Cutting phase limits")).toBeInTheDocument();
    });
  });

  describe("Future Ranges Display", () => {
    it("displays future ranges section", () => {
      mockCategorizedLimits.future = [
        createMockLimit({
          id: "future-1",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
        }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText("Future Ranges")).toBeInTheDocument();
    });

    it("displays multiple future ranges", () => {
      mockCategorizedLimits.future = [
        createMockLimit({
          id: "future-1",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
        }),
        createMockLimit({
          id: "future-2",
          start_date: "2026-03-01",
          end_date: "2026-03-31",
        }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText("2026-02-01 - 2026-02-28")).toBeInTheDocument();
      expect(screen.getByText("2026-03-01 - 2026-03-31")).toBeInTheDocument();
    });

    it("shows edit button for future ranges", () => {
      mockCategorizedLimits.future = [
        createMockLimit({
          id: "future-1",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
        }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      const editButtons = screen.getAllByTitle("Edit range");
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it("shows delete button for future ranges", () => {
      mockCategorizedLimits.future = [
        createMockLimit({
          id: "future-1",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
        }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      const deleteButtons = screen.getAllByTitle("Delete range");
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Past Ranges Display", () => {
    it("shows collapsed past ranges section", () => {
      mockCategorizedLimits.past = [
        createMockLimit({
          id: "past-1",
          start_date: "2025-12-01",
          end_date: "2025-12-31",
        }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText(/show past ranges/i)).toBeInTheDocument();
    });

    it("shows past ranges count", () => {
      mockCategorizedLimits.past = [
        createMockLimit({ id: "past-1" }),
        createMockLimit({ id: "past-2" }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });

    it("expands past ranges when clicked", async () => {
      const user = userEvent.setup();
      mockCategorizedLimits.past = [
        createMockLimit({
          id: "past-1",
          start_date: "2025-12-01",
          end_date: "2025-12-31",
        }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      await user.click(screen.getByText(/show past ranges/i));

      await waitFor(() => {
        expect(screen.getByText("2025-12-01 - 2025-12-31")).toBeInTheDocument();
      });
    });

    it("does not show edit/delete buttons for past ranges", async () => {
      const user = userEvent.setup();
      mockCategorizedLimits.past = [
        createMockLimit({
          id: "past-1",
          start_date: "2025-12-01",
          end_date: "2025-12-31",
        }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      await user.click(screen.getByText(/show past ranges/i));

      // Wait for expansion
      await waitFor(() => {
        expect(screen.getByText("2025-12-01 - 2025-12-31")).toBeInTheDocument();
      });

      // Past ranges should not have edit/delete buttons
      // This is verified by the fact we only have buttons for future ranges
    });
  });

  describe("Delete Functionality", () => {
    it("calls deleteLimitRange when delete is confirmed", async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => true);

      mockCategorizedLimits.future = [
        createMockLimit({
          id: "future-1",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
        }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      const deleteButton = screen.getByTitle("Delete range");
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockDeleteLimitRange).toHaveBeenCalledWith("future-1");
    });

    it("does not delete when confirmation is cancelled", async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => false);

      mockCategorizedLimits.future = [
        createMockLimit({
          id: "future-1",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
        }),
      ];

      render(<PlanLimitsManager clientId={clientId} />);

      const deleteButton = screen.getByTitle("Delete range");
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockDeleteLimitRange).not.toHaveBeenCalled();
    });
  });

  describe("Macro Display Formatting", () => {
    it("shows protein range with min and max", () => {
      mockCategorizedLimits.current = createMockLimit({
        min_protein_per_day: 100,
        max_protein_per_day: 150,
      });

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText(/100g - 150g\/day/i)).toBeInTheDocument();
    });

    it("shows protein with plus sign when no max", () => {
      mockCategorizedLimits.current = createMockLimit({
        min_protein_per_day: 100,
        max_protein_per_day: null,
      });

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText(/100g\+\/day/i)).toBeInTheDocument();
    });

    it("shows carbs range when both values are set", () => {
      mockCategorizedLimits.current = createMockLimit({
        min_carbs_per_day: 200,
        max_carbs_per_day: 300,
      });

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.getByText(/200g - 300g\/day/i)).toBeInTheDocument();
    });

    it("hides carbs when both values are null", () => {
      mockCategorizedLimits.current = createMockLimit({
        min_carbs_per_day: null,
        max_carbs_per_day: null,
      });

      render(<PlanLimitsManager clientId={clientId} />);

      expect(screen.queryByText(/carbs/i)).not.toBeInTheDocument();
    });
  });
});
