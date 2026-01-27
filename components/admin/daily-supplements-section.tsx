/**
 * Daily Supplements Section Component
 *
 * Displays the supplement plan for a specific day.
 * Groups supplements by time of day (morning, afternoon, evening).
 */

"use client";

import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupplementPlanWithSupplement, SupplementCounts } from "@/hooks/use-daily-plan-data";

interface DailySupplementsSectionProps {
  supplements: SupplementPlanWithSupplement[];
  counts: SupplementCounts;
  className?: string;
}

/**
 * Time period to display group mapping
 */
function getTimeGroup(period: string | null): "morning" | "afternoon" | "evening" {
  if (period === "early_morning" || period === "morning") {
    return "morning";
  }
  if (period === "midday" || period === "afternoon") {
    return "afternoon";
  }
  if (period === "evening" || period === "night" || period === "before_sleep") {
    return "evening";
  }
  // Default to morning
  return "morning";
}

/**
 * Group supplements by time of day
 */
function groupByTime(supplements: SupplementPlanWithSupplement[]): {
  morning: SupplementPlanWithSupplement[];
  afternoon: SupplementPlanWithSupplement[];
  evening: SupplementPlanWithSupplement[];
} {
  const grouped = {
    morning: [] as SupplementPlanWithSupplement[],
    afternoon: [] as SupplementPlanWithSupplement[],
    evening: [] as SupplementPlanWithSupplement[],
  };

  for (const supplement of supplements) {
    const group = getTimeGroup(supplement.time_period);
    grouped[group].push(supplement);
  }

  return grouped;
}

/**
 * Daily supplements section component
 */
export function DailySupplementsSection({
  supplements,
  counts,
  className,
}: DailySupplementsSectionProps) {
  const hasSupplements = supplements.length > 0;
  const grouped = groupByTime(supplements);

  return (
    <div className={cn("athletic-card p-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Pill className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-tight">
          Supple<span className="gradient-athletic">ments</span>
        </h3>
      </div>

      {!hasSupplements ? (
        <p className="text-muted-foreground text-sm font-bold text-center py-4">
          No supplements planned
        </p>
      ) : (
        <div className="space-y-3">
          {/* Morning */}
          {grouped.morning.length > 0 && (
            <div className="bg-secondary/30 p-3 rounded">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Morning
              </p>
              <div className="space-y-1">
                {grouped.morning.map((item) => (
                  <SupplementItem key={item.id} supplement={item} />
                ))}
              </div>
            </div>
          )}

          {/* Afternoon */}
          {grouped.afternoon.length > 0 && (
            <div className="bg-secondary/30 p-3 rounded">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Afternoon
              </p>
              <div className="space-y-1">
                {grouped.afternoon.map((item) => (
                  <SupplementItem key={item.id} supplement={item} />
                ))}
              </div>
            </div>
          )}

          {/* Evening */}
          {grouped.evening.length > 0 && (
            <div className="bg-secondary/30 p-3 rounded">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Evening
              </p>
              <div className="space-y-1">
                {grouped.evening.map((item) => (
                  <SupplementItem key={item.id} supplement={item} />
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="pt-3 border-t border-border">
            <p className="text-sm font-bold">
              <span className="text-primary">{counts.total} supplements</span>
              {counts.morning > 0 && counts.afternoon > 0 && counts.evening > 0 && (
                <span className="text-muted-foreground text-xs ml-2">
                  ({counts.morning} AM / {counts.afternoon} PM / {counts.evening} Eve)
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual supplement item display
 */
function SupplementItem({ supplement }: { supplement: SupplementPlanWithSupplement }) {
  const name = supplement.supplements?.name || "Unknown Supplement";
  const dosageUnit = supplement.supplements?.dosage_unit || "mg";
  const dosage = supplement.dosage;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="truncate pr-2">{name}</span>
      <span className="text-muted-foreground flex-shrink-0">
        {dosage} {dosageUnit}
      </span>
    </div>
  );
}
