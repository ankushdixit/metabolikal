/**
 * Tests for PlanCycleSelector component
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanCycleSelector } from "../plan-cycle-selector";

// ---------------------------------------------------------------------------
// Mock @refinedev/core useList
// ---------------------------------------------------------------------------

const mockUseList = jest.fn();

jest.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createCycle(overrides: Record<string, unknown> = {}) {
  return {
    id: "cycle-1",
    client_id: "client-123",
    cycle_number: 1,
    start_date: "2026-01-01",
    duration_days: 90,
    end_date: "2026-03-31",
    status: "active",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const defaultProps = {
  clientId: "client-123",
  currentCycle: 2,
  selectedCycle: 2,
  onCycleChange: jest.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PlanCycleSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Not rendered (single or zero cycles)
  // =========================================================================

  describe("when there is only one cycle", () => {
    it("returns null", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [createCycle()] },
          isLoading: false,
        },
      });

      const { container } = render(<PlanCycleSelector {...defaultProps} />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when there are no cycles", () => {
    it("returns null", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const { container } = render(<PlanCycleSelector {...defaultProps} />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when query returns undefined data", () => {
    it("returns null", () => {
      mockUseList.mockReturnValue({
        query: {
          data: undefined,
          isLoading: false,
        },
      });

      const { container } = render(<PlanCycleSelector {...defaultProps} />);
      expect(container.innerHTML).toBe("");
    });
  });

  // =========================================================================
  // Renders with multiple cycles
  // =========================================================================

  describe("when there are multiple cycles", () => {
    const twoCycles = [
      createCycle({
        id: "c2",
        cycle_number: 2,
        start_date: "2026-04-01",
        duration_days: 90,
        end_date: "2026-06-29",
        status: "active",
      }),
      createCycle({
        id: "c1",
        cycle_number: 1,
        start_date: "2026-01-01",
        duration_days: 90,
        end_date: "2026-03-31",
        status: "completed",
      }),
    ];

    beforeEach(() => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: twoCycles },
          isLoading: false,
        },
      });
    });

    it("renders the History icon", () => {
      render(<PlanCycleSelector {...defaultProps} />);
      // The component renders a History lucide icon
      const icon = document.querySelector(".lucide-history");
      expect(icon).toBeInTheDocument();
    });

    it("renders a select trigger", () => {
      render(<PlanCycleSelector {...defaultProps} />);
      // SelectTrigger renders a button with role="combobox"
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("shows current cycle label with (Current) suffix", () => {
      render(<PlanCycleSelector {...defaultProps} currentCycle={2} selectedCycle={2} />);
      // The selected option should display "Plan 2 (Current)" in the trigger
      expect(screen.getByText("Plan 2 (Current)")).toBeInTheDocument();
    });

    it("shows date range for selected cycle", () => {
      render(<PlanCycleSelector {...defaultProps} currentCycle={2} selectedCycle={2} />);
      // Date range for cycle 2: Apr 1, 90 days => computeEndDate gives Jun 28, 2026
      expect(screen.getByText("Apr 1, 2026 - Jun 28, 2026")).toBeInTheDocument();
    });

    it("calls onCycleChange when user selects a different cycle", async () => {
      const user = userEvent.setup();
      const onCycleChange = jest.fn();

      render(
        <PlanCycleSelector
          {...defaultProps}
          currentCycle={2}
          selectedCycle={2}
          onCycleChange={onCycleChange}
        />
      );

      // Open the select dropdown
      await user.click(screen.getByRole("combobox"));

      // Click on Plan 1
      const option1 = await screen.findByText("Plan 1");
      await user.click(option1);

      expect(onCycleChange).toHaveBeenCalledWith(1);
    });

    it("passes correct filters to useList", () => {
      render(<PlanCycleSelector {...defaultProps} clientId="abc-123" />);

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "plan_cycles",
          filters: [{ field: "client_id", operator: "eq", value: "abc-123" }],
          sorters: [{ field: "cycle_number", order: "desc" }],
          pagination: { mode: "off" },
          queryOptions: { enabled: true },
        })
      );
    });

    it("disables query when clientId is empty", () => {
      render(<PlanCycleSelector {...defaultProps} clientId="" />);

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: { enabled: false },
        })
      );
    });
  });

  // =========================================================================
  // currentCycleProfile override
  // =========================================================================

  describe("currentCycleProfile override", () => {
    const twoCycles = [
      createCycle({
        id: "c2",
        cycle_number: 2,
        start_date: "2026-04-01",
        duration_days: 90,
        status: "active",
      }),
      createCycle({
        id: "c1",
        cycle_number: 1,
        start_date: "2026-01-01",
        duration_days: 90,
        status: "completed",
      }),
    ];

    it("uses profile data for the current cycle dates instead of plan_cycles data", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: twoCycles },
          isLoading: false,
        },
      });

      render(
        <PlanCycleSelector
          {...defaultProps}
          currentCycle={2}
          selectedCycle={2}
          currentCycleProfile={{
            startDate: "2026-05-01",
            durationDays: 60,
          }}
        />
      );

      // Profile override: start May 1, 60 days => computeEndDate gives Jun 28
      expect(screen.getByText("May 1, 2026 - Jun 28, 2026")).toBeInTheDocument();
    });

    it("does not override non-current cycle dates", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: twoCycles },
          isLoading: false,
        },
      });

      render(
        <PlanCycleSelector
          {...defaultProps}
          currentCycle={2}
          selectedCycle={1}
          currentCycleProfile={{
            startDate: "2026-05-01",
            durationDays: 60,
          }}
        />
      );

      // Cycle 1 should still use its own data: Jan 1, 90 days => Mar 30, 2026
      expect(screen.getByText("Plan 1")).toBeInTheDocument();
      expect(screen.getByText("Jan 1, 2026 - Mar 30, 2026")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe("edge cases", () => {
    it("handles three cycles with mixed statuses", () => {
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              createCycle({
                id: "c3",
                cycle_number: 3,
                start_date: "2026-07-01",
                duration_days: 30,
                status: "active",
              }),
              createCycle({
                id: "c2",
                cycle_number: 2,
                start_date: "2026-04-01",
                duration_days: 90,
                status: "completed",
              }),
              createCycle({
                id: "c1",
                cycle_number: 1,
                start_date: "2026-01-01",
                duration_days: 90,
                status: "cancelled",
              }),
            ],
          },
          isLoading: false,
        },
      });

      render(<PlanCycleSelector {...defaultProps} currentCycle={3} selectedCycle={3} />);

      expect(screen.getByText("Plan 3 (Current)")).toBeInTheDocument();
    });

    it("handles single-day duration", () => {
      // Use January dates to avoid DST-related timezone issues
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              createCycle({
                id: "c2",
                cycle_number: 2,
                start_date: "2026-02-01",
                duration_days: 1,
              }),
              createCycle({
                id: "c1",
                cycle_number: 1,
                start_date: "2026-01-01",
                duration_days: 1,
              }),
            ],
          },
          isLoading: false,
        },
      });

      render(<PlanCycleSelector {...defaultProps} currentCycle={2} selectedCycle={2} />);

      // 1-day duration: start and end are the same
      expect(screen.getByText("Feb 1, 2026 - Feb 1, 2026")).toBeInTheDocument();
    });
  });
});
