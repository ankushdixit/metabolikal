/**
 * Tests for completion-stats utility functions
 */

import {
  calculateStats,
  calculateStatsByType,
  calculateDayCompletionSummary,
  calculateStreak,
  calculateTrend,
  formatStreak,
  formatTrend,
  getTrendLabel,
  formatPercentage,
  getCompletionColorClass,
  getCompletionBgClass,
  timelineTypeToPlanType,
  type TimelineItemWithCompletion,
  type DayCompletionSummary,
} from "../completion-stats";
import type { PlanCompletion } from "@/lib/database.types";

describe("completion-stats utilities", () => {
  // Mock data helpers
  const createItem = (
    id: string,
    type: "meal" | "supplement" | "workout" | "lifestyle",
    sourceId: string,
    groupedSourceIds?: string[]
  ): TimelineItemWithCompletion => ({
    id,
    type,
    sourceId,
    groupedSourceIds,
  });

  const createCompletion = (
    planItemId: string,
    planType: "diet" | "supplement" | "workout" | "lifestyle",
    date: string = "2026-01-20"
  ): PlanCompletion => ({
    id: `comp-${planItemId}`,
    client_id: "user-1",
    plan_type: planType,
    plan_item_id: planItemId,
    completed_date: date,
    completed_at: `${date}T10:00:00Z`,
    notes: null,
    created_at: `${date}T10:00:00Z`,
  });

  describe("timelineTypeToPlanType", () => {
    it("maps meal to diet", () => {
      expect(timelineTypeToPlanType("meal")).toBe("diet");
    });

    it("maps supplement to supplement", () => {
      expect(timelineTypeToPlanType("supplement")).toBe("supplement");
    });

    it("maps workout to workout", () => {
      expect(timelineTypeToPlanType("workout")).toBe("workout");
    });

    it("maps lifestyle to lifestyle", () => {
      expect(timelineTypeToPlanType("lifestyle")).toBe("lifestyle");
    });
  });

  describe("calculateStats", () => {
    it("returns zero stats for empty items", () => {
      const result = calculateStats([], []);
      expect(result).toEqual({ total: 0, completed: 0, percentage: 0 });
    });

    it("calculates correct stats for no completions", () => {
      const items = [createItem("1", "meal", "src-1"), createItem("2", "supplement", "src-2")];
      const result = calculateStats(items, []);
      expect(result).toEqual({ total: 2, completed: 0, percentage: 0 });
    });

    it("calculates correct stats for partial completions", () => {
      const items = [createItem("1", "meal", "src-1"), createItem("2", "supplement", "src-2")];
      const completions = [createCompletion("src-1", "diet")];
      const result = calculateStats(items, completions);
      expect(result).toEqual({ total: 2, completed: 1, percentage: 50 });
    });

    it("calculates correct stats for full completions", () => {
      const items = [createItem("1", "meal", "src-1"), createItem("2", "supplement", "src-2")];
      const completions = [
        createCompletion("src-1", "diet"),
        createCompletion("src-2", "supplement"),
      ];
      const result = calculateStats(items, completions);
      expect(result).toEqual({ total: 2, completed: 2, percentage: 100 });
    });

    it("handles grouped items correctly - requires all completed", () => {
      const items = [createItem("group-1", "meal", "src-1", ["src-1", "src-2", "src-3"])];
      // Only 2 of 3 completed
      const completions = [createCompletion("src-1", "diet"), createCompletion("src-2", "diet")];
      const result = calculateStats(items, completions);
      expect(result).toEqual({ total: 1, completed: 0, percentage: 0 });
    });

    it("marks grouped item complete when all sources completed", () => {
      const items = [createItem("group-1", "meal", "src-1", ["src-1", "src-2"])];
      const completions = [createCompletion("src-1", "diet"), createCompletion("src-2", "diet")];
      const result = calculateStats(items, completions);
      expect(result).toEqual({ total: 1, completed: 1, percentage: 100 });
    });

    it("rounds percentage correctly", () => {
      const items = [
        createItem("1", "meal", "src-1"),
        createItem("2", "meal", "src-2"),
        createItem("3", "meal", "src-3"),
      ];
      const completions = [createCompletion("src-1", "diet")];
      const result = calculateStats(items, completions);
      expect(result.percentage).toBe(33); // 1/3 = 33.33... rounds to 33
    });
  });

  describe("calculateStatsByType", () => {
    it("returns zero stats for all types when empty", () => {
      const result = calculateStatsByType([], []);
      expect(result.meal).toEqual({ total: 0, completed: 0, percentage: 0 });
      expect(result.supplement).toEqual({ total: 0, completed: 0, percentage: 0 });
      expect(result.workout).toEqual({ total: 0, completed: 0, percentage: 0 });
      expect(result.lifestyle).toEqual({ total: 0, completed: 0, percentage: 0 });
    });

    it("calculates stats per type correctly", () => {
      const items = [
        createItem("1", "meal", "src-1"),
        createItem("2", "meal", "src-2"),
        createItem("3", "supplement", "src-3"),
        createItem("4", "workout", "src-4"),
      ];
      const completions = [
        createCompletion("src-1", "diet"),
        createCompletion("src-3", "supplement"),
        createCompletion("src-4", "workout"),
      ];
      const result = calculateStatsByType(items, completions);

      expect(result.meal).toEqual({ total: 2, completed: 1, percentage: 50 });
      expect(result.supplement).toEqual({ total: 1, completed: 1, percentage: 100 });
      expect(result.workout).toEqual({ total: 1, completed: 1, percentage: 100 });
      expect(result.lifestyle).toEqual({ total: 0, completed: 0, percentage: 0 });
    });
  });

  describe("calculateDayCompletionSummary", () => {
    it("creates summary with correct date and stats", () => {
      const items = [createItem("1", "meal", "src-1"), createItem("2", "supplement", "src-2")];
      const completions = [createCompletion("src-1", "diet")];
      const result = calculateDayCompletionSummary("2026-01-20", items, completions);

      expect(result.date).toBe("2026-01-20");
      expect(result.total).toBe(2);
      expect(result.completed).toBe(1);
      expect(result.percentage).toBe(50);
      expect(result.byType.meal).toEqual({ total: 1, completed: 1, percentage: 100 });
    });
  });

  describe("calculateStreak", () => {
    it("returns zero streak for empty summaries", () => {
      const result = calculateStreak([]);
      expect(result).toEqual({ current: 0, longest: 0, lastCompletedDate: null });
    });

    it("calculates current streak for consecutive full days", () => {
      const summaries: DayCompletionSummary[] = [
        { date: "2026-01-20", total: 10, completed: 10, percentage: 100, byType: {} as any },
        { date: "2026-01-19", total: 10, completed: 10, percentage: 100, byType: {} as any },
        { date: "2026-01-18", total: 10, completed: 10, percentage: 100, byType: {} as any },
      ];
      const result = calculateStreak(summaries);
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });

    it("breaks streak on incomplete day", () => {
      const summaries: DayCompletionSummary[] = [
        { date: "2026-01-20", total: 10, completed: 10, percentage: 100, byType: {} as any },
        { date: "2026-01-19", total: 10, completed: 5, percentage: 50, byType: {} as any },
        { date: "2026-01-18", total: 10, completed: 10, percentage: 100, byType: {} as any },
      ];
      const result = calculateStreak(summaries);
      expect(result.current).toBe(1);
    });

    it("tracks longest streak correctly", () => {
      const summaries: DayCompletionSummary[] = [
        { date: "2026-01-20", total: 10, completed: 10, percentage: 100, byType: {} as any },
        { date: "2026-01-19", total: 10, completed: 5, percentage: 50, byType: {} as any },
        { date: "2026-01-18", total: 10, completed: 10, percentage: 100, byType: {} as any },
        { date: "2026-01-17", total: 10, completed: 10, percentage: 100, byType: {} as any },
        { date: "2026-01-16", total: 10, completed: 10, percentage: 100, byType: {} as any },
      ];
      const result = calculateStreak(summaries);
      expect(result.current).toBe(1);
      expect(result.longest).toBe(3);
    });

    it("sets lastCompletedDate correctly", () => {
      const summaries: DayCompletionSummary[] = [
        { date: "2026-01-20", total: 10, completed: 10, percentage: 100, byType: {} as any },
      ];
      const result = calculateStreak(summaries);
      expect(result.lastCompletedDate).toBe("2026-01-20");
    });
  });

  describe("calculateTrend", () => {
    it("returns maintaining for insufficient data", () => {
      const summaries: DayCompletionSummary[] = [
        { date: "2026-01-20", total: 10, completed: 10, percentage: 100, byType: {} as any },
      ];
      const result = calculateTrend(summaries, 7);
      expect(result.direction).toBe("maintaining");
      expect(result.percentageChange).toBe(0);
    });

    it("detects improving trend", () => {
      const summaries: DayCompletionSummary[] = [];
      // Recent week: 80% average
      for (let i = 0; i < 7; i++) {
        summaries.push({
          date: `2026-01-${20 - i}`,
          total: 10,
          completed: 8,
          percentage: 80,
          byType: {} as any,
        });
      }
      // Previous week: 60% average
      for (let i = 7; i < 14; i++) {
        summaries.push({
          date: `2026-01-${20 - i}`,
          total: 10,
          completed: 6,
          percentage: 60,
          byType: {} as any,
        });
      }
      const result = calculateTrend(summaries, 7);
      expect(result.direction).toBe("improving");
      expect(result.percentageChange).toBe(20);
    });

    it("detects declining trend", () => {
      const summaries: DayCompletionSummary[] = [];
      // Recent week: 50% average
      for (let i = 0; i < 7; i++) {
        summaries.push({
          date: `2026-01-${20 - i}`,
          total: 10,
          completed: 5,
          percentage: 50,
          byType: {} as any,
        });
      }
      // Previous week: 80% average
      for (let i = 7; i < 14; i++) {
        summaries.push({
          date: `2026-01-${20 - i}`,
          total: 10,
          completed: 8,
          percentage: 80,
          byType: {} as any,
        });
      }
      const result = calculateTrend(summaries, 7);
      expect(result.direction).toBe("declining");
      expect(result.percentageChange).toBe(-30);
    });

    it("detects maintaining trend for small changes", () => {
      const summaries: DayCompletionSummary[] = [];
      // Recent week: 75% average
      for (let i = 0; i < 7; i++) {
        summaries.push({
          date: `2026-01-${20 - i}`,
          total: 10,
          completed: 7 + (i % 2), // Alternates 7 and 8
          percentage: 70 + (i % 2) * 10,
          byType: {} as any,
        });
      }
      // Previous week: 73% average
      for (let i = 7; i < 14; i++) {
        summaries.push({
          date: `2026-01-${20 - i}`,
          total: 10,
          completed: 7 + ((i + 1) % 2),
          percentage: 70 + ((i + 1) % 2) * 10,
          byType: {} as any,
        });
      }
      const result = calculateTrend(summaries, 7);
      expect(result.direction).toBe("maintaining");
    });
  });

  describe("formatting functions", () => {
    describe("formatStreak", () => {
      it("formats zero streak", () => {
        expect(formatStreak({ current: 0, longest: 0, lastCompletedDate: null })).toBe(
          "No current streak"
        );
      });

      it("formats singular day", () => {
        expect(formatStreak({ current: 1, longest: 1, lastCompletedDate: "2026-01-20" })).toBe(
          "1 day"
        );
      });

      it("formats plural days", () => {
        expect(formatStreak({ current: 5, longest: 5, lastCompletedDate: "2026-01-20" })).toBe(
          "5 days"
        );
      });
    });

    describe("formatTrend", () => {
      it("formats improving trend", () => {
        const result = formatTrend({
          direction: "improving",
          percentageChange: 15,
          comparisonPeriod: "7 days",
        });
        expect(result).toBe("+15% vs last 7 days");
      });

      it("formats declining trend", () => {
        const result = formatTrend({
          direction: "declining",
          percentageChange: -10,
          comparisonPeriod: "7 days",
        });
        expect(result).toBe("-10% vs last 7 days");
      });

      it("formats maintaining trend", () => {
        const result = formatTrend({
          direction: "maintaining",
          percentageChange: 2,
          comparisonPeriod: "7 days",
        });
        expect(result).toBe("Consistent over last 7 days");
      });
    });

    describe("getTrendLabel", () => {
      it("returns Improving for improving", () => {
        expect(
          getTrendLabel({
            direction: "improving",
            percentageChange: 10,
            comparisonPeriod: "7 days",
          })
        ).toBe("Improving");
      });

      it("returns Room to Grow for declining", () => {
        expect(
          getTrendLabel({
            direction: "declining",
            percentageChange: -10,
            comparisonPeriod: "7 days",
          })
        ).toBe("Room to Grow");
      });

      it("returns Maintaining for maintaining", () => {
        expect(
          getTrendLabel({
            direction: "maintaining",
            percentageChange: 0,
            comparisonPeriod: "7 days",
          })
        ).toBe("Maintaining");
      });
    });

    describe("formatPercentage", () => {
      it("formats percentage correctly", () => {
        expect(formatPercentage(75)).toBe("75%");
        expect(formatPercentage(0)).toBe("0%");
        expect(formatPercentage(100)).toBe("100%");
      });
    });

    describe("getCompletionColorClass", () => {
      it("returns green for high completion", () => {
        expect(getCompletionColorClass(80)).toBe("text-green-500");
        expect(getCompletionColorClass(100)).toBe("text-green-500");
      });

      it("returns yellow for medium completion", () => {
        expect(getCompletionColorClass(50)).toBe("text-yellow-500");
        expect(getCompletionColorClass(79)).toBe("text-yellow-500");
      });

      it("returns red for low completion", () => {
        expect(getCompletionColorClass(0)).toBe("text-red-500");
        expect(getCompletionColorClass(49)).toBe("text-red-500");
      });
    });

    describe("getCompletionBgClass", () => {
      it("returns green for high completion", () => {
        expect(getCompletionBgClass(80)).toBe("bg-green-500/20");
      });

      it("returns yellow for medium completion", () => {
        expect(getCompletionBgClass(50)).toBe("bg-yellow-500/20");
      });

      it("returns red for low completion", () => {
        expect(getCompletionBgClass(0)).toBe("bg-red-500/20");
      });
    });
  });
});
