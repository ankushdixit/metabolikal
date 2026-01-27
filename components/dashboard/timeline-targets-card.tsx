/**
 * Timeline Targets Card Component (Compact Version)
 *
 * Displays daily macro targets in a single compact row.
 * Shows calories, protein, carbs, and fats with mini progress bars.
 */

"use client";

import { cn } from "@/lib/utils";
import { Flame, Beef, Wheat, Droplets, AlertTriangle } from "lucide-react";
import type { MacroTargets, ConsumedTotals, PlanProgress } from "@/hooks/use-client-timeline";

// =============================================================================
// TYPES
// =============================================================================

interface TimelineTargetsCardProps {
  targets: MacroTargets;
  consumed: ConsumedTotals;
  planProgress: PlanProgress | null;
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get progress bar color based on percentage
 */
function getProgressColor(percent: number): string {
  if (percent > 100) return "bg-red-500";
  if (percent >= 75) return "bg-yellow-500";
  return "bg-green-500";
}

/**
 * Format target display
 */
function formatTarget(min: number | null, max: number | null, unit: string): string {
  if (min !== null && max !== null && min !== max) {
    return `${min}-${max}${unit}`;
  }
  if (max !== null) {
    return `${max}${unit}`;
  }
  if (min !== null) {
    // Single value - don't add "+" suffix
    return `${min}${unit}`;
  }
  return "—";
}

// =============================================================================
// COMPACT MACRO ITEM
// =============================================================================

interface MacroItemProps {
  consumed: number;
  target: number | null;
  targetMax?: number | null;
  label: string;
  unit: string;
  icon: React.ReactNode;
  colorClass: string;
}

function MacroItem({ consumed, target, targetMax, label, unit, icon, colorClass }: MacroItemProps) {
  const percentTarget = targetMax ?? target;
  const percent = percentTarget ? Math.min((consumed / percentTarget) * 100, 120) : 0;
  const progressColor = target !== null ? getProgressColor(percent) : "bg-muted";

  const displayTarget = formatTarget(target, targetMax ?? null, unit);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className={cn("shrink-0", colorClass)}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </span>
          <span className="text-xs font-bold whitespace-nowrap">
            {consumed} / {displayTarget}
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
          <div
            className={cn("h-full transition-all duration-300", progressColor)}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TimelineTargetsCard({
  targets,
  consumed,
  planProgress,
  className,
}: TimelineTargetsCardProps) {
  const hasCalorieTarget = targets.calories !== null;
  const hasProteinTarget = targets.proteinMin !== null || targets.proteinMax !== null;
  const hasCarbsTarget = targets.carbsMin !== null || targets.carbsMax !== null;
  const hasFatsTarget = targets.fatsMin !== null || targets.fatsMax !== null;

  // Show warning if no limits configured
  if (!targets.hasLimits) {
    return (
      <div className={cn("athletic-card p-3 border-yellow-500/50", className)}>
        <div className="flex items-center gap-2 text-yellow-500">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="font-bold text-sm">No macro targets configured</p>
          <span className="text-xs text-muted-foreground ml-auto">Contact your coach</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("athletic-card p-3", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Today&apos;s Targets
        </h3>
        {planProgress && (
          <div className="flex items-center gap-2 text-xs">
            {planProgress.isExtended && (
              <span className="font-bold uppercase px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px]">
                Extended
              </span>
            )}
            <span className="font-bold text-muted-foreground">
              Day {planProgress.dayNumber} of {planProgress.totalDays}
            </span>
          </div>
        )}
      </div>

      {/* Macros in a single row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {hasCalorieTarget && (
          <MacroItem
            consumed={consumed.calories}
            target={targets.calories}
            label="Cal"
            unit=""
            icon={<Flame className="h-3.5 w-3.5" />}
            colorClass="text-orange-400"
          />
        )}
        {hasProteinTarget && (
          <MacroItem
            consumed={consumed.protein}
            target={targets.proteinMin}
            targetMax={targets.proteinMax}
            label="Protein"
            unit="g"
            icon={<Beef className="h-3.5 w-3.5" />}
            colorClass="text-red-400"
          />
        )}
        {hasCarbsTarget && (
          <MacroItem
            consumed={consumed.carbs}
            target={targets.carbsMin}
            targetMax={targets.carbsMax}
            label="Carbs"
            unit="g"
            icon={<Wheat className="h-3.5 w-3.5" />}
            colorClass="text-yellow-400"
          />
        )}
        {hasFatsTarget && (
          <MacroItem
            consumed={consumed.fats}
            target={targets.fatsMin}
            targetMax={targets.fatsMax}
            label="Fats"
            unit="g"
            icon={<Droplets className="h-3.5 w-3.5" />}
            colorClass="text-blue-400"
          />
        )}
      </div>
    </div>
  );
}
