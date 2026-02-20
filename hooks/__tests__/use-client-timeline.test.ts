/**
 * Tests for useClientTimeline hook
 *
 * Covers:
 * - Basic initialization and loading states
 * - Plan progress calculation (active, extended, before start, no start date)
 * - Day number calculation (default, override, selectedDate, cycle wrapping)
 * - Macro targets from limits
 * - Consumed totals from completed diet items
 * - Completion tracking (isItemCompleted, isSourceItemCompleted, getItemCompletionStatus)
 * - Mutation functions (markComplete, markUncomplete, markSourceItemComplete, markSourceItemUncomplete)
 * - Refetch / invalidation
 * - Error states
 * - isBeforePlanStart edge cases
 * - Date info output (dateStr, formattedDate)
 */

import { renderHook, act } from "@testing-library/react";
import { useClientTimeline } from "../use-client-timeline";
import type { ExtendedTimelineItem } from "../use-timeline-data";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockInvalidate = jest.fn();
const mockCreateCompletion = jest.fn().mockResolvedValue({});
const mockDeleteCompletion = jest.fn().mockResolvedValue({});

let mockUserId: string | null = "test-user-id";

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    userId: mockUserId,
    isLoading: false,
    profile: null,
    signOut: jest.fn(),
  }),
}));

const mockUseOne = jest.fn();
const mockUseList = jest.fn();

jest.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useList: (...args: unknown[]) => mockUseList(...args),
  useCreate: jest.fn(() => ({
    mutateAsync: mockCreateCompletion,
  })),
  useDelete: jest.fn(() => ({
    mutateAsync: mockDeleteCompletion,
  })),
  useInvalidate: jest.fn(() => mockInvalidate),
}));

const mockRefetchAll = jest.fn();
const mockUseTimelineData = jest.fn();

