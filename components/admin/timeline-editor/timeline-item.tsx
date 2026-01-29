/**
 * Timeline Item Component
 *
 * Individual item renderer for the timeline grid.
 * Color-coded by type with appropriate icons and metadata display.
 * Supports grouped items (multiple foods in a meal, multiple exercises in a workout).
 */

"use client";

import { cn } from "@/lib/utils";
import { Utensils, Pill, Dumbbell, Activity, Check, Layers, AlertOctagon } from "lucide-react";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";
import type { TimelineItemType } from "@/lib/database.types";
import { getSchedulingDisplayText } from "@/lib/utils/timeline";

// Type-specific styling
const TYPE_STYLES: Record<
  TimelineItemType,
  {
    bgColor: string;
    borderColor: string;
    textColor: string;
    icon: typeof Utensils;
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
    icon: Activity,
  },
};

interface TimelineItemProps {
  item: ExtendedTimelineItem;
  isSelected?: boolean;
  isAllDay?: boolean;
  onClick?: () => void;
  onSelect?: (selected: boolean) => void;
  showSelect?: boolean;
  className?: string;
  /** Whether this item has a food incompatibility with client conditions */
  hasIncompatibility?: boolean;
  /** Names of incompatible conditions for tooltip display */
  incompatibleConditions?: string[];
}

/**
 * Format metadata for display based on item type
 */
function formatMetadata(item: ExtendedTimelineItem): string {
  const { type, metadata, isGrouped } = item;

  if (!metadata) return "";

  switch (type) {
    case "meal":
      if (metadata.calories) {
        return `${metadata.calories} cal${isGrouped ? " total" : ""}`;
      }
      return "";

    case "supplement":
      if (metadata.dosage && metadata.dosageUnit) {
        return `${metadata.dosage} ${metadata.dosageUnit}`;
      }
      return "";

    case "workout":
      if (isGrouped && metadata.duration) {
        return `~${metadata.duration} min`;
      }
      if (metadata.sets && metadata.reps) {
        return `${metadata.sets}x${metadata.reps}`;
      }
      if (metadata.duration) {
        return `${metadata.duration} min`;
      }
      return "";

    case "lifestyle":
      if (metadata.targetValue && metadata.targetUnit) {
        return `${metadata.targetValue.toLocaleString()} ${metadata.targetUnit}`;
      }
      return "";

    default:
      return "";
  }
}

/**
 * Truncate item names list for display
 */
function formatItemNames(names: string[] | undefined, maxDisplay: number = 3): string {
  if (!names || names.length === 0) return "";

  if (names.length <= maxDisplay) {
    return names.join(", ");
  }

  const displayed = names.slice(0, maxDisplay);
  const remaining = names.length - maxDisplay;
  return `${displayed.join(", ")} +${remaining} more`;
}

/**
 * Individual timeline item
 */
export function TimelineItem({
  item,
  isSelected = false,
  isAllDay = false,
  onClick,
  onSelect,
  showSelect = false,
  className,
  hasIncompatibility = false,
  incompatibleConditions = [],
}: TimelineItemProps) {
  const style = TYPE_STYLES[item.type];
  const Icon = style.icon;
  const metadataText = formatMetadata(item);
  const timeText = getSchedulingDisplayText(item.scheduling);
  const isGrouped = item.isGrouped;

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(!isSelected);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "h-full w-full rounded border cursor-pointer transition-all overflow-hidden",
        hasIncompatibility
          ? "bg-red-500/10 border-red-500/70 border-2"
          : cn(style.bgColor, style.borderColor),
        isAllDay && "opacity-40 border-dashed",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        onClick && "hover:brightness-110",
        className
      )}
    >
      <div className="p-2 h-full flex flex-col min-h-0">
        {/* Header with icon, title, and select checkbox */}
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Icon className={cn("h-3.5 w-3.5 shrink-0", style.textColor)} />
            {/* Title - prioritized for visibility */}
            <p className="font-bold text-sm text-foreground truncate leading-tight flex-1">
              {item.title}
            </p>
            {/* Condition incompatibility warning badge */}
            {hasIncompatibility && (
              <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-500/30 border-2 border-red-500 animate-pulse">
                <AlertOctagon className="h-4 w-4 text-red-400" />
              </div>
            )}
            {/* Group indicator */}
            {isGrouped && <Layers className={cn("h-3 w-3 shrink-0", style.textColor)} />}
          </div>
          {showSelect && (
            <button
              onClick={handleSelectClick}
              className={cn(
                "shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-primary border-primary text-black"
                  : "border-muted-foreground/50 hover:border-primary"
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Category label and condition warning */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider shrink-0",
              style.textColor
            )}
          >
            {item.subtitle || item.type}
          </span>
          {/* Condition warning text */}
          {hasIncompatibility && incompatibleConditions.length > 0 && (
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider truncate">
              ⚠ {incompatibleConditions.join(", ")}
            </span>
          )}
        </div>

        {/* Item names for grouped items */}
        {isGrouped && item.itemNames && item.itemNames.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-tight">
            {formatItemNames(item.itemNames, 3)}
          </p>
        )}

        {/* Metadata and time */}
        <div className="mt-auto flex items-end justify-between gap-2">
          {metadataText && (
            <span className="text-xs text-muted-foreground font-medium">{metadataText}</span>
          )}
          {!isAllDay && (
            <span className="text-xs text-muted-foreground/70 font-medium ml-auto">{timeText}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export { TYPE_STYLES };
