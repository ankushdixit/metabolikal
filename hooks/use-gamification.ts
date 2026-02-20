"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { useOptionalAuth } from "@/contexts/auth-context";
import {
  getDateString,
  getDaysSinceStart,
  calculateStreak,
  calculateWeekUnlocked,
  calculateCompletionPercent,
  calculateCumulativeStats,
  buildDayProgressMap,
  daysBetween,
  DEFAULT_CHALLENGE_DAYS,
  DAYS_IN_WEEK,
} from "@/lib/challenge-utils";
import type { DailyMetrics, DayProgress } from "@/lib/challenge-utils";

// Re-export types so existing imports don't break
export type { DailyMetrics, DayProgress } from "@/lib/challenge-utils";

// Constants (kept here — only used by client-facing points logic)
const MAX_DAILY_POINTS = 150;
const SAVE_TIMEOUT_MS = 10_000; // 10 second timeout for save operations

/** Race an async operation against a timeout. Rejects on timeout. */
function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error("Save timed out")), ms);
    fn().then(
      (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
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
  user: { id: string } | null;
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

// Main hook - uses AuthContext for userId when available (Task 1.3)
export function useGamification() {
  const auth = useOptionalAuth();
  // When inside AuthProvider, use cached userId. Otherwise track it locally.
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const authUserId = auth?.userId ?? localUserId;

  const [isLoading, setIsLoading] = useState(true);
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
        // Fetch challenge progress for this user and current plan cycle (with column selection)
        const { data: progressData, error } = await supabase
          .from("challenge_progress")
          .select(
            "day_number, logged_date, steps, water_liters, floors_climbed, protein_grams, sleep_hours, feeling, tomorrow_focus, points_earned"
          )
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
          .select(
            "role, plan_duration_days, plan_start_date, current_plan_cycle, challenge_start_date, created_at"
          )
          .eq("id", userId)
          .single();

        if (profile) {
          const planDuration = profile.plan_duration_days || DEFAULT_CHALLENGE_DAYS;
          const planStart =
            profile.plan_start_date || profile.created_at?.split("T")[0] || getDateString();
          const challengeStart = profile.challenge_start_date;

          // If the user was upgraded from challenger → client and their original
          // challenge started before the new plan_start_date, extend totalDays
          // to cover the gap so their original progress days remain valid.
          if (challengeStart && challengeStart < planStart) {
            const gapDays = daysBetween(challengeStart, planStart);
            return {
              totalDays: gapDays + planDuration,
              planStartDate: challengeStart,
              planCycle: profile.current_plan_cycle || 1,
            };
          }

          return {
            totalDays: planDuration,
            planStartDate: planStart,
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

  // Derive profile duration from AuthContext when available (Task 3.7)
  // This avoids a separate profile query when inside AuthProvider.
  const deriveProfileFromAuth = useCallback((): {
    totalDays: number;
    planStartDate: string;
    planCycle: number;
  } | null => {
    const profile = auth?.profile;
    if (!profile) return null;

    const planDuration = profile.plan_duration_days || DEFAULT_CHALLENGE_DAYS;
    const planStart =
      profile.plan_start_date || profile.created_at?.split("T")[0] || getDateString();
    const challengeStart = profile.challenge_start_date;

    if (challengeStart && challengeStart < planStart) {
      const gapDays = daysBetween(challengeStart, planStart);
      return {
        totalDays: gapDays + planDuration,
        planStartDate: challengeStart,
        planCycle: profile.current_plan_cycle || 1,
      };
    }

    return {
      totalDays: planDuration,
      planStartDate: planStart,
      planCycle: profile.current_plan_cycle || 1,
    };
  }, [auth?.profile]);

  // Initialize when userId becomes available (Task 1.3)
  // Inside AuthProvider: reacts to auth.userId changes, no getUser()/onAuthStateChange needed.
  // Outside AuthProvider (public page): falls back to getUser() + onAuthStateChange.
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // If AuthProvider is present and still loading, wait for it
    if (auth && auth.isLoading) return;

    // If AuthProvider gave us a userId (or localUserId was set by fallback), use it
    const effectiveUserId = auth?.userId ?? localUserId;

    if (!effectiveUserId && auth) {
      // AuthProvider is done loading and user isn't authenticated
      setChallengeData(null);
      setTotalDays(DEFAULT_CHALLENGE_DAYS);
      setPlanCycle(1);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const initializeGamification = async (userId: string) => {
      setIsLoading(true);

      // Task 3.7: Use cached auth profile when available to skip the profile query
      const cachedProfile = deriveProfileFromAuth();
      const profileResult = cachedProfile ?? (await loadProfileDuration(userId));
      if (cancelled) return;
      setTotalDays(profileResult.totalDays);
      setPlanCycle(profileResult.planCycle);

      const data = await loadChallengeData(userId, profileResult.planCycle);
      if (cancelled) return;

      if (data) {
        data.startDate = profileResult.planStartDate;
        setChallengeData(data);
        setStartDate(data.startDate);

        const today = getDateString();
        if (data.lastVisitDate !== today) {
          setDailyVisitPoints(10);
        }
      }

      setIsLoading(false);
    };

    if (effectiveUserId) {
      initializeGamification(effectiveUserId);
    } else {
      // No AuthProvider — resolve userId via getUser() (public page fallback)
      supabase.auth
        .getUser()
        .then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
          if (cancelled) return;
          if (user) {
            setLocalUserId(user.id);
            // The effect will re-run with the new localUserId
          } else {
            setChallengeData(null);
            setTotalDays(DEFAULT_CHALLENGE_DAYS);
            setPlanCycle(1);
            setIsLoading(false);
          }
        });
    }

    // Only subscribe to onAuthStateChange when outside AuthProvider
    let subscription: { unsubscribe: () => void } | null = null;
    if (!auth) {
      const { data } = supabase.auth.onAuthStateChange(
        (_event: string, session: { user: { id: string } } | null) => {
          if (session?.user) {
            setLocalUserId(session.user.id);
          } else {
            setLocalUserId(null);
            setChallengeData(null);
            setTotalDays(DEFAULT_CHALLENGE_DAYS);
            setPlanCycle(1);
          }
        }
      );
      subscription = data.subscription;
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [auth, localUserId, supabase, loadChallengeData, loadProfileDuration, deriveProfileFromAuth]);

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
      if (!authUserId || !challengeData || !supabase) return false;

      const points = calculateDailyPoints(metrics, true);
      const today = getDateString();

      try {
        // Upsert to database with timeout to prevent indefinite hang
        const upsertError = await withTimeout(async () => {
          const { error: err } = await supabase.from("challenge_progress").upsert(
            {
              user_id: authUserId,
              visitor_id: authUserId, // Use user_id as visitor_id for compatibility
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
            { onConflict: "user_id,day_number,plan_cycle" }
          );
          return err;
        }, SAVE_TIMEOUT_MS);

        if (upsertError) {
          console.error("Error saving progress:", upsertError);
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
    [authUserId, challengeData, currentDay, planCycle, supabase]
  );

  // Check if editing a specific day is allowed
  // All past days and the current day are editable — week-lock is visual only
  const canEditDay = useCallback(
    (dayNumber: number): boolean => dayNumber >= 1 && dayNumber <= currentDay,
    [currentDay]
  );

  // Save progress for any editable day
  const saveDayProgress = useCallback(
    async (dayNumber: number, metrics: DailyMetrics): Promise<boolean> => {
      if (!authUserId || !supabase) return false;

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

        const upsertError = await withTimeout(async () => {
          const { error: err } = await supabase.from("challenge_progress").upsert(
            {
              user_id: authUserId,
              visitor_id: authUserId,
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
            { onConflict: "user_id,day_number,plan_cycle" }
          );
          return err;
        }, SAVE_TIMEOUT_MS);

        if (upsertError) {
          console.error("Error saving day progress:", upsertError);
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
    [authUserId, supabase, startDate, planCycle]
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
    if (!authUserId || !supabase) return;

    try {
      // Delete progress for this user's current plan cycle
      await supabase
        .from("challenge_progress")
        .delete()
        .eq("user_id", authUserId)
        .eq("plan_cycle", planCycle);

      // Reset local state
      setChallengeData({
        userId: authUserId,
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
  }, [authUserId, planCycle, supabase]);

  const state: GamificationState = {
    isLoading,
    user: authUserId ? { id: authUserId } : null,
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
