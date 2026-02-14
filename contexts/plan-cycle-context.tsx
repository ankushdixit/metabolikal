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
import type { Profile, PlanCycle } from "@/lib/database.types";

export interface PlanCycleContextValue {
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
  isLoading: boolean;
}

const PlanCycleContext = createContext<PlanCycleContextValue | undefined>(undefined);

export function PlanCycleProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [selectedCycle, setSelectedCycleRaw] = useState<number | null>(null);

  // Fetch profile
  const profileQuery = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "id", operator: "eq", value: userId || "" }],
    queryOptions: { enabled: !!userId },
  });

  const profile = profileQuery.query.data?.data?.[0];
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
  const currentCycleProfile = useMemo(() => {
    if (!profile) return null;
    return {
      startDate: profile.plan_start_date || profile.created_at?.split("T")[0] || "",
      durationDays: profile.plan_duration_days || 30,
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

  const isLoading = profileQuery.query.isLoading;

  const value = useMemo<PlanCycleContextValue>(
    () => ({
      userId,
      currentCycle,
      selectedCycle: effectiveSelectedCycle,
      isViewingHistory,
      cycleDetails,
      currentCycleProfile,
      setSelectedCycle,
      isLoading,
    }),
    [
      userId,
      currentCycle,
      effectiveSelectedCycle,
      isViewingHistory,
      cycleDetails,
      currentCycleProfile,
      setSelectedCycle,
      isLoading,
    ]
  );

  return <PlanCycleContext.Provider value={value}>{children}</PlanCycleContext.Provider>;
}

export function usePlanCycle() {
  const context = useContext(PlanCycleContext);
  if (context === undefined) {
    throw new Error("usePlanCycle must be used within a PlanCycleProvider");
  }
  return context;
}
