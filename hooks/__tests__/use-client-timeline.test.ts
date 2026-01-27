/**
 * Tests for useClientTimeline hook
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useClientTimeline } from "../use-client-timeline";

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
  }),
}));

jest.mock("@refinedev/core", () => ({
  useOne: jest.fn(() => ({
    query: {
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: "test-user-id",
          full_name: "Test User",
          plan_start_date: "2026-01-20",
          plan_duration_days: 28,
          created_at: "2026-01-01T00:00:00Z",
        },
      },
    },
  })),
  useList: jest.fn(() => ({
    query: {
      isLoading: false,
      isError: false,
      data: { data: [] },
    },
  })),
  useCreate: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
  })),
  useDelete: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
  })),
  useInvalidate: jest.fn(() => jest.fn()),
}));

jest.mock("../use-timeline-data", () => ({
  useTimelineData: jest.fn(() => ({
    timelineItems: [],
    packingItems: [],
    dietItems: [],
    supplementItems: [],
    workoutItems: [],
    lifestyleItems: [],
    isLoading: false,
    isError: false,
    refetchAll: jest.fn(),
    rawDietPlans: [],
    rawSupplementPlans: [],
    rawWorkoutPlans: [],
    rawLifestyleActivityPlans: [],
    planConfig: { startDate: null, durationDays: 7 },
    clientConditions: [],
  })),
}));

describe("useClientTimeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-27T10:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("basic functionality", () => {
    it("should initialize with loading state", async () => {
      const { result } = renderHook(() => useClientTimeline());

      // Initially loading while auth check happens
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });
    });

    it("should provide timeline items", async () => {
      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        expect(result.current.timelineItems).toEqual([]);
      });
    });

    it("should provide date info", async () => {
      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        expect(result.current.dateStr).toBe("2026-01-27");
        expect(result.current.formattedDate).toContain("January 27");
      });
    });
  });

  describe("plan progress calculation", () => {
    it("should return null planProgress when no start date", async () => {
      const { useOne } = require("@refinedev/core");
      useOne.mockReturnValue({
        query: {
          isLoading: false,
          isError: false,
          data: {
            data: {
              id: "test-user-id",
              plan_start_date: null,
              plan_duration_days: 7,
            },
          },
        },
      });

      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        expect(result.current.planProgress).toBeNull();
        expect(result.current.isPlanConfigured).toBe(false);
      });
    });

    it("should calculate plan progress correctly", async () => {
      const { useOne } = require("@refinedev/core");
      useOne.mockReturnValue({
        query: {
          isLoading: false,
          isError: false,
          data: {
            data: {
              id: "test-user-id",
              plan_start_date: "2026-01-20",
              plan_duration_days: 28,
            },
          },
        },
      });

      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        expect(result.current.planProgress).not.toBeNull();
        expect(result.current.planProgress?.dayNumber).toBe(8); // Jan 27 - Jan 20 + 1 = 8
        expect(result.current.planProgress?.totalDays).toBe(28);
        expect(result.current.isPlanConfigured).toBe(true);
      });
    });

    it("should detect extended plan", async () => {
      const { useOne } = require("@refinedev/core");
      useOne.mockReturnValue({
        query: {
          isLoading: false,
          isError: false,
          data: {
            data: {
              id: "test-user-id",
              plan_start_date: "2026-01-01",
              plan_duration_days: 7,
            },
          },
        },
      });

      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        // Day 27 of a 7-day plan = extended
        expect(result.current.planProgress?.isExtended).toBe(true);
      });
    });
  });

  describe("macro targets", () => {
    it("should return empty targets when no limits configured", async () => {
      const { useList } = require("@refinedev/core");
      useList.mockReturnValue({
        query: {
          isLoading: false,
          isError: false,
          data: { data: [] },
        },
      });

      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        expect(result.current.targets.hasLimits).toBe(false);
        expect(result.current.targets.calories).toBeNull();
      });
    });

    it("should return targets when limits are configured", async () => {
      const { useList } = require("@refinedev/core");
      useList.mockImplementation(({ resource }: { resource: string }) => {
        if (resource === "client_plan_limits") {
          return {
            query: {
              isLoading: false,
              isError: false,
              data: {
                data: [
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
              },
            },
          };
        }
        return {
          query: {
            isLoading: false,
            isError: false,
            data: { data: [] },
          },
        };
      });

      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        expect(result.current.targets.hasLimits).toBe(true);
        expect(result.current.targets.calories).toBe(2000);
        expect(result.current.targets.proteinMin).toBe(120);
        expect(result.current.targets.proteinMax).toBe(150);
      });
    });
  });

  describe("completion tracking", () => {
    it("should track completed items", async () => {
      const { useList } = require("@refinedev/core");
      useList.mockImplementation(({ resource }: { resource: string }) => {
        if (resource === "plan_completions") {
          return {
            query: {
              isLoading: false,
              isError: false,
              data: {
                data: [
                  {
                    id: "completion-1",
                    plan_type: "diet",
                    plan_item_id: "meal-item-1",
                    completed_date: "2026-01-27",
                  },
                ],
              },
            },
          };
        }
        return {
          query: {
            isLoading: false,
            isError: false,
            data: { data: [] },
          },
        };
      });

      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        expect(result.current.completions).toHaveLength(1);
        expect(result.current.completions[0].plan_item_id).toBe("meal-item-1");
      });
    });

    it("should provide completion count", async () => {
      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        expect(result.current.completedCount).toBeDefined();
        expect(result.current.totalCount).toBeDefined();
      });
    });
  });

  describe("before plan start", () => {
    it("should detect before plan start state", async () => {
      const { useOne } = require("@refinedev/core");
      useOne.mockReturnValue({
        query: {
          isLoading: false,
          isError: false,
          data: {
            data: {
              id: "test-user-id",
              plan_start_date: "2026-02-01", // Future date
              plan_duration_days: 28,
            },
          },
        },
      });

      const { result } = renderHook(() => useClientTimeline());

      await waitFor(() => {
        expect(result.current.isBeforePlanStart).toBe(true);
        expect(result.current.isPlanConfigured).toBe(true);
      });
    });
  });
});
