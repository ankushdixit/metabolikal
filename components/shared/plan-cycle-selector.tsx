"use client";

import { useMemo } from "react";
import { useList } from "@refinedev/core";
import { History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlanCycle } from "@/lib/database.types";

interface PlanCycleSelectorProps {
  clientId: string;
  currentCycle: number;
  selectedCycle: number;
  onCycleChange: (cycle: number) => void;
  /** Profile-based override for the current cycle's display dates.
   *  The profile is the authoritative source for the active cycle;
   *  plan_cycles may be stale if the admin edited plan fields after creation. */
  currentCycleProfile?: {
    startDate: string;
    durationDays: number;
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeEndDate(startDate: string, durationDays: number): string {
  const date = new Date(startDate + "T00:00:00");
  date.setDate(date.getDate() + durationDays - 1);
  return date.toISOString().split("T")[0];
}

export function PlanCycleSelector({
  clientId,
  currentCycle,
  selectedCycle,
  onCycleChange,
  currentCycleProfile,
}: PlanCycleSelectorProps) {
  const cyclesQuery = useList<PlanCycle>({
    resource: "plan_cycles",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    sorters: [{ field: "cycle_number", order: "desc" }],
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const cycles = cyclesQuery.query.data?.data || [];

  const options = useMemo(() => {
    return cycles.map((cycle) => {
      const isCurrent = cycle.cycle_number === currentCycle;

      // For the current cycle, prefer profile data (authoritative) over plan_cycles (may be stale)
      const effectiveStartDate =
        isCurrent && currentCycleProfile?.startDate
          ? currentCycleProfile.startDate
          : cycle.start_date;
      const effectiveDuration =
        isCurrent && currentCycleProfile?.durationDays
          ? currentCycleProfile.durationDays
          : cycle.duration_days;

      const endDate = computeEndDate(effectiveStartDate, effectiveDuration);
      const label = `Plan ${cycle.cycle_number}${isCurrent ? " (Current)" : ""}`;
      const dateRange = `${formatDate(effectiveStartDate)} - ${formatDate(endDate)}`;
      return {
        value: cycle.cycle_number,
        label,
        dateRange,
        status: cycle.status,
      };
    });
  }, [cycles, currentCycle, currentCycleProfile]);

  // Don't render if only 1 cycle exists
  if (options.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <History className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={String(selectedCycle)} onValueChange={(val) => onCycleChange(parseInt(val))}>
        <SelectTrigger className="bg-secondary border-border text-sm w-auto min-w-[240px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-secondary border-border">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              <div className="flex flex-col">
                <span className="font-bold">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.dateRange}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
