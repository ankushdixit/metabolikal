"use client";

import { Loader2, AlertTriangle, Check } from "lucide-react";
import { useMedicalConditions } from "@/hooks/use-medical-conditions";
import { cn } from "@/lib/utils";

interface ConditionSelectorProps {
  selectedConditionIds: string[];
  onChange: (conditionIds: string[]) => void;
  className?: string;
}

/**
 * Condition Selector Component
 * Multi-select for medical conditions that a food should be avoided for
 *
 * IMPORTANT: This component requires medical conditions to exist in the database.
 * Run supabase/seed.sql to populate the medical_conditions table.
 * There is NO fallback - if the database is unavailable, an error is shown.
 */
export function ConditionSelector({
  selectedConditionIds,
  onChange,
  className,
}: ConditionSelectorProps) {
  const { conditions: dbConditions, isLoading, error } = useMedicalConditions();

  // Use database conditions (excluding "none" which is for the calculator UI only)
  const conditions = dbConditions.filter((c) => c.slug !== "none");

  const handleToggle = (conditionId: string) => {
    const isSelected = selectedConditionIds.includes(conditionId);
    if (isSelected) {
      onChange(selectedConditionIds.filter((id) => id !== conditionId));
    } else {
      onChange([...selectedConditionIds, conditionId]);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-bold">Loading conditions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 border border-destructive/50 bg-destructive/10 rounded", className)}>
        <div className="flex items-center gap-2 text-destructive text-sm font-bold">
          <AlertTriangle className="h-4 w-4" />
          <span>Failed to load medical conditions</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Please ensure the database is running and seeded. Run: psql $DATABASE_URL -f
          supabase/seed.sql
        </p>
      </div>
    );
  }

  if (conditions.length === 0) {
    return (
      <div className={cn("p-4 border border-yellow-500/50 bg-yellow-500/10 rounded", className)}>
        <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold">
          <AlertTriangle className="h-4 w-4" />
          <span>No medical conditions found</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Please seed the database with medical conditions. Run: psql $DATABASE_URL -f
          supabase/seed.sql
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {conditions.map((condition) => {
          const isSelected = selectedConditionIds.includes(condition.id);
          return (
            <div
              key={condition.id}
              role="button"
              tabIndex={0}
              className={cn(
                "flex items-center gap-3 p-3 border transition-all cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-muted-foreground"
              )}
              onClick={() => handleToggle(condition.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle(condition.id);
                }
              }}
            >
              <div
                className={cn(
                  "h-5 w-5 shrink-0 rounded-sm border flex items-center justify-center",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold">{condition.name}</span>
                <span className="text-xs text-muted-foreground">
                  -{condition.impact_percent}% metabolic impact
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {selectedConditionIds.length > 0 && (
        <p className="text-sm text-muted-foreground font-bold">
          {selectedConditionIds.length} condition{selectedConditionIds.length !== 1 ? "s" : ""}{" "}
          selected
        </p>
      )}
    </div>
  );
}
