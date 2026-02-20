"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { useList } from "@refinedev/core";
import { useAuth } from "@/contexts/auth-context";
import type { PlanCycle } from "@/lib/database.types";
import { daysBetween } from "@/lib/challenge-utils";

/* ── Context value types ───────────────────────────────────────────── */

export interface PlanCycleDataValue {
  userId: string | null;
  currentCycle: number;
  selectedCycle: number;
  isViewingHistory: boolean;
  cycleDetails: {
    startDate: string;
    durationDays: number;
  } | null;
  /** Profile-based data for the current cycle (always available, regardless of selectedCycle).
   *  Use this as the authoritative source for the active cycle's dates. */
  currentCycleProfile: {
    startDate: string;
    durationDays: number;
  } | null;
  setSelectedCycle: (cycle: number) => void;
}

export interface PlanCycleLoadingValue {
  isLoading: boolean;
}

/** Combined type kept for backward-compatibility with usePlanCycle(). */
export type PlanCycleContextValue = PlanCycleDataValue & PlanCycleLoadingValue;

/* ── Two separate contexts ─────────────────────────────────────────── */

const PlanCycleDataContext = createContext<PlanCycleDataValue | undefined>(undefined);
const PlanCycleLoadingContext = createContext<PlanCycleLoadingValue | undefined>(undefined);

/* ── Provider ──────────────────────────────────────────────────────── */

export function PlanCycleProvider({ children }: { children: ReactNode }) {
  const { userId, profile, isLoading: authLoading } = useAuth();
  const [selectedCycle, setSelectedCycleRaw] = useState<number | null>(null);

  // Read plan fields directly from AuthProvider's profile (Task 1.4)
  // This eliminates a redundant useList query that fetched the same profile.
  const currentCycle = profile?.current_plan_cycle ?? 1;

  // Initialize selectedCycle to currentCycle when profile loads
  useEffect(() => {
    if (profile && selectedCycle === null) {
      setSelectedCycleRaw(currentCycle);
    }
  }, [profile, currentCycle, selectedCycle]);

  const effectiveSelectedCycle = selectedCycle ?? currentCycle;
  const isViewingHistory = effectiveSelectedCycle !== currentCycle;

  // Fetch plan_cycles for cycle details (only when viewing history)
  const cycleQuery = useList<PlanCycle>({
    resource: "plan_cycles",
    filters: [
      { field: "client_id", operator: "eq", value: userId || "" },
      { field: "cycle_number", operator: "eq", value: effectiveSelectedCycle },
    ],
    pagination: { pageSize: 1 },
    queryOptions: {
      enabled: !!userId && isViewingHistory,
    },
  });

  // Profile-based data for the current cycle (always available)
  // If the user was upgraded from challenger → client, extend the duration
  // to cover the gap between challenge_start_date and plan_start_date.
  const currentCycleProfile = useMemo(() => {
    if (!profile) return null;
    const planDuration = profile.plan_duration_days || 30;
    const planStart = profile.plan_start_date || profile.created_at?.split("T")[0] || "";
    const challengeStart = profile.challenge_start_date;

    if (challengeStart && challengeStart < planStart) {
      const gapDays = daysBetween(challengeStart, planStart);
      return {
        startDate: challengeStart,
        durationDays: gapDays + planDuration,
      };
    }

    return {
      startDate: planStart,
      durationDays: planDuration,
    };
  }, [profile]);

  const cycleDetails = useMemo(() => {
    if (!isViewingHistory) {
      // Current cycle — use profile data (authoritative)
      return currentCycleProfile;
    }
    // Historical cycle — use plan_cycles data
    const cycleData = cycleQuery.query.data?.data?.[0];
    if (!cycleData) return null;
    return {
      startDate: cycleData.start_date,
      durationDays: cycleData.duration_days,
    };
  }, [isViewingHistory, currentCycleProfile, cycleQuery.query.data]);

  const setSelectedCycle = useCallback((cycle: number) => {
    setSelectedCycleRaw(cycle);
  }, []);

  // Data context value — changes only when plan data changes (rare)
  const dataValue = useMemo<PlanCycleDataValue>(
    () => ({
      userId,
      currentCycle,
      selectedCycle: effectiveSelectedCycle,
      isViewingHistory,
      cycleDetails,
      currentCycleProfile,
      setSelectedCycle,
    }),
    [
      userId,
      currentCycle,
      effectiveSelectedCycle,
      isViewingHistory,
      cycleDetails,
      currentCycleProfile,
      setSelectedCycle,
    ]
  );

  // Loading context value — changes frequently during auth init
  const loadingValue = useMemo<PlanCycleLoadingValue>(
    () => ({ isLoading: authLoading }),
    [authLoading]
  );

  return (
    <PlanCycleLoadingContext.Provider value={loadingValue}>
      <PlanCycleDataContext.Provider value={dataValue}>{children}</PlanCycleDataContext.Provider>
    </PlanCycleLoadingContext.Provider>
  );
}

/* ── Hooks ─────────────────────────────────────────────────────────── */

/** Use when you only need plan cycle data (userId, cycles, details).
 *  Will NOT re-render when loading state changes. */
export function usePlanCycleData() {
  const context = useContext(PlanCycleDataContext);
  if (context === undefined) {
    throw new Error("usePlanCycleData must be used within a PlanCycleProvider");
  }
  return context;
}

/** Use when you only need loading state (skeleton/spinner components). */
export function usePlanCycleLoading() {
  const context = useContext(PlanCycleLoadingContext);
  if (context === undefined) {
    throw new Error("usePlanCycleLoading must be used within a PlanCycleProvider");
  }
  return context;
}

/** Backward-compatible hook — subscribes to BOTH contexts.
 *  Prefer usePlanCycleData() in components that don't need isLoading. */
export function usePlanCycle(): PlanCycleContextValue {
  const data = usePlanCycleData();
  const loading = usePlanCycleLoading();
  return { ...data, ...loading };
}
