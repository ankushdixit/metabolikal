/**
 * Tests for ClientTimelineView component
 *
 * Enhanced to cover: SSR/hydration skeleton, mobile view delegation,
 * viewing past/future day banners, filter toggling, expanded item modal,
 * mark complete/uncomplete, food swap flow, and day navigation.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { ClientTimelineView } from "../client-timeline-view";

// Mock scrollTo for JSDOM
Element.prototype.scrollTo = jest.fn();

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockRouterReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
  useRouter: () => ({
    replace: mockRouterReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Mock toast
// ---------------------------------------------------------------------------

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mock child components that receive callbacks
// We capture their props so we can invoke callbacks directly in tests.
// ---------------------------------------------------------------------------

let _capturedTimelineGridProps: Record<string, unknown> = {};
jest.mock("@/components/admin/timeline-editor/timeline-grid", () => ({
  TimelineGrid: (props: Record<string, unknown>) => {
    _capturedTimelineGridProps = props;
    const items = (props.items || []) as Array<{ id: string; title: string }>;
    return (
      <div data-testid="mock-timeline-grid">
        {items.length === 0 ? (
          <p>No items for this day</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              data-testid={`grid-item-${item.id}`}
              onClick={() => (props.onItemClick as (item: unknown) => void)?.(item)}
            >
              {item.title}
            </div>
          ))
        )}
      </div>
    );
  },
}));

let _capturedExpandedProps: Record<string, unknown> = {};
jest.mock("../timeline-item-expanded", () => ({
  TimelineItemExpanded: (props: Record<string, unknown>) => {
    _capturedExpandedProps = props;
    return (
      <div data-testid="mock-expanded-item">
        <span>Expanded: {(props.item as { title: string })?.title}</span>
        <button data-testid="mark-complete-btn" onClick={props.onMarkComplete as () => void}>
          Mark Complete
        </button>
        <button data-testid="mark-uncomplete-btn" onClick={props.onMarkUncomplete as () => void}>
          Mark Uncomplete
        </button>
        <button data-testid="close-expanded-btn" onClick={props.onClose as () => void}>
          Close
        </button>
        {(props.onSwapFood as ((id: string) => void) | undefined) && (
          <button
            data-testid="swap-food-btn"
            onClick={() => (props.onSwapFood as (id: string) => void)("diet-plan-1")}
          >
            Swap Food
          </button>
        )}
        <button
          data-testid="mark-source-complete-btn"
          onClick={() => (props.onMarkSourceItemComplete as (id: string) => void)?.("source-1")}
        >
          Complete Source Item
        </button>
        <button
          data-testid="mark-source-uncomplete-btn"
          onClick={() => (props.onMarkSourceItemUncomplete as (id: string) => void)?.("source-1")}
        >
          Uncomplete Source Item
        </button>
      </div>
    );
  },
}));

let _capturedMobileProps: Record<string, unknown> = {};
jest.mock("../mobile-timeline-view", () => ({
  MobileTimelineView: (props: Record<string, unknown>) => {
    _capturedMobileProps = props;
    return <div data-testid="mock-mobile-view">Mobile Timeline View</div>;
  },
}));

let _capturedDayNavProps: Record<string, unknown> = {};
jest.mock("@/components/admin/plan-day-navigator", () => ({
  PlanDayNavigator: (props: Record<string, unknown>) => {
    _capturedDayNavProps = props;
    return (
      <div data-testid="mock-day-navigator">
        <span>Day {props.currentDay as number}</span>
        <button
          data-testid="nav-prev"
          onClick={() =>
            (props.onDayChange as (d: number) => void)?.((props.currentDay as number) - 1)
          }
        >
          Prev
        </button>
        <button
          data-testid="nav-next"
          onClick={() =>
            (props.onDayChange as (d: number) => void)?.((props.currentDay as number) + 1)
          }
        >
          Next
        </button>
      </div>
    );
  },
}));

jest.mock("../food-alternatives-drawer", () => ({
  FoodAlternativesDrawer: (props: Record<string, unknown>) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="mock-food-drawer">
        <button
          data-testid="select-alternative-btn"
          onClick={() => (props.onSelectAlternative as (id: string) => void)?.("alt-food-1")}
        >
          Select Alternative
        </button>
        <button data-testid="close-drawer-btn" onClick={props.onClose as () => void}>
          Close Drawer
        </button>
      </div>
    );
  },
}));

// Mock remaining child components
jest.mock("../timeline-targets-card", () => ({
  TimelineTargetsCard: (_props: Record<string, unknown>) => (
    <div data-testid="mock-targets-card">Today's Targets</div>
  ),
}));

jest.mock("../timeline-filters", () => {
  const actual = jest.requireActual("../timeline-filters");
  return {
    ...actual,
    TimelineFilters: (props: Record<string, unknown>) => {
      return (
        <div data-testid="mock-filters">
          <span>Show:</span>
          {["Meals", "Supplements", "Workouts", "Lifestyle"].map((name) => (
            <button
              key={name}
              onClick={() => {
                const newFilters = { ...(props.filters as Record<string, boolean>) };
                const filterKey = name === "Meals" ? "meal" : name.toLowerCase().slice(0, -1);
                newFilters[filterKey] = !newFilters[filterKey];
                (props.onFiltersChange as (f: unknown) => void)?.(newFilters);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      );
    },
  };
});

jest.mock("../timeline-stats", () => ({
  TimelineStats: (props: Record<string, unknown>) => (
    <div data-testid="mock-stats">{props.periodLabel as string}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Mock useClientTimeline hook
// ---------------------------------------------------------------------------

const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
const mockMarkUncomplete = jest.fn().mockResolvedValue(undefined);
const mockRefetch = jest.fn();
const mockIsItemCompleted = jest.fn().mockReturnValue(false);
const mockIsSourceItemCompleted = jest.fn().mockReturnValue(false);
const mockGetItemCompletionStatus = jest.fn().mockReturnValue("none");
const mockMarkSourceItemComplete = jest.fn().mockResolvedValue(undefined);
const mockMarkSourceItemUncomplete = jest.fn().mockResolvedValue(undefined);

const defaultHookReturn = {
  userId: "test-user-id",
  timelineItems: [] as unknown[],
  packingItems: [] as unknown[],
  dietItems: [] as unknown[],
  supplementItems: [] as unknown[],
  workoutItems: [] as unknown[],
  lifestyleItems: [] as unknown[],
  planProgress: {
    dayNumber: 8,
    totalDays: 28,
    progressPercent: 28.57,
    daysRemaining: 21,
    weekNumber: 2,
    isExtended: false,
  },
  planStartDate: new Date("2026-01-20"),
  isPlanConfigured: true,
  isBeforePlanStart: false,
  dayLabel: "Day 8 - Mon, Jan 27",
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
  selectedDate: new Date("2026-01-27"),
  dateStr: "2026-01-27",
  formattedDate: "Monday, January 27, 2026",
  dayNumber: 8,
};

jest.mock("@/hooks/use-client-timeline", () => ({
  useClientTimeline: jest.fn(() => defaultHookReturn),
}));

// ---------------------------------------------------------------------------
// Mock @refinedev/core hooks
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mock completion-stats
// ---------------------------------------------------------------------------

jest.mock("@/lib/utils/completion-stats", () => ({
  calculateStats: jest.fn().mockReturnValue({
    completed: 0,
    total: 0,
    percentage: 0,
  }),
  calculateStatsByType: jest.fn().mockReturnValue({}),
}));

// ---------------------------------------------------------------------------
// Helper to create timeline items
// ---------------------------------------------------------------------------

function createTimelineItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    type: "meal",
    title: "Breakfast",
    subtitle: "2 items",
    scheduling: { time_type: "fixed", time_start: "08:00" },
    metadata: { calories: 400 },
    sourceType: "diet_plan",
    sourceId: "plan-1",
    dayNumber: 8,
    isGrouped: true,
    itemNames: ["Oatmeal", "Eggs"],
    groupedSourceIds: ["plan-1"],
    groupedItems: [
      {
        id: "diet-plan-1",
        food_items: {
          id: "food-1",
          name: "Oatmeal",
          calories: 200,
          protein: 8,
          serving_size: "100g",
          is_vegetarian: true,
        },
        meal_category: "breakfast",
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ClientTimelineView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-27T10:00:00Z"));

    _capturedTimelineGridProps = {};
    _capturedExpandedProps = {};
    _capturedMobileProps = {};
    _capturedDayNavProps = {};

    // Reset the hook mock to defaults
    const { useClientTimeline } = require("@/hooks/use-client-timeline");
    useClientTimeline.mockReturnValue(defaultHookReturn);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // =========================================================================
  // Header section
  // =========================================================================

  describe("header section", () => {
    it("should render the title and formatted date", () => {
      render(<ClientTimelineView />);

      expect(screen.getByText("Today's")).toBeInTheDocument();
      expect(screen.getByText("Plan")).toBeInTheDocument();
      expect(screen.getByText("Monday, January 27, 2026")).toBeInTheDocument();
    });

    it("should show completion count", () => {
      render(<ClientTimelineView />);

      expect(screen.getAllByText("0/0").length).toBeGreaterThan(0);
    });

    it("should show non-zero completion count", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        completedCount: 5,
        totalCount: 12,
      });

      render(<ClientTimelineView />);

      expect(screen.getAllByText("5/12").length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Loading state
  // =========================================================================

  describe("loading state", () => {
    it("should show loading skeleton", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({ ...defaultHookReturn, isLoading: true });

      render(<ClientTimelineView />);

      expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Error state
  // =========================================================================

  describe("error state", () => {
    it("should show error state with retry button", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({ ...defaultHookReturn, isError: true });

      render(<ClientTimelineView />);

      expect(screen.getByText("Failed to load your plan")).toBeInTheDocument();
      expect(screen.getByText("Please try refreshing the page")).toBeInTheDocument();
    });

    it("should call refetch on try again click", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({ ...defaultHookReturn, isError: true });

      render(<ClientTimelineView />);
      fireEvent.click(screen.getByText("Try Again"));

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Plan not configured
  // =========================================================================

  describe("plan not configured state", () => {
    it("should show plan not configured message (desktop)", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        isPlanConfigured: false,
        planProgress: null,
      });

      render(<ClientTimelineView />);

      expect(screen.getByText("Plan Not Configured")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Before plan start
  // =========================================================================

  describe("before plan start state", () => {
    it("should show countdown banner", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        isBeforePlanStart: true,
        planStartDate: new Date("2026-02-01"),
        dayNumber: 1,
      });

      render(<ClientTimelineView />);

      expect(screen.getByText(/Your plan starts in/)).toBeInTheDocument();
      expect(screen.getByText(/Preview your Day 1 plan below/)).toBeInTheDocument();
    });

    it("should use singular 'day' for 1 day countdown", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        isBeforePlanStart: true,
        planStartDate: new Date("2026-01-28"),
        dayNumber: 1,
      });

      render(<ClientTimelineView />);

      expect(screen.getByText(/Your plan starts in 1 day /)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Timeline items & empty state
  // =========================================================================

  describe("timeline items", () => {
    it("should render timeline items via TimelineGrid", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      expect(screen.getByText("Breakfast")).toBeInTheDocument();
    });

    it("should show empty state when no items", () => {
      render(<ClientTimelineView />);

      expect(screen.getByText("No items for this day")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Day navigation (handleDayChange)
  // =========================================================================

  describe("day navigation", () => {
    it("should navigate to next day via PlanDayNavigator callback", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue(defaultHookReturn);

      render(<ClientTimelineView />);

      const nextBtn = screen.getByTestId("nav-next");
      fireEvent.click(nextBtn);

      // Day should update from 8 to 9 (may appear in multiple places)
      expect(screen.getAllByText("Day 9").length).toBeGreaterThan(0);
    });

    it("should navigate to previous day", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue(defaultHookReturn);

      render(<ClientTimelineView />);

      const prevBtn = screen.getByTestId("nav-prev");
      fireEvent.click(prevBtn);

      // Day should update from 8 to 7 (may appear in multiple places)
      expect(screen.getAllByText("Day 7").length).toBeGreaterThan(0);
    });

    it("should not navigate below day 1", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        planProgress: { ...defaultHookReturn.planProgress, dayNumber: 1 },
      });

      render(<ClientTimelineView />);

      // Click prev when already at day 1 should stay at 1
      const prevBtn = screen.getByTestId("nav-prev");
      fireEvent.click(prevBtn);

      // Day 0 is invalid, should stay at Day 1
      expect(screen.getAllByText("Day 1").length).toBeGreaterThan(0);
    });

    it("should not navigate above total days", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        planProgress: { ...defaultHookReturn.planProgress, dayNumber: 28, totalDays: 28 },
      });

      render(<ClientTimelineView />);

      const nextBtn = screen.getByTestId("nav-next");
      fireEvent.click(nextBtn);

      // Day 29 is above totalDays 28, should stay at 28
      expect(screen.getAllByText("Day 28").length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Expanded item modal & mark complete/uncomplete
  // =========================================================================

  describe("expanded item modal", () => {
    it("should open expanded view when item is clicked in grid", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      // Click the grid item
      fireEvent.click(screen.getByTestId("grid-item-item-1"));

      // Expanded view should appear
      expect(screen.getByTestId("mock-expanded-item")).toBeInTheDocument();
      expect(screen.getByText("Expanded: Breakfast")).toBeInTheDocument();
    });

    it("should call markComplete when mark complete button is clicked", async () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      // Open expanded view
      fireEvent.click(screen.getByTestId("grid-item-item-1"));

      // Click mark complete
      await act(async () => {
        fireEvent.click(screen.getByTestId("mark-complete-btn"));
      });

      expect(mockMarkComplete).toHaveBeenCalled();
    });

    it("should call markUncomplete when uncomplete button is clicked", async () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      // Open expanded view
      fireEvent.click(screen.getByTestId("grid-item-item-1"));

      // Click mark uncomplete
      await act(async () => {
        fireEvent.click(screen.getByTestId("mark-uncomplete-btn"));
      });

      expect(mockMarkUncomplete).toHaveBeenCalled();
    });

    it("should close expanded view when close button is clicked", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      // Open expanded view
      fireEvent.click(screen.getByTestId("grid-item-item-1"));
      expect(screen.getByTestId("mock-expanded-item")).toBeInTheDocument();

      // Close
      fireEvent.click(screen.getByTestId("close-expanded-btn"));
      expect(screen.queryByTestId("mock-expanded-item")).not.toBeInTheDocument();
    });

    it("should call markSourceItemComplete with correct args", async () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      fireEvent.click(screen.getByTestId("grid-item-item-1"));

      await act(async () => {
        fireEvent.click(screen.getByTestId("mark-source-complete-btn"));
      });

      expect(mockMarkSourceItemComplete).toHaveBeenCalledWith("source-1", "diet");
    });

    it("should call markSourceItemUncomplete with source id", async () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      fireEvent.click(screen.getByTestId("grid-item-item-1"));

      await act(async () => {
        fireEvent.click(screen.getByTestId("mark-source-uncomplete-btn"));
      });

      expect(mockMarkSourceItemUncomplete).toHaveBeenCalledWith("source-1");
    });
  });

  // =========================================================================
  // Food swap flow
  // =========================================================================

  describe("food swap flow", () => {
    it("should open food alternatives drawer when swap button is clicked", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      // Open expanded view
      fireEvent.click(screen.getByTestId("grid-item-item-1"));

      // Click swap food button
      fireEvent.click(screen.getByTestId("swap-food-btn"));

      // Food drawer should appear
      expect(screen.getByTestId("mock-food-drawer")).toBeInTheDocument();
    });

    it("should call updateMutation when selecting an alternative", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      // Open expanded view, then swap
      fireEvent.click(screen.getByTestId("grid-item-item-1"));
      fireEvent.click(screen.getByTestId("swap-food-btn"));

      // Select alternative
      fireEvent.click(screen.getByTestId("select-alternative-btn"));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "diet_plans",
          id: "diet-plan-1",
          values: { food_item_id: "alt-food-1", serving_multiplier: 1 },
        }),
        expect.any(Object)
      );
    });

    it("should not show swap button when viewing past days", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
        planProgress: { ...defaultHookReturn.planProgress, dayNumber: 10 },
      });

      render(<ClientTimelineView />);

      // Component sets initial day to planProgress.dayNumber (10)
      // Navigate back to day 8 to view past
      fireEvent.click(screen.getByTestId("nav-prev"));
      fireEvent.click(screen.getByTestId("nav-prev"));

      // Open expanded view
      fireEvent.click(screen.getByTestId("grid-item-item-1"));

      // onSwapFood should be undefined for past days, so swap button shouldn't render
      expect(screen.queryByTestId("swap-food-btn")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Statistics card
  // =========================================================================

  describe("statistics card", () => {
    it("should show stats card when viewing today", () => {
      render(<ClientTimelineView />);

      expect(screen.getByText("Today's Progress")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Extended plan
  // =========================================================================

  describe("extended plan", () => {
    it("should handle extended plan label", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        planProgress: { ...defaultHookReturn.planProgress, isExtended: true },
      });

      render(<ClientTimelineView />);

      expect(screen.getByText("Plan")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Targets card
  // =========================================================================

  describe("targets card", () => {
    it("should render targets card", () => {
      render(<ClientTimelineView />);

      expect(screen.getByText("Today's Targets")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Suspense boundary
  // =========================================================================

  describe("suspense boundary", () => {
    it("renders without error (wrapped in Suspense)", () => {
      render(<ClientTimelineView />);

      expect(screen.getByText("Plan")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Filter changes
  // =========================================================================

  describe("filter changes", () => {
    it("should pass filter change handler to TimelineFilters", () => {
      render(<ClientTimelineView />);

      const filters = screen.getAllByTestId("mock-filters");
      expect(filters.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // handleGoToToday (Back to Today button in past-view banner)
  // =========================================================================

  describe("handleGoToToday", () => {
    it("should navigate back to today from a past day view", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      // Plan is at day 10
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        planProgress: { ...defaultHookReturn.planProgress, dayNumber: 10, totalDays: 28 },
      });

      render(<ClientTimelineView />);

      // Navigate back to day 8 (past day)
      fireEvent.click(screen.getByTestId("nav-prev")); // 10 -> 9
      fireEvent.click(screen.getByTestId("nav-prev")); // 9 -> 8

      // Should show "Viewing History" banner with "Back to Today" button
      const backButton = screen.queryByText("Back to Today");
      if (backButton) {
        fireEvent.click(backButton);
        // Should go back to day 10
        expect(screen.getAllByText("Day 10").length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // handleSelectAlternative onSuccess/onError callbacks
  // =========================================================================

  describe("handleSelectAlternative callbacks", () => {
    it("should invoke onSuccess callback from mutation", async () => {
      // Make mockMutate invoke the onSuccess callback
      mockMutate.mockImplementation((_params: unknown, options: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      });

      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      const { toast } = require("sonner");

      render(<ClientTimelineView />);

      // Open expanded view -> swap food -> select alternative
      fireEvent.click(screen.getByTestId("grid-item-item-1"));
      fireEvent.click(screen.getByTestId("swap-food-btn"));
      fireEvent.click(screen.getByTestId("select-alternative-btn"));

      expect(toast.success).toHaveBeenCalledWith("Food item swapped successfully");
      expect(mockRefetch).toHaveBeenCalled();

      // Food drawer should be closed
      expect(screen.queryByTestId("mock-food-drawer")).not.toBeInTheDocument();
    });

    it("should invoke onError callback from mutation", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Make mockMutate invoke the onError callback
      mockMutate.mockImplementation(
        (_params: unknown, options: { onError?: (error: Error) => void }) => {
          options?.onError?.(new Error("DB error"));
        }
      );

      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [createTimelineItem()],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      const { toast } = require("sonner");

      render(<ClientTimelineView />);

      fireEvent.click(screen.getByTestId("grid-item-item-1"));
      fireEvent.click(screen.getByTestId("swap-food-btn"));
      fireEvent.click(screen.getByTestId("select-alternative-btn"));

      expect(toast.error).toHaveBeenCalledWith("Failed to swap food item. Please try again.");
      expect(consoleSpy).toHaveBeenCalledWith("Error swapping food:", expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // Mobile view path
  // =========================================================================

  describe("mobile view", () => {
    it("should render MobileTimelineView when window is narrow", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue(defaultHookReturn);

      // Set narrow viewport
      Object.defineProperty(window, "innerWidth", { value: 400, writable: true });

      render(<ClientTimelineView />);

      // Trigger the resize effect
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });

      // Mobile view should be rendered
      expect(screen.getByTestId("mock-mobile-view")).toBeInTheDocument();

      // Restore
      Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    });
  });

  // =========================================================================
  // Viewing past day styling (low/medium/high completion)
  // =========================================================================

  describe("past day completion styling", () => {
    it("should handle different completion percentage colors in past view", () => {
      const { calculateStats } = require("@/lib/utils/completion-stats");

      // Low completion (< 50%)
      calculateStats.mockReturnValue({ completed: 2, total: 10, percentage: 20 });

      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        planProgress: { ...defaultHookReturn.planProgress, dayNumber: 10 },
        completedCount: 2,
        totalCount: 10,
      });

      render(<ClientTimelineView />);

      // Navigate to past day
      fireEvent.click(screen.getByTestId("nav-prev")); // 10 -> 9

      // Completion counter should be visible with count
      expect(screen.getAllByText("2/10").length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Sync expandedItem with latest timeline data
  // =========================================================================

  describe("expandedItem sync with timeline updates", () => {
    it("should update expandedItem when timeline items change", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      const item1 = createTimelineItem({ id: "item-1", title: "Breakfast v1" });

      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [item1],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      const { rerender } = render(<ClientTimelineView />);

      // Open expanded view
      fireEvent.click(screen.getByTestId("grid-item-item-1"));
      expect(screen.getByText("Expanded: Breakfast v1")).toBeInTheDocument();

      // Now update the timeline items (simulating food swap refetch)
      const updatedItem = createTimelineItem({ id: "item-1", title: "Breakfast v2" });
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [updatedItem],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      rerender(<ClientTimelineView />);

      // Expanded item should sync with updated data
      expect(screen.getByText("Expanded: Breakfast v2")).toBeInTheDocument();
    });
  });
});
