/**
 * Timeline Item Sheet Component
 *
 * Mobile-optimized bottom sheet for displaying timeline item details.
 * Uses Vaul for native iOS/Android drawer behavior.
 * Styled consistently with TimelineItemExpanded desktop component.
 */

"use client";

import { useCallback } from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import {
  Utensils,
  Pill,
  Dumbbell,
  Heart,
  Check,
  Clock,
  Info,
  RefreshCw,
  X,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
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

interface TimelineItemSheetProps {
  /** The item to display */
  item: ExtendedTimelineItem | null;
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback to close the sheet */
  onClose: () => void;
  /** Whether the item is completed */
  isCompleted: boolean;
  /** Completion status for grouped items */
  completionStatus: { completed: number; total: number };
  /** Check if a source item is completed */
  isSourceItemCompleted: (sourceId: string) => boolean;
  /** Mark the entire item as complete */
  onMarkComplete: () => void;
  /** Mark the entire item as uncomplete */
  onMarkUncomplete: () => void;
  /** Mark a single source item as complete */
  onMarkSourceItemComplete: (sourceId: string) => void;
  /** Mark a single source item as uncomplete */
  onMarkSourceItemUncomplete: (sourceId: string) => void;
  /** Whether a marking operation is in progress */
  isMarking?: boolean;
  /** Whether completions are read-only (future/past days) */
  readOnly?: boolean;
  /** Callback to swap a food item - only for meal type */
  onSwapFood?: (dietPlanId: string) => void;
}

// Type-specific styling - matches TimelineItemExpanded exactly
const TYPE_STYLES: Record<
  string,
  {
    bgColor: string;
    borderColor: string;
    textColor: string;
    icon: LucideIcon;
  }
> = {
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
    icon: Heart,
  },
};

// =============================================================================
// DETAIL COMPONENTS - Match TimelineItemExpanded patterns
// =============================================================================

interface DetailProps {
  item: ExtendedTimelineItem;
  isSourceItemCompleted: (sourceId: string) => boolean;
  onToggleSourceItem: (sourceId: string, isCompleted: boolean) => void;
  readOnly: boolean;
}

interface MealSheetDetailProps extends DetailProps {
  onSwapFood?: (dietPlanId: string) => void;
}

/**
 * Meal item details
 */
