/**
 * Daily Lifestyle Section Component
 *
 * Displays the lifestyle activity plan for a specific day.
 * Shows activities with their targets (steps, water, sleep, etc.).
 */

"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LifestyleActivityPlanWithType } from "@/hooks/use-daily-plan-data";

interface DailyLifestyleSectionProps {
  activities: LifestyleActivityPlanWithType[];
  className?: string;
}

/**
 * Format target value with unit
 */
function formatTarget(activity: LifestyleActivityPlanWithType): string {
  const targetValue =
    activity.target_value || activity.lifestyle_activity_types?.default_target_value;
  const targetUnit = activity.lifestyle_activity_types?.target_unit || "";

  if (!targetValue) {
    return "—";
  }

  // Format based on unit type
  if (targetUnit === "steps") {
    return `${targetValue.toLocaleString()} steps`;
  }
  if (targetUnit === "L" || targetUnit === "liters") {
    return `${targetValue}L`;
  }
  if (targetUnit === "hours" || targetUnit === "hrs") {
    return `${targetValue} hrs`;
  }
  if (targetUnit === "minutes" || targetUnit === "min") {
    return `${targetValue} min`;
  }

  // Default format
  return targetUnit ? `${targetValue} ${targetUnit}` : `${targetValue}`;
}

/**
 * Daily lifestyle section component
 */
export function DailyLifestyleSection({ activities, className }: DailyLifestyleSectionProps) {
  const hasActivities = activities.length > 0;

  return (
    <div className={cn("athletic-card p-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-tight">
          Life<span className="gradient-athletic">style</span>
        </h3>
      </div>

      {!hasActivities ? (
        <p className="text-muted-foreground text-sm font-bold text-center py-4">
          No lifestyle activities planned
        </p>
      ) : (
        <div className="space-y-3">
          {/* Activities section */}
          <div className="bg-secondary/30 p-3 rounded">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
              Daily Activities
            </p>
            <div className="space-y-1">
              {activities.map((activity) => {
                const name = activity.lifestyle_activity_types?.name || "Activity";
                const icon = activity.lifestyle_activity_types?.icon;
                const target = formatTarget(activity);

                return (
                  <div key={activity.id} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2 flex items-center gap-2">
                      {icon && <span className="text-base">{icon}</span>}
                      {name}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0">{target}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="pt-3 border-t border-border">
            <p className="text-sm font-bold">
              <span className="text-primary">
                {activities.length} activit{activities.length === 1 ? "y" : "ies"}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
