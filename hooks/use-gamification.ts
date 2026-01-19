"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// Constants
const CHALLENGE_DATA_KEY = "metabolikal_challenge_data";
const VISITOR_ID_KEY = "metabolikal_visitor_id";
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
  visitorId: string;
  startDate: string;
  dailyProgress: Record<number, DayProgress>;
  assessmentPoints: number;
  calculatorPoints: number;
  lastVisitDate: string;
  dailyVisitPointsAwarded: boolean;
}

export interface GamificationState {
  isLoading: boolean;
  visitorId: string | null;
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

function getDefaultChallengeData(visitorId: string): ChallengeData {
  return {
    visitorId,
    startDate: getDateString(),
    dailyProgress: {},
    assessmentPoints: 0,
    calculatorPoints: 0,
    lastVisitDate: "",
    dailyVisitPointsAwarded: false,
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

// Main hook
export function useGamification() {
  const [isLoading, setIsLoading] = useState(true);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [dailyVisitPoints, setDailyVisitPoints] = useState(0);

  // Load data from localStorage on mount
  useEffect(() => {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    const storedData = localStorage.getItem(CHALLENGE_DATA_KEY);
    let data: ChallengeData;

    if (storedData) {
      try {
        data = JSON.parse(storedData);
        // Ensure visitorId matches
        if (data.visitorId !== visitorId) {
          data.visitorId = visitorId;
        }
      } catch {
        data = getDefaultChallengeData(visitorId);
      }
    } else {
      data = getDefaultChallengeData(visitorId);
    }

    // Award daily visit points (10 pts, once per day)
    const today = getDateString();
    if (data.lastVisitDate !== today) {
      data.lastVisitDate = today;
      data.dailyVisitPointsAwarded = true;
      setDailyVisitPoints(10);
    } else if (data.dailyVisitPointsAwarded) {
      setDailyVisitPoints(10);
    }

    setChallengeData(data);
    setIsLoading(false);

    // Save to localStorage
    localStorage.setItem(CHALLENGE_DATA_KEY, JSON.stringify(data));
  }, []);

  // Persist data to localStorage on changes
  useEffect(() => {
    if (challengeData && !isLoading) {
      localStorage.setItem(CHALLENGE_DATA_KEY, JSON.stringify(challengeData));
    }
  }, [challengeData, isLoading]);

  // Calculate current day
  const currentDay = useMemo(() => {
    if (!challengeData) return 1;
    return getDaysSinceStart(challengeData.startDate);
  }, [challengeData]);

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

  // Save today's progress
  const saveTodayProgress = useCallback(
    (metrics: DailyMetrics) => {
      if (!challengeData) return false;

      const points = calculateDailyPoints(metrics, true); // Include check-in bonus

      const newProgress: DayProgress = {
        dayNumber: currentDay,
        loggedDate: getDateString(),
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
    },
    [challengeData, currentDay]
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

  // Reset challenge (for testing)
  const resetChallenge = useCallback(() => {
    const visitorId = localStorage.getItem(VISITOR_ID_KEY) || crypto.randomUUID();
    const newData = getDefaultChallengeData(visitorId);
    setChallengeData(newData);
    setDailyVisitPoints(0);
    localStorage.setItem(CHALLENGE_DATA_KEY, JSON.stringify(newData));
  }, []);

  const state: GamificationState = {
    isLoading,
    visitorId: challengeData?.visitorId || null,
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
