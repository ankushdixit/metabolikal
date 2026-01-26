"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Edit, Trash2, Plus, Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientPlanLimits, formatDateRange } from "@/hooks/use-client-plan-limits";
import { AddLimitRangeModal } from "./add-limit-range-modal";
import type { ClientPlanLimit } from "@/lib/database.types";

interface PlanLimitsManagerProps {
  clientId: string;
}

/**
 * Component for managing date-range based macro limits for clients
 * Displays current, future, and past limit ranges with CRUD operations
 */
export function PlanLimitsManager({ clientId }: PlanLimitsManagerProps) {
  const [showPastRanges, setShowPastRanges] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<ClientPlanLimit | null>(null);

  const { categorizedLimits, isLoading, isError, deleteLimitRange, isDeletable } =
    useClientPlanLimits({ clientId });

  const { current, future, past } = categorizedLimits;

  const handleAddRange = () => {
    setEditingLimit(null);
    setIsModalOpen(true);
  };

  const handleEditRange = (limit: ClientPlanLimit) => {
    setEditingLimit(limit);
    setIsModalOpen(true);
  };

  const handleDeleteRange = async (limit: ClientPlanLimit) => {
    if (!window.confirm("Are you sure you want to delete this macro limit range?")) {
      return;
    }
    await deleteLimitRange(limit.id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLimit(null);
  };

  if (isLoading) {
    return (
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-bold">Loading macro limits...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-destructive font-bold">Failed to load macro limits</p>
      </div>
    );
  }

  const hasAnyLimits = current || future.length > 0 || past.length > 0;

  return (
    <div className="mt-6 pt-6 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Macro Limits</h3>
        </div>
        <button
          onClick={handleAddRange}
          className="btn-athletic flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20"
        >
          <Plus className="h-3 w-3" />
          <span>Add Range</span>
        </button>
      </div>

      {!hasAnyLimits ? (
        <div className="bg-secondary/30 p-4 text-center">
          <p className="text-muted-foreground text-sm font-bold">No macro limits configured</p>
          <p className="text-muted-foreground text-xs mt-1">
            Add date ranges with calorie and macro limits for diet planning
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Range */}
          {current && (
            <LimitRangeCard
              limit={current}
              type="current"
              onEdit={() => handleEditRange(current)}
              onDelete={isDeletable(current) ? () => handleDeleteRange(current) : undefined}
            />
          )}

          {/* Future Ranges */}
          {future.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Future Ranges
              </p>
              {future.map((limit) => (
                <LimitRangeCard
                  key={limit.id}
                  limit={limit}
                  type="future"
                  onEdit={() => handleEditRange(limit)}
                  onDelete={() => handleDeleteRange(limit)}
                />
              ))}
            </div>
          )}

          {/* Past Ranges (Collapsed) */}
          {past.length > 0 && (
            <div>
              <button
                onClick={() => setShowPastRanges(!showPastRanges)}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPastRanges ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                <span>
                  {showPastRanges ? "Hide" : "Show"} Past Ranges ({past.length})
                </span>
              </button>

              {showPastRanges && (
                <div className="mt-2 space-y-2">
                  {past.map((limit) => (
                    <LimitRangeCard key={limit.id} limit={limit} type="past" />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddLimitRangeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        clientId={clientId}
        editingLimit={editingLimit}
      />
    </div>
  );
}

interface LimitRangeCardProps {
  limit: ClientPlanLimit;
  type: "current" | "future" | "past";
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Card component for displaying a single limit range
 */
function LimitRangeCard({ limit, type, onEdit, onDelete }: LimitRangeCardProps) {
  const isCurrent = type === "current";
  const isPast = type === "past";

  return (
    <div
      className={cn(
        "p-4 border",
        isCurrent && "border-primary bg-primary/5",
        type === "future" && "border-border bg-secondary/30",
        isPast && "border-border/50 bg-secondary/20 opacity-75"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          {isCurrent && (
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Current</span>
          )}
          <p className={cn("text-sm font-bold", isPast && "text-muted-foreground")}>
            {formatDateRange(limit.start_date, limit.end_date)}
          </p>
        </div>

        {/* Action Buttons */}
        {!isPast && (onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit range"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete range"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Macro Limits */}
      <div className={cn("grid gap-2 text-sm", isPast ? "grid-cols-1" : "grid-cols-2")}>
        {isPast ? (
          // Compact view for past ranges
          <p className="text-muted-foreground text-xs">
            <span>Calories: Max {limit.max_calories_per_day.toLocaleString()}</span>
            <span className="mx-2">|</span>
            <span>
              Protein: {limit.min_protein_per_day}g
              {limit.max_protein_per_day ? `-${limit.max_protein_per_day}g` : "+"}
            </span>
            {(limit.min_carbs_per_day !== null || limit.max_carbs_per_day !== null) && (
              <>
                <span className="mx-2">|</span>
                <span>
                  Carbs: {limit.min_carbs_per_day ?? 0}g-{limit.max_carbs_per_day ?? "∞"}g
                </span>
              </>
            )}
          </p>
        ) : (
          // Full view for current/future
          <>
            <div>
              <p className="text-xs text-muted-foreground">Calories</p>
              <p className="font-bold">Max {limit.max_calories_per_day.toLocaleString()}/day</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Protein</p>
              <p className="font-bold">
                {limit.min_protein_per_day}g
                {limit.max_protein_per_day ? ` - ${limit.max_protein_per_day}g` : "+"}/day
              </p>
            </div>
            {(limit.min_carbs_per_day !== null || limit.max_carbs_per_day !== null) && (
              <div>
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="font-bold">
                  {limit.min_carbs_per_day ?? 0}g - {limit.max_carbs_per_day ?? "∞"}g/day
                </p>
              </div>
            )}
            {(limit.min_fats_per_day !== null || limit.max_fats_per_day !== null) && (
              <div>
                <p className="text-xs text-muted-foreground">Fats</p>
                <p className="font-bold">
                  {limit.min_fats_per_day ?? 0}g - {limit.max_fats_per_day ?? "∞"}g/day
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notes */}
      {limit.notes && !isPast && (
        <p className="mt-2 text-xs text-muted-foreground italic">{limit.notes}</p>
      )}
    </div>
  );
}
