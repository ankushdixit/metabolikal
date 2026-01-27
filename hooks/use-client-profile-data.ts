/**
 * useClientProfileData Hook
 *
 * Combined data fetching hook for the enhanced client profile page.
 * Fetches profile, medical conditions, and plan limits, then calculates
 * plan progress information.
 */

"use client";

import { useMemo } from "react";
import { useList } from "@refinedev/core";
import { categorizeLimits, type CategorizedLimits } from "./use-client-plan-limits";
import type { Profile, ClientCondition, ClientPlanLimit } from "@/lib/database.types";

export interface UseClientProfileDataOptions {
  userId: string | null;
}

/**
 * Joined type for client conditions with medical condition details
 */
export interface ClientConditionWithDetails extends ClientCondition {
  medical_conditions: {
    id: string;
    name: string;
    description: string | null;
    impact_percent: number;
  } | null;
}

/**
 * Plan information derived from profile data
 */
export interface PlanInfo {
  isConfigured: boolean;
  startDate?: Date;
  endDate?: Date;
  durationDays?: number;
  dayNumber?: number;
  daysRemaining?: number;
  progressPercent?: number;
  isBeforeStart?: boolean;
  isCompleted?: boolean;
}

/**
 * Hook for fetching all client profile page data
 */
export function useClientProfileData({ userId }: UseClientProfileDataOptions) {
  // Fetch client conditions with medical condition names
  const conditionsQuery = useList<ClientConditionWithDetails>({
    resource: "client_conditions",
    filters: [{ field: "client_id", operator: "eq", value: userId || "" }],
    meta: {
      select: "*, medical_conditions(id, name, description, impact_percent)",
    },
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Fetch all plan limits for the client (to show current + upcoming)
  const limitsQuery = useList<ClientPlanLimit>({
    resource: "client_plan_limits",
    filters: [{ field: "client_id", operator: "eq", value: userId || "" }],
    sorters: [{ field: "start_date", order: "asc" }],
    queryOptions: {
      enabled: !!userId,
    },
  });

  const conditions = conditionsQuery.query.data?.data || [];
  const limits = limitsQuery.query.data?.data || [];

  // Categorize limits into current/future/past
  const categorizedLimits = useMemo<CategorizedLimits>(() => {
    return categorizeLimits(limits);
  }, [limits]);

  return {
    conditions,
    limits,
    currentLimits: categorizedLimits.current,
    futureLimits: categorizedLimits.future,
    isLoading: conditionsQuery.query.isLoading || limitsQuery.query.isLoading,
    isError: conditionsQuery.query.isError || limitsQuery.query.isError,
    refetch: () => {
      conditionsQuery.query.refetch();
      limitsQuery.query.refetch();
    },
  };
}

/**
 * Calculate plan progress information from profile data
 */
export function calculatePlanInfo(profile: Profile | null | undefined): PlanInfo {
  if (!profile?.plan_start_date) {
    return { isConfigured: false };
  }

  const startDate = new Date(profile.plan_start_date + "T00:00:00");
  const durationDays = profile.plan_duration_days || 7;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays - 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const daysRemaining = Math.max(0, durationDays - dayNumber + 1);
  const progressPercent = Math.min(100, Math.max(0, Math.round((dayNumber / durationDays) * 100)));

  return {
    isConfigured: true,
    startDate,
    endDate,
    durationDays,
    dayNumber: Math.max(1, dayNumber),
    daysRemaining,
    progressPercent,
    isBeforeStart: today < startDate,
    isCompleted: dayNumber > durationDays,
  };
}

/**
 * Format a date for display (e.g., "January 15, 2026")
 */
export function formatPlanDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format macro limit for display
 * Handles min-only, max-only, and range cases
 */
export function formatMacroRange(
  min: number | null | undefined,
  max: number | null | undefined,
  unit: string
): string | null {
  if (min != null && max != null) {
    if (min === max) {
      return `${min.toLocaleString()}${unit}`;
    }
    return `${min.toLocaleString()} - ${max.toLocaleString()}${unit}`;
  }
  if (min != null) {
    return `${min.toLocaleString()}${unit} min`;
  }
  if (max != null) {
    return `${max.toLocaleString()}${unit} max`;
  }
  return null;
}