function MealSheetContent({
  item,
  isSourceItemCompleted,
  onToggleSourceItem,
  readOnly,
  onSwapFood,
}: MealSheetDetailProps) {
  const groupedItems = item.groupedItems as DietPlanWithFood[] | undefined;

  // Calculate totals for all macros
  const totals = groupedItems?.reduce(
    (acc, plan) => {
      const food = plan.food_items;
      const multiplier = plan.serving_multiplier || 1;
      return {
        calories: acc.calories + Math.round((food?.calories || 0) * multiplier),
        protein: acc.protein + Math.round((food?.protein || 0) * multiplier),
        carbs: acc.carbs + Math.round((food?.carbs || 0) * multiplier),
        fats: acc.fats + Math.round((food?.fats || 0) * multiplier),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

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
            const carbs = Math.round((food?.carbs || 0) * multiplier);
            const fats = Math.round((food?.fats || 0) * multiplier);
            const isCompleted = isSourceItemCompleted(plan.id);

            // Build quantity display
            const quantities: string[] = [];
            if (food?.cooked_quantity) quantities.push(`Cooked: ${food.cooked_quantity}`);
            if (food?.raw_quantity) quantities.push(`Raw: ${food.raw_quantity}`);

            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded transition-all",
                  isCompleted ? "bg-green-500/20 border border-green-500/50" : "bg-secondary/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Completion toggle */}
                  <button
                    onClick={() => !readOnly && onToggleSourceItem(plan.id, isCompleted)}
                    disabled={readOnly}
                    className={cn(
                      "shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors mt-0.5",
                      "min-w-[24px] min-h-[24px]", // Touch target
                      isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground/50",
                      !readOnly && "hover:border-primary"
                    )}
                  >
                    {isCompleted && <Check className="h-4 w-4 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn("font-bold text-sm", isCompleted && "line-through opacity-70")}
                    >
                      {food?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {food?.serving_size}
                      {multiplier !== 1 && ` × ${multiplier}`}
                    </p>
                    {quantities.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{quantities.join(" | ")}</p>
                    )}
                  </div>
                  {/* Swap button */}
                  {!readOnly && onSwapFood && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwapFood(plan.id);
                      }}
                      className={cn(
                        "shrink-0 p-2 rounded transition-colors",
                        "min-w-[44px] min-h-[44px]", // Apple HIG touch target
                        "text-muted-foreground hover:text-primary hover:bg-primary/10",
                        "border border-transparent hover:border-primary/30",
                        "flex items-center justify-center"
                      )}
                      title="Swap food item"
                    >
                      <ArrowLeftRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {/* Macro grid */}
                <div className="grid grid-cols-4 gap-2 text-xs ml-9">
                  <div className="text-center p-1.5 bg-background/50 rounded">
                    <p className="font-bold text-orange-400">{calories}</p>
                    <p className="text-muted-foreground text-[10px]">cal</p>
                  </div>
                  <div className="text-center p-1.5 bg-background/50 rounded">
                    <p className="font-bold text-blue-400">{protein}g</p>
                    <p className="text-muted-foreground text-[10px]">protein</p>
                  </div>
                  <div className="text-center p-1.5 bg-background/50 rounded">
                    <p className="font-bold text-yellow-400">{carbs}g</p>
                    <p className="text-muted-foreground text-[10px]">carbs</p>
                  </div>
                  <div className="text-center p-1.5 bg-background/50 rounded">
                    <p className="font-bold text-pink-400">{fats}g</p>
                    <p className="text-muted-foreground text-[10px]">fat</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Totals */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold">Total</span>
          <span className="font-bold">{totals.calories} cal</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-secondary rounded">
            <p className="font-bold text-blue-400">{totals.protein}g</p>
            <p className="text-muted-foreground">protein</p>
          </div>
          <div className="text-center p-2 bg-secondary rounded">
            <p className="font-bold text-yellow-400">{totals.carbs}g</p>
            <p className="text-muted-foreground">carbs</p>
          </div>
          <div className="text-center p-2 bg-secondary rounded">
            <p className="font-bold text-pink-400">{totals.fats}g</p>
            <p className="text-muted-foreground">fat</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Supplement item details
 */
function SupplementSheetContent({
  item,
  isSourceItemCompleted,
  onToggleSourceItem,
  readOnly,
}: DetailProps) {
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
                onClick={() => !readOnly && onToggleSourceItem(plan.id, isCompleted)}
                disabled={readOnly}
                className={cn(
                  "w-full flex items-start gap-3 p-2 rounded transition-all text-left",
                  isCompleted
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-secondary/50 hover:bg-secondary",
                  readOnly && "cursor-default"
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
function WorkoutSheetContent({
  item,
  isSourceItemCompleted,
  onToggleSourceItem,
  readOnly,
}: DetailProps) {
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
                onClick={() => !readOnly && onToggleSourceItem(plan.id, isCompleted)}
                disabled={readOnly}
                className={cn(
                  "w-full flex items-start gap-3 p-2 rounded transition-all text-left",
                  isCompleted
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-secondary/50 hover:bg-secondary",
                  readOnly && "cursor-default"
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
function LifestyleSheetContent({
  item,
  isSourceItemCompleted,
  onToggleSourceItem,
  readOnly,
}: DetailProps) {
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
                onClick={() => !readOnly && onToggleSourceItem(plan.id, isCompleted)}
                disabled={readOnly}
                className={cn(
                  "w-full flex items-start gap-3 p-2 rounded transition-all text-left",
                  isCompleted
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-secondary/50 hover:bg-secondary",
                  readOnly && "cursor-default"
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

export function TimelineItemSheet({
  item,
  isOpen,
  onClose,
  isCompleted,
  completionStatus,
  isSourceItemCompleted,
  onMarkComplete,
  onMarkUncomplete,
  onMarkSourceItemComplete,
  onMarkSourceItemUncomplete,
  isMarking = false,
  readOnly = false,
  onSwapFood,
}: TimelineItemSheetProps) {
  if (!item) return null;

  const style = TYPE_STYLES[item.type];
  const Icon = style.icon;
  const timeText = getSchedulingDisplayText(item.scheduling);
  const hasMultipleItems = completionStatus.total > 1;
  const isPartiallyCompleted =
    completionStatus.completed > 0 && completionStatus.completed < completionStatus.total;

  // Handle toggling individual source items
  const handleToggleSourceItem = useCallback(
    (sourceId: string, currentlyCompleted: boolean) => {
      if (readOnly) return;
      if (currentlyCompleted) {
        onMarkSourceItemUncomplete(sourceId);
      } else {
        onMarkSourceItemComplete(sourceId);
      }
    },
    [readOnly, onMarkSourceItemComplete, onMarkSourceItemUncomplete]
  );

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "bg-background border rounded-t-xl",
            "flex flex-col max-h-[80vh]",
            "focus:outline-none"
          )}
        >
          {/* Header - matches TimelineItemExpanded exactly */}
          <div
            className={cn(
              "sticky top-0 p-4 border-b rounded-t-xl",
              style.bgColor,
              style.borderColor
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Icon className={cn("h-6 w-6", style.textColor)} />
                <div>
                  <Drawer.Title className="font-black text-lg">{item.title}</Drawer.Title>
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

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {item.type === "meal" && (
              <MealSheetContent
                item={item}
                isSourceItemCompleted={isSourceItemCompleted}
                onToggleSourceItem={handleToggleSourceItem}
                readOnly={readOnly}
                onSwapFood={onSwapFood}
              />
            )}
            {item.type === "supplement" && (
              <SupplementSheetContent
                item={item}
                isSourceItemCompleted={isSourceItemCompleted}
                onToggleSourceItem={handleToggleSourceItem}
                readOnly={readOnly}
              />
            )}
            {item.type === "workout" && (
              <WorkoutSheetContent
                item={item}
                isSourceItemCompleted={isSourceItemCompleted}
                onToggleSourceItem={handleToggleSourceItem}
                readOnly={readOnly}
              />
            )}
            {item.type === "lifestyle" && (
              <LifestyleSheetContent
                item={item}
                isSourceItemCompleted={isSourceItemCompleted}
                onToggleSourceItem={handleToggleSourceItem}
                readOnly={readOnly}
              />
            )}
          </div>

          {/* Actions - matches TimelineItemExpanded exactly */}
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
