/**
 * useClientPlanLimits Hook
 *
 * Hook for managing client plan limits - date-range based macro limits for diet plans.
 * Provides CRUD operations and utility functions for date overlap detection and
 * range categorization (current/future/past).
 */

"use client";

import { useMemo, useCallback } from "react";
import { useList, useCreate, useUpdate, useDelete, useInvalidate } from "@refinedev/core";
import { toast } from "sonner";
import type {
  ClientPlanLimit,
  ClientPlanLimitInsert,
  ClientPlanLimitUpdate,
} from "@/lib/database.types";

export interface UseClientPlanLimitsOptions {
  clientId: string;
  enabled?: boolean;
}

export interface CategorizedLimits {
  current: ClientPlanLimit | null;
  future: ClientPlanLimit[];
  past: ClientPlanLimit[];
}

/**
 * Get all dates covered by existing ranges
 */
export function getUnavailableDates(existingRanges: ClientPlanLimit[], excludeId?: string): Date[] {
  const dates: Date[] = [];

  for (const range of existingRanges) {
    // Skip the range being edited
    if (excludeId && range.id === excludeId) continue;

    const current = new Date(range.start_date + "T00:00:00");
    const end = new Date(range.end_date + "T00:00:00");

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  return dates;
}

/**
 * Check if a date is in the unavailable dates list
 */
export function isDateUnavailable(date: Date, unavailableDates: Date[]): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return unavailableDates.some((d) => d.toISOString().split("T")[0] === dateStr);
}

/**
 * Check if a proposed range overlaps with existing ranges
 */
export function hasOverlap(
  newStart: Date,
  newEnd: Date,
  existingRanges: ClientPlanLimit[],
  excludeId?: string
): boolean {
  return existingRanges.some((range) => {
    // Skip the range being edited
    if (excludeId && range.id === excludeId) return false;

    const existingStart = new Date(range.start_date + "T00:00:00");
    const existingEnd = new Date(range.end_date + "T00:00:00");

    // Ranges overlap if newStart <= existingEnd AND newEnd >= existingStart
    return newStart <= existingEnd && newEnd >= existingStart;
  });
}

/**
 * Categorize limits into current, future, and past
 */
export function categorizeLimits(limits: ClientPlanLimit[]): CategorizedLimits {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  let current: ClientPlanLimit | null = null;
  const future: ClientPlanLimit[] = [];
  const past: ClientPlanLimit[] = [];

  // Sort by start_date ascending
  const sorted = [...limits].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  for (const limit of sorted) {
    const startDate = limit.start_date;
    const endDate = limit.end_date;

    if (startDate <= todayStr && endDate >= todayStr) {
      // Current range covers today
      current = limit;
    } else if (startDate > todayStr) {
      // Future range starts after today
      future.push(limit);
    } else {
      // Past range ended before today
      past.push(limit);
    }
  }

  // Sort past by end_date descending (most recent first)
  past.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

  return { current, future, past };
}

/**
 * Format a date range for display
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  const formatOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  // Include year if different from current year
  const currentYear = new Date().getFullYear();
  if (start.getFullYear() !== currentYear || end.getFullYear() !== currentYear) {
    formatOptions.year = "numeric";
  }

  return `${start.toLocaleDateString("en-US", formatOptions)} - ${end.toLocaleDateString("en-US", formatOptions)}`;
}

/**
 * Hook for managing client plan limits
 */
