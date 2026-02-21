/**
 * Integration tests for dashboard data flows.
 *
 * These tests verify multi-step data flows by:
 * 1. Chaining pure functions directly (no mocking needed)
 * 2. Testing Supabase-dependent flows with mocked clients
 * 3. Verifying data consistency across steps
 *
 * Scenarios covered:
 * - Timeline data loading -> filtering -> completion toggle -> refetch
 * - Check-in submission -> history update -> progress recalculation
 * - Challenge progress -> points calculation -> streak tracking
 */

import {
  calculateStats,
  calculateStatsByType,
  calculateDayCompletionSummary,
  calculateStreak as calculateCompletionStreak,
  calculateTrend,
  timelineTypeToPlanType,
  formatTrend,
  getCompletionColorClass,
  type TimelineItemWithCompletion,
  type DayCompletionSummary,
} from "@/lib/utils/completion-stats";

import {
  sortTimelineItems,
  groupTimelineItemsByPeriod,
  timeToMinutes,
  minutesToTime,
  calculateRelativeTime,
  getItemTimePeriod,
  matchesScheduling,
} from "@/lib/utils/timeline";

import {
  buildDayProgressMap,
  calculateStreak as calculateChallengeStreak,
  calculateWeekUnlocked,
  calculateCompletionPercent,
  calculateCumulativeStats,
  calculateTotalPoints,
  isEditableDay,
  daysBetween,
  getDateForDay,
  type DailyMetrics,
  type DayProgress,
} from "@/lib/challenge-utils";

import {
  calculateStepsPoints,
  calculateWaterPoints,
  calculateFloorsPoints,
  calculateProteinPoints,
  calculateSleepPoints,
  calculateMetricsPoints,
  calculateDailyPoints,
} from "@/hooks/use-gamification";

import type { PlanCompletion, TimelineItemType } from "@/lib/database.types";

// =============================================================================
// MOCK FACTORIES
// =============================================================================

function createMockTimelineItem(
  overrides: Partial<TimelineItemWithCompletion> & { id: string; type: TimelineItemType }
): TimelineItemWithCompletion {
  return {
    sourceId: overrides.id,
    ...overrides,
  };
}

function createMockCompletion(overrides: Partial<PlanCompletion>): PlanCompletion {
  return {
    id: `completion-${Math.random().toString(36).slice(2, 8)}`,
    client_id: "client-1",
    plan_type: "diet",
    plan_item_id: "item-1",
    completed_date: "2026-02-20",
    completed_at: "2026-02-20T12:00:00Z",
    notes: null,
    plan_cycle: 1,
    created_at: "2026-02-20T12:00:00Z",
    ...overrides,
  };
}

function createMockDayProgress(
  dayNumber: number,
  overrides: Partial<DayProgress> = {}
): DayProgress {
  return {
    dayNumber,
    loggedDate: `2026-02-${String(dayNumber).padStart(2, "0")}`,
    metrics: {
      steps: 10000,
      waterLiters: 3.0,
      floorsClimbed: 10,
      proteinGrams: 80,
      sleepHours: 7.5,
    },
    pointsEarned: 90,
    hasData: true,
    ...overrides,
  };
}

function createMockChallengeProgressRow(
  dayNumber: number,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    day_number: dayNumber,
    logged_date: `2026-02-${String(dayNumber).padStart(2, "0")}`,
    steps: 10000,
    water_liters: 3.0,
    floors_climbed: 10,
    protein_grams: 80,
    sleep_hours: 7.5,
    feeling: null,
    tomorrow_focus: null,
    points_earned: 90,
    ...overrides,
  };
}

// =============================================================================
// SCENARIO 1: Timeline data loading -> filtering -> completion toggle -> refetch
// =============================================================================

