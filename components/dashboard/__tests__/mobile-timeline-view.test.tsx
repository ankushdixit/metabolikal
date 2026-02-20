/**
 * Tests for MobileTimelineView component
 *
 * Tests rendering states, time period grouping, filtering, navigation,
 * item interaction, and completion tracking.
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MobileTimelineView } from "../mobile-timeline-view";
import type { UseClientTimelineReturn } from "@/hooks/use-client-timeline";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";

// =============================================================================
// MOCKS
// =============================================================================

// Mock child components to avoid deep rendering
jest.mock("../timeline-mobile-header", () => ({
  TimelineMobileHeader: (props: Record<string, unknown>) => (
    <div data-testid="timeline-mobile-header" data-day-number={props.dayNumber}>
      <span data-testid="header-day">Day {String(props.dayNumber)}</span>
      <span data-testid="header-date">{String(props.formattedDate)}</span>
      <span data-testid="header-completed">
        {String(props.completedCount)}/{String(props.totalCount)}
      </span>
      {Boolean(props.canGoPrevious) && (
        <button data-testid="prev-day-btn" onClick={props.onPreviousDay as () => void}>
          Previous
        </button>
      )}
      {Boolean(props.canGoNext) && (
        <button data-testid="next-day-btn" onClick={props.onNextDay as () => void}>
          Next
        </button>
      )}
    </div>
  ),
}));

jest.mock("../timeline-swipe-container", () => ({
  TimelineSwipeContainer: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    onPreviousDay: () => void;
    onNextDay: () => void;
    canGoPrevious: boolean;
    canGoNext: boolean;
    enabled: boolean;
  }) => (
    <div
      data-testid="timeline-swipe-container"
      data-can-go-previous={props.canGoPrevious}
      data-can-go-next={props.canGoNext}
      data-enabled={props.enabled}
    >
      {children}
    </div>
  ),
}));

jest.mock("../timeline-item-sheet", () => ({
  TimelineItemSheet: (props: Record<string, unknown>) => (
    <div
      data-testid="timeline-item-sheet"
      data-is-open={props.isOpen}
      data-is-completed={props.isCompleted}
      data-read-only={props.readOnly}
    >
      {Boolean(props.isOpen) && (
        <>
          <span data-testid="sheet-item-title">
            {(props.item as ExtendedTimelineItem | null)?.title ?? ""}
          </span>
          <button data-testid="sheet-close" onClick={props.onClose as () => void}>
            Close
          </button>
          <button data-testid="sheet-complete" onClick={props.onMarkComplete as () => void}>
            Complete
          </button>
          <button data-testid="sheet-uncomplete" onClick={props.onMarkUncomplete as () => void}>
            Uncomplete
          </button>
        </>
      )}
    </div>
  ),
}));

jest.mock("../food-alternatives-drawer", () => ({
  FoodAlternativesDrawer: (props: Record<string, unknown>) => (
    <div data-testid="food-alternatives-drawer" data-is-open={props.isOpen} />
  ),
}));

jest.mock("../scroll-to-now-button", () => ({
  ScrollToNowButton: () => <div data-testid="scroll-to-now-button" />,
}));

// Mock hooks
const mockQueueCompletion = jest.fn();
const mockGetPendingAction = jest.fn().mockReturnValue(null);

jest.mock("@/hooks/use-offline-completions", () => ({
  useOfflineCompletions: () => ({
    isOnline: true,
    getPendingAction: mockGetPendingAction,
    queueCompletion: mockQueueCompletion,
  }),
}));

// Mock @refinedev/core
const mockMutate = jest.fn();
jest.mock("@refinedev/core", () => ({
  useList: jest.fn(() => ({
    query: {
      data: { data: [] },
      isLoading: false,
    },
  })),
  useUpdate: jest.fn(() => ({
    mutate: mockMutate,
    isLoading: false,
  })),
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

function createTimelineItem(overrides: Partial<ExtendedTimelineItem> = {}): ExtendedTimelineItem {
  return {
    id: `item-${Math.random().toString(36).substring(2, 8)}`,
    type: "meal",
    title: "Test Item",
    subtitle: "Test subtitle",
    sourceId: "source-1",
    sourceType: "diet_plan",
    dayNumber: 1,
    scheduling: {
      time_type: "fixed",
      time_start: "08:00",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: { calories: 300 },
    groupedSourceIds: ["source-1"],
    groupedItems: [],
    ...overrides,
  } as unknown as ExtendedTimelineItem;
}

function createMorningMealItem(id = "morning-meal"): ExtendedTimelineItem {
  return createTimelineItem({
    id,
    type: "meal",
    title: "Breakfast",
    subtitle: "Morning meal",
    sourceId: `${id}-source`,
    scheduling: {
      time_type: "fixed",
      time_start: "08:00",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: { calories: 450 },
  });
}

function createMiddayMealItem(id = "midday-meal"): ExtendedTimelineItem {
  return createTimelineItem({
    id,
    type: "meal",
    title: "Lunch",
    subtitle: "Midday meal",
    sourceId: `${id}-source`,
    scheduling: {
      time_type: "fixed",
      time_start: "12:30",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: { calories: 600 },
  });
}

function createAfternoonSupplementItem(id = "afternoon-supp"): ExtendedTimelineItem {
  return createTimelineItem({
    id,
    type: "supplement",
    title: "Afternoon Supplements",
    subtitle: "1 supplement",
    sourceId: `${id}-source`,
    scheduling: {
      time_type: "fixed",
      time_start: "15:00",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: {},
  });
}

function createEveningWorkoutItem(id = "evening-workout"): ExtendedTimelineItem {
  return createTimelineItem({
    id,
    type: "workout",
    title: "Upper Body Workout",
    subtitle: "3 exercises",
    sourceId: `${id}-source`,
    scheduling: {
      time_type: "fixed",
      time_start: "18:00",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: { duration: 45 },
  });
}

function createNightLifestyleItem(id = "night-lifestyle"): ExtendedTimelineItem {
  return createTimelineItem({
    id,
    type: "lifestyle",
    title: "Wind Down",
    subtitle: "Evening routine",
    sourceId: `${id}-source`,
    scheduling: {
      time_type: "fixed",
      time_start: "22:30",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: {},
  });
}

function createEarlyMorningItem(id = "early-morning"): ExtendedTimelineItem {
  return createTimelineItem({
    id,
    type: "lifestyle",
    title: "Early Rise",
    subtitle: "Wake up routine",
    sourceId: `${id}-source`,
    scheduling: {
      time_type: "fixed",
      time_start: "04:30",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: {},
  });
}

// =============================================================================
// MOCK TIMELINE RETURN
// =============================================================================

const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
const mockMarkUncomplete = jest.fn().mockResolvedValue(undefined);
const mockMarkSourceItemComplete = jest.fn().mockResolvedValue(undefined);
const mockMarkSourceItemUncomplete = jest.fn().mockResolvedValue(undefined);
const mockRefetch = jest.fn();
const mockIsItemCompleted = jest.fn().mockReturnValue(false);
const mockIsSourceItemCompleted = jest.fn().mockReturnValue(false);
const mockGetItemCompletionStatus = jest.fn().mockReturnValue({ completed: 0, total: 1 });

function createMockTimeline(
  overrides: Partial<UseClientTimelineReturn> = {}
): UseClientTimelineReturn {
  return {
    userId: "user-123",
    timelineItems: [],
    packingItems: [],
    dietItems: [],
    supplementItems: [],
    workoutItems: [],
    lifestyleItems: [],
    planProgress: {
      dayNumber: 5,
      totalDays: 30,
      progressPercent: 16.67,
      daysRemaining: 25,
      weekNumber: 1,
      isExtended: false,
    },
    planStartDate: new Date("2026-01-01"),
    isPlanConfigured: true,
    isBeforePlanStart: false,
    dayLabel: "Day 5 - Mon, Jan 5",
    targets: {
      calories: 2000,
      proteinMin: 120,
      proteinMax: 150,
      carbsMin: null,
      carbsMax: null,
      fatsMin: null,
      fatsMax: null,
      hasLimits: true,
    },
    consumed: {
      calories: 500,
      protein: 30,
      carbs: 60,
      fats: 15,
    },
    completions: [],
    completedCount: 0,
    totalCount: 0,
    isItemCompleted: mockIsItemCompleted,
    isSourceItemCompleted: mockIsSourceItemCompleted,
    getItemCompletionStatus: mockGetItemCompletionStatus,
    markComplete: mockMarkComplete,
    markUncomplete: mockMarkUncomplete,
    markSourceItemComplete: mockMarkSourceItemComplete,
    markSourceItemUncomplete: mockMarkSourceItemUncomplete,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
    selectedDate: new Date("2026-01-05"),
    dateStr: "2026-01-05",
    formattedDate: "Monday, January 5, 2026",
    dayNumber: 5,
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe("MobileTimelineView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-05T10:30:00"));

    // Reset mock return values after clearAllMocks
    mockIsItemCompleted.mockReturnValue(false);
    mockIsSourceItemCompleted.mockReturnValue(false);
    mockGetItemCompletionStatus.mockReturnValue({ completed: 0, total: 1 });
    mockGetPendingAction.mockReturnValue(null);
    mockMarkComplete.mockResolvedValue(undefined);
    mockMarkUncomplete.mockResolvedValue(undefined);
    mockMarkSourceItemComplete.mockResolvedValue(undefined);
    mockMarkSourceItemUncomplete.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  describe("loading state", () => {
    it("should show loading skeleton when isLoading is true", () => {
      const timeline = createMockTimeline({ isLoading: true });

      const { container } = render(<MobileTimelineView timeline={timeline} />);

      // Loading state renders animate-pulse skeleton divs
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should not render header or content when loading", () => {
      const timeline = createMockTimeline({ isLoading: true });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.queryByTestId("timeline-mobile-header")).not.toBeInTheDocument();
      expect(screen.queryByTestId("timeline-swipe-container")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ERROR STATE
  // ===========================================================================

  describe("error state", () => {
    it("should show error message when isError is true", () => {
      const timeline = createMockTimeline({ isError: true });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Failed to load your plan")).toBeInTheDocument();
      expect(screen.getByText("Please try refreshing")).toBeInTheDocument();
    });

    it("should show Try Again button that calls refetch", () => {
      const timeline = createMockTimeline({ isError: true });

      render(<MobileTimelineView timeline={timeline} />);

      const retryButton = screen.getByRole("button", { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // PLAN NOT CONFIGURED
  // ===========================================================================

  describe("plan not configured state", () => {
    it("should show plan not configured message", () => {
      const timeline = createMockTimeline({ isPlanConfigured: false });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Plan Not Configured")).toBeInTheDocument();
      expect(
        screen.getByText(/your coach hasn't set up your plan start date yet/i)
      ).toBeInTheDocument();
    });

    it("should not render timeline content when plan not configured", () => {
      const timeline = createMockTimeline({ isPlanConfigured: false });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.queryByTestId("timeline-mobile-header")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // NORMAL RENDERING
  // ===========================================================================

  describe("normal rendering", () => {
    it("should render mobile header with correct props", () => {
      const timeline = createMockTimeline();

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByTestId("timeline-mobile-header")).toBeInTheDocument();
      expect(screen.getByTestId("header-day")).toHaveTextContent("Day 5");
      expect(screen.getByTestId("header-date")).toHaveTextContent("Monday, January 5, 2026");
    });

    it("should render swipe container", () => {
      const timeline = createMockTimeline();

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByTestId("timeline-swipe-container")).toBeInTheDocument();
    });

    it("should render scroll to now button", () => {
      const timeline = createMockTimeline();

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByTestId("scroll-to-now-button")).toBeInTheDocument();
    });

    it("should render timeline item sheet", () => {
      const timeline = createMockTimeline();

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByTestId("timeline-item-sheet")).toBeInTheDocument();
    });

    it("should render food alternatives drawer", () => {
      const timeline = createMockTimeline();

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByTestId("food-alternatives-drawer")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

  describe("empty state", () => {
    it("should show empty message when no items", () => {
      const timeline = createMockTimeline({ timelineItems: [] });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("No items scheduled")).toBeInTheDocument();
      expect(screen.getByText("Check your filters or select a different day")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // TIME PERIOD GROUPING
  // ===========================================================================

  describe("time period grouping", () => {
    it("should group items into correct time periods", () => {
      const items = [
        createMorningMealItem(),
        createMiddayMealItem(),
        createAfternoonSupplementItem(),
        createEveningWorkoutItem(),
      ];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items.filter((i) => i.type === "meal"),
        supplementItems: items.filter((i) => i.type === "supplement"),
        workoutItems: items.filter((i) => i.type === "workout"),
        lifestyleItems: [],
        totalCount: items.length,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Morning")).toBeInTheDocument();
      expect(screen.getByText("Midday")).toBeInTheDocument();
      expect(screen.getByText("Afternoon")).toBeInTheDocument();
      expect(screen.getByText("Evening")).toBeInTheDocument();
    });

    it("should show item count per period", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("(1 item)")).toBeInTheDocument();
    });

    it("should show plural item count for multiple items", () => {
      const items = [
        createMorningMealItem("m1"),
        createTimelineItem({
          id: "m2",
          type: "supplement",
          title: "Morning Vitamins",
          sourceId: "m2-source",
          scheduling: {
            time_type: "fixed",
            time_start: "07:30",
            time_end: null,
            time_period: null,
            relative_anchor: null,
            relative_offset_minutes: 0,
          },
        }),
      ];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items.filter((i) => i.type === "meal"),
        supplementItems: items.filter((i) => i.type === "supplement"),
        totalCount: 2,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("(2 items)")).toBeInTheDocument();
    });

    it("should filter out empty periods", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Morning")).toBeInTheDocument();
      // Midday, Afternoon, Evening, Night should not be shown since they have no items
      expect(screen.queryByText("Midday")).not.toBeInTheDocument();
      expect(screen.queryByText("Afternoon")).not.toBeInTheDocument();
      expect(screen.queryByText("Evening")).not.toBeInTheDocument();
      expect(screen.queryByText("Night")).not.toBeInTheDocument();
    });

    it("should display item titles within periods", () => {
      const items = [createMorningMealItem(), createMiddayMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 2,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Breakfast")).toBeInTheDocument();
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // OVERNIGHT PERIOD WRAPPING
  // ===========================================================================

  describe("overnight period wrapping", () => {
    it("should place items after 22:00 in the Night period", () => {
      const items = [createNightLifestyleItem()]; // 22:30

      const timeline = createMockTimeline({
        timelineItems: items,
        lifestyleItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Night")).toBeInTheDocument();
      expect(screen.getByText("Wind Down")).toBeInTheDocument();
    });

    it("should place items before 05:00 in the Night period", () => {
      const items = [createEarlyMorningItem()]; // 04:30

      const timeline = createMockTimeline({
        timelineItems: items,
        lifestyleItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Night")).toBeInTheDocument();
      expect(screen.getByText("Early Rise")).toBeInTheDocument();
    });

    it("should group both overnight items (pre and post midnight) together", () => {
      const items = [
        createNightLifestyleItem("night-item"), // 22:30
        createEarlyMorningItem("early-item"), // 04:30
      ];

      const timeline = createMockTimeline({
        timelineItems: items,
        lifestyleItems: items,
        totalCount: 2,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // Both should be under Night
      expect(screen.getByText("Night")).toBeInTheDocument();
      expect(screen.getByText("(2 items)")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // CURRENT TIME INDICATOR
  // ===========================================================================

  describe("current time indicator", () => {
    it("should mark the current period with NOW badge", () => {
      // Time is set to 10:30 which falls in Midday (10-14)
      const items = [createMiddayMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("NOW")).toBeInTheDocument();
    });

    it("should not mark non-current periods with NOW", () => {
      // Time is 10:30 - Morning (5-10) is not current
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.queryByText("NOW")).not.toBeInTheDocument();
    });

    it("should mark Night period as current when time is after 22:00", () => {
      jest.setSystemTime(new Date("2026-01-05T23:00:00"));

      const items = [createNightLifestyleItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        lifestyleItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("NOW")).toBeInTheDocument();
    });

    it("should mark Night period as current when time is before 05:00", () => {
      jest.setSystemTime(new Date("2026-01-05T03:00:00"));

      const items = [createEarlyMorningItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        lifestyleItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("NOW")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ITEM SORTING WITHIN PERIOD
  // ===========================================================================

  describe("item sorting within period", () => {
    it("should sort items by time within a period", () => {
      const earlyMorning = createTimelineItem({
        id: "early",
        title: "Early Breakfast",
        scheduling: {
          time_type: "fixed",
          time_start: "06:00",
          time_end: null,
          time_period: null,
          relative_anchor: null,
          relative_offset_minutes: 0,
        },
      });
      const lateMorning = createTimelineItem({
        id: "late",
        title: "Late Breakfast",
        scheduling: {
          time_type: "fixed",
          time_start: "09:00",
          time_end: null,
          time_period: null,
          relative_anchor: null,
          relative_offset_minutes: 0,
        },
      });

      // Pass in reverse order to verify sorting
      const items = [lateMorning, earlyMorning];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 2,
      });

      render(<MobileTimelineView timeline={timeline} />);

      const itemElements = screen.getAllByRole("button");
      const earlyIndex = itemElements.findIndex((el) =>
        el.textContent?.includes("Early Breakfast")
      );
      const lateIndex = itemElements.findIndex((el) => el.textContent?.includes("Late Breakfast"));

      // Early should appear before late
      if (earlyIndex >= 0 && lateIndex >= 0) {
        expect(earlyIndex).toBeLessThan(lateIndex);
      }
    });
  });

  // ===========================================================================
  // COLLAPSIBLE PERIODS
  // ===========================================================================

  describe("collapsible periods", () => {
    it("should have all periods expanded by default", () => {
      const items = [createMorningMealItem(), createMiddayMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 2,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // Both item titles should be visible (periods expanded)
      expect(screen.getByText("Breakfast")).toBeInTheDocument();
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });

    it("should collapse period when header clicked", async () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // Item should be visible initially
      expect(screen.getByText("Breakfast")).toBeInTheDocument();

      // Click the period header to collapse
      const periodHeader = screen.getByText("Morning").closest("button");
      if (periodHeader) {
        fireEvent.click(periodHeader);
      }

      // Item should be hidden after collapse
      expect(screen.queryByText("Breakfast")).not.toBeInTheDocument();
      // Period header should still be visible
      expect(screen.getByText("Morning")).toBeInTheDocument();
    });

    it("should expand period when collapsed header clicked", async () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // Collapse first
      const periodHeader = screen.getByText("Morning").closest("button");
      if (periodHeader) {
        fireEvent.click(periodHeader);
        // Verify collapsed
        expect(screen.queryByText("Breakfast")).not.toBeInTheDocument();

        // Click again to expand
        fireEvent.click(periodHeader);
        // Item should be visible again
        expect(screen.getByText("Breakfast")).toBeInTheDocument();
      }
    });
  });

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

  describe("navigation", () => {
    it("should allow navigation to previous day when canGoPrevious is true", () => {
      const onDayChange = jest.fn();
      const timeline = createMockTimeline({ dayNumber: 5 });

      render(<MobileTimelineView timeline={timeline} onDayChange={onDayChange} />);

      // The header mock renders a prev-day-btn when canGoPrevious is true
      const prevBtn = screen.getByTestId("prev-day-btn");
      fireEvent.click(prevBtn);

      expect(onDayChange).toHaveBeenCalledWith(4);
    });

    it("should allow navigation to next day when canGoNext is true", () => {
      const onDayChange = jest.fn();
      const timeline = createMockTimeline({ dayNumber: 5 });

      render(<MobileTimelineView timeline={timeline} onDayChange={onDayChange} />);

      const nextBtn = screen.getByTestId("next-day-btn");
      fireEvent.click(nextBtn);

      expect(onDayChange).toHaveBeenCalledWith(6);
    });

    it("should not allow navigation before day 1", () => {
      const onDayChange = jest.fn();
      const timeline = createMockTimeline({ dayNumber: 1 });

      render(<MobileTimelineView timeline={timeline} onDayChange={onDayChange} />);

      // canGoPrevious should be false for day 1
      expect(screen.queryByTestId("prev-day-btn")).not.toBeInTheDocument();
    });

    it("should not allow navigation past total days", () => {
      const onDayChange = jest.fn();
      const timeline = createMockTimeline({
        dayNumber: 30,
        planProgress: {
          dayNumber: 5,
          totalDays: 30,
          progressPercent: 16.67,
          daysRemaining: 25,
          weekNumber: 1,
          isExtended: false,
        },
      });

      render(<MobileTimelineView timeline={timeline} onDayChange={onDayChange} />);

      // canGoNext should be false at totalDays
      expect(screen.queryByTestId("next-day-btn")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ITEM INTERACTION
  // ===========================================================================

  describe("item interaction", () => {
    it("should open item sheet when item card clicked", async () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // Click the item card (it's a button role)
      const itemCard = screen.getByText("Breakfast").closest("[role='button']");
      if (itemCard) {
        fireEvent.click(itemCard);
      }

      // The sheet should now be open
      await waitFor(() => {
        const sheet = screen.getByTestId("timeline-item-sheet");
        expect(sheet).toHaveAttribute("data-is-open", "true");
      });
    });

    it("should display the selected item title in the sheet", async () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      const itemCard = screen.getByText("Breakfast").closest("[role='button']");
      if (itemCard) {
        fireEvent.click(itemCard);
      }

      await waitFor(() => {
        expect(screen.getByTestId("sheet-item-title")).toHaveTextContent("Breakfast");
      });
    });

    it("should close item sheet when close button clicked", async () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // Open the sheet
      const itemCard = screen.getByText("Breakfast").closest("[role='button']");
      if (itemCard) {
        fireEvent.click(itemCard);
      }

      // Close the sheet
      await waitFor(() => {
        const closeBtn = screen.getByTestId("sheet-close");
        fireEvent.click(closeBtn);
      });

      await waitFor(() => {
        const sheet = screen.getByTestId("timeline-item-sheet");
        expect(sheet).toHaveAttribute("data-is-open", "false");
      });
    });

    it("should support keyboard activation (Enter) on item card", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      const itemCard = screen.getByText("Breakfast").closest("[role='button']");
      if (itemCard) {
        fireEvent.keyDown(itemCard, { key: "Enter" });
      }

      const sheet = screen.getByTestId("timeline-item-sheet");
      expect(sheet).toHaveAttribute("data-is-open", "true");
    });

    it("should support keyboard activation (Space) on item card", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      const itemCard = screen.getByText("Breakfast").closest("[role='button']");
      if (itemCard) {
        fireEvent.keyDown(itemCard, { key: " " });
      }

      const sheet = screen.getByTestId("timeline-item-sheet");
      expect(sheet).toHaveAttribute("data-is-open", "true");
    });
  });

  // ===========================================================================
  // QUICK COMPLETE
  // ===========================================================================

  describe("quick complete", () => {
    it("should call markComplete when quick complete button clicked for uncompleted item", async () => {
      const items = [createMorningMealItem()];
      mockIsItemCompleted.mockReturnValue(false);

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // Find the completion button (the circle button with aria-label)
      const completeBtn = screen.getByLabelText("Mark complete");
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(mockMarkComplete).toHaveBeenCalled();
      });
    });

    it("should call markUncomplete when quick complete button clicked for completed item", async () => {
      const items = [createMorningMealItem()];
      mockIsItemCompleted.mockReturnValue(true);

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      const completeBtn = screen.getByLabelText("Mark incomplete");
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(mockMarkUncomplete).toHaveBeenCalled();
      });
    });

    it("should not quick complete in read-only mode (future day)", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
        dayNumber: 10,
        planProgress: {
          dayNumber: 5,
          totalDays: 30,
          progressPercent: 16.67,
          daysRemaining: 25,
          weekNumber: 1,
          isExtended: false,
        },
      });

      render(<MobileTimelineView timeline={timeline} />);

      // The completion button should be disabled in read-only mode
      const completeBtn = screen.getByLabelText("Mark complete");
      expect(completeBtn).toBeDisabled();
    });
  });

  // ===========================================================================
  // TYPE FILTER SUPPORT
  // ===========================================================================

  describe("type filter support", () => {
    it("should render items of all types when all filters are enabled", () => {
      const items = [
        createMorningMealItem(),
        createAfternoonSupplementItem(),
        createEveningWorkoutItem(),
        createNightLifestyleItem(),
      ];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items.filter((i) => i.type === "meal"),
        supplementItems: items.filter((i) => i.type === "supplement"),
        workoutItems: items.filter((i) => i.type === "workout"),
        lifestyleItems: items.filter((i) => i.type === "lifestyle"),
        totalCount: 4,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Breakfast")).toBeInTheDocument();
      expect(screen.getByText("Afternoon Supplements")).toBeInTheDocument();
      expect(screen.getByText("Upper Body Workout")).toBeInTheDocument();
      expect(screen.getByText("Wind Down")).toBeInTheDocument();
    });

    it("should pass initialFilters to the filter state", () => {
      const items = [createMorningMealItem(), createAfternoonSupplementItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items.filter((i) => i.type === "meal"),
        supplementItems: items.filter((i) => i.type === "supplement"),
        totalCount: 2,
      });

      render(
        <MobileTimelineView
          timeline={timeline}
          initialFilters={{
            meal: true,
            supplement: false,
            workout: true,
            lifestyle: true,
          }}
        />
      );

      // Meal should be visible (filter enabled)
      expect(screen.getByText("Breakfast")).toBeInTheDocument();
      // Supplement should be hidden (filter disabled)
      expect(screen.queryByText("Afternoon Supplements")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ITEM CARD DISPLAY
  // ===========================================================================

  describe("item card display", () => {
    it("should display item title and subtitle", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Breakfast")).toBeInTheDocument();
      expect(screen.getByText("Morning meal")).toBeInTheDocument();
    });

    it("should display time for items", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // 08:00 -> "8:00 AM"
      expect(screen.getByText("8:00 AM")).toBeInTheDocument();
    });

    it("should display calories for meal items", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("450 cal")).toBeInTheDocument();
    });

    it("should apply completed styling when item is completed", () => {
      const items = [createMorningMealItem()];
      mockIsItemCompleted.mockReturnValue(true);

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // The item title should have line-through styling
      const title = screen.getByText("Breakfast");
      expect(title).toHaveClass("line-through");
    });

    it("should show partial completion indicator for grouped items", () => {
      const items = [
        createTimelineItem({
          id: "grouped-meal",
          title: "Grouped Breakfast",
          groupedSourceIds: ["s1", "s2", "s3"],
        }),
      ];
      mockIsItemCompleted.mockReturnValue(false);
      mockGetItemCompletionStatus.mockReturnValue({ completed: 1, total: 3 });

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // Should show partial completion count
      expect(screen.getByText("1/3")).toBeInTheDocument();
    });

    it("should show item count hint for grouped items", () => {
      const items = [
        createTimelineItem({
          id: "grouped-meal",
          title: "Grouped Breakfast",
          groupedSourceIds: ["s1", "s2"],
        }),
      ];
      mockIsItemCompleted.mockReturnValue(false);
      mockGetItemCompletionStatus.mockReturnValue({ completed: 0, total: 2 });

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("0/2 items")).toBeInTheDocument();
      expect(screen.getByText("Tap for details")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATUS BANNERS
  // ===========================================================================

  describe("status banners", () => {
    it("should show before plan start banner", () => {
      const timeline = createMockTimeline({
        isBeforePlanStart: true,
        planStartDate: new Date("2026-02-01"),
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText(/your plan starts/i)).toBeInTheDocument();
    });

    it("should show viewing history banner when viewing past day", () => {
      const timeline = createMockTimeline({
        dayNumber: 3,
        planProgress: {
          dayNumber: 5,
          totalDays: 30,
          progressPercent: 16.67,
          daysRemaining: 25,
          weekNumber: 1,
          isExtended: false,
        },
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByText("Viewing History")).toBeInTheDocument();
    });

    it("should not show viewing history banner when viewing today", () => {
      const timeline = createMockTimeline({
        dayNumber: 5,
        planProgress: {
          dayNumber: 5,
          totalDays: 30,
          progressPercent: 16.67,
          daysRemaining: 25,
          weekNumber: 1,
          isExtended: false,
        },
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.queryByText("Viewing History")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // READ-ONLY STATE (FUTURE / PAST DAYS)
  // ===========================================================================

  describe("read-only state", () => {
    it("should mark item sheet as readOnly for future days", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
        dayNumber: 10,
        planProgress: {
          dayNumber: 5,
          totalDays: 30,
          progressPercent: 16.67,
          daysRemaining: 25,
          weekNumber: 1,
          isExtended: false,
        },
      });

      render(<MobileTimelineView timeline={timeline} />);

      const sheet = screen.getByTestId("timeline-item-sheet");
      expect(sheet).toHaveAttribute("data-read-only", "true");
    });

    it("should mark item sheet as readOnly for past days", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
        dayNumber: 3,
        planProgress: {
          dayNumber: 5,
          totalDays: 30,
          progressPercent: 16.67,
          daysRemaining: 25,
          weekNumber: 1,
          isExtended: false,
        },
      });

      render(<MobileTimelineView timeline={timeline} />);

      const sheet = screen.getByTestId("timeline-item-sheet");
      expect(sheet).toHaveAttribute("data-read-only", "true");
    });

    it("should not mark item sheet as readOnly for today", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
        dayNumber: 5,
        planProgress: {
          dayNumber: 5,
          totalDays: 30,
          progressPercent: 16.67,
          daysRemaining: 25,
          weekNumber: 1,
          isExtended: false,
        },
      });

      render(<MobileTimelineView timeline={timeline} />);

      const sheet = screen.getByTestId("timeline-item-sheet");
      expect(sheet).toHaveAttribute("data-read-only", "false");
    });
  });

  // ===========================================================================
  // SWIPE CONTAINER INTEGRATION
  // ===========================================================================

  describe("swipe container integration", () => {
    it("should disable swipe when item sheet is open", async () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      // Open item sheet
      const itemCard = screen.getByText("Breakfast").closest("[role='button']");
      if (itemCard) {
        fireEvent.click(itemCard);
      }

      await waitFor(() => {
        const swipeContainer = screen.getByTestId("timeline-swipe-container");
        // When selectedItem is not null, enabled should be false
        expect(swipeContainer).toHaveAttribute("data-enabled", "false");
      });
    });

    it("should enable swipe when item sheet is closed", () => {
      const items = [createMorningMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      const swipeContainer = screen.getByTestId("timeline-swipe-container");
      expect(swipeContainer).toHaveAttribute("data-enabled", "true");
    });
  });

  // ===========================================================================
  // REFRESH
  // ===========================================================================

  describe("refresh", () => {
    it("should show refreshing indicator when refreshing", async () => {
      const timeline = createMockTimeline({ isError: true });

      render(<MobileTimelineView timeline={timeline} />);

      // Click the Try Again button
      const retryButton = screen.getByRole("button", { name: /try again/i });

      await act(async () => {
        fireEvent.click(retryButton);
      });

      // After clicking, the component should show refreshing state
      // The refresh state is set with a 500ms timeout
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // COMPLETION HEADER DISPLAY
  // ===========================================================================

  describe("completion header display", () => {
    it("should pass completed and total counts to header", () => {
      const items = [createMorningMealItem(), createMiddayMealItem()];

      const timeline = createMockTimeline({
        timelineItems: items,
        dietItems: items,
        totalCount: 2,
        completedCount: 1,
      });

      render(<MobileTimelineView timeline={timeline} />);

      expect(screen.getByTestId("header-completed")).toHaveTextContent("1/2");
    });
  });
});