jest.mock("../use-timeline-data", () => ({
  useTimelineData: (...args: unknown[]) => mockUseTimelineData(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default profile query result */
function profileQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    query: {
      isLoading: false,
      isFetched: true,
      isError: false,
      data: {
        data: {
          id: "test-user-id",
          full_name: "Test User",
          plan_start_date: "2026-01-20",
          plan_duration_days: 28,
          current_plan_cycle: 1,
          created_at: "2026-01-01T00:00:00Z",
          ...overrides,
        },
      },
    },
  };
}

/** Default useList query result */
function listQueryResult(data: unknown[] = [], overrides: Record<string, unknown> = {}) {
  return {
    query: {
      isLoading: false,
      isFetched: true,
      isError: false,
      data: { data },
      ...overrides,
    },
  };
}

/** Default timeline data return */
function timelineDataResult(overrides: Record<string, unknown> = {}) {
  return {
    timelineItems: [],
    packingItems: [],
    dietItems: [],
    supplementItems: [],
    workoutItems: [],
    lifestyleItems: [],
    isLoading: false,
    isError: false,
    refetchAll: mockRefetchAll,
    rawDietPlans: [],
    rawSupplementPlans: [],
    rawWorkoutPlans: [],
    rawLifestyleActivityPlans: [],
    planConfig: { startDate: null, durationDays: 7 },
    clientConditions: [],
    ...overrides,
  };
}

/** Set up the default mock implementations */
function setupDefaultMocks(
  opts: {
    profileOverrides?: Record<string, unknown>;
    limitsData?: unknown[];
    completionsData?: unknown[];
    timelineOverrides?: Record<string, unknown>;
  } = {}
) {
  mockUseOne.mockReturnValue(profileQueryResult(opts.profileOverrides));

  mockUseList.mockImplementation((config: { resource: string }) => {
    if (config.resource === "client_plan_limits") {
      return listQueryResult(opts.limitsData ?? []);
    }
    if (config.resource === "plan_completions") {
      return listQueryResult(opts.completionsData ?? []);
    }
    return listQueryResult([]);
  });

  mockUseTimelineData.mockReturnValue(timelineDataResult(opts.timelineOverrides));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useClientTimeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-27T10:00:00Z"));
    mockUserId = "test-user-id";
    setupDefaultMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // =========================================================================
  // Basic functionality
  // =========================================================================

  describe("basic functionality", () => {
    it("should return userId from auth context", () => {
      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.userId).toBe("test-user-id");
    });

    it("should provide empty timeline items by default", () => {
      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.timelineItems).toEqual([]);
      expect(result.current.dietItems).toEqual([]);
      expect(result.current.supplementItems).toEqual([]);
      expect(result.current.workoutItems).toEqual([]);
      expect(result.current.lifestyleItems).toEqual([]);
      expect(result.current.packingItems).toEqual([]);
    });

    it("should provide date info for today", () => {
      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.dateStr).toBe("2026-01-27");
      expect(result.current.formattedDate).toContain("January");
      expect(result.current.formattedDate).toContain("27");
      expect(result.current.formattedDate).toContain("2026");
    });

    it("should provide selectedDate matching the current date", () => {
      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.selectedDate.toISOString().split("T")[0]).toBe("2026-01-27");
    });

    it("should pass correct options to useTimelineData", () => {
      renderHook(() => useClientTimeline());
      expect(mockUseTimelineData).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: "test-user-id",
          enabled: true,
        })
      );
    });
  });

  // =========================================================================
  // Loading states
  // =========================================================================

  describe("loading states", () => {
    it("should be loading when userId is null", () => {
      mockUserId = null;
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isLoading).toBe(true);
    });

    it("should be loading when profile has not been fetched yet", () => {
      mockUseOne.mockReturnValue({
        query: { isLoading: false, isFetched: false, isError: false, data: null },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isLoading).toBe(true);
    });

    it("should be loading when profile query is loading", () => {
      mockUseOne.mockReturnValue({
        query: { isLoading: true, isFetched: false, isError: false, data: null },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isLoading).toBe(true);
    });

    it("should be loading when timeline data is loading", () => {
      setupDefaultMocks({ timelineOverrides: { isLoading: true } });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isLoading).toBe(true);
    });

    it("should be loading when limits query is loading", () => {
      mockUseList.mockImplementation((config: { resource: string }) => {
        if (config.resource === "client_plan_limits") {
          return listQueryResult([], { isLoading: true });
        }
        return listQueryResult([]);
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isLoading).toBe(true);
    });

    it("should be loading when completions query is loading", () => {
      mockUseList.mockImplementation((config: { resource: string }) => {
        if (config.resource === "plan_completions") {
          return listQueryResult([], { isLoading: true });
        }
        return listQueryResult([]);
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isLoading).toBe(true);
    });

    it("should not be loading when all queries are loaded", () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isLoading).toBe(false);
    });
  });

  // =========================================================================
  // Error states
  // =========================================================================

  describe("error states", () => {
    it("should be in error when profile query has error", () => {
      mockUseOne.mockReturnValue({
        query: { isLoading: false, isFetched: true, isError: true, data: null },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isError).toBe(true);
    });

    it("should be in error when timeline data has error", () => {
      setupDefaultMocks({ timelineOverrides: { isError: true } });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isError).toBe(true);
    });

    it("should be in error when limits query has error", () => {
      mockUseList.mockImplementation((config: { resource: string }) => {
        if (config.resource === "client_plan_limits") {
          return listQueryResult([], { isError: true });
        }
        return listQueryResult([]);
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isError).toBe(true);
    });

    it("should be in error when completions query has error", () => {
      mockUseList.mockImplementation((config: { resource: string }) => {
        if (config.resource === "plan_completions") {
          return listQueryResult([], { isError: true });
        }
        return listQueryResult([]);
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isError).toBe(true);
    });

    it("should not be in error when all queries succeed", () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isError).toBe(false);
    });
  });

  // =========================================================================
  // Plan progress calculation
  // =========================================================================

  describe("plan progress calculation", () => {
    it("should return null planProgress when no start date and no created_at", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: null,
          created_at: null,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.planProgress).toBeNull();
      expect(result.current.isPlanConfigured).toBe(false);
    });

    it("should fall back to created_at when plan_start_date is null", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: null,
          plan_duration_days: 90,
          created_at: "2026-01-20T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      // parsePlanDate("2026-01-20") -> Date for Jan 20
      expect(result.current.planProgress).not.toBeNull();
      expect(result.current.planProgress?.dayNumber).toBe(8); // Jan 27 - Jan 20 + 1
      expect(result.current.isPlanConfigured).toBe(true);
    });

    it("should calculate plan progress correctly for active plan", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-20",
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline());

      expect(result.current.planProgress).not.toBeNull();
      expect(result.current.planProgress?.dayNumber).toBe(8); // Jan 27 - Jan 20 + 1 = 8
      expect(result.current.planProgress?.totalDays).toBe(28);
      expect(result.current.planProgress?.isExtended).toBe(false);
      expect(result.current.planProgress?.weekNumber).toBe(2); // ceil(8/7) = 2
      expect(result.current.planProgress?.daysRemaining).toBe(21); // 28 - 8 + 1 = 21
      expect(result.current.isPlanConfigured).toBe(true);
    });

    it("should detect extended plan", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-01",
          plan_duration_days: 7,
        },
      });

      const { result } = renderHook(() => useClientTimeline());

      // Day 27 of a 7-day plan = extended
      expect(result.current.planProgress?.isExtended).toBe(true);
      expect(result.current.planProgress?.daysRemaining).toBe(0);
    });

    it("should clamp progress percent to 0-100", () => {
      // Extended plan - should cap at 100%
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-01",
          plan_duration_days: 7,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.planProgress?.progressPercent).toBeLessThanOrEqual(100);
      expect(result.current.planProgress?.progressPercent).toBeGreaterThanOrEqual(0);
    });

    it("should use default duration of 7 when plan_duration_days is null", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-25",
          plan_duration_days: null,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.planProgress?.totalDays).toBe(7);
    });

    it("should default current_plan_cycle to 1 when null", () => {
      setupDefaultMocks({
        profileOverrides: { current_plan_cycle: null },
      });

      // Verify it doesn't crash and completions filter works
      const { result } = renderHook(() => useClientTimeline());
      expect(result.current).toBeDefined();
    });
  });

  // =========================================================================
  // Day number calculation
  // =========================================================================

  describe("day number calculation", () => {
    it("should calculate day number from plan start date for today", () => {
      // Plan started Jan 20, today is Jan 27 => getTodaysDayNumber returns 8
      // Then ((8 - 1) % 28) + 1 = 8
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-20",
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.dayNumber).toBe(8);
    });

    it("should use dayNumberOverride when provided", () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline({ dayNumberOverride: 5 }));
      expect(result.current.dayNumber).toBe(5);
    });

    it("should calculate date from dayNumberOverride based on plan start", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-20",
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline({ dayNumberOverride: 3 }));
      // Day 3 from Jan 20 = Jan 22
      expect(result.current.dateStr).toBe("2026-01-22");
    });

    it("should calculate day number for selectedDate", () => {
      const selectedDate = new Date("2026-01-25T10:00:00Z");
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-20",
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline({ selectedDate }));
      // Jan 25 - Jan 20 + 1 = 6
      expect(result.current.dayNumber).toBe(6);
    });

    it("should default to day 1 when profile has no start date", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: null,
          created_at: null,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.dayNumber).toBe(1);
    });

    it("should default to day 1 when plan has not started yet (before plan start)", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-02-01", // Future date
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      // getTodaysDayNumber returns null for future start date, so should default to 1
      expect(result.current.dayNumber).toBe(1);
    });

    it("should cycle through plan duration when extended", () => {
      // Plan started Jan 1, duration 7, today Jan 27
      // getTodaysDayNumber = 27
      // ((27 - 1) % 7) + 1 = (26 % 7) + 1 = 5 + 1 = 6
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-01",
          plan_duration_days: 7,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.dayNumber).toBe(6);
    });

    it("should use selectedDate when provided instead of today", () => {
      const selectedDate = new Date("2026-01-23T00:00:00Z");
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-20",
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline({ selectedDate }));
      expect(result.current.selectedDate).toEqual(selectedDate);
      expect(result.current.dateStr).toBe("2026-01-23");
    });
  });

  // =========================================================================
  // isBeforePlanStart edge cases
  // =========================================================================

  describe("isBeforePlanStart", () => {
    it("should be true when plan starts in the future and no overrides", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-02-01",
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isBeforePlanStart).toBe(true);
      expect(result.current.isPlanConfigured).toBe(true);
    });

    it("should be false when plan starts in the past", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-01",
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isBeforePlanStart).toBe(false);
    });

    it("should be false when dayNumberOverride is provided (even with future start)", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-02-01",
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline({ dayNumberOverride: 3 }));
      expect(result.current.isBeforePlanStart).toBe(false);
    });

    it("should be false when selectedDate is provided (even with future start)", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-02-01",
          plan_duration_days: 28,
        },
      });

      const selectedDate = new Date("2026-01-25T10:00:00Z");
      const { result } = renderHook(() => useClientTimeline({ selectedDate }));
      expect(result.current.isBeforePlanStart).toBe(false);
    });

    it("should be false when plan start date is not set", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: null,
          created_at: null,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isBeforePlanStart).toBe(false);
    });
  });

  // =========================================================================
  // Day label
  // =========================================================================

  describe("day label", () => {
    it("should format day label with date when plan is configured", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: "2026-01-20",
          plan_duration_days: 28,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      // Day 8 from Jan 20 = Jan 27
      expect(result.current.dayLabel).toContain("Day 8");
      expect(result.current.dayLabel).toContain("Jan");
      expect(result.current.dayLabel).toContain("27");
    });

    it("should format simple day label when no plan start date", () => {
      setupDefaultMocks({
        profileOverrides: {
          plan_start_date: null,
          created_at: null,
        },
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.dayLabel).toBe("Day 1");
    });
  });

  // =========================================================================
  // Macro targets
  // =========================================================================

  describe("macro targets", () => {
    it("should return empty targets when no limits configured", () => {
      setupDefaultMocks({ limitsData: [] });

      const { result } = renderHook(() => useClientTimeline());

      expect(result.current.targets.hasLimits).toBe(false);
      expect(result.current.targets.calories).toBeNull();
      expect(result.current.targets.proteinMin).toBeNull();
      expect(result.current.targets.proteinMax).toBeNull();
      expect(result.current.targets.carbsMin).toBeNull();
      expect(result.current.targets.carbsMax).toBeNull();
      expect(result.current.targets.fatsMin).toBeNull();
      expect(result.current.targets.fatsMax).toBeNull();
    });

    it("should return targets when limits are configured", () => {
      setupDefaultMocks({
        limitsData: [
          {
            id: "limit-1",
            max_calories_per_day: 2000,
            min_protein_per_day: 120,
            max_protein_per_day: 150,
            min_carbs_per_day: 200,
            max_carbs_per_day: 250,
            min_fats_per_day: 60,
            max_fats_per_day: 80,
          },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      expect(result.current.targets.hasLimits).toBe(true);
      expect(result.current.targets.calories).toBe(2000);
      expect(result.current.targets.proteinMin).toBe(120);
      expect(result.current.targets.proteinMax).toBe(150);
      expect(result.current.targets.carbsMin).toBe(200);
      expect(result.current.targets.carbsMax).toBe(250);
      expect(result.current.targets.fatsMin).toBe(60);
      expect(result.current.targets.fatsMax).toBe(80);
    });
  });

  // =========================================================================
  // Completions
  // =========================================================================

  describe("completion tracking", () => {
    it("should track completions", () => {
      setupDefaultMocks({
        completionsData: [
          {
            id: "completion-1",
            plan_type: "diet",
            plan_item_id: "meal-item-1",
            completed_date: "2026-01-27",
            plan_cycle: 1,
          },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      expect(result.current.completions).toHaveLength(1);
      expect(result.current.completions[0].plan_item_id).toBe("meal-item-1");
    });

    it("should return empty completions when none exist", () => {
      setupDefaultMocks({ completionsData: [] });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.completions).toHaveLength(0);
    });

    it("should provide completedCount and totalCount", () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.completedCount).toBe(0);
      expect(result.current.totalCount).toBe(0);
    });
  });

  // =========================================================================
  // isSourceItemCompleted
  // =========================================================================

  describe("isSourceItemCompleted", () => {
    it("should return true when source item has completion", () => {
      setupDefaultMocks({
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isSourceItemCompleted("source-1")).toBe(true);
    });

    it("should return false when source item has no completion", () => {
      setupDefaultMocks({ completionsData: [] });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isSourceItemCompleted("source-1")).toBe(false);
    });
  });

  // =========================================================================
  // isItemCompleted
  // =========================================================================

  describe("isItemCompleted", () => {
    it("should return false when item is not found in timeline", () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isItemCompleted("non-existent-id")).toBe(false);
    });

    it("should return true for non-grouped item when source is completed", () => {
      setupDefaultMocks({
        timelineOverrides: {
          timelineItems: [
            { id: "item-1", sourceId: "source-1", type: "meal" } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isItemCompleted("item-1")).toBe(true);
    });

    it("should return false for non-grouped item when source is not completed", () => {
      setupDefaultMocks({
        timelineOverrides: {
          timelineItems: [
            { id: "item-1", sourceId: "source-1", type: "meal" } as ExtendedTimelineItem,
          ],
        },
        completionsData: [],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isItemCompleted("item-1")).toBe(false);
    });

    it("should return true for grouped item when ALL source items are completed", () => {
      setupDefaultMocks({
        timelineOverrides: {
          timelineItems: [
            {
              id: "group-1",
              sourceId: "source-1",
              groupedSourceIds: ["source-1", "source-2"],
              type: "meal",
              isGrouped: true,
            } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
          { id: "c2", plan_type: "diet", plan_item_id: "source-2", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isItemCompleted("group-1")).toBe(true);
    });

    it("should return false for grouped item when only some source items are completed", () => {
      setupDefaultMocks({
        timelineOverrides: {
          timelineItems: [
            {
              id: "group-1",
              sourceId: "source-1",
              groupedSourceIds: ["source-1", "source-2"],
              type: "meal",
              isGrouped: true,
            } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.isItemCompleted("group-1")).toBe(false);
    });
  });

  // =========================================================================
  // getItemCompletionStatus
  // =========================================================================

  describe("getItemCompletionStatus", () => {
    it("should return zeros when item not found", () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.getItemCompletionStatus("non-existent")).toEqual({
        completed: 0,
        total: 0,
      });
    });

    it("should return 0/1 for non-grouped incomplete item", () => {
      setupDefaultMocks({
        timelineOverrides: {
          timelineItems: [
            { id: "item-1", sourceId: "source-1", type: "meal" } as ExtendedTimelineItem,
          ],
        },
        completionsData: [],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.getItemCompletionStatus("item-1")).toEqual({
        completed: 0,
        total: 1,
      });
    });

    it("should return 1/1 for non-grouped completed item", () => {
      setupDefaultMocks({
        timelineOverrides: {
          timelineItems: [
            { id: "item-1", sourceId: "source-1", type: "meal" } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.getItemCompletionStatus("item-1")).toEqual({
        completed: 1,
        total: 1,
      });
    });

    it("should return partial status for grouped item", () => {
      setupDefaultMocks({
        timelineOverrides: {
          timelineItems: [
            {
              id: "group-1",
              sourceId: "source-1",
              groupedSourceIds: ["source-1", "source-2", "source-3"],
              type: "meal",
              isGrouped: true,
            } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
          { id: "c2", plan_type: "diet", plan_item_id: "source-3", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.getItemCompletionStatus("group-1")).toEqual({
        completed: 2,
        total: 3,
      });
    });
  });

  // =========================================================================
  // completedCount
  // =========================================================================

  describe("completedCount", () => {
    it("should count completed items correctly", () => {
      setupDefaultMocks({
        timelineOverrides: {
          timelineItems: [
            { id: "item-1", sourceId: "source-1", type: "meal" } as ExtendedTimelineItem,
            { id: "item-2", sourceId: "source-2", type: "supplement" } as ExtendedTimelineItem,
            { id: "item-3", sourceId: "source-3", type: "workout" } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
          {
            id: "c2",
            plan_type: "supplement",
            plan_item_id: "source-2",
            completed_date: "2026-01-27",
          },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.completedCount).toBe(2);
      expect(result.current.totalCount).toBe(3);
    });
  });

  // =========================================================================
  // Consumed totals
  // =========================================================================

  describe("consumed totals", () => {
    it("should calculate consumed totals from completed diet items", () => {
      setupDefaultMocks({
        timelineOverrides: {
          dietItems: [
            {
              id: "d1",
              sourceId: "source-1",
              type: "meal",
              metadata: { calories: 300, protein: 25 },
            } as ExtendedTimelineItem,
            {
              id: "d2",
              sourceId: "source-2",
              type: "meal",
              metadata: { calories: 500, protein: 40 },
            } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.consumed.calories).toBe(300);
      expect(result.current.consumed.protein).toBe(25);
    });

    it("should return zero consumed when no items completed", () => {
      setupDefaultMocks({
        timelineOverrides: {
          dietItems: [
            {
              id: "d1",
              sourceId: "source-1",
              type: "meal",
              metadata: { calories: 300, protein: 25 },
            } as ExtendedTimelineItem,
          ],
        },
        completionsData: [],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.consumed.calories).toBe(0);
      expect(result.current.consumed.protein).toBe(0);
      expect(result.current.consumed.carbs).toBe(0);
      expect(result.current.consumed.fats).toBe(0);
    });

    it("should handle grouped diet items with groupedSourceIds", () => {
      setupDefaultMocks({
        timelineOverrides: {
          dietItems: [
            {
              id: "group-d1",
              sourceId: "source-1",
              groupedSourceIds: ["source-1", "source-2"],
              type: "meal",
              metadata: { calories: 800, protein: 60 },
              isGrouped: true,
            } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      // Grouped item is considered completed if ANY grouped source ID is completed
      expect(result.current.consumed.calories).toBe(800);
      expect(result.current.consumed.protein).toBe(60);
    });

    it("should ignore non-diet completions for consumed totals", () => {
      setupDefaultMocks({
        timelineOverrides: {
          dietItems: [
            {
              id: "d1",
              sourceId: "source-1",
              type: "meal",
              metadata: { calories: 300, protein: 25 },
            } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          {
            id: "c1",
            plan_type: "supplement",
            plan_item_id: "source-1",
            completed_date: "2026-01-27",
          },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      // source-1 is completed as a supplement, not as diet, so consumed should be 0
      expect(result.current.consumed.calories).toBe(0);
    });

    it("should handle diet items with missing metadata", () => {
      setupDefaultMocks({
        timelineOverrides: {
          dietItems: [
            {
              id: "d1",
              sourceId: "source-1",
              type: "meal",
              metadata: {},
            } as ExtendedTimelineItem,
          ],
        },
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());
      expect(result.current.consumed.calories).toBe(0);
      expect(result.current.consumed.protein).toBe(0);
    });
  });

  // =========================================================================
  // markComplete
  // =========================================================================

  describe("markComplete", () => {
    it("should create completion for a non-grouped meal item", async () => {
      setupDefaultMocks({ completionsData: [] });

      const { result } = renderHook(() => useClientTimeline());

      const item = {
        id: "item-1",
        sourceId: "source-1",
        type: "meal",
      } as ExtendedTimelineItem;

      await act(async () => {
        await result.current.markComplete(item);
      });

      expect(mockCreateCompletion).toHaveBeenCalledWith({
        resource: "plan_completions",
        values: expect.objectContaining({
          client_id: "test-user-id",
          plan_type: "diet",
          plan_item_id: "source-1",
          completed_date: "2026-01-27",
          plan_cycle: 1,
        }),
      });

      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "plan_completions",
        invalidates: ["list"],
      });
    });

    it("should create completions for all source IDs in grouped item", async () => {
      setupDefaultMocks({ completionsData: [] });

      const { result } = renderHook(() => useClientTimeline());

      const item = {
        id: "group-1",
        sourceId: "source-1",
        type: "meal",
        groupedSourceIds: ["source-1", "source-2"],
        isGrouped: true,
      } as ExtendedTimelineItem;

      await act(async () => {
        await result.current.markComplete(item);
      });

      expect(mockCreateCompletion).toHaveBeenCalledTimes(2);
      expect(mockCreateCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({ plan_item_id: "source-1" }),
        })
      );
      expect(mockCreateCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({ plan_item_id: "source-2" }),
        })
      );
    });

    it("should skip already completed items in grouped item", async () => {
      setupDefaultMocks({
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      const item = {
        id: "group-1",
        sourceId: "source-1",
        type: "meal",
        groupedSourceIds: ["source-1", "source-2"],
        isGrouped: true,
      } as ExtendedTimelineItem;

      await act(async () => {
        await result.current.markComplete(item);
      });

      // Should only create for source-2 since source-1 is already completed
      expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
      expect(mockCreateCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({ plan_item_id: "source-2" }),
        })
      );
    });

    it("should map item types to correct plan types", async () => {
      setupDefaultMocks({ completionsData: [] });

      const typeMap = [
        { type: "meal", planType: "diet" },
        { type: "supplement", planType: "supplement" },
        { type: "workout", planType: "workout" },
        { type: "lifestyle", planType: "lifestyle" },
      ];

      for (const { type, planType } of typeMap) {
        mockCreateCompletion.mockClear();
        mockInvalidate.mockClear();

        const { result } = renderHook(() => useClientTimeline());

        const item = {
          id: `item-${type}`,
          sourceId: `source-${type}`,
          type,
        } as ExtendedTimelineItem;

        await act(async () => {
          await result.current.markComplete(item);
        });

        expect(mockCreateCompletion).toHaveBeenCalledWith(
          expect.objectContaining({
            values: expect.objectContaining({ plan_type: planType }),
          })
        );
      }
    });

    it("should not create completion for unknown item type", async () => {
      setupDefaultMocks({ completionsData: [] });

      const { result } = renderHook(() => useClientTimeline());

      const item = {
        id: "item-1",
        sourceId: "source-1",
        type: "unknown_type",
      } as unknown as ExtendedTimelineItem;

      await act(async () => {
        await result.current.markComplete(item);
      });

      expect(mockCreateCompletion).not.toHaveBeenCalled();
    });

    it("should not create completion when userId is null", async () => {
      mockUserId = null;
      setupDefaultMocks({ completionsData: [] });

      const { result } = renderHook(() => useClientTimeline());

      const item = {
        id: "item-1",
        sourceId: "source-1",
        type: "meal",
      } as ExtendedTimelineItem;

      await act(async () => {
        await result.current.markComplete(item);
      });

      expect(mockCreateCompletion).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // markUncomplete
  // =========================================================================

  describe("markUncomplete", () => {
    it("should delete completion for a non-grouped item", async () => {
      setupDefaultMocks({
        completionsData: [
          {
            id: "c1",
            plan_type: "diet",
            plan_item_id: "source-1",
            completed_date: "2026-01-27",
          },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      const item = {
        id: "item-1",
        sourceId: "source-1",
        type: "meal",
      } as ExtendedTimelineItem;

      await act(async () => {
        await result.current.markUncomplete(item);
      });

      expect(mockDeleteCompletion).toHaveBeenCalledWith({
        resource: "plan_completions",
        id: "c1",
      });

      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "plan_completions",
        invalidates: ["list"],
      });
    });

    it("should delete all completions for grouped item", async () => {
      setupDefaultMocks({
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
          { id: "c2", plan_type: "diet", plan_item_id: "source-2", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      const item = {
        id: "group-1",
        sourceId: "source-1",
        groupedSourceIds: ["source-1", "source-2"],
        type: "meal",
        isGrouped: true,
      } as ExtendedTimelineItem;

      await act(async () => {
        await result.current.markUncomplete(item);
      });

      expect(mockDeleteCompletion).toHaveBeenCalledTimes(2);
    });

    it("should skip source items without completions in grouped item", async () => {
      setupDefaultMocks({
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      const item = {
        id: "group-1",
        sourceId: "source-1",
        groupedSourceIds: ["source-1", "source-2"],
        type: "meal",
        isGrouped: true,
      } as ExtendedTimelineItem;

      await act(async () => {
        await result.current.markUncomplete(item);
      });

      // Only source-1 has a completion
      expect(mockDeleteCompletion).toHaveBeenCalledTimes(1);
    });

    it("should not delete when userId is null", async () => {
      mockUserId = null;
      setupDefaultMocks({
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      const item = {
        id: "item-1",
        sourceId: "source-1",
        type: "meal",
      } as ExtendedTimelineItem;

      await act(async () => {
        await result.current.markUncomplete(item);
      });

      expect(mockDeleteCompletion).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // markSourceItemComplete
  // =========================================================================

  describe("markSourceItemComplete", () => {
    it("should create completion for a specific source item", async () => {
      setupDefaultMocks({ completionsData: [] });

      const { result } = renderHook(() => useClientTimeline());

      await act(async () => {
        await result.current.markSourceItemComplete("source-1", "diet");
      });

      expect(mockCreateCompletion).toHaveBeenCalledWith({
        resource: "plan_completions",
        values: expect.objectContaining({
          client_id: "test-user-id",
          plan_type: "diet",
          plan_item_id: "source-1",
          completed_date: "2026-01-27",
          plan_cycle: 1,
        }),
      });
    });

    it("should skip if source item is already completed", async () => {
      setupDefaultMocks({
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      await act(async () => {
        await result.current.markSourceItemComplete("source-1", "diet");
      });

      expect(mockCreateCompletion).not.toHaveBeenCalled();
    });

    it("should not create when userId is null", async () => {
      mockUserId = null;
      setupDefaultMocks({ completionsData: [] });

      const { result } = renderHook(() => useClientTimeline());

      await act(async () => {
        await result.current.markSourceItemComplete("source-1", "diet");
      });

      expect(mockCreateCompletion).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // markSourceItemUncomplete
  // =========================================================================

  describe("markSourceItemUncomplete", () => {
    it("should delete completion for a specific source item", async () => {
      setupDefaultMocks({
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      await act(async () => {
        await result.current.markSourceItemUncomplete("source-1");
      });

      expect(mockDeleteCompletion).toHaveBeenCalledWith({
        resource: "plan_completions",
        id: "c1",
      });
    });

    it("should not delete if source item has no completion", async () => {
      setupDefaultMocks({ completionsData: [] });

      const { result } = renderHook(() => useClientTimeline());

      await act(async () => {
        await result.current.markSourceItemUncomplete("source-1");
      });

      expect(mockDeleteCompletion).not.toHaveBeenCalled();
      // Also should not invalidate since no deletion occurred
      expect(mockInvalidate).not.toHaveBeenCalled();
    });

    it("should not delete when userId is null", async () => {
      mockUserId = null;
      setupDefaultMocks({
        completionsData: [
          { id: "c1", plan_type: "diet", plan_item_id: "source-1", completed_date: "2026-01-27" },
        ],
      });

      const { result } = renderHook(() => useClientTimeline());

      await act(async () => {
        await result.current.markSourceItemUncomplete("source-1");
      });

      expect(mockDeleteCompletion).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Refetch
  // =========================================================================

  describe("refetch", () => {
    it("should call refetchAll and invalidate queries", () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline());

      act(() => {
        result.current.refetch();
      });

      expect(mockRefetchAll).toHaveBeenCalled();
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "client_plan_limits",
        invalidates: ["list"],
      });
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "plan_completions",
        invalidates: ["list"],
      });
    });
  });

  // =========================================================================
  // Date with selectedDate
  // =========================================================================

  describe("selectedDate option", () => {
    it("should use selectedDate for date info output", () => {
      const selectedDate = new Date("2026-02-10T14:00:00Z");
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline({ selectedDate }));

      expect(result.current.dateStr).toBe("2026-02-10");
      expect(result.current.formattedDate).toContain("February");
      expect(result.current.formattedDate).toContain("10");
    });

    it("should default to today when no selectedDate or dayNumberOverride", () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useClientTimeline());

      expect(result.current.dateStr).toBe("2026-01-27");
    });
  });
});