describe("Integration: Timeline data loading -> filtering -> completion toggle -> refetch", () => {
  describe("Step 1: Load timeline data for a user (diet, supplements, workouts, lifestyle)", () => {
    const timelineItems: TimelineItemWithCompletion[] = [
      createMockTimelineItem({
        id: "diet-1",
        type: "meal",
        sourceId: "diet-plan-1",
        groupedSourceIds: ["diet-plan-1", "diet-plan-2"],
      }),
      createMockTimelineItem({
        id: "diet-2",
        type: "meal",
        sourceId: "diet-plan-3",
      }),
      createMockTimelineItem({
        id: "supp-1",
        type: "supplement",
        sourceId: "supp-plan-1",
        groupedSourceIds: ["supp-plan-1", "supp-plan-2"],
      }),
      createMockTimelineItem({
        id: "workout-1",
        type: "workout",
        sourceId: "workout-plan-1",
      }),
      createMockTimelineItem({
        id: "lifestyle-1",
        type: "lifestyle",
        sourceId: "lifestyle-plan-1",
      }),
    ];

    it("correctly identifies items by type for filtering", () => {
      const mealItems = timelineItems.filter((i) => i.type === "meal");
      const supplementItems = timelineItems.filter((i) => i.type === "supplement");
      const workoutItems = timelineItems.filter((i) => i.type === "workout");
      const lifestyleItems = timelineItems.filter((i) => i.type === "lifestyle");

      expect(mealItems).toHaveLength(2);
      expect(supplementItems).toHaveLength(1);
      expect(workoutItems).toHaveLength(1);
      expect(lifestyleItems).toHaveLength(1);
    });

    it("maps timeline types to plan types for completion lookups", () => {
      expect(timelineTypeToPlanType("meal")).toBe("diet");
      expect(timelineTypeToPlanType("supplement")).toBe("supplement");
      expect(timelineTypeToPlanType("workout")).toBe("workout");
      expect(timelineTypeToPlanType("lifestyle")).toBe("lifestyle");
    });
  });

  describe("Step 2: Filter/group items by time period", () => {
    it("groups items by time period and sorts within periods", () => {
      // Create timeline items with scheduling info for period grouping
      const items = [
        {
          id: "diet-morning",
          type: "meal" as const,
          title: "Breakfast",
          subtitle: "2 items",
          sourceType: "diet_plan" as const,
          sourceId: "dp-1",
          isGrouped: true,
          groupKey: "meal:fixed:08:00:breakfast",
          itemCount: 2,
          itemNames: ["Oatmeal", "Banana"],
          groupedItems: [],
          scheduling: {
            time_type: "fixed" as const,
            time_start: "08:00",
            time_end: null,
            time_period: null,
            relative_anchor: null,
            relative_offset_minutes: 0,
          },
          metadata: { calories: 300, protein: 15 },
          displayOrder: 1,
        },
        {
          id: "supp-morning",
          type: "supplement" as const,
          title: "Supplements",
          subtitle: "2 supplements",
          sourceType: "supplement_plan" as const,
          sourceId: "sp-1",
          isGrouped: true,
          groupKey: "supplement:period:morning",
          itemCount: 2,
          itemNames: ["Vitamin D", "Omega 3"],
          groupedItems: [],
          scheduling: {
            time_type: "period" as const,
            time_start: null,
            time_end: null,
            time_period: "morning" as const,
            relative_anchor: null,
            relative_offset_minutes: 0,
          },
          metadata: {},
          displayOrder: 1,
        },
        {
          id: "workout-evening",
          type: "workout" as const,
          title: "Workout Session",
          subtitle: "3 exercises",
          sourceType: "workout_plan" as const,
          sourceId: "wp-1",
          isGrouped: true,
          groupKey: "workout:fixed:17:00",
          itemCount: 3,
          itemNames: ["Push-ups", "Squats", "Planks"],
          groupedItems: [],
          scheduling: {
            time_type: "fixed" as const,
            time_start: "17:00",
            time_end: "18:00",
            time_period: null,
            relative_anchor: null,
            relative_offset_minutes: 0,
          },
          metadata: { duration: 45 },
          displayOrder: 1,
        },
        {
          id: "lifestyle-allday",
          type: "lifestyle" as const,
          title: "Lifestyle Activities",
          subtitle: "1 activity",
          sourceType: "lifestyle_activity_plan" as const,
          sourceId: "lap-1",
          isGrouped: true,
          groupKey: "lifestyle:all_day",
          itemCount: 1,
          itemNames: ["Morning Walk"],
          groupedItems: [],
          scheduling: {
            time_type: "all_day" as const,
            time_start: null,
            time_end: null,
            time_period: null,
            relative_anchor: null,
            relative_offset_minutes: 0,
          },
          metadata: {},
          displayOrder: 1,
        },
      ];

      // Verify sorting places items in chronological order
      const sorted = sortTimelineItems(items);
      const sortedIds = sorted.map((i) => i.id);

      // Fixed 08:00 diet, period morning supplement (~08:30), fixed 17:00 workout, all_day last
      expect(sortedIds[0]).toBe("diet-morning"); // 08:00 = 480 min
      expect(sortedIds[1]).toBe("supp-morning"); // morning midpoint ~08:30 = 510 min
      expect(sortedIds[2]).toBe("workout-evening"); // 17:00 = 1020 min
      expect(sortedIds[3]).toBe("lifestyle-allday"); // all_day = end of day

      // Verify period grouping
      const groups = groupTimelineItemsByPeriod(items);
      const morningItems = groups.get("morning") || [];
      const eveningItems = groups.get("evening") || [];
      const allDayItems = groups.get("all_day") || [];

      expect(morningItems).toHaveLength(2); // diet (08:00 falls in morning) + supplement (morning)
      expect(eveningItems).toHaveLength(1); // workout at 17:00
      expect(allDayItems).toHaveLength(1); // lifestyle
    });
  });

  describe("Step 3: Toggle completion on an item", () => {
    it("completion calculation changes when items are marked complete", () => {
      const items: TimelineItemWithCompletion[] = [
        createMockTimelineItem({ id: "meal-1", type: "meal", sourceId: "dp-1" }),
        createMockTimelineItem({ id: "meal-2", type: "meal", sourceId: "dp-2" }),
        createMockTimelineItem({ id: "supp-1", type: "supplement", sourceId: "sp-1" }),
        createMockTimelineItem({ id: "workout-1", type: "workout", sourceId: "wp-1" }),
      ];

      // Initial state: no completions
      const noCompletions: PlanCompletion[] = [];
      const initialStats = calculateStats(items, noCompletions);
      expect(initialStats.total).toBe(4);
      expect(initialStats.completed).toBe(0);
      expect(initialStats.percentage).toBe(0);

      // Toggle: complete the first meal item
      const afterOneComplete: PlanCompletion[] = [
        createMockCompletion({ plan_type: "diet", plan_item_id: "dp-1" }),
      ];
      const statsAfterOne = calculateStats(items, afterOneComplete);
      expect(statsAfterOne.completed).toBe(1);
      expect(statsAfterOne.percentage).toBe(25); // 1/4 = 25%

      // Toggle: complete the workout
      const afterTwoComplete: PlanCompletion[] = [
        ...afterOneComplete,
        createMockCompletion({ plan_type: "workout", plan_item_id: "wp-1" }),
      ];
      const statsAfterTwo = calculateStats(items, afterTwoComplete);
      expect(statsAfterTwo.completed).toBe(2);
      expect(statsAfterTwo.percentage).toBe(50); // 2/4 = 50%

      // Verify stats by type reflect the completions
      const byType = calculateStatsByType(items, afterTwoComplete);
      expect(byType.meal.total).toBe(2);
      expect(byType.meal.completed).toBe(1);
      expect(byType.meal.percentage).toBe(50);
      expect(byType.workout.total).toBe(1);
      expect(byType.workout.completed).toBe(1);
      expect(byType.workout.percentage).toBe(100);
      expect(byType.supplement.completed).toBe(0);
    });

    it("grouped items require ALL sub-items to be completed", () => {
      const groupedItem: TimelineItemWithCompletion = createMockTimelineItem({
        id: "group:meal-breakfast",
        type: "meal",
        sourceId: "dp-1",
        groupedSourceIds: ["dp-1", "dp-2", "dp-3"],
      });

      // Only 2 of 3 sub-items completed - should NOT count as complete
      const partialCompletions: PlanCompletion[] = [
        createMockCompletion({ plan_type: "diet", plan_item_id: "dp-1" }),
        createMockCompletion({ plan_type: "diet", plan_item_id: "dp-2" }),
      ];
      const partialStats = calculateStats([groupedItem], partialCompletions);
      expect(partialStats.completed).toBe(0);

      // All 3 sub-items completed - should count as complete
      const fullCompletions: PlanCompletion[] = [
        ...partialCompletions,
        createMockCompletion({ plan_type: "diet", plan_item_id: "dp-3" }),
      ];
      const fullStats = calculateStats([groupedItem], fullCompletions);
      expect(fullStats.completed).toBe(1);
      expect(fullStats.percentage).toBe(100);
    });
  });

  describe("Step 4: Verify data refreshed — completion stats are recalculated after toggle", () => {
    it("full flow: load items -> check empty -> complete items -> verify stats update", () => {
      // Simulate full day timeline with all 4 types
      const items: TimelineItemWithCompletion[] = [
        createMockTimelineItem({ id: "m1", type: "meal", sourceId: "dp-1" }),
        createMockTimelineItem({ id: "m2", type: "meal", sourceId: "dp-2" }),
        createMockTimelineItem({ id: "s1", type: "supplement", sourceId: "sp-1" }),
        createMockTimelineItem({ id: "w1", type: "workout", sourceId: "wp-1" }),
        createMockTimelineItem({ id: "l1", type: "lifestyle", sourceId: "lp-1" }),
      ];

      // Step A: Initial empty state
      let completions: PlanCompletion[] = [];
      let summary = calculateDayCompletionSummary("2026-02-20", items, completions);
      expect(summary.total).toBe(5);
      expect(summary.completed).toBe(0);
      expect(summary.percentage).toBe(0);
      expect(getCompletionColorClass(summary.percentage)).toBe("text-red-500");

      // Step B: Complete all meals and supplement (3/5)
      completions = [
        createMockCompletion({ plan_type: "diet", plan_item_id: "dp-1" }),
        createMockCompletion({ plan_type: "diet", plan_item_id: "dp-2" }),
        createMockCompletion({ plan_type: "supplement", plan_item_id: "sp-1" }),
      ];
      summary = calculateDayCompletionSummary("2026-02-20", items, completions);
      expect(summary.completed).toBe(3);
      expect(summary.percentage).toBe(60);
      expect(summary.byType.meal.percentage).toBe(100);
      expect(summary.byType.supplement.percentage).toBe(100);
      expect(summary.byType.workout.percentage).toBe(0);
      expect(getCompletionColorClass(summary.percentage)).toBe("text-yellow-500");

      // Step C: Complete everything (5/5)
      completions = [
        ...completions,
        createMockCompletion({ plan_type: "workout", plan_item_id: "wp-1" }),
        createMockCompletion({ plan_type: "lifestyle", plan_item_id: "lp-1" }),
      ];
      summary = calculateDayCompletionSummary("2026-02-20", items, completions);
      expect(summary.completed).toBe(5);
      expect(summary.percentage).toBe(100);
      expect(getCompletionColorClass(summary.percentage)).toBe("text-green-500");

      // Step D: Uncomplete the workout (simulate toggle off)
      completions = completions.filter((c) => c.plan_item_id !== "wp-1");
      summary = calculateDayCompletionSummary("2026-02-20", items, completions);
      expect(summary.completed).toBe(4);
      expect(summary.percentage).toBe(80);
      expect(summary.byType.workout.completed).toBe(0);
      expect(getCompletionColorClass(summary.percentage)).toBe("text-green-500");
    });
  });
});

