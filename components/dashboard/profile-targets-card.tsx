"use client";

import { useState } from "react";
import {
  Flame,
  Drumstick,
  Wheat,
  Droplets,
  Info,
  ChevronDown,
  ChevronUp,
  CalendarClock,
} from "lucide-react";
import { formatDateRange } from "@/hooks/use-client-plan-limits";
import { formatMacroRange } from "@/hooks/use-client-profile-data";
import type { ClientPlanLimit } from "@/lib/database.types";

interface ProfileTargetsCardProps {
  currentLimits: ClientPlanLimit | null;
  futureLimits: ClientPlanLimit[];
  isLoading?: boolean;
}

interface MacroRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  iconBgClass?: string;
}

function MacroRow({ icon, label, value, iconBgClass = "bg-secondary" }: MacroRowProps) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`p-2 ${iconBgClass} text-primary`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

/**
 * Profile Targets Card Component
 * Displays current macro limits and upcoming targets preview
 */
export function ProfileTargetsCard({
  currentLimits,
  futureLimits,
  isLoading,
}: ProfileTargetsCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 gradient-electric" />
          <h2 className="text-sm font-black uppercase tracking-wider">Current Targets</h2>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-10 bg-secondary rounded" />
          <div className="h-10 bg-secondary rounded" />
          <div className="h-10 bg-secondary rounded" />
          <div className="h-10 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  const nextLimit = futureLimits.length > 0 ? futureLimits[0] : null;

  return (
    <div className="athletic-card p-6 pl-8">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center gap-2 mb-4 text-left"
      >
        <div className="w-6 h-1 gradient-electric" />
        <h2 className="text-sm font-black uppercase tracking-wider flex-1">
          Current Targets
          {currentLimits && (
            <span className="font-normal text-muted-foreground ml-2 text-xs normal-case">
              ({formatDateRange(currentLimits.start_date, currentLimits.end_date)})
            </span>
          )}
        </h2>
        <span className="text-muted-foreground md:hidden">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </span>
      </button>

      <div className={`${isCollapsed ? "hidden md:block" : ""}`}>
        {!currentLimits ? (
          <div className="py-4 text-center">
            <Flame className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No targets set for today</p>
            <p className="text-muted-foreground text-xs mt-1">
              Your coach will configure your macro targets.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Calories */}
            <MacroRow
              icon={<Flame className="w-4 h-4" />}
              label="Calories"
              value={`${currentLimits.max_calories_per_day.toLocaleString()} kcal max`}
              iconBgClass="bg-orange-500/20"
            />

            {/* Protein */}
            <MacroRow
              icon={<Drumstick className="w-4 h-4" />}
              label="Protein"
              value={formatMacroRange(
                currentLimits.min_protein_per_day,
                currentLimits.max_protein_per_day,
                "g"
              )}
              iconBgClass="bg-red-500/20"
            />

            {/* Carbs */}
            <MacroRow
              icon={<Wheat className="w-4 h-4" />}
              label="Carbs"
              value={formatMacroRange(
                currentLimits.min_carbs_per_day,
                currentLimits.max_carbs_per_day,
                "g"
              )}
              iconBgClass="bg-amber-500/20"
            />

            {/* Fats */}
            <MacroRow
              icon={<Droplets className="w-4 h-4" />}
              label="Fats"
              value={formatMacroRange(
                currentLimits.min_fats_per_day,
                currentLimits.max_fats_per_day,
                "g"
              )}
              iconBgClass="bg-blue-500/20"
            />
          </div>
        )}

        {/* Upcoming Targets Preview */}
        {nextLimit && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="w-4 h-4" />
              <span>
                <span className="font-bold text-foreground">Upcoming:</span>{" "}
                {nextLimit.max_calories_per_day.toLocaleString()} kcal starting{" "}
                {new Date(nextLimit.start_date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="flex items-start gap-2 mt-4 pt-4 border-t border-border">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Targets are set by your coach and may change over time
          </p>
        </div>
      </div>
    </div>
  );
}
