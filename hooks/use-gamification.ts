"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

// Constants
const MAX_DAILY_POINTS = 150;
const DAYS_IN_WEEK = 7;
const TOTAL_CHALLENGE_DAYS = 30;
const WEEK_UNLOCK_THRESHOLD = 0.9; // 90% = 6/7 days

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

export interface ChallengeData {
  userId: string;
  startDate: string;
  dailyProgress: Record<number, DayProgress>;
  assessmentPoints: number;
  calculatorPoints: number;
  lastVisitDate: string;
  dailyVisitPointsAwarded: boolean;
}

export interface GamificationState {
  isLoading: boolean;
  user: User | null;
  currentDay: number;
  totalPoints: number;
  dayStreak: number;
  weekUnlocked: number;
  completionPercent: number;
  assessmentPoints: number;
  calculatorPoints: number;
  dailyVisitPoints: number;
  todayProgress: DayProgress | null;
  allProgress: Record<number, DayProgress>;
  cumulativeStats: {
    totalSteps: number;
    totalWater: number;
    totalFloors: number;
    totalProtein: number;
    totalSleepHours: number;
    daysCompleted: number;
  };
}

// Points calculation functions
export function calculateStepsPoints(steps: number): number {
  if (steps >= 15000) return 45;
  if (steps >= 10000) return 30;
  if (steps >= 7000) return 15;
  return 0;
}

export function calculateWaterPoints(liters: number): number {
  return liters >= 3.0 ? 15 : 0;
}

export function calculateFloorsPoints(floors: number): number {
  if (floors >= 14) return 45;
  if (floors >= 4) return 15;
  return 0;
}

export function calculateProteinPoints(grams: number): number {
  return grams >= 70 ? 15 : 0;
}

export function calculateSleepPoints(hours: number): number {
  return hours >= 7 ? 15 : 0;
}

export function calculateMetricsPoints(metrics: DailyMetrics): number {
  return (
    calculateStepsPoints(metrics.steps) +
    calculateWaterPoints(metrics.waterLiters) +
    calculateFloorsPoints(metrics.floorsClimbed) +
    calculateProteinPoints(metrics.proteinGrams) +
    calculateSleepPoints(metrics.sleepHours)
  );
}

export function calculateDailyPoints(metrics: DailyMetrics, includeCheckInBonus: boolean): number {
  const metricsPoints = calculateMetricsPoints(metrics);
  const checkInBonus = includeCheckInBonus ? 15 : 0;
  return Math.min(metricsPoints + checkInBonus, MAX_DAILY_POINTS);
}

// Helper functions
function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function getDaysSinceStart(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diffDays + 1, 1), TOTAL_CHALLENGE_DAYS);
}

