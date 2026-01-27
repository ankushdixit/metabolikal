/**
 * Tests for TimelineMobileHeader component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineMobileHeader } from "../timeline-mobile-header";
import type { MacroTargets, ConsumedTotals, PlanProgress } from "@/hooks/use-client-timeline";
import type { TypeFilters, FilterCounts } from "../timeline-filters";

const defaultFilters: TypeFilters = {
  meal: true,
  supplement: true,
  workout: true,
  lifestyle: true,
};

const defaultCounts: FilterCounts = {
  meal: 5,
  supplement: 3,
  workout: 2,
  lifestyle: 1,
  total: 11,
};

const defaultTargets: MacroTargets = {
  calories: 2000,
  proteinMin: 100,
  proteinMax: 150,
  carbsMin: null,
  carbsMax: null,
  fatsMin: null,
  fatsMax: null,
  hasLimits: true,
};

const defaultConsumed: ConsumedTotals = {
  calories: 800,
  protein: 50,
  carbs: 0,
  fats: 0,
};

const defaultPlanProgress: PlanProgress = {
  dayNumber: 5,
  totalDays: 28,
  progressPercent: 17.9,
  daysRemaining: 24,
  weekNumber: 1,
  isExtended: false,
};

const defaultProps = {
  dayNumber: 5,
  formattedDate: "Monday, January 27, 2026",
  isViewingToday: true,
  isViewingPast: false,
  planProgress: defaultPlanProgress,
  completedCount: 3,
  totalCount: 11,
  completionPercentage: 27,
  targets: defaultTargets,
  consumed: defaultConsumed,
  filters: defaultFilters,
  onFiltersChange: jest.fn(),
  counts: defaultCounts,
  onPreviousDay: jest.fn(),
  onNextDay: jest.fn(),
  canGoPrevious: true,
  canGoNext: true,
  isOffline: false,
  lastUpdated: null,
};

describe("TimelineMobileHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render today's plan title when viewing today", () => {
      render(<TimelineMobileHeader {...defaultProps} />);

      expect(screen.getByText("Today's Plan")).toBeInTheDocument();
    });

    it("should render day number when not viewing today", () => {
      render(<TimelineMobileHeader {...defaultProps} isViewingToday={false} />);

      expect(screen.getByText("Day 5")).toBeInTheDocument();
    });

    it("should display formatted date", () => {
      render(<TimelineMobileHeader {...defaultProps} />);

      expect(screen.getByText("Monday, January 27, 2026")).toBeInTheDocument();
    });

    it("should display completion count", () => {
      render(<TimelineMobileHeader {...defaultProps} />);

      expect(screen.getByText("3/11")).toBeInTheDocument();
    });

    it("should display calorie progress", () => {
      render(<TimelineMobileHeader {...defaultProps} />);

      expect(screen.getByText("800/2000")).toBeInTheDocument();
      expect(screen.getByText("cal")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should call onPreviousDay when previous button clicked", () => {
      const onPreviousDay = jest.fn();
      render(<TimelineMobileHeader {...defaultProps} onPreviousDay={onPreviousDay} />);

      const prevButton = screen.getByLabelText("Previous day");
      fireEvent.click(prevButton);

      expect(onPreviousDay).toHaveBeenCalled();
    });

    it("should call onNextDay when next button clicked", () => {
      const onNextDay = jest.fn();
      render(<TimelineMobileHeader {...defaultProps} onNextDay={onNextDay} />);

      const nextButton = screen.getByLabelText("Next day");
      fireEvent.click(nextButton);

      expect(onNextDay).toHaveBeenCalled();
    });

    it("should disable previous button when canGoPrevious is false", () => {
      render(<TimelineMobileHeader {...defaultProps} canGoPrevious={false} />);

      const prevButton = screen.getByLabelText("Previous day");
      expect(prevButton).toBeDisabled();
    });

    it("should disable next button when canGoNext is false", () => {
      render(<TimelineMobileHeader {...defaultProps} canGoNext={false} />);

      const nextButton = screen.getByLabelText("Next day");
      expect(nextButton).toBeDisabled();
    });
  });

  describe("offline indicator", () => {
    it("should show offline indicator when offline", () => {
      render(<TimelineMobileHeader {...defaultProps} isOffline={true} />);

      expect(screen.getByText(/offline - changes will sync/i)).toBeInTheDocument();
    });

    it("should not show offline indicator when online", () => {
      render(<TimelineMobileHeader {...defaultProps} isOffline={false} />);

      expect(screen.queryByText(/offline - changes will sync/i)).not.toBeInTheDocument();
    });
  });

  describe("historical view", () => {
    it("should show (History) label when viewing past", () => {
      render(
        <TimelineMobileHeader {...defaultProps} isViewingToday={false} isViewingPast={true} />
      );

      expect(screen.getByText("(History)")).toBeInTheDocument();
    });

    it("should show colored completion based on percentage for historical view", () => {
      render(
        <TimelineMobileHeader
          {...defaultProps}
          isViewingToday={false}
          isViewingPast={true}
          completionPercentage={90}
        />
      );

      // Should have green styling for high completion
      const completionBadge = screen.getByText("3/11").closest("div");
      expect(completionBadge).toHaveClass("bg-green-500/20");
    });
  });

  describe("last updated", () => {
    it("should display last updated time when provided", () => {
      const lastUpdated = new Date("2026-01-27T14:30:00");
      render(<TimelineMobileHeader {...defaultProps} lastUpdated={lastUpdated} />);

      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });

    it("should not display last updated when not provided", () => {
      render(<TimelineMobileHeader {...defaultProps} lastUpdated={null} />);

      expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
    });
  });

  describe("filters", () => {
    it("should render filter buttons", () => {
      render(<TimelineMobileHeader {...defaultProps} />);

      // The TimelineFilters component is rendered in mobile mode
      // Filter buttons show icons but have title attributes
      const filterButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("title")?.match(/meals|supplements|workouts|lifestyle/i));
      expect(filterButtons.length).toBeGreaterThan(0);
    });
  });
});
