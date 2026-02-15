import type { ChallengeProgress } from "@/lib/database.types";

// Constants
export const DEFAULT_CHALLENGE_DAYS = 30;
export const DAYS_IN_WEEK = 7;
export const WEEK_UNLOCK_THRESHOLD = 0.9; // 90% = 6/7 days

// Types
export interface DailyMetrics {
  steps: number;
  waterLiters: number;
  floorsClimbed: number;
  proteinGrams: number;
  sleepHours: number;
  feeling?: string;
  tomorrowFocus?: string;
}

export interface DayProgress {
  dayNumber: number;
  loggedDate: string;
  metrics: DailyMetrics;
  pointsEarned: number;
  hasData: boolean;
}

export interface CumulativeStats {
  totalSteps: number;
  totalWater: number;
  totalFloors: number;
  totalProtein: number;
  totalSleepHours: number;
  daysCompleted: number;
}

// Pure helper functions

export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export function getDaysSinceStart(startDate: string, totalDays: number): number {
  const start = new Date(startDate);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diffDays + 1, 1), totalDays);
}

export function calculateStreak(progress: Record<number, DayProgress>, currentDay: number): number {
  let streak = 0;
  for (let day = currentDay; day >= 1; day--) {
    if (progress[day]?.hasData) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function calculateWeekUnlocked(
  progress: Record<number, DayProgress>,
  totalDays: number
): number {
  const totalWeeks = Math.ceil(totalDays / DAYS_IN_WEEK);
  let unlockedWeek = 1;

  for (let week = 1; week <= totalWeeks; week++) {
    const weekStart = (week - 1) * DAYS_IN_WEEK + 1;
    const weekEnd = Math.min(week * DAYS_IN_WEEK, totalDays);
    const daysInThisWeek = weekEnd - weekStart + 1;

    let daysWithData = 0;
    for (let day = weekStart; day <= weekEnd; day++) {
      if (progress[day]?.hasData) {
        daysWithData++;
      }
    }

    const completionRate = daysWithData / daysInThisWeek;
    if (completionRate >= WEEK_UNLOCK_THRESHOLD) {
      unlockedWeek = Math.min(week + 1, totalWeeks + 1);
    } else {
      break;
    }
  }

  return unlockedWeek;
}

export function calculateCompletionPercent(
  progress: Record<number, DayProgress>,
  totalDays: number
): number {
  const daysWithData = Object.values(progress).filter((p) => p.hasData).length;
  return Math.round((daysWithData / totalDays) * 100);
}

export function calculateCumulativeStats(progress: Record<number, DayProgress>): CumulativeStats {
  let totalSteps = 0;
  let totalWater = 0;
  let totalFloors = 0;
  let totalProtein = 0;
  let totalSleepHours = 0;
  let daysCompleted = 0;

  Object.values(progress).forEach((day) => {
    if (day.hasData) {
      totalSteps += day.metrics.steps;
      totalWater += day.metrics.waterLiters;
      totalFloors += day.metrics.floorsClimbed;
      totalProtein += day.metrics.proteinGrams;
      totalSleepHours += day.metrics.sleepHours;
      daysCompleted++;
    }
  });

  return {
    totalSteps,
    totalWater: Math.round(totalWater * 10) / 10,
    totalFloors,
    totalProtein,
    totalSleepHours: Math.round(totalSleepHours * 10) / 10,
    daysCompleted,
  };
}

export function buildDayProgressMap(rows: ChallengeProgress[]): Record<number, DayProgress> {
  const dailyProgress: Record<number, DayProgress> = {};

  rows.forEach((row) => {
    if (row.day_number !== null) {
      dailyProgress[row.day_number] = {
        dayNumber: row.day_number,
        loggedDate: row.logged_date,
        metrics: {
          steps: row.steps || 0,
          waterLiters: Number(row.water_liters) || 0,
          floorsClimbed: row.floors_climbed || 0,
          proteinGrams: row.protein_grams || 0,
          sleepHours: Number(row.sleep_hours) || 0,
          feeling: row.feeling || undefined,
          tomorrowFocus: row.tomorrow_focus || undefined,
        },
        pointsEarned: row.points_earned || 0,
        hasData: true,
      };
    }
  });

  return dailyProgress;
}

export function calculateTotalPoints(progress: Record<number, DayProgress>): number {
  return Object.values(progress).reduce((sum, day) => sum + day.pointsEarned, 0);
}

export function getDateForDay(startDate: string, dayNumber: number): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + (dayNumber - 1));
  return date;
}

/**
 * Pure helper: is a given day number editable?
 * All past days and the current day are editable. Future days are not.
 */
export function isEditableDay(dayNumber: number, currentDay: number): boolean {
  return dayNumber >= 1 && dayNumber <= currentDay;
}

/**
 * Calculate the number of days between two date strings (YYYY-MM-DD).
 * Returns 0 if dateB <= dateA.
 */
export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00Z").getTime();
  const b = new Date(dateB + "T00:00:00Z").getTime();
  const diff = b - a;
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}
