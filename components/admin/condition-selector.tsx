"use client";

import { Loader2, AlertTriangle, Check } from "lucide-react";
import { useMedicalConditions, DEFAULT_MEDICAL_CONDITIONS } from "@/hooks/use-medical-conditions";
import { cn } from "@/lib/utils";
import type { MedicalConditionRow } from "@/lib/database.types";

interface ConditionSelectorProps {
  selectedConditionIds: string[];
  onChange: (conditionIds: string[]) => void;
  className?: string;
}

/**
 * Condition Selector Component
 * Multi-select for medical conditions that a food should be avoided for
 */
export function ConditionSelector({
  selectedConditionIds,
  onChange,
  className,
}: ConditionSelectorProps) {
  const { conditions: dbConditions, isLoading, error } = useMedicalConditions();

  // Use database conditions or fallback to defaults (excluding "none")
  const conditions: Pick<MedicalConditionRow, "id" | "name" | "slug" | "impact_percent">[] =
    error || dbConditions.length === 0
      ? DEFAULT_MEDICAL_CONDITIONS.filter((c) => c.slug !== "none").map((c, idx) => ({
          id: `default-${idx}`,
          name: c.name,
          slug: c.slug,
          impact_percent: c.impact_percent,
        }))
      : dbConditions.filter((c) => c.slug !== "none");

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

  return (
    <div className={cn("space-y-3", className)}>
      {error && (
        <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold mb-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Using default conditions (database unavailable)</span>
        </div>
      )}
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
