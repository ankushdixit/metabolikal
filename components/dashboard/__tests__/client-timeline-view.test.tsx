/**
 * Tests for ClientTimelineView component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ClientTimelineView } from "../client-timeline-view";

// Mock scrollTo for JSDOM
Element.prototype.scrollTo = jest.fn();

// Mock the useClientTimeline hook
const mockMarkComplete = jest.fn();
const mockMarkUncomplete = jest.fn();
const mockRefetch = jest.fn();
const mockIsItemCompleted = jest.fn().mockReturnValue(false);

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
  markComplete: mockMarkComplete,
  markUncomplete: mockMarkUncomplete,
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

      expect(screen.getByText("0/0")).toBeInTheDocument();
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

      // New toggle-based filters instead of "All"
      expect(screen.getByText("Show:")).toBeInTheDocument();
      expect(screen.getByText("Meals")).toBeInTheDocument();
      expect(screen.getByText("Supplements")).toBeInTheDocument();
      expect(screen.getByText("Workouts")).toBeInTheDocument();
      expect(screen.getByText("Lifestyle")).toBeInTheDocument();
    });

    it("should toggle filter on click", () => {
      const { useClientTimeline } = require("@/hooks/use-client-timeline");
      useClientTimeline.mockReturnValue(defaultHookReturn);

      render(<ClientTimelineView />);

      const mealsFilter = screen.getByText("Meals");

      // Initially all filters are active
      expect(mealsFilter.closest("button")).toHaveClass("border-orange-500/50");

      // Click to toggle off
      fireEvent.click(mealsFilter);

      // Should now be inactive
      expect(mealsFilter.closest("button")).toHaveClass("bg-secondary/50");
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
