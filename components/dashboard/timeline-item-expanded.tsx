/**
 * Timeline Item Expanded Component
 *
 * Expandable detail view for timeline items showing full information
 * based on item type (meal details, supplement instructions, workout exercises, lifestyle targets).
 * Includes completion toggle functionality.
 */

"use client";

import { cn } from "@/lib/utils";
import { Utensils, Pill, Dumbbell, Activity, Check, X, Clock, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";
import type {
  DietPlanWithFood,
  WorkoutPlanWithExercise,
  SupplementPlanWithSupplement,
  LifestyleActivityPlanWithType,
} from "@/hooks/use-timeline-data";
import { getSchedulingDisplayText } from "@/lib/utils/timeline";

// =============================================================================
// TYPES
// =============================================================================

interface TimelineItemExpandedProps {
  item: ExtendedTimelineItem;
  isCompleted: boolean;
  completionStatus: { completed: number; total: number };
  isSourceItemCompleted: (sourceId: string) => boolean;
  onMarkComplete: () => void;
  onMarkUncomplete: () => void;
  onMarkSourceItemComplete: (sourceId: string) => void;
  onMarkSourceItemUncomplete: (sourceId: string) => void;
  onClose: () => void;
  isMarking?: boolean;
  readOnly?: boolean;
}

// Type-specific styling
const TYPE_STYLES = {
  meal: {
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/50",
    textColor: "text-orange-400",
    icon: Utensils,
  },
  supplement: {
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
    textColor: "text-green-400",
    icon: Pill,
  },
  workout: {
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
    textColor: "text-blue-400",
    icon: Dumbbell,
  },
  lifestyle: {
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/50",
    textColor: "text-purple-400",
    icon: Activity,
  },
};

// =============================================================================
// DETAIL COMPONENTS
// =============================================================================

interface DetailProps {
  item: ExtendedTimelineItem;
  isSourceItemCompleted: (sourceId: string) => boolean;
  onToggleSourceItem: (sourceId: string, isCompleted: boolean) => void;
}

/**
 * Meal item details
 */
function MealDetails({ item, isSourceItemCompleted, onToggleSourceItem }: DetailProps) {
  const groupedItems = item.groupedItems as DietPlanWithFood[] | undefined;

  return (
    <div className="space-y-3">
      {/* Food items list */}
      {groupedItems && groupedItems.length > 0 && (
        <div className="space-y-2">
          {groupedItems.map((plan) => {
            const food = plan.food_items;
            const multiplier = plan.serving_multiplier || 1;
            const calories = Math.round((food?.calories || 0) * multiplier);
            const protein = Math.round((food?.protein || 0) * multiplier);
            const isCompleted = isSourceItemCompleted(plan.id);

            return (
              <button
                key={plan.id}
                onClick={() => onToggleSourceItem(plan.id, isCompleted)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded transition-all text-left",
                  isCompleted
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                    isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground/50"
                  )}
                >
                  {isCompleted && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-bold text-sm", isCompleted && "line-through opacity-70")}>
                    {food?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {food?.serving_size}
                    {multiplier !== 1 && ` × ${multiplier}`}
                  </p>
                </div>
                <div className="text-right text-xs shrink-0">
                  <p className="font-bold">{calories} cal</p>
                  <p className="text-muted-foreground">{protein}g protein</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Totals */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-sm font-bold">Total</span>
        <div className="text-right">
          <span className="font-bold">{item.metadata?.calories || 0} cal</span>
          <span className="text-muted-foreground ml-2">{item.metadata?.protein || 0}g protein</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Supplement item details
 */
function SupplementDetails({ item, isSourceItemCompleted, onToggleSourceItem }: DetailProps) {
  const groupedItems = item.groupedItems as SupplementPlanWithSupplement[] | undefined;

  return (
    <div className="space-y-3">
      {groupedItems && groupedItems.length > 0 && (
        <div className="space-y-2">
          {groupedItems.map((plan) => {
            const supplement = plan.supplements;
            const isCompleted = isSourceItemCompleted(plan.id);

            return (
              <button
                key={plan.id}
                onClick={() => onToggleSourceItem(plan.id, isCompleted)}
                className={cn(
                  "w-full flex items-start gap-3 p-2 rounded transition-all text-left",
                  isCompleted
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5",
                    isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground/50"
                  )}
                >
                  {isCompleted && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn("font-bold text-sm", isCompleted && "line-through opacity-70")}
                    >
                      {supplement?.name || "Unknown"}
                    </p>
                    <span className="text-xs font-bold shrink-0 ml-2">
                      {plan.dosage} {supplement?.dosage_unit || "units"}
                    </span>
                  </div>
                  {supplement?.instructions && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                      <Info className="h-3 w-3 shrink-0 mt-0.5" />
                      {supplement.instructions}
                    </p>
                  )}
                  {plan.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Note: {plan.notes}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Workout item details
 */
function WorkoutDetails({ item, isSourceItemCompleted, onToggleSourceItem }: DetailProps) {
  const groupedItems = item.groupedItems as WorkoutPlanWithExercise[] | undefined;

  return (
    <div className="space-y-3">
      {groupedItems && groupedItems.length > 0 && (
        <div className="space-y-2">
          {groupedItems.map((plan) => {
            const exercise = plan.exercises;
            const name = plan.exercise_name || exercise?.name || "Unknown";
            const isCompleted = isSourceItemCompleted(plan.id);

            return (
              <button
                key={plan.id}
                onClick={() => onToggleSourceItem(plan.id, isCompleted)}
                className={cn(
                  "w-full flex items-start gap-3 p-2 rounded transition-all text-left",
                  isCompleted
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5",
                    isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground/50"
                  )}
                >
                  {isCompleted && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={cn(
                          "font-bold text-sm",
                          isCompleted && "line-through opacity-70"
                        )}
                      >
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {plan.section || "Main"}
                      </p>
                    </div>
                    <div className="text-right text-xs shrink-0 ml-2">
                      {plan.sets && plan.reps && (
                        <p className="font-bold">
                          {plan.sets} × {plan.reps}
                        </p>
                      )}
                      {plan.duration_minutes && (
                        <p className="text-muted-foreground">{plan.duration_minutes} min</p>
                      )}
                      {plan.rest_seconds > 0 && (
                        <p className="text-muted-foreground">{plan.rest_seconds}s rest</p>
                      )}
                    </div>
                  </div>
                  {plan.instructions && (
                    <p className="text-xs text-muted-foreground mt-1">{plan.instructions}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Total duration */}
      {item.metadata?.duration && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm font-bold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Total Duration
          </span>
          <span className="font-bold">~{item.metadata.duration} min</span>
        </div>
      )}
    </div>
  );
}

/**
 * Lifestyle activity item details
 */
function LifestyleDetails({ item, isSourceItemCompleted, onToggleSourceItem }: DetailProps) {
  const groupedItems = item.groupedItems as LifestyleActivityPlanWithType[] | undefined;

  return (
    <div className="space-y-3">
      {groupedItems && groupedItems.length > 0 && (
        <div className="space-y-2">
          {groupedItems.map((plan) => {
            const activityType = plan.lifestyle_activity_types;
            const targetValue = plan.target_value || activityType?.default_target_value;
            const targetUnit = activityType?.target_unit || "";
            const isCompleted = isSourceItemCompleted(plan.id);

            return (
              <button
                key={plan.id}
                onClick={() => onToggleSourceItem(plan.id, isCompleted)}
                className={cn(
                  "w-full flex items-start gap-3 p-2 rounded transition-all text-left",
                  isCompleted
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5",
                    isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground/50"
                  )}
                >
                  {isCompleted && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={cn(
                          "font-bold text-sm",
                          isCompleted && "line-through opacity-70"
                        )}
                      >
                        {activityType?.name || "Activity"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {activityType?.category || "General"}
                      </p>
                    </div>
                    {targetValue && (
                      <span className="text-sm font-bold shrink-0 ml-2">
                        {targetValue.toLocaleString()} {targetUnit}
                      </span>
                    )}
                  </div>
                  {(plan.custom_rationale || activityType?.rationale) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                      <Info className="h-3 w-3 shrink-0 mt-0.5" />
                      {plan.custom_rationale || activityType?.rationale}
                    </p>
                  )}
                  {plan.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Note: {plan.notes}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TimelineItemExpanded({
  item,
  isCompleted,
  completionStatus,
  isSourceItemCompleted,
  onMarkComplete,
  onMarkUncomplete,
  onMarkSourceItemComplete,
  onMarkSourceItemUncomplete,
  onClose,
  isMarking = false,
  readOnly = false,
}: TimelineItemExpandedProps) {
  const style = TYPE_STYLES[item.type];
  const Icon = style.icon;
  const timeText = getSchedulingDisplayText(item.scheduling);
  const hasMultipleItems = completionStatus.total > 1;
  const isPartiallyCompleted =
    completionStatus.completed > 0 && completionStatus.completed < completionStatus.total;

  // Handle toggling individual source items
  const handleToggleSourceItem = (sourceId: string, currentlyCompleted: boolean) => {
    if (readOnly) return;
    if (currentlyCompleted) {
      onMarkSourceItemUncomplete(sourceId);
    } else {
      onMarkSourceItemComplete(sourceId);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center",
        "bg-black/50 backdrop-blur-sm"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-lg max-h-[80vh] overflow-y-auto",
          "bg-background border rounded-t-xl sm:rounded-xl",
          "animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 sm:zoom-in-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn("sticky top-0 p-4 border-b", style.bgColor, style.borderColor)}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Icon className={cn("h-6 w-6", style.textColor)} />
              <div>
                <h2 className="font-black text-lg">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Time and completion status */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeText}</span>
            </div>
            {hasMultipleItems ? (
              <span
                className={cn(
                  "flex items-center gap-1 text-sm font-bold",
                  isCompleted
                    ? "text-green-500"
                    : isPartiallyCompleted
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                )}
              >
                <Check className="h-4 w-4" />
                {completionStatus.completed}/{completionStatus.total} done
              </span>
            ) : isCompleted ? (
              <span className="flex items-center gap-1 text-sm font-bold text-green-500">
                <Check className="h-4 w-4" />
                Completed
              </span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {item.type === "meal" && (
            <MealDetails
              item={item}
              isSourceItemCompleted={isSourceItemCompleted}
              onToggleSourceItem={handleToggleSourceItem}
            />
          )}
          {item.type === "supplement" && (
            <SupplementDetails
              item={item}
              isSourceItemCompleted={isSourceItemCompleted}
              onToggleSourceItem={handleToggleSourceItem}
            />
          )}
          {item.type === "workout" && (
            <WorkoutDetails
              item={item}
              isSourceItemCompleted={isSourceItemCompleted}
              onToggleSourceItem={handleToggleSourceItem}
            />
          )}
          {item.type === "lifestyle" && (
            <LifestyleDetails
              item={item}
              isSourceItemCompleted={isSourceItemCompleted}
              onToggleSourceItem={handleToggleSourceItem}
            />
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 p-4 border-t bg-background">
          {readOnly ? (
            <div className="text-center text-sm text-muted-foreground py-2">
              <Clock className="h-4 w-4 inline-block mr-2" />
              Completions can only be tracked for today and past days
            </div>
          ) : hasMultipleItems ? (
            <div className="flex gap-2">
              {completionStatus.completed < completionStatus.total && (
                <Button className="flex-1" onClick={onMarkComplete} disabled={isMarking}>
                  {isMarking ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Complete All
                </Button>
              )}
              {completionStatus.completed > 0 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onMarkUncomplete}
                  disabled={isMarking}
                >
                  {isMarking ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Clear All
                </Button>
              )}
            </div>
          ) : isCompleted ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={onMarkUncomplete}
              disabled={isMarking}
            >
              {isMarking ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Mark as Incomplete
            </Button>
          ) : (
            <Button className="w-full" onClick={onMarkComplete} disabled={isMarking}>
              {isMarking ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Mark as Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