export function useClientPlanLimits({ clientId, enabled = true }: UseClientPlanLimitsOptions) {
  const invalidate = useInvalidate();

  // Fetch all limits for the client
  const limitsQuery = useList<ClientPlanLimit>({
    resource: "client_plan_limits",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    sorters: [{ field: "start_date", order: "asc" }],
    queryOptions: {
      enabled: enabled && !!clientId,
    },
  });

  const { mutateAsync: createLimit } = useCreate<ClientPlanLimit>();
  const { mutateAsync: updateLimit } = useUpdate<ClientPlanLimit>();
  const { mutateAsync: deleteLimit } = useDelete<ClientPlanLimit>();

  // Raw limits data
  const limits = limitsQuery.query.data?.data || [];

  // Categorized limits
  const categorizedLimits = useMemo(() => categorizeLimits(limits), [limits]);

  // Unavailable dates (for date picker)
  const unavailableDates = useMemo(() => getUnavailableDates(limits), [limits]);

  // Create a new limit range
  const createLimitRange = useCallback(
    async (data: Omit<ClientPlanLimitInsert, "client_id">) => {
      // Check for overlap before creating
      const newStart = new Date(data.start_date + "T00:00:00");
      const newEnd = new Date(data.end_date + "T00:00:00");

      if (hasOverlap(newStart, newEnd, limits)) {
        toast.error("Date range overlaps with existing range");
        throw new Error("Date range overlaps with existing range");
      }

      try {
        await createLimit({
          resource: "client_plan_limits",
          values: {
            ...data,
            client_id: clientId,
          },
        });

        toast.success("Macro limit range created");
        invalidate({ resource: "client_plan_limits", invalidates: ["list"] });
      } catch (error) {
        console.error("Failed to create limit range:", error);
        toast.error("Failed to create limit range");
        throw error;
      }
    },
    [clientId, createLimit, invalidate, limits]
  );

  // Update an existing limit range
  const updateLimitRange = useCallback(
    async (id: string, data: Partial<ClientPlanLimitUpdate>) => {
      // If updating dates, check for overlap
      if (data.start_date || data.end_date) {
        const existingLimit = limits.find((l) => l.id === id);
        if (existingLimit) {
          const newStart = new Date((data.start_date || existingLimit.start_date) + "T00:00:00");
          const newEnd = new Date((data.end_date || existingLimit.end_date) + "T00:00:00");

          if (hasOverlap(newStart, newEnd, limits, id)) {
            toast.error("Date range overlaps with existing range");
            throw new Error("Date range overlaps with existing range");
          }
        }
      }

      try {
        await updateLimit({
          resource: "client_plan_limits",
          id,
          values: data,
        });

        toast.success("Macro limit range updated");
        invalidate({ resource: "client_plan_limits", invalidates: ["list"] });
      } catch (error) {
        console.error("Failed to update limit range:", error);
        toast.error("Failed to update limit range");
        throw error;
      }
    },
    [updateLimit, invalidate, limits]
  );

  // Delete a limit range
  const deleteLimitRange = useCallback(
    async (id: string) => {
      try {
        await deleteLimit({
          resource: "client_plan_limits",
          id,
        });

        toast.success("Macro limit range deleted");
        invalidate({ resource: "client_plan_limits", invalidates: ["list"] });
      } catch (error) {
        console.error("Failed to delete limit range:", error);
        toast.error("Failed to delete limit range");
        throw error;
      }
    },
    [deleteLimit, invalidate]
  );

  // Refetch limits
  const refetch = useCallback(() => {
    invalidate({ resource: "client_plan_limits", invalidates: ["list"] });
  }, [invalidate]);

  // Check if a limit is editable (not past)
  const isEditable = useCallback((limit: ClientPlanLimit): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Can edit if end_date is today or in the future
    return limit.end_date >= todayStr;
  }, []);

  // Check if a limit is deletable (future only)
  const isDeletable = useCallback((limit: ClientPlanLimit): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Can delete only if start_date is in the future
    return limit.start_date > todayStr;
  }, []);

  return {
    // Data
    limits,
    categorizedLimits,
    unavailableDates,

    // Loading states
    isLoading: limitsQuery.query.isLoading,
    isError: limitsQuery.query.isError,

    // Mutations
    createLimitRange,
    updateLimitRange,
    deleteLimitRange,
    refetch,

    // Helpers
    isEditable,
    isDeletable,
    getUnavailableDates: (excludeId?: string) => getUnavailableDates(limits, excludeId),
    hasOverlap: (start: Date, end: Date, excludeId?: string) =>
      hasOverlap(start, end, limits, excludeId),
  };
}
