/**
 * Timeline Filters Component
 *
 * Filter chips for activity types with:
 * - Multi-select support
 * - "All" option to show everything
 * - Visual feedback for active filters
 * - Horizontally scrollable on mobile
 */

"use client";

import { useCallback } from "react";
import { Eye, EyeOff, Utensils, Pill, Dumbbell, Heart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineItemType } from "@/lib/database.types";

// =============================================================================
// TYPES
// =============================================================================

export interface TypeFilters {
  meal: boolean;
  supplement: boolean;
  workout: boolean;
  lifestyle: boolean;
}

export interface FilterCounts {
  meal: number;
  supplement: number;
  workout: number;
  lifestyle: number;
  total: number;
}

interface TimelineFiltersProps {
  /** Current filter state */
  filters: TypeFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: TypeFilters) => void;
  /** Item counts by type (optional) */
  counts?: FilterCounts;
  /** Whether filters are disabled */
  disabled?: boolean;
  /** Compact mode - single row horizontal scroll */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// FILTER CONFIGURATION
// =============================================================================

interface FilterConfig {
  key: TimelineItemType;
  label: string;
  icon: LucideIcon;
  activeColors: string;
}

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "meal",
    label: "Meals",
    icon: Utensils,
    activeColors: "bg-orange-500/20 border-orange-500/50 text-orange-400",
  },
  {
    key: "supplement",
    label: "Supplements",
    icon: Pill,
    activeColors: "bg-green-500/20 border-green-500/50 text-green-400",
  },
  {
    key: "workout",
    label: "Workouts",
    icon: Dumbbell,
    activeColors: "bg-blue-500/20 border-blue-500/50 text-blue-400",
  },
  {
    key: "lifestyle",
    label: "Lifestyle",
    icon: Heart,
    activeColors: "bg-purple-500/20 border-purple-500/50 text-purple-400",
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if all filters are enabled
 */
export function areAllFiltersEnabled(filters: TypeFilters): boolean {
  return Object.values(filters).every(Boolean);
}

/**
 * Check if no filters are enabled
 */
export function areNoFiltersEnabled(filters: TypeFilters): boolean {
  return Object.values(filters).every((v) => !v);
}

/**
 * Get active filter types as an array
 */
export function getActiveFilterTypes(filters: TypeFilters): TimelineItemType[] {
  return (Object.keys(filters) as TimelineItemType[]).filter((key) => filters[key]);
}

/**
 * Create filters from URL query param string
 * @param filterParam Comma-separated filter types (e.g., "meal,supplement")
 */
export function parseFiltersFromParam(filterParam: string | null): TypeFilters {
  const defaultFilters: TypeFilters = {
    meal: true,
    supplement: true,
    workout: true,
    lifestyle: true,
  };

  if (!filterParam) return defaultFilters;

  const activeTypes = filterParam.split(",").filter(Boolean) as TimelineItemType[];

  if (activeTypes.length === 0) return defaultFilters;

  return {
    meal: activeTypes.includes("meal"),
    supplement: activeTypes.includes("supplement"),
    workout: activeTypes.includes("workout"),
    lifestyle: activeTypes.includes("lifestyle"),
  };
}

/**
 * Convert filters to URL query param string
 * Returns null if all filters are enabled (to omit param)
 */
export function filtersToParam(filters: TypeFilters): string | null {
  if (areAllFiltersEnabled(filters)) return null;

  const activeTypes = getActiveFilterTypes(filters);
  if (activeTypes.length === 0) return null;

  return activeTypes.join(",");
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Timeline filters component with multi-select chips
 */
export function TimelineFilters({
  filters,
  onFiltersChange,
  counts,
  disabled = false,
  compact = false,
  className,
}: TimelineFiltersProps) {
  const allEnabled = areAllFiltersEnabled(filters);

  // Toggle a single filter
  const toggleFilter = useCallback(
    (type: TimelineItemType) => {
      if (disabled) return;

      onFiltersChange({
        ...filters,
        [type]: !filters[type],
      });
    },
    [filters, onFiltersChange, disabled]
  );

  // Toggle all filters
  const toggleAll = useCallback(() => {
    if (disabled) return;

    const newState = !allEnabled;
    onFiltersChange({
      meal: newState,
      supplement: newState,
      workout: newState,
      lifestyle: newState,
    });
  }, [allEnabled, onFiltersChange, disabled]);

  // Select only one type (exclusive filter)
  const selectOnly = useCallback(
    (type: TimelineItemType) => {
      if (disabled) return;

      onFiltersChange({
        meal: type === "meal",
        supplement: type === "supplement",
        workout: type === "workout",
        lifestyle: type === "lifestyle",
      });
    },
    [onFiltersChange, disabled]
  );

  return (
    <div
      className={cn(
        "flex items-center",
        compact ? "gap-1.5 overflow-x-auto scrollbar-hide flex-1" : "flex-wrap gap-3",
        className
      )}
    >
      {/* Show label - hidden in compact mode */}
      {!compact && (
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex-shrink-0">
          Show:
        </span>
      )}

      {/* Filter chips */}
      <div
        className={cn(
          "flex items-center overflow-x-auto scrollbar-hide",
          compact ? "gap-1" : "flex-wrap gap-2 pb-1 -mb-1"
        )}
      >
        {FILTER_CONFIGS.map((config) => {
          const isActive = filters[config.key];
          const count = counts?.[config.key];
          const Icon = config.icon;

          return (
            <button
              key={config.key}
              type="button"
              onClick={() => toggleFilter(config.key)}
              onDoubleClick={() => selectOnly(config.key)}
              disabled={disabled}
              title={
                compact
                  ? config.label
                  : `Click to toggle, double-click to show only ${config.label}`
              }
              className={cn(
                "flex items-center rounded border font-bold transition-all flex-shrink-0",
                compact ? "p-2" : "gap-1.5 px-2.5 py-1.5 text-sm",
                isActive
                  ? config.activeColors
                  : "bg-secondary/50 border-border text-muted-foreground",
                !isActive && "opacity-50",
                !disabled && "hover:opacity-100",
                disabled && "cursor-not-allowed"
              )}
            >
              {compact ? (
                /* Compact: only show type icon */
                <Icon className="h-4 w-4" />
              ) : (
                /* Full: show eye + label + count */
                <>
                  {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span>{config.label}</span>
                  {count !== undefined && (
                    <span
                      className={cn(
                        "px-1 py-0.5 rounded text-xs min-w-[1.25rem] text-center",
                        isActive ? "bg-black/20" : "bg-secondary"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Show/Hide All toggle - hidden in compact mode */}
      {!compact && (
        <button
          type="button"
          onClick={toggleAll}
          disabled={disabled}
          className={cn(
            "text-xs font-bold text-muted-foreground uppercase tracking-wider transition-colors flex-shrink-0",
            !disabled && "hover:text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {allEnabled ? "Hide All" : "Show All"}
        </button>
      )}
    </div>
  );
}

export default TimelineFilters;
