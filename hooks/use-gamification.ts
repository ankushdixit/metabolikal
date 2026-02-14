"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import {
  getDateString,
  getDaysSinceStart,
  calculateStreak,
  calculateWeekUnlocked,
  calculateCompletionPercent,
  calculateCumulativeStats,
  buildDayProgressMap,
  DEFAULT_CHALLENGE_DAYS,
  DAYS_IN_WEEK,
} from "@/lib/challenge-utils";
import type { DailyMetrics, DayProgress } from "@/lib/challenge-utils";

// Re-export types so existing imports don't break
export type { DailyMetrics, DayProgress } from "@/lib/challenge-utils";

// Constants (kept here — only used by client-facing points logic)
const MAX_DAILY_POINTS = 150;

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
  totalDays: number;
  startDate: string;
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

// Main hook - now requires authentication
export function useGamification() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [dailyVisitPoints, setDailyVisitPoints] = useState(0);
  const [startDate, setStartDate] = useState<string>(getDateString());
  const [totalDays, setTotalDays] = useState<number>(DEFAULT_CHALLENGE_DAYS);
  const [planCycle, setPlanCycle] = useState<number>(1);

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // Load data from database
  const loadChallengeData = useCallback(
    async (userId: string, cycle: number = 1) => {
      if (!supabase) return null;

      try {
        // Fetch all challenge progress for this user and current plan cycle
        const { data: progressData, error } = await supabase
          .from("challenge_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("plan_cycle", cycle)
          .order("day_number", { ascending: true });

        if (error) {
          console.error("Error loading challenge progress:", error);
          return null;
        }

        // Convert database rows to DayProgress records
        const dailyProgress = progressData?.length ? buildDayProgressMap(progressData) : {};

        return {
          userId,
          startDate: getDateString(), // Placeholder — overwritten by profile start date
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

  // Fetch profile to determine challenge duration, start date, and plan cycle
  const loadProfileDuration = useCallback(
    async (
      userId: string
    ): Promise<{ totalDays: number; planStartDate: string; planCycle: number }> => {
      if (!supabase)
        return { totalDays: DEFAULT_CHALLENGE_DAYS, planStartDate: getDateString(), planCycle: 1 };

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, plan_duration_days, plan_start_date, current_plan_cycle, created_at")
          .eq("id", userId)
          .single();

        if (profile) {
          return {
            totalDays: profile.plan_duration_days || DEFAULT_CHALLENGE_DAYS,
            planStartDate:
              profile.plan_start_date || profile.created_at?.split("T")[0] || getDateString(),
            planCycle: profile.current_plan_cycle || 1,
          };
        }
      } catch (error) {
        console.error("Error loading profile duration:", error);
      }

      return { totalDays: DEFAULT_CHALLENGE_DAYS, planStartDate: getDateString(), planCycle: 1 };
    },
    [supabase]
  );

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

        // Fetch profile first to get plan cycle
        const profileResult = await loadProfileDuration(currentUser.id);
        setTotalDays(profileResult.totalDays);
        setPlanCycle(profileResult.planCycle);

        // Then fetch challenge data with the correct plan cycle
        const data = await loadChallengeData(currentUser.id, profileResult.planCycle);

        if (data) {
          data.startDate = profileResult.planStartDate;
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
        setTotalDays(DEFAULT_CHALLENGE_DAYS);
        setPlanCycle(1);
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

          const profileResult = await loadProfileDuration(session.user.id);
          setTotalDays(profileResult.totalDays);
          setPlanCycle(profileResult.planCycle);

          const data = await loadChallengeData(session.user.id, profileResult.planCycle);

          if (data) {
            data.startDate = profileResult.planStartDate;
            setChallengeData(data);
            setStartDate(data.startDate);
          }
        } else {
          setUser(null);
          setChallengeData(null);
          setTotalDays(DEFAULT_CHALLENGE_DAYS);
          setPlanCycle(1);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadChallengeData, loadProfileDuration]);

  // Calculate current day
  const currentDay = useMemo(() => {
    return getDaysSinceStart(startDate, totalDays);
  }, [startDate, totalDays]);

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
    return calculateWeekUnlocked(challengeData.dailyProgress, totalDays);
  }, [challengeData, totalDays]);

  // Calculate completion percent
  const completionPercent = useMemo(() => {
    if (!challengeData) return 0;
    return calculateCompletionPercent(challengeData.dailyProgress, totalDays);
  }, [challengeData, totalDays]);

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
            plan_cycle: planCycle,
          },
          {
            onConflict: "user_id,day_number,plan_cycle",
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
    [user, challengeData, currentDay, planCycle, supabase]
  );

  // Check if editing a specific day is allowed (week-lock: can edit any day in unlocked weeks)
  const canEditDay = useCallback(
    (dayNumber: number): boolean => {
      if (dayNumber < 1 || dayNumber > currentDay) return false;
      const weekForDay = Math.ceil(dayNumber / DAYS_IN_WEEK);
      return weekForDay <= weekUnlocked;
    },
    [currentDay, weekUnlocked]
  );

  // Save progress for any editable day
  const saveDayProgress = useCallback(
    async (dayNumber: number, metrics: DailyMetrics): Promise<boolean> => {
      if (!user || !supabase) return false;

      try {
        const points = calculateDailyPoints(metrics, true);

        // Compute logged_date in pure UTC to avoid local-time drift
        let loggedDate: string;
        if (startDate) {
          const startMs = new Date(startDate + "T00:00:00Z").getTime();
          loggedDate = new Date(startMs + (dayNumber - 1) * 86_400_000).toISOString().split("T")[0];
        } else {
          loggedDate = getDateString();
        }

        const { error } = await supabase.from("challenge_progress").upsert(
          {
            user_id: user.id,
            visitor_id: user.id,
            day_number: dayNumber,
            logged_date: loggedDate,
            steps: metrics.steps,
            water_liters: metrics.waterLiters,
            floors_climbed: metrics.floorsClimbed,
            protein_grams: metrics.proteinGrams,
            sleep_hours: metrics.sleepHours,
            feeling: metrics.feeling || null,
            tomorrow_focus: metrics.tomorrowFocus || null,
            points_earned: points,
            plan_cycle: planCycle,
          },
          {
            onConflict: "user_id,day_number,plan_cycle",
          }
        );

        if (error) {
          console.error("Error saving day progress:", error);
          return false;
        }

        const newProgress: DayProgress = {
          dayNumber,
          loggedDate,
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
              [dayNumber]: newProgress,
            },
          };
        });

        return true;
      } catch (error) {
        console.error("Error saving day progress:", error);
        return false;
      }
    },
    [user, supabase, startDate, planCycle]
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
      // Delete progress for this user's current plan cycle
      await supabase
        .from("challenge_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("plan_cycle", planCycle);

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
  }, [user, planCycle, supabase]);

  const state: GamificationState = {
    isLoading,
    user,
    currentDay,
    totalDays,
    startDate,
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
    saveDayProgress,
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
