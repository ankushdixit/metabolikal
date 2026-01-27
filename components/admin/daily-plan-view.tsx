/**
 * Daily Plan View Component
 *
 * Main container component for the daily plan view.
 * Displays all 4 plan types (Diet, Supplements, Workout, Lifestyle)
 * in a 2x2 grid layout with day navigation and limit enforcement.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Edit, Plus, Loader2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyPlanData, calculateCurrentDay } from "@/hooks/use-daily-plan-data";
import { getDayDate } from "@/lib/utils/plan-dates";
import { PlanDayNavigator } from "./plan-day-navigator";
import { DailyDietSection } from "./daily-diet-section";
import { DailySupplementsSection } from "./daily-supplements-section";
import { DailyWorkoutSection } from "./daily-workout-section";
import { DailyLifestyleSection } from "./daily-lifestyle-section";

interface DailyPlanViewProps {
  clientId: string;
  onEditSettings?: () => void;
}

/**
 * Daily plan view component
 */
export function DailyPlanView({ clientId, onEditSettings }: DailyPlanViewProps) {
  // Day state - start with 1, will be updated once plan config loads
  const [currentDay, setCurrentDay] = useState(1);
  const [initialDaySet, setInitialDaySet] = useState(false);

  // Fetch plan data for current day
  const {
    dietByMeal,
    supplementPlans,
    workoutBySection,
    lifestylePlans,
    dietTotals,
    workoutTotals,
    supplementCounts,
    planConfig,
    hasLimitsForDay,
    currentLimit,
    isLoading,
    isError,
  } = useDailyPlanData({
    clientId,
    dayNumber: currentDay,
    enabled: !!clientId,
  });

  // Set initial day to "today" once plan config loads
  useEffect(() => {
    if (!initialDaySet && planConfig.startDate && planConfig.durationDays > 0) {
      const today = calculateCurrentDay(planConfig.startDate, planConfig.durationDays);
      setCurrentDay(today);
      setInitialDaySet(true);
    }
  }, [planConfig.startDate, planConfig.durationDays, initialDaySet]);

  // Check if day has any plans
  const hasPlanForDay = useMemo(() => {
    return (
      dietByMeal.size > 0 ||
      supplementPlans.length > 0 ||
      workoutBySection.size > 0 ||
      lifestylePlans.length > 0
    );
  }, [dietByMeal.size, supplementPlans.length, workoutBySection.size, lifestylePlans.length]);

  // Get current day's date string for limit warning
  const currentDayDateStr = useMemo(() => {
    if (!planConfig.startDate) return null;
    const date = getDayDate(planConfig.startDate, currentDay);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [planConfig.startDate, currentDay]);

  // Handle day change
  const handleDayChange = (day: number) => {
    if (day >= 1 && day <= planConfig.durationDays) {
      setCurrentDay(day);
    }
  };

  // Loading state
  if (isLoading && !initialDaySet) {
    return (
      <div className="athletic-card p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="font-bold">Loading daily plan...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="athletic-card p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-bold text-destructive">Failed to load plan data</p>
        </div>
      </div>
    );
  }

  // Plan start date not set state
  if (!planConfig.startDate) {
    return (
      <div className="athletic-card p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertTriangle className="h-12 w-12 text-primary/70" />
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">
              Set a Plan Start Date
            </h3>
            <p className="text-muted-foreground font-medium mb-4 max-w-md">
              A plan start date is required to view daily plans. This maps day numbers to calendar
              dates and enables the daily plan view.
            </p>
          </div>
          {onEditSettings && (
            <button
              onClick={onEditSettings}
              className="btn-athletic flex items-center gap-2 px-6 py-3 gradient-electric text-black font-bold"
            >
              <Settings className="h-5 w-5" />
              <span>Edit Plan Settings</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Day Navigator */}
      <div className="athletic-card p-4">
        <PlanDayNavigator
          currentDay={currentDay}
          totalDays={planConfig.durationDays}
          planStartDate={planConfig.startDate}
          onDayChange={handleDayChange}
          disabled={isLoading}
        />
      </div>

      {/* Limit Warning Banner */}
      {!hasLimitsForDay && currentDayDateStr && (
        <div className="athletic-card p-4 border-l-4 border-l-yellow-500 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm">No macro limits set for {currentDayDateStr}</p>
              <p className="text-muted-foreground text-sm mt-1">
                Set calorie and protein limits before creating diet plans for this day.
              </p>
            </div>
            <Link
              href={`/admin/clients/${clientId}#limits`}
              className="btn-athletic flex items-center gap-1 px-3 py-1.5 text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30"
            >
              <Plus className="h-3 w-3" />
              <span>Add Limit Range</span>
            </Link>
          </div>
        </div>
      )}

      {/* Empty Day State */}
      {!hasPlanForDay ? (
        <div className="athletic-card p-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">
                No Plan for Day {currentDay}
              </h3>
              <p className="text-muted-foreground font-medium max-w-md">
                The client has no diet, supplements, workout, or lifestyle activities planned for
                this day.
              </p>
            </div>
            <Link
              href={`/admin/clients/${clientId}/plans?day=${currentDay}`}
              className={cn(
                "btn-athletic flex items-center gap-2 px-6 py-3 font-bold",
                hasLimitsForDay
                  ? "gradient-electric text-black"
                  : "bg-secondary text-muted-foreground cursor-not-allowed pointer-events-none"
              )}
            >
              <Plus className="h-5 w-5" />
              <span>Create Plan in Timeline Editor</span>
            </Link>
            {!hasLimitsForDay && (
              <p className="text-xs text-muted-foreground">Set macro limits for this day first</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2x2 Grid - Plan Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Diet Section */}
            <DailyDietSection dietByMeal={dietByMeal} totals={dietTotals} />

            {/* Supplements Section */}
            <DailySupplementsSection supplements={supplementPlans} counts={supplementCounts} />

            {/* Workout Section */}
            <DailyWorkoutSection workoutBySection={workoutBySection} totals={workoutTotals} />

            {/* Lifestyle Section */}
            <DailyLifestyleSection activities={lifestylePlans} />
          </div>

          {/* Edit Button */}
          <div className="flex justify-center">
            <Link
              href={`/admin/clients/${clientId}/plans?day=${currentDay}`}
              className={cn(
                "btn-athletic flex items-center gap-2 px-6 py-3 font-bold",
                hasLimitsForDay
                  ? "gradient-electric text-black"
                  : "bg-secondary text-muted-foreground cursor-not-allowed pointer-events-none"
              )}
            >
              <Edit className="h-5 w-5" />
              <span>Edit Plan in Timeline</span>
            </Link>
          </div>
          {!hasLimitsForDay && (
            <p className="text-center text-xs text-muted-foreground -mt-4">
              Set macro limits for this day to enable editing
            </p>
          )}
        </>
      )}

      {/* Current Limit Info (when limits are set) */}
      {hasLimitsForDay && currentLimit && (
        <div className="athletic-card p-4 bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                Active Limits for Day {currentDay}
              </p>
              <p className="text-sm font-bold">
                Max {currentLimit.max_calories_per_day.toLocaleString()} cal |{" "}
                {currentLimit.min_protein_per_day}g
                {currentLimit.max_protein_per_day ? `-${currentLimit.max_protein_per_day}g` : "+"}{" "}
                protein
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {dietTotals.totalCalories.toLocaleString()} /{" "}
                {currentLimit.max_calories_per_day.toLocaleString()} cal
              </p>
              <div className="w-32 h-2 bg-secondary rounded-full mt-1 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    dietTotals.totalCalories > currentLimit.max_calories_per_day
                      ? "bg-red-500"
                      : dietTotals.totalCalories > currentLimit.max_calories_per_day * 0.9
                        ? "bg-yellow-500"
                        : "bg-primary"
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      (dietTotals.totalCalories / currentLimit.max_calories_per_day) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