function calculateStreak(progress: Record<number, DayProgress>, currentDay: number): number {
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

function calculateWeekUnlocked(progress: Record<number, DayProgress>): number {
  let unlockedWeek = 1;

  for (let week = 1; week <= 4; week++) {
    const weekStart = (week - 1) * DAYS_IN_WEEK + 1;
    const weekEnd = Math.min(week * DAYS_IN_WEEK, TOTAL_CHALLENGE_DAYS);
    const daysInThisWeek = weekEnd - weekStart + 1;

    let daysWithData = 0;
    for (let day = weekStart; day <= weekEnd; day++) {
      if (progress[day]?.hasData) {
        daysWithData++;
      }
    }

    const completionRate = daysWithData / daysInThisWeek;
    if (completionRate >= WEEK_UNLOCK_THRESHOLD) {
      unlockedWeek = Math.min(week + 1, 5); // Week 5 means all unlocked (days 29-30)
    } else {
      break;
    }
  }

  return unlockedWeek;
}

function calculateCompletionPercent(progress: Record<number, DayProgress>): number {
  const daysWithData = Object.values(progress).filter((p) => p.hasData).length;
  return Math.round((daysWithData / TOTAL_CHALLENGE_DAYS) * 100);
}

function calculateCumulativeStats(progress: Record<number, DayProgress>) {
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

function getEmptyDayProgress(dayNumber: number): DayProgress {
  return {
    dayNumber,
    loggedDate: getDateString(),
    metrics: {
      steps: 0,
      waterLiters: 0,
      floorsClimbed: 0,
      proteinGrams: 0,
      sleepHours: 0,
    },
    pointsEarned: 0,
    hasData: false,
  };
}

interface ChallengeProgressRow {
  id: string;
  user_id: string;
  day_number: number;
  logged_date: string;
  steps: number;
  water_liters: number;
  floors_climbed: number;
  protein_grams: number;
  sleep_hours: number;
  feeling: string | null;
  tomorrow_focus: string | null;
  points_earned: number;
}

// Main hook - now requires authentication
export function useGamification() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [dailyVisitPoints, setDailyVisitPoints] = useState(0);
  const [startDate, setStartDate] = useState<string>(getDateString());

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // Load data from database
  const loadChallengeData = useCallback(
    async (userId: string) => {
      if (!supabase) return null;

      try {
        // Fetch all challenge progress for this user
        const { data: progressData, error } = await supabase
          .from("challenge_progress")
          .select("*")
          .eq("user_id", userId)
          .order("day_number", { ascending: true });

        if (error) {
          console.error("Error loading challenge progress:", error);
          return null;
        }

        // Convert database rows to DayProgress records
        const dailyProgress: Record<number, DayProgress> = {};
        let earliestDate = getDateString();

        if (progressData && progressData.length > 0) {
          progressData.forEach((row: ChallengeProgressRow) => {
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

              // Track earliest date to calculate start date
              if (row.logged_date < earliestDate) {
                earliestDate = row.logged_date;
              }
            }
          });
        }

        // Calculate start date based on day 1 entry or current date
        const calculatedStartDate =
          progressData && progressData.length > 0
            ? calculateStartDateFromProgress(dailyProgress)
            : getDateString();

        return {
          userId,
          startDate: calculatedStartDate,
          dailyProgress,
          assessmentPoints: 0,
          calculatorPoints: 0,
          lastVisitDate: getDateString(),
          dailyVisitPointsAwarded: false,
        };
      } catch (error) {
        console.error("Error loading challenge data:", error);
        return null;
      }
    },
    [supabase]
  );

  // Calculate start date from the earliest day 1 entry
  function calculateStartDateFromProgress(progress: Record<number, DayProgress>): string {
    const day1 = progress[1];
    if (day1) {
      return day1.loggedDate;
    }
    // If no day 1, estimate from the earliest entry
    const entries = Object.values(progress).sort((a, b) => a.dayNumber - b.dayNumber);
    if (entries.length > 0) {
      const earliest = entries[0];
      const date = new Date(earliest.loggedDate);
      date.setDate(date.getDate() - (earliest.dayNumber - 1));
      return getDateString(date);
    }
    return getDateString();
  }

  // Initialize and subscribe to auth changes
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const initializeGamification = async () => {
      setIsLoading(true);

      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
        const data = await loadChallengeData(currentUser.id);
        if (data) {
          setChallengeData(data);
          setStartDate(data.startDate);

          // Award daily visit points
          const today = getDateString();
          if (data.lastVisitDate !== today) {
            setDailyVisitPoints(10);
          }
        }
      } else {
        // Not authenticated - clear state
        setUser(null);
        setChallengeData(null);
      }

      setIsLoading(false);
    };

    initializeGamification();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          setUser(session.user);
          const data = await loadChallengeData(session.user.id);
          if (data) {
            setChallengeData(data);
            setStartDate(data.startDate);
          }
        } else {
          setUser(null);
          setChallengeData(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadChallengeData]);

  // Calculate current day
  const currentDay = useMemo(() => {
    return getDaysSinceStart(startDate);
  }, [startDate]);

  // Get today's progress
  const todayProgress = useMemo(() => {
    if (!challengeData) return null;
    return challengeData.dailyProgress[currentDay] || getEmptyDayProgress(currentDay);
  }, [challengeData, currentDay]);

  // Calculate total points
  const totalPoints = useMemo(() => {
    if (!challengeData) return 0;

    const progressPoints = Object.values(challengeData.dailyProgress).reduce(
      (sum, day) => sum + day.pointsEarned,
      0
    );

    return (
      progressPoints +
      challengeData.assessmentPoints +
      challengeData.calculatorPoints +
      dailyVisitPoints
    );
  }, [challengeData, dailyVisitPoints]);

  // Calculate day streak
  const dayStreak = useMemo(() => {
    if (!challengeData) return 0;
    return calculateStreak(challengeData.dailyProgress, currentDay);
  }, [challengeData, currentDay]);

  // Calculate week unlocked
  const weekUnlocked = useMemo(() => {
    if (!challengeData) return 1;
    return calculateWeekUnlocked(challengeData.dailyProgress);
  }, [challengeData]);

  // Calculate completion percent
  const completionPercent = useMemo(() => {
    if (!challengeData) return 0;
    return calculateCompletionPercent(challengeData.dailyProgress);
  }, [challengeData]);

  // Calculate cumulative stats
  const cumulativeStats = useMemo(() => {
    if (!challengeData)
      return {
        totalSteps: 0,
        totalWater: 0,
        totalFloors: 0,
        totalProtein: 0,
        totalSleepHours: 0,
        daysCompleted: 0,
      };
    return calculateCumulativeStats(challengeData.dailyProgress);
  }, [challengeData]);

  // Save today's progress to database
  const saveTodayProgress = useCallback(
    async (metrics: DailyMetrics): Promise<boolean> => {
      if (!user || !challengeData || !supabase) return false;

      const points = calculateDailyPoints(metrics, true);
      const today = getDateString();

      try {
        // Upsert to database
        const { error } = await supabase.from("challenge_progress").upsert(
          {
            user_id: user.id,
            visitor_id: user.id, // Use user_id as visitor_id for compatibility
            day_number: currentDay,
            logged_date: today,
            steps: metrics.steps,
            water_liters: metrics.waterLiters,
            floors_climbed: metrics.floorsClimbed,
            protein_grams: metrics.proteinGrams,
            sleep_hours: metrics.sleepHours,
            feeling: metrics.feeling || null,
            tomorrow_focus: metrics.tomorrowFocus || null,
            points_earned: points,
          },
          {
            onConflict: "user_id,day_number",
          }
        );

        if (error) {
          console.error("Error saving progress:", error);
          return false;
        }

        // Update local state
        const newProgress: DayProgress = {
          dayNumber: currentDay,
          loggedDate: today,
          metrics,
          pointsEarned: points,
          hasData: true,
        };

        setChallengeData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            dailyProgress: {
              ...prev.dailyProgress,
              [currentDay]: newProgress,
            },
          };
        });

        return true;
      } catch (error) {
        console.error("Error saving progress:", error);
        return false;
      }
    },
    [user, challengeData, currentDay, supabase]
  );

  // Check if editing a specific day is allowed
  const canEditDay = useCallback(
    (dayNumber: number): boolean => {
      // Can only edit current day or earlier days on the same date
      if (dayNumber > currentDay) return false;
      if (dayNumber === currentDay) return true;

      // For previous days, check if we're still on that day (before midnight)
      const progress = challengeData?.dailyProgress[dayNumber];
      if (!progress) return dayNumber === currentDay;

      const progressDate = progress.loggedDate;
      const today = getDateString();
      return progressDate === today;
    },
    [challengeData, currentDay]
  );

  // Award assessment points
  const awardAssessmentPoints = useCallback((points: number) => {
    setChallengeData((prev) => {
      if (!prev || prev.assessmentPoints > 0) return prev;
      return {
        ...prev,
        assessmentPoints: points,
      };
    });
  }, []);

  // Award calculator points
  const awardCalculatorPoints = useCallback((points: number) => {
    setChallengeData((prev) => {
      if (!prev || prev.calculatorPoints > 0) return prev;
      return {
        ...prev,
        calculatorPoints: points,
      };
    });
  }, []);

  // Get progress for a specific day
  const getDayProgress = useCallback(
    (dayNumber: number): DayProgress | null => {
      if (!challengeData) return null;
      return challengeData.dailyProgress[dayNumber] || null;
    },
    [challengeData]
  );

  // Check if a day is unlocked
  const isDayUnlocked = useCallback(
    (dayNumber: number): boolean => {
      const weekForDay = Math.ceil(dayNumber / DAYS_IN_WEEK);
      return weekForDay <= weekUnlocked;
    },
    [weekUnlocked]
  );

  // Reset challenge (admin/testing only)
  const resetChallenge = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      // Delete all progress for this user
      await supabase.from("challenge_progress").delete().eq("user_id", user.id);

      // Reset local state
      setChallengeData({
        userId: user.id,
        startDate: getDateString(),
        dailyProgress: {},
        assessmentPoints: 0,
        calculatorPoints: 0,
        lastVisitDate: getDateString(),
        dailyVisitPointsAwarded: false,
      });
      setStartDate(getDateString());
      setDailyVisitPoints(0);
    } catch (error) {
      console.error("Error resetting challenge:", error);
    }
  }, [user, supabase]);

  const state: GamificationState = {
    isLoading,
    user,
    currentDay,
    totalPoints,
    dayStreak,
    weekUnlocked,
    completionPercent,
    assessmentPoints: challengeData?.assessmentPoints || 0,
    calculatorPoints: challengeData?.calculatorPoints || 0,
    dailyVisitPoints,
    todayProgress,
    allProgress: challengeData?.dailyProgress || {},
    cumulativeStats,
  };

  return {
    ...state,
    saveTodayProgress,
    canEditDay,
    awardAssessmentPoints,
    awardCalculatorPoints,
    getDayProgress,
    isDayUnlocked,
    resetChallenge,
    calculateMetricsPoints,
  };
}

// Type for the hook return value
export type UseGamificationReturn = ReturnType<typeof useGamification>;