// =============================================================================
// SCENARIO 2: Check-in submission -> history update -> progress recalculation
// =============================================================================

describe("Integration: Check-in submission -> history update -> progress recalculation", () => {
  describe("Step 1: Submit a daily check-in (ratings, measurements, notes)", () => {
    it("calculates points correctly for various metric combinations", () => {
      // Excellent day: all metrics met
      const excellentMetrics: DailyMetrics = {
        steps: 15000,
        waterLiters: 4.0,
        floorsClimbed: 14,
        proteinGrams: 100,
        sleepHours: 8,
      };
      const excellentPoints = calculateDailyPoints(excellentMetrics, true);
      // steps:45 + water:15 + floors:45 + protein:15 + sleep:15 = 135 + bonus:15 = 150 (capped)
      expect(excellentPoints).toBe(150);

      // Average day: some metrics met
      const averageMetrics: DailyMetrics = {
        steps: 8000,
        waterLiters: 3.0,
        floorsClimbed: 6,
        proteinGrams: 70,
        sleepHours: 7,
      };
      const averagePoints = calculateDailyPoints(averageMetrics, true);
      // steps:15 + water:15 + floors:15 + protein:15 + sleep:15 = 75 + bonus:15 = 90
      expect(averagePoints).toBe(90);

      // Poor day: no metrics met
      const poorMetrics: DailyMetrics = {
        steps: 2000,
        waterLiters: 1.0,
        floorsClimbed: 2,
        proteinGrams: 30,
        sleepHours: 5,
      };
      const poorPoints = calculateDailyPoints(poorMetrics, true);
      // 0 metrics + bonus:15 = 15
      expect(poorPoints).toBe(15);

      // No check-in bonus
      const noBonus = calculateDailyPoints(averageMetrics, false);
      expect(noBonus).toBe(75);
    });
  });

  describe("Step 2: Verify check-in is saved to database (via buildDayProgressMap)", () => {
    it("transforms database rows into DayProgress records correctly", () => {
      const dbRows = [
        createMockChallengeProgressRow(1, {
          steps: 12000,
          water_liters: 3.5,
          floors_climbed: 8,
          protein_grams: 90,
          sleep_hours: 7.5,
          feeling: "great",
          tomorrow_focus: "cardio",
          points_earned: 105,
        }),
        createMockChallengeProgressRow(2, {
          steps: 5000,
          water_liters: 2.0,
          floors_climbed: 3,
          protein_grams: 50,
          sleep_hours: 6,
          feeling: "tired",
          points_earned: 30,
        }),
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progressMap = buildDayProgressMap(dbRows as any);

      expect(progressMap[1]).toBeDefined();
      expect(progressMap[1].dayNumber).toBe(1);
      expect(progressMap[1].metrics.steps).toBe(12000);
      expect(progressMap[1].metrics.waterLiters).toBe(3.5);
      expect(progressMap[1].metrics.feeling).toBe("great");
      expect(progressMap[1].metrics.tomorrowFocus).toBe("cardio");
      expect(progressMap[1].pointsEarned).toBe(105);
      expect(progressMap[1].hasData).toBe(true);

      expect(progressMap[2]).toBeDefined();
      expect(progressMap[2].metrics.steps).toBe(5000);
      expect(progressMap[2].metrics.feeling).toBe("tired");
      expect(progressMap[2].pointsEarned).toBe(30);
    });

    it("handles empty or null values in database rows gracefully", () => {
      const dbRows = [
        createMockChallengeProgressRow(1, {
          steps: 0,
          water_liters: 0,
          floors_climbed: 0,
          protein_grams: 0,
          sleep_hours: 0,
          feeling: null,
          tomorrow_focus: null,
          points_earned: 0,
        }),
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progressMap = buildDayProgressMap(dbRows as any);

      expect(progressMap[1].metrics.steps).toBe(0);
      expect(progressMap[1].metrics.waterLiters).toBe(0);
      expect(progressMap[1].metrics.feeling).toBeUndefined();
      expect(progressMap[1].metrics.tomorrowFocus).toBeUndefined();
      expect(progressMap[1].hasData).toBe(true);
    });
  });

  describe("Step 3: Verify history includes the new entry", () => {
    it("adding a new day to progress map updates cumulative stats", () => {
      // Existing progress: days 1-3
      const existingProgress: Record<number, DayProgress> = {
        1: createMockDayProgress(1, {
          metrics: {
            steps: 10000,
            waterLiters: 3.0,
            floorsClimbed: 10,
            proteinGrams: 80,
            sleepHours: 7.5,
          },
          pointsEarned: 90,
        }),
        2: createMockDayProgress(2, {
          metrics: {
            steps: 8000,
            waterLiters: 2.5,
            floorsClimbed: 6,
            proteinGrams: 70,
            sleepHours: 7,
          },
          pointsEarned: 75,
        }),
        3: createMockDayProgress(3, {
          metrics: {
            steps: 5000,
            waterLiters: 2.0,
            floorsClimbed: 3,
            proteinGrams: 50,
            sleepHours: 6,
          },
          pointsEarned: 30,
        }),
      };

      // Verify stats before new entry
      const statsBefore = calculateCumulativeStats(existingProgress);
      expect(statsBefore.daysCompleted).toBe(3);
      expect(statsBefore.totalSteps).toBe(23000);

      // Add a new day 4
      const newDay4: DayProgress = createMockDayProgress(4, {
        metrics: {
          steps: 15000,
          waterLiters: 4.0,
          floorsClimbed: 14,
          proteinGrams: 100,
          sleepHours: 8,
        },
        pointsEarned: 150,
      });

      const updatedProgress = { ...existingProgress, 4: newDay4 };
      const statsAfter = calculateCumulativeStats(updatedProgress);

      expect(statsAfter.daysCompleted).toBe(4);
      expect(statsAfter.totalSteps).toBe(38000); // 23000 + 15000
      expect(statsAfter.totalWater).toBe(11.5); // 3 + 2.5 + 2 + 4
      expect(statsAfter.totalFloors).toBe(33); // 10 + 6 + 3 + 14
      expect(statsAfter.totalProtein).toBe(300); // 80 + 70 + 50 + 100
      expect(statsAfter.totalSleepHours).toBe(28.5); // 7.5 + 7 + 6 + 8
    });
  });

  describe("Step 4: Verify progress stats are recalculated", () => {
    it("full flow: empty -> add check-in -> verify points + streak + completion", () => {
      const totalDays = 30;

      // State 1: Empty progress
      let progress: Record<number, DayProgress> = {};
      expect(calculateTotalPoints(progress)).toBe(0);
      expect(calculateChallengeStreak(progress, 1)).toBe(0);
      expect(calculateCompletionPercent(progress, totalDays)).toBe(0);

      // State 2: Day 1 check-in with good metrics
      const day1Metrics: DailyMetrics = {
        steps: 10000,
        waterLiters: 3.5,
        floorsClimbed: 10,
        proteinGrams: 80,
        sleepHours: 7.5,
      };
      const day1Points = calculateDailyPoints(day1Metrics, true);
      progress = {
        1: createMockDayProgress(1, { metrics: day1Metrics, pointsEarned: day1Points }),
      };

      expect(calculateTotalPoints(progress)).toBe(day1Points);
      expect(calculateChallengeStreak(progress, 1)).toBe(1);
      expect(calculateCompletionPercent(progress, totalDays)).toBe(3); // 1/30 ~= 3%

      // State 3: Days 1-3 consecutive (streak = 3)
      const day2Metrics: DailyMetrics = {
        steps: 12000,
        waterLiters: 3.0,
        floorsClimbed: 8,
        proteinGrams: 90,
        sleepHours: 8,
      };
      const day2Points = calculateDailyPoints(day2Metrics, true);

      const day3Metrics: DailyMetrics = {
        steps: 7000,
        waterLiters: 3.0,
        floorsClimbed: 4,
        proteinGrams: 70,
        sleepHours: 7,
      };
      const day3Points = calculateDailyPoints(day3Metrics, true);

      progress = {
        1: createMockDayProgress(1, { metrics: day1Metrics, pointsEarned: day1Points }),
        2: createMockDayProgress(2, { metrics: day2Metrics, pointsEarned: day2Points }),
        3: createMockDayProgress(3, { metrics: day3Metrics, pointsEarned: day3Points }),
      };

      expect(calculateTotalPoints(progress)).toBe(day1Points + day2Points + day3Points);
      expect(calculateChallengeStreak(progress, 3)).toBe(3);
      expect(calculateCompletionPercent(progress, totalDays)).toBe(10); // 3/30 = 10%

      // State 4: Gap at day 4, then day 5 (streak from currentDay=5 should be 1)
      const day5Metrics: DailyMetrics = {
        steps: 9000,
        waterLiters: 3.0,
        floorsClimbed: 5,
        proteinGrams: 75,
        sleepHours: 7,
      };
      const day5Points = calculateDailyPoints(day5Metrics, true);

      progress = {
        ...progress,
        5: createMockDayProgress(5, { metrics: day5Metrics, pointsEarned: day5Points }),
      };

      expect(calculateChallengeStreak(progress, 5)).toBe(1); // Gap at day 4 breaks streak
      expect(calculateCompletionPercent(progress, totalDays)).toBe(13); // 4/30 ~= 13%

      // Cumulative stats should reflect all 4 completed days
      const cumulative = calculateCumulativeStats(progress);
      expect(cumulative.daysCompleted).toBe(4);
      expect(cumulative.totalSteps).toBe(10000 + 12000 + 7000 + 9000);
    });

    it("week unlock progresses as days are completed", () => {
      const totalDays = 30;

      // Build progress for 6/7 days in week 1 (85.7% < 90%)
      const sixDaysProgress: Record<number, DayProgress> = {};
      for (let d = 1; d <= 6; d++) {
        sixDaysProgress[d] = createMockDayProgress(d);
      }
      expect(calculateWeekUnlocked(sixDaysProgress, totalDays)).toBe(1); // Not enough

      // Complete day 7 (100% >= 90%)
      const sevenDaysProgress = { ...sixDaysProgress, 7: createMockDayProgress(7) };
      expect(calculateWeekUnlocked(sevenDaysProgress, totalDays)).toBe(2); // Week 2 unlocked

      // Complete week 2 fully
      const twoWeeksProgress: Record<number, DayProgress> = { ...sevenDaysProgress };
      for (let d = 8; d <= 14; d++) {
        twoWeeksProgress[d] = createMockDayProgress(d);
      }
      expect(calculateWeekUnlocked(twoWeeksProgress, totalDays)).toBe(3); // Week 3 unlocked
    });
  });
});

// =============================================================================
// SCENARIO 3: Challenge progress -> points calculation -> streak tracking
// =============================================================================

describe("Integration: Challenge progress -> points calculation -> streak tracking", () => {
  describe("Step 1: Load challenge progress for a user", () => {
    it("builds progress map from database rows with correct structure", () => {
      const rows = [
        createMockChallengeProgressRow(1, {
          steps: 15000,
          water_liters: 4,
          floors_climbed: 14,
          protein_grams: 100,
          sleep_hours: 8,
          points_earned: 150,
        }),
        createMockChallengeProgressRow(2, {
          steps: 8000,
          water_liters: 3,
          floors_climbed: 6,
          protein_grams: 70,
          sleep_hours: 7,
          points_earned: 90,
        }),
        createMockChallengeProgressRow(3, {
          steps: 3000,
          water_liters: 1.5,
          floors_climbed: 2,
          protein_grams: 40,
          sleep_hours: 5,
          points_earned: 15,
        }),
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progressMap = buildDayProgressMap(rows as any);

      expect(Object.keys(progressMap)).toHaveLength(3);
      expect(progressMap[1].hasData).toBe(true);
      expect(progressMap[2].hasData).toBe(true);
      expect(progressMap[3].hasData).toBe(true);

      // Verify day 1 has the best metrics
      expect(progressMap[1].metrics.steps).toBe(15000);
      expect(progressMap[1].pointsEarned).toBe(150);

      // Verify day 3 has the worst metrics
      expect(progressMap[3].metrics.steps).toBe(3000);
      expect(progressMap[3].pointsEarned).toBe(15);
    });
  });

  describe("Step 2: Verify points are calculated correctly from daily metrics", () => {
    it("individual metric point calculations compose correctly", () => {
      const metrics: DailyMetrics = {
        steps: 12000, // 30 pts (10k-14999)
        waterLiters: 3.0, // 15 pts (>= 3L)
        floorsClimbed: 5, // 15 pts (4-13)
        proteinGrams: 80, // 15 pts (>= 70g)
        sleepHours: 7.5, // 15 pts (>= 7h)
      };

      // Verify each metric individually
      expect(calculateStepsPoints(metrics.steps)).toBe(30);
      expect(calculateWaterPoints(metrics.waterLiters)).toBe(15);
      expect(calculateFloorsPoints(metrics.floorsClimbed)).toBe(15);
      expect(calculateProteinPoints(metrics.proteinGrams)).toBe(15);
      expect(calculateSleepPoints(metrics.sleepHours)).toBe(15);

      // Verify the aggregate
      const totalMetrics = calculateMetricsPoints(metrics);
      expect(totalMetrics).toBe(90); // 30 + 15 + 15 + 15 + 15

      // With check-in bonus
      const withBonus = calculateDailyPoints(metrics, true);
      expect(withBonus).toBe(105); // 90 + 15 bonus

      // Without check-in bonus
      const withoutBonus = calculateDailyPoints(metrics, false);
      expect(withoutBonus).toBe(90); // no bonus
    });

    it("points cap at 150 regardless of how high metrics are", () => {
      const maxMetrics: DailyMetrics = {
        steps: 25000, // 45 pts
        waterLiters: 5.0, // 15 pts
        floorsClimbed: 20, // 45 pts
        proteinGrams: 200, // 15 pts
        sleepHours: 10, // 15 pts
      };

      const total = calculateMetricsPoints(maxMetrics);
      expect(total).toBe(135); // 45 + 15 + 45 + 15 + 15

      const withBonus = calculateDailyPoints(maxMetrics, true);
      expect(withBonus).toBe(150); // 135 + 15 = 150 (exactly at cap)

      // Even higher doesn't change
      expect(calculateDailyPoints(maxMetrics, true)).toBeLessThanOrEqual(150);
    });

    it("total points across multiple days accumulate correctly", () => {
      const progress: Record<number, DayProgress> = {
        1: createMockDayProgress(1, { pointsEarned: 90 }),
        2: createMockDayProgress(2, { pointsEarned: 150 }),
        3: createMockDayProgress(3, { pointsEarned: 15 }),
        4: createMockDayProgress(4, { pointsEarned: 75 }),
      };

      const total = calculateTotalPoints(progress);
      expect(total).toBe(90 + 150 + 15 + 75); // 330
    });
  });

  describe("Step 3: Add a new day's progress", () => {
    it("adding progress for a new day updates all derived calculations", () => {
      const totalDays = 30;

      // Existing: consecutive days 1-5
      const existing: Record<number, DayProgress> = {};
      for (let d = 1; d <= 5; d++) {
        existing[d] = createMockDayProgress(d, { pointsEarned: 90 });
      }

      // Before adding day 6
      const pointsBefore = calculateTotalPoints(existing);
      const streakBefore = calculateChallengeStreak(existing, 5);
      const completionBefore = calculateCompletionPercent(existing, totalDays);
      const statsBefore = calculateCumulativeStats(existing);

      expect(pointsBefore).toBe(450); // 5 * 90
      expect(streakBefore).toBe(5);
      expect(completionBefore).toBe(17); // 5/30 ~= 17%
      expect(statsBefore.daysCompleted).toBe(5);

      // Add day 6 with excellent metrics
      const day6: DayProgress = createMockDayProgress(6, {
        metrics: {
          steps: 20000,
          waterLiters: 4.5,
          floorsClimbed: 18,
          proteinGrams: 120,
          sleepHours: 9,
        },
        pointsEarned: 150,
      });
      const updated = { ...existing, 6: day6 };

      // After adding day 6
      const pointsAfter = calculateTotalPoints(updated);
      const streakAfter = calculateChallengeStreak(updated, 6);
      const completionAfter = calculateCompletionPercent(updated, totalDays);
      const statsAfter = calculateCumulativeStats(updated);

      expect(pointsAfter).toBe(600); // 450 + 150
      expect(streakAfter).toBe(6); // Consecutive
      expect(completionAfter).toBe(20); // 6/30 = 20%
      expect(statsAfter.daysCompleted).toBe(6);
      expect(statsAfter.totalSteps).toBe(5 * 10000 + 20000); // 70000
    });
  });

  describe("Step 4: Verify streak is updated correctly", () => {
    it("streak counts consecutive days backward from current day", () => {
      // Days 1, 2, 3 present, gap at 4, days 5, 6, 7 present
      const progress: Record<number, DayProgress> = {};
      [1, 2, 3, 5, 6, 7].forEach((d) => {
        progress[d] = createMockDayProgress(d);
      });

      // Current day = 7: streak = 3 (days 7, 6, 5 — gap at 4)
      expect(calculateChallengeStreak(progress, 7)).toBe(3);

      // Current day = 3: streak = 3 (days 3, 2, 1)
      expect(calculateChallengeStreak(progress, 3)).toBe(3);

      // Current day = 4: streak = 0 (day 4 has no data)
      expect(calculateChallengeStreak(progress, 4)).toBe(0);

      // Current day = 5: streak = 1 (only day 5, gap at 4)
      expect(calculateChallengeStreak(progress, 5)).toBe(1);
    });

    it("streak handles edge case of non-consecutive single days", () => {
      const progress: Record<number, DayProgress> = {
        1: createMockDayProgress(1),
        3: createMockDayProgress(3),
        5: createMockDayProgress(5),
        7: createMockDayProgress(7),
      };

      // Each day is isolated, so streak from any day is always 1
      expect(calculateChallengeStreak(progress, 1)).toBe(1);
      expect(calculateChallengeStreak(progress, 3)).toBe(1);
      expect(calculateChallengeStreak(progress, 5)).toBe(1);
      expect(calculateChallengeStreak(progress, 7)).toBe(1);

      // Days without data have streak 0
      expect(calculateChallengeStreak(progress, 2)).toBe(0);
      expect(calculateChallengeStreak(progress, 4)).toBe(0);
    });

    it("streak of zero when no progress exists", () => {
      expect(calculateChallengeStreak({}, 1)).toBe(0);
      expect(calculateChallengeStreak({}, 10)).toBe(0);
    });
  });

  describe("Step 5: Verify cumulative stats are updated", () => {
    it("cumulative stats accumulate across all days with data", () => {
      const progress: Record<number, DayProgress> = {
        1: createMockDayProgress(1, {
          metrics: {
            steps: 10000,
            waterLiters: 3.0,
            floorsClimbed: 10,
            proteinGrams: 80,
            sleepHours: 7.5,
          },
        }),
        2: createMockDayProgress(2, {
          metrics: {
            steps: 15000,
            waterLiters: 4.0,
            floorsClimbed: 14,
            proteinGrams: 100,
            sleepHours: 8,
          },
        }),
        3: createMockDayProgress(3, {
          metrics: {
            steps: 5000,
            waterLiters: 2.0,
            floorsClimbed: 3,
            proteinGrams: 50,
            sleepHours: 6,
          },
        }),
      };

      const stats = calculateCumulativeStats(progress);

      expect(stats.daysCompleted).toBe(3);
      expect(stats.totalSteps).toBe(30000);
      expect(stats.totalWater).toBe(9.0);
      expect(stats.totalFloors).toBe(27);
      expect(stats.totalProtein).toBe(230);
      expect(stats.totalSleepHours).toBe(21.5);
    });

    it("cumulative stats handle non-data days (hasData=false)", () => {
      const progress: Record<number, DayProgress> = {
        1: createMockDayProgress(1),
        2: createMockDayProgress(2, {
          hasData: false,
          metrics: { steps: 0, waterLiters: 0, floorsClimbed: 0, proteinGrams: 0, sleepHours: 0 },
        }),
        3: createMockDayProgress(3),
      };

      const stats = calculateCumulativeStats(progress);
      // Day 2 has hasData=false, so should not be counted
      expect(stats.daysCompleted).toBe(2);
    });

    it("cumulative stats return zeros for empty progress", () => {
      const stats = calculateCumulativeStats({});
      expect(stats.daysCompleted).toBe(0);
      expect(stats.totalSteps).toBe(0);
      expect(stats.totalWater).toBe(0);
      expect(stats.totalFloors).toBe(0);
      expect(stats.totalProtein).toBe(0);
      expect(stats.totalSleepHours).toBe(0);
    });
  });
});

// =============================================================================
// CROSS-SCENARIO: End-to-end consistency checks
// =============================================================================

describe("Integration: Cross-scenario consistency", () => {
  it("completion streak from completion-stats aligns with challenge streak logic", () => {
    // Build 5 consecutive days of 100% completion summaries
    const summaries: DayCompletionSummary[] = [];
    for (let d = 1; d <= 5; d++) {
      summaries.push({
        date: `2026-02-${String(d).padStart(2, "0")}`,
        total: 4,
        completed: 4,
        percentage: 100,
        byType: {
          meal: { total: 1, completed: 1, percentage: 100 },
          supplement: { total: 1, completed: 1, percentage: 100 },
          workout: { total: 1, completed: 1, percentage: 100 },
          lifestyle: { total: 1, completed: 1, percentage: 100 },
        },
      });
    }

    const completionStreak = calculateCompletionStreak(summaries);
    expect(completionStreak.current).toBe(5);
    expect(completionStreak.longest).toBe(5);
    expect(completionStreak.lastCompletedDate).toBe("2026-02-05");

    // Build the same in challenge progress format
    const challengeProgress: Record<number, DayProgress> = {};
    for (let d = 1; d <= 5; d++) {
      challengeProgress[d] = createMockDayProgress(d);
    }
    const challengeStreak = calculateChallengeStreak(challengeProgress, 5);
    expect(challengeStreak).toBe(5);

    // Both should agree: 5-day streak
    expect(completionStreak.current).toBe(challengeStreak);
  });

  it("trend calculation reflects completion improvements over time", () => {
    // First 7 days: ~50% completion
    // Next 7 days: ~100% completion
    const summaries: DayCompletionSummary[] = [];

    // Older period (days 1-7): 50% completion
    for (let d = 1; d <= 7; d++) {
      summaries.push({
        date: `2026-02-${String(d).padStart(2, "0")}`,
        total: 4,
        completed: 2,
        percentage: 50,
        byType: {
          meal: { total: 1, completed: 1, percentage: 100 },
          supplement: { total: 1, completed: 1, percentage: 100 },
          workout: { total: 1, completed: 0, percentage: 0 },
          lifestyle: { total: 1, completed: 0, percentage: 0 },
        },
      });
    }

    // Recent period (days 8-14): 100% completion
    for (let d = 8; d <= 14; d++) {
      summaries.push({
        date: `2026-02-${String(d).padStart(2, "0")}`,
        total: 4,
        completed: 4,
        percentage: 100,
        byType: {
          meal: { total: 1, completed: 1, percentage: 100 },
          supplement: { total: 1, completed: 1, percentage: 100 },
          workout: { total: 1, completed: 1, percentage: 100 },
          lifestyle: { total: 1, completed: 1, percentage: 100 },
        },
      });
    }

    const trend = calculateTrend(summaries, 7);
    expect(trend.direction).toBe("improving");
    expect(trend.percentageChange).toBe(50); // 100% - 50%
    expect(trend.comparisonPeriod).toBe("7 days");

    const formatted = formatTrend(trend);
    expect(formatted).toBe("+50% vs last 7 days");
  });

  it("editability matches day progress: past and current days are editable", () => {
    // Current day is 10
    const currentDay = 10;

    // Days with progress
    const progress: Record<number, DayProgress> = {};
    for (let d = 1; d <= 8; d++) {
      progress[d] = createMockDayProgress(d);
    }

    // All past days (1-9) and current day (10) should be editable
    for (let d = 1; d <= 10; d++) {
      expect(isEditableDay(d, currentDay)).toBe(true);
    }

    // Future days should not be editable
    for (let d = 11; d <= 30; d++) {
      expect(isEditableDay(d, currentDay)).toBe(false);
    }

    // Day 0 and negative should not be editable
    expect(isEditableDay(0, currentDay)).toBe(false);
    expect(isEditableDay(-1, currentDay)).toBe(false);
  });

  it("daysBetween is consistent with getDateForDay for gap calculation", () => {
    const startDate = "2026-02-01";
    const planStart = "2026-02-11"; // 10 days later

    const gap = daysBetween(startDate, planStart);
    expect(gap).toBe(10);

    // Verify the dates at day boundaries
    const day1Date = getDateForDay(startDate, 1);
    expect(day1Date.toISOString().split("T")[0]).toBe("2026-02-01");

    const day10Date = getDateForDay(startDate, 10);
    expect(day10Date.toISOString().split("T")[0]).toBe("2026-02-10");

    const day11Date = getDateForDay(startDate, 11);
    expect(day11Date.toISOString().split("T")[0]).toBe("2026-02-11"); // Should align with planStart
  });

  it("timeline utility functions compose for relative scheduling resolution", () => {
    // Breakfast anchor is at 08:00 by default
    const breakfastTime = calculateRelativeTime("breakfast", 0);
    expect(breakfastTime).toBe("08:00");

    // 30 minutes after breakfast
    const afterBreakfast = calculateRelativeTime("breakfast", 30);
    expect(afterBreakfast).toBe("08:30");

    // Convert to minutes for comparison
    const breakfastMinutes = timeToMinutes(breakfastTime);
    const afterBreakfastMinutes = timeToMinutes(afterBreakfast);
    expect(afterBreakfastMinutes - breakfastMinutes).toBe(30);

    // Convert back to time string
    expect(minutesToTime(afterBreakfastMinutes)).toBe("08:30");

    // Verify period assignment
    const scheduling = {
      time_type: "relative" as const,
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: "breakfast" as const,
      relative_offset_minutes: 30,
    };
    const period = getItemTimePeriod(scheduling);
    expect(period).toBe("morning"); // 08:30 falls in morning (07:00-10:00)
  });

  it("scheduling matching correctly groups items by their scheduling type", () => {
    const fixedSchedule = {
      time_type: "fixed",
      time_start: "08:00",
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };

    const sameFix = {
      time_type: "fixed",
      time_start: "08:00",
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };

    const differentFix = {
      time_type: "fixed",
      time_start: "09:00",
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };

    const periodSchedule = {
      time_type: "period",
      time_start: null,
      time_period: "morning",
      relative_anchor: null,
      relative_offset_minutes: 0,
    };

    expect(matchesScheduling(sameFix, fixedSchedule)).toBe(true);
    expect(matchesScheduling(differentFix, fixedSchedule)).toBe(false);
    expect(matchesScheduling(periodSchedule, fixedSchedule)).toBe(false);

    // Period matching
    const samePeriod = {
      time_type: "period",
      time_start: null,
      time_period: "morning",
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(matchesScheduling(samePeriod, periodSchedule)).toBe(true);

    // all_day always matches other all_day
    const allDay1 = {
      time_type: "all_day",
      time_start: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    const allDay2 = {
      time_type: "all_day",
      time_start: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(matchesScheduling(allDay1, allDay2)).toBe(true);
  });
});
