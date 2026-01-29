/**
 * Timeline Grid Component
 *
 * Visual timeline displaying hours from 5 AM to 11 PM with lanes for items.
 * Uses CSS Grid for layout with time labels on the left and item lanes on the right.
 */

"use client";

import { useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { packItemsIntoLanes, getLaneCount } from "@/lib/utils/lane-packing";
import type { LanePackingItem, PackedItem } from "@/lib/utils/lane-packing";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";
import { TimelineItem } from "./timeline-item";

// Timeline configuration
const TIMELINE_START_HOUR = 5; // 5 AM
const TIMELINE_END_HOUR = 23; // 11 PM
const HOUR_HEIGHT_PX = 100; // Height per hour in pixels
const MIN_LANES = 1; // Minimum lanes - items span full width when only 1 lane needed

/**
 * Convert minutes from midnight to pixel position
 */
function minutesToPixels(minutes: number): number {
  const startMinutes = TIMELINE_START_HOUR * 60;
  const offsetMinutes = minutes - startMinutes;
  return (offsetMinutes / 60) * HOUR_HEIGHT_PX;
}

/**
 * Format hour for display (e.g., "5 AM", "12 PM")
 */
function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

interface TimelineGridProps {
  items: ExtendedTimelineItem[];
  packingItems: LanePackingItem[];
  onItemClick?: (item: ExtendedTimelineItem) => void;
  selectedItemIds?: Set<string>;
  onItemSelect?: (itemId: string, selected: boolean) => void;
  isLoading?: boolean;
  /** Scroll to the first item when items load */
  autoScrollToFirstItem?: boolean;
  className?: string;
  /** Set of food_item_ids with condition incompatibilities */
  incompatibleFoodIds?: Set<string>;
  /** Map of food_item_id -> array of incompatible condition names */
  incompatibleFoodsMap?: Map<string, string[]>;
}

/**
 * Timeline grid with time labels and item lanes
 */
export function TimelineGrid({
  items,
  packingItems,
  onItemClick,
  selectedItemIds = new Set(),
  onItemSelect,
  isLoading = false,
  autoScrollToFirstItem = false,
  className,
  incompatibleFoodIds = new Set(),
  incompatibleFoodsMap = new Map(),
}: TimelineGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Generate hour labels
  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
      result.push(h);
    }
    return result;
  }, []);

  // Pack items into lanes
  const packedItems = useMemo(() => packItemsIntoLanes(packingItems), [packingItems]);

  // Create a map of packed items by ID for quick lookup
  const packedItemsMap = useMemo(() => {
    const map = new Map<string, PackedItem>();
    for (const packed of packedItems) {
      map.set(packed.id, packed);
    }
    return map;
  }, [packedItems]);

  // Calculate number of lanes
  const laneCount = useMemo(() => {
    const packed = getLaneCount(packedItems);
    return Math.max(packed, MIN_LANES);
  }, [packedItems]);

  // Calculate total timeline height
  const totalHeight = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX;

  // Create items with positions
  const positionedItems = useMemo(() => {
    return items.map((item) => {
      const packed = packedItemsMap.get(item.id);
      if (!packed) {
        // Fallback if packing failed
        return {
          item,
          top: 0,
          height: HOUR_HEIGHT_PX,
          lane: 0,
        };
      }

      const top = minutesToPixels(packed.startMinutes);
      const height = Math.max(
        minutesToPixels(packed.endMinutes) - top,
        50 // Minimum height for visibility (increased for title display)
      );

      return {
        item,
        top,
        height,
        lane: packed.lane,
      };
    });
  }, [items, packedItemsMap]);

  // Find earliest item position for auto-scroll
  const earliestItemTop = useMemo(() => {
    if (positionedItems.length === 0) return 0;
    return Math.max(0, Math.min(...positionedItems.map((p) => p.top)) - 20); // 20px padding above
  }, [positionedItems]);

  // Auto-scroll to first item
  useEffect(() => {
    if (autoScrollToFirstItem && containerRef.current && positionedItems.length > 0 && !isLoading) {
      // Find the scrollable parent
      const scrollParent = containerRef.current.closest(".overflow-y-auto, .overflow-auto");
      if (scrollParent) {
        scrollParent.scrollTop = earliestItemTop;
      } else {
        // If no scroll parent, try scrolling the container itself
        containerRef.current.scrollTop = earliestItemTop;
      }
    }
  }, [autoScrollToFirstItem, earliestItemTop, positionedItems.length, isLoading]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 z-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex">
        {/* Time labels column */}
        <div className="w-20 shrink-0 border-r border-border">
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-border/50 pr-3 flex items-start justify-end"
              style={{ height: HOUR_HEIGHT_PX }}
            >
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider -mt-2">
                {formatHour(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Lanes container */}
        <div className="flex-1 relative" style={{ height: totalHeight }}>
          {/* Hour grid lines */}
          {hours.map((hour, index) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-b border-border/30"
              style={{ top: index * HOUR_HEIGHT_PX }}
            />
          ))}

          {/* Lane columns (visual guides) */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: laneCount }).map((_, laneIndex) => (
              <div
                key={laneIndex}
                className={cn(
                  "flex-1 border-r border-border/20",
                  laneIndex === laneCount - 1 && "border-r-0"
                )}
              />
            ))}
          </div>

          {/* Timeline items - render all-day items first (lower z-index) */}
          {positionedItems
            .sort((a, b) => {
              // All-day items render first (background), regular items on top
              const aIsAllDay = a.item.scheduling.time_type === "all_day";
              const bIsAllDay = b.item.scheduling.time_type === "all_day";
              if (aIsAllDay && !bIsAllDay) return -1;
              if (!aIsAllDay && bIsAllDay) return 1;
              return 0;
            })
            .map(({ item, top, height, lane }) => {
              const laneWidth = 100 / laneCount;
              const left = lane * laneWidth;

              // All-day items now stay in their assigned lane (not spanning all lanes)
              // Don't apply faded all-day styling to grouped items - they should be clearly visible
              const isAllDay = item.scheduling.time_type === "all_day" && !item.isGrouped;
              const itemWidth = laneWidth - 1; // -1% for gap between lanes
              const itemLeft = left + 0.5; // 0.5% for gap

              // Check for food incompatibilities (only for meal items)
              const itemFoodIds = item.foodItemIds || [];
              const hasIncompatibility =
                item.type === "meal" &&
                itemFoodIds.some((foodId) => incompatibleFoodIds.has(foodId));

              // Collect all incompatible conditions for this item
              const incompatibleConditions = hasIncompatibility
                ? Array.from(
                    new Set(itemFoodIds.flatMap((foodId) => incompatibleFoodsMap.get(foodId) || []))
                  )
                : [];

              return (
                <div
                  key={item.id}
                  className="absolute px-1"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `${itemLeft}%`,
                    width: `${itemWidth}%`,
                    zIndex: isAllDay ? 0 : 10, // All-day items behind regular items
                  }}
                >
                  <TimelineItem
                    item={item}
                    isSelected={selectedItemIds.has(item.id)}
                    isAllDay={isAllDay}
                    onClick={() => onItemClick?.(item)}
                    onSelect={(selected) => onItemSelect?.(item.id, selected)}
                    showSelect={!!onItemSelect}
                    hasIncompatibility={hasIncompatibility}
                    incompatibleConditions={incompatibleConditions}
                  />
                </div>
              );
            })}

          {/* Empty state */}
          {items.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground font-bold">No items for this day</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click &quot;Add Item&quot; to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { TIMELINE_START_HOUR, TIMELINE_END_HOUR, HOUR_HEIGHT_PX };
