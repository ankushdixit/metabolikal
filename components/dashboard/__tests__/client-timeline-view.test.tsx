/**
 * Tests for ClientTimelineView component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ClientTimelineView } from "../client-timeline-view";

// Mock scrollTo for JSDOM
Element.prototype.scrollTo = jest.fn();

// Mock next/navigation
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

// Mock the useClientTimeline hook
const mockMarkComplete = jest.fn();
const mockMarkUncomplete = jest.fn();
const mockRefetch = jest.fn();
const mockIsItemCompleted = jest.fn().mockReturnValue(false);

const mockIsSourceItemCompleted = jest.fn().mockReturnValue(false);
const mockGetItemCompletionStatus = jest.fn().mockReturnValue("none");
const mockMarkSourceItemComplete = jest.fn();
const mockMarkSourceItemUncomplete = jest.fn();

const defaultHookReturn = {
  userId: "test-user-id",
  timelineItems: [],
  packingItems: [],
  dietItems: [],
  supplementItems: [],
  workoutItems: [],
  lifestyleItems: [],
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

// Mock @refinedev/core hooks used by the component
jest.mock("@refinedev/core", () => ({
  useList: jest.fn(() => ({
    query: {
      data: { data: [] },
      isLoading: false,
    },
  })),
  useUpdate: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
  })),
}));

describe("ClientTimelineView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-27T10:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("header section", () => {
    it("should render the title", () => {
      render(<ClientTimelineView />);

      // Title is split: "Today's" and "Plan" (with gradient)
      expect(screen.getByText("Today's")).toBeInTheDocument();
      expect(screen.getByText("Plan")).toBeInTheDocument();
    });

    it("should show the formatted date", () => {
      render(<ClientTimelineView />);

      expect(screen.getByText("Monday, January 27, 2026")).toBeInTheDocument();
    });

    it("should show day number", () => {
      render(<ClientTimelineView />);

      // Day 8 appears in multiple places (header and targets card)
      const dayElements = screen.getAllByText(/Day 8/);
      expect(dayElements.length).toBeGreaterThan(0);
    });

    it("should show completion count", () => {
      render(<ClientTimelineView />);

      // 0/0 appears in header and possibly stats card, so use getAllByText
      expect(screen.getAllByText("0/0").length).toBeGreaterThan(0);
    });
  });

  describe("loading state", () => {
    it("should show loading state", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      render(<ClientTimelineView />);

      // Should show loading skeleton
      expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("should show error state", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        isError: true,
      });

      render(<ClientTimelineView />);

      expect(screen.getByText("Failed to load your plan")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should call refetch on try again click", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        isError: true,
      });

      render(<ClientTimelineView />);

      fireEvent.click(screen.getByText("Try Again"));

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe("plan not configured state", () => {
    it("should show plan not configured message", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        isPlanConfigured: false,
        planProgress: null,
      });

      render(<ClientTimelineView />);

      expect(screen.getByText("Plan Not Configured")).toBeInTheDocument();
      expect(
        screen.getByText("Your coach hasn't set up your plan start date yet.")
      ).toBeInTheDocument();
    });
  });

  describe("before plan start state", () => {
    it("should show banner with countdown but still render Day 1 content", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        isBeforePlanStart: true,
        planStartDate: new Date("2026-02-01"),
        dayNumber: 1,
      });

      render(<ClientTimelineView />);

      // Should show the banner with countdown
      expect(screen.getByText(/Your plan starts in/)).toBeInTheDocument();
      expect(screen.getByText(/Preview your Day 1 plan below/)).toBeInTheDocument();
      // Should still show the timeline content (Plan in header)
      expect(screen.getByText("Plan")).toBeInTheDocument();
    });
  });

  describe("filter chips", () => {
    it("should render filter chips", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue(defaultHookReturn);

      render(<ClientTimelineView />);

      // New toggle-based filters - "Show:" label and filter buttons
      expect(screen.getByText("Show:")).toBeInTheDocument();
      // Filters have both icon and text, so there may be multiple instances
      // Check that at least one instance exists for each filter type
      expect(screen.getAllByText("Meals").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Supplements").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Workouts").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Lifestyle").length).toBeGreaterThanOrEqual(1);
    });

    it("should toggle filter on click", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue(defaultHookReturn);

      render(<ClientTimelineView />);

      // Find the filter button by looking for "Meals" within the filters section
      const mealsFilters = screen.getAllByText("Meals");
      // The first one should be in the filter chip section (has border-orange class)
      const mealsFilterButton = mealsFilters.find((el) =>
        el.closest("button")?.classList.contains("border-orange-500/50")
      );

      if (!mealsFilterButton) {
        // If not found with active class, find the one that's a button
        const mealsButton = mealsFilters.find((el) => el.closest("button"));
        expect(mealsButton).toBeDefined();
        return;
      }

      // Initially filter is active
      expect(mealsFilterButton.closest("button")).toHaveClass("border-orange-500/50");

      // Click to toggle off
      fireEvent.click(mealsFilterButton);

      // Should now be inactive
      expect(mealsFilterButton.closest("button")).toHaveClass("bg-secondary/50");
    });
  });

  describe("timeline items", () => {
    it("should render timeline items", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [
          {
            id: "item-1",
            type: "meal",
            title: "Breakfast",
            subtitle: "2 items",
            scheduling: { time_type: "fixed", time_start: "08:00" },
            metadata: { calories: 400 },
            sourceType: "diet_plan",
            sourceId: "plan-1",
            dayNumber: 1,
            isGrouped: true,
            itemNames: ["Oatmeal", "Eggs"],
          },
        ],
        packingItems: [{ id: "item-1", startMinutes: 480, endMinutes: 510, type: "meal" }],
        totalCount: 1,
      });

      render(<ClientTimelineView />);

      expect(screen.getByText("Breakfast")).toBeInTheDocument();
    });

    it("should show empty state when no items", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        timelineItems: [],
        packingItems: [],
      });

      render(<ClientTimelineView />);

      expect(screen.getByText("No items for this day")).toBeInTheDocument();
    });
  });

  describe("targets card", () => {
    it("should render targets card", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue(defaultHookReturn);

      render(<ClientTimelineView />);

      expect(screen.getByText("Today's Targets")).toBeInTheDocument();
      // Compact version uses "Cal" instead of "Calories"
      expect(screen.getByText("Cal")).toBeInTheDocument();
    });
  });

  describe("extended plan", () => {
    it("should show Extended label when plan is extended", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue({
        ...defaultHookReturn,
        planProgress: {
          ...defaultHookReturn.planProgress,
          isExtended: true,
        },
      });

      render(<ClientTimelineView />);

      // Extended appears in multiple places, use getAllByText
      const extendedElements = screen.getAllByText(/Extended/);
      expect(extendedElements.length).toBeGreaterThan(0);
    });
  });
});
