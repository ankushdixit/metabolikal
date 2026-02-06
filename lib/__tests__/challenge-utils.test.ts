import {
  getDateString,
  getDaysSinceStart,
  calculateStreak,
  calculateWeekUnlocked,
  calculateCompletionPercent,
  calculateCumulativeStats,
  buildDayProgressMap,
  calculateTotalPoints,
  getDateForDay,
  DEFAULT_CHALLENGE_DAYS,
  DAYS_IN_WEEK,
  WEEK_UNLOCK_THRESHOLD,
} from "../challenge-utils";
import type { DayProgress } from "../challenge-utils";
import type { ChallengeProgress } from "@/lib/database.types";

// Helper to create a DayProgress entry
function makeDayProgress(dayNumber: number, overrides: Partial<DayProgress> = {}): DayProgress {
  return {
    dayNumber,
    loggedDate: `2026-01-${String(dayNumber).padStart(2, "0")}`,
    metrics: {
      steps: 10000,
      waterLiters: 3.5,
      floorsClimbed: 10,
      proteinGrams: 80,
      sleepHours: 7.5,
    },
    pointsEarned: 90,
    hasData: true,
    ...overrides,
  };
}

describe("challenge-utils", () => {
  describe("constants", () => {
    it("exports expected constants", () => {
      expect(DEFAULT_CHALLENGE_DAYS).toBe(30);
      expect(DAYS_IN_WEEK).toBe(7);
      expect(WEEK_UNLOCK_THRESHOLD).toBe(0.9);
    });
  });

  describe("getDateString", () => {
    it("returns YYYY-MM-DD format for a given date", () => {
      const date = new Date("2026-03-15T10:30:00Z");
      expect(getDateString(date)).toBe("2026-03-15");
    });

    it("returns today when no argument", () => {
      const result = getDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getDaysSinceStart", () => {
    it("returns 1 on the start date", () => {
      const today = getDateString();
      expect(getDaysSinceStart(today, 30)).toBe(1);
    });

    it("never returns less than 1", () => {
      // Future start date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      expect(getDaysSinceStart(getDateString(tomorrow), 30)).toBe(1);
    });

    it("never exceeds totalDays", () => {
      // Very old start date
      expect(getDaysSinceStart("2020-01-01", 30)).toBe(30);
    });

    it("calculates correct day for a date in the past", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);
      expect(getDaysSinceStart(getDateString(threeDaysAgo), 30)).toBe(3);
    });
  });

  describe("calculateStreak", () => {
    it("returns 0 for empty progress", () => {
      expect(calculateStreak({}, 5)).toBe(0);
    });

    it("counts consecutive days from currentDay backwards", () => {
      const progress: Record<number, DayProgress> = {
        3: makeDayProgress(3),
        4: makeDayProgress(4),
        5: makeDayProgress(5),
      };
      expect(calculateStreak(progress, 5)).toBe(3);
    });

    it("stops at gaps", () => {
      const progress: Record<number, DayProgress> = {
        1: makeDayProgress(1),
        // day 2 missing
        3: makeDayProgress(3),
        4: makeDayProgress(4),
      };
      expect(calculateStreak(progress, 4)).toBe(2);
    });

    it("skips days without data", () => {
      const progress: Record<number, DayProgress> = {
        3: makeDayProgress(3, { hasData: false }),
        4: makeDayProgress(4),
      };
      expect(calculateStreak(progress, 4)).toBe(1);
    });

    it("returns 0 when current day has no data", () => {
      const progress: Record<number, DayProgress> = {
        1: makeDayProgress(1),
        2: makeDayProgress(2),
      };
      expect(calculateStreak(progress, 3)).toBe(0);
    });
  });

  describe("calculateWeekUnlocked", () => {
    it("returns 1 for empty progress", () => {
      expect(calculateWeekUnlocked({}, 30)).toBe(1);
    });

    it("unlocks week 2 when week 1 has 90%+ completion", () => {
      const progress: Record<number, DayProgress> = {};
      // 7 out of 7 days
      for (let i = 1; i <= 7; i++) {
        progress[i] = makeDayProgress(i);
      }
      expect(calculateWeekUnlocked(progress, 30)).toBe(2);
    });

    it("stays at week 1 if week 1 has less than 90% completion", () => {
      const progress: Record<number, DayProgress> = {};
      // Only 5 out of 7 days (71%)
      for (let i = 1; i <= 5; i++) {
        progress[i] = makeDayProgress(i);
      }
      expect(calculateWeekUnlocked(progress, 30)).toBe(1);
    });

    it("handles non-standard totalDays (partial last week)", () => {
      // 10 days = 1 full week + 3 days
      const progress: Record<number, DayProgress> = {};
      for (let i = 1; i <= 10; i++) {
        progress[i] = makeDayProgress(i);
      }
      expect(calculateWeekUnlocked(progress, 10)).toBe(3); // Beyond last week
    });
  });

  describe("calculateCompletionPercent", () => {
    it("returns 0 for empty progress", () => {
      expect(calculateCompletionPercent({}, 30)).toBe(0);
    });

    it("returns correct percentage", () => {
      const progress: Record<number, DayProgress> = {};
      for (let i = 1; i <= 15; i++) {
        progress[i] = makeDayProgress(i);
      }
      expect(calculateCompletionPercent(progress, 30)).toBe(50);
    });

    it("returns 100 for full completion", () => {
      const progress: Record<number, DayProgress> = {};
      for (let i = 1; i <= 30; i++) {
        progress[i] = makeDayProgress(i);
      }
      expect(calculateCompletionPercent(progress, 30)).toBe(100);
    });

    it("excludes days without data", () => {
      const progress: Record<number, DayProgress> = {
        1: makeDayProgress(1),
        2: makeDayProgress(2, { hasData: false }),
        3: makeDayProgress(3),
      };
      expect(calculateCompletionPercent(progress, 10)).toBe(20);
    });
  });

  describe("calculateCumulativeStats", () => {
    it("returns zeros for empty progress", () => {
      const stats = calculateCumulativeStats({});
      expect(stats).toEqual({
        totalSteps: 0,
        totalWater: 0,
        totalFloors: 0,
        totalProtein: 0,
        totalSleepHours: 0,
        daysCompleted: 0,
      });
    });

    it("sums metrics across days", () => {
      const progress: Record<number, DayProgress> = {
        1: makeDayProgress(1, {
          metrics: {
            steps: 10000,
            waterLiters: 3.0,
            floorsClimbed: 5,
            proteinGrams: 80,
            sleepHours: 7,
          },
        }),
        2: makeDayProgress(2, {
          metrics: {
            steps: 8000,
            waterLiters: 4.0,
            floorsClimbed: 10,
            proteinGrams: 100,
            sleepHours: 8,
          },
        }),
      };

      const stats = calculateCumulativeStats(progress);
      expect(stats.totalSteps).toBe(18000);
      expect(stats.totalWater).toBe(7);
      expect(stats.totalFloors).toBe(15);
      expect(stats.totalProtein).toBe(180);
      expect(stats.totalSleepHours).toBe(15);
      expect(stats.daysCompleted).toBe(2);
    });

    it("skips days without data", () => {
      const progress: Record<number, DayProgress> = {
        1: makeDayProgress(1),
        2: makeDayProgress(2, { hasData: false }),
      };
      const stats = calculateCumulativeStats(progress);
      expect(stats.daysCompleted).toBe(1);
    });
  });

  describe("buildDayProgressMap", () => {
    it("returns empty object for empty array", () => {
      expect(buildDayProgressMap([])).toEqual({});
    });

    it("converts DB rows to DayProgress records", () => {
      const rows: ChallengeProgress[] = [
        {
          id: "1",
          visitor_id: "v1",
          user_id: "u1",
          day_number: 1,
          logged_date: "2026-01-01",
          steps: 12000,
          water_liters: 3.5,
          floors_climbed: 8,
          protein_grams: 90,
          sleep_hours: 7.5,
          feeling: "Great",
          tomorrow_focus: "More steps",
          points_earned: 105,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ];

      const result = buildDayProgressMap(rows);
      expect(result[1]).toBeDefined();
      expect(result[1].dayNumber).toBe(1);
      expect(result[1].metrics.steps).toBe(12000);
      expect(result[1].metrics.feeling).toBe("Great");
      expect(result[1].hasData).toBe(true);
      expect(result[1].pointsEarned).toBe(105);
    });

    it("skips rows with null day_number", () => {
      const rows = [
        {
          id: "1",
          visitor_id: "v1",
          user_id: "u1",
          day_number: null,
          logged_date: "2026-01-01",
          steps: 0,
          water_liters: 0,
          floors_climbed: 0,
          protein_grams: 0,
          sleep_hours: 0,
          feeling: null,
          tomorrow_focus: null,
          points_earned: 0,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ] as ChallengeProgress[];

      const result = buildDayProgressMap(rows);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe("calculateTotalPoints", () => {
    it("returns 0 for empty progress", () => {
      expect(calculateTotalPoints({})).toBe(0);
    });

    it("sums pointsEarned across all entries", () => {
      const progress: Record<number, DayProgress> = {
        1: makeDayProgress(1, { pointsEarned: 100 }),
        2: makeDayProgress(2, { pointsEarned: 50 }),
        3: makeDayProgress(3, { pointsEarned: 75 }),
      };
      expect(calculateTotalPoints(progress)).toBe(225);
    });
  });

  describe("getDateForDay", () => {
    it("returns start date for day 1", () => {
      const result = getDateForDay("2026-01-01", 1);
      expect(result.toISOString().split("T")[0]).toBe("2026-01-01");
    });

    it("returns correct date for subsequent days", () => {
      const result = getDateForDay("2026-01-01", 5);
      expect(result.toISOString().split("T")[0]).toBe("2026-01-05");
    });

    it("handles month boundaries", () => {
      const result = getDateForDay("2026-01-30", 3);
      expect(result.toISOString().split("T")[0]).toBe("2026-02-01");
    });
  });
});
