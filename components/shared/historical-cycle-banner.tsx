"use client";

import { AlertTriangle } from "lucide-react";
import { PlanCycleSelector } from "@/components/shared/plan-cycle-selector";
import { usePlanCycleData } from "@/contexts/plan-cycle-context";

/**
 * HistoricalCycleBanner
 * Renders the PlanCycleSelector and an amber warning banner when viewing historical data.
 * Returns null when only 1 cycle exists (delegates to PlanCycleSelector's own null-return).
 */
export function HistoricalCycleBanner() {
  const {
    userId,
    currentCycle,
    selectedCycle,
    isViewingHistory,
    currentCycleProfile,
    setSelectedCycle,
  } = usePlanCycleData();

  if (!userId) return null;

  return (
    <div className="space-y-2">
      <PlanCycleSelector
        clientId={userId}
        currentCycle={currentCycle}
        selectedCycle={selectedCycle}
        onCycleChange={setSelectedCycle}
        currentCycleProfile={currentCycleProfile ?? undefined}
      />

      {isViewingHistory && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-500">
            Viewing Plan {selectedCycle} (Historical) — This data is read-only.
          </p>
          <button
            onClick={() => setSelectedCycle(currentCycle)}
            className="ml-auto text-sm font-bold text-primary hover:underline shrink-0"
          >
            Return to Current
          </button>
        </div>
      )}
    </div>
  );
}
