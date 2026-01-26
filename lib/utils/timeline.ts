/**
 * Timeline Utility Functions
 *
 * Provides utilities for:
 * - Time period to range conversion
 * - Relative time calculation with offsets
 * - Timeline item sorting
 * - Time formatting and parsing
 */

import type {
  TimePeriod,
  RelativeAnchor,
  TimelineScheduling,
  TimelineItem,
  TimeRange,
  ClientAnchorTimes,
} from "../database.types";

// =============================================================================
// TIME PERIOD MAPPINGS
// =============================================================================

/**
 * Default time ranges for each time period
 * Used when no fixed time is specified
 */
export const TIME_PERIOD_RANGES: Record<TimePeriod, TimeRange> = {
  early_morning: { start: "05:00", end: "07:00" },
  morning: { start: "07:00", end: "10:00" },
  midday: { start: "10:00", end: "14:00" },
  afternoon: { start: "14:00", end: "17:00" },
  evening: { start: "17:00", end: "20:00" },
  night: { start: "20:00", end: "22:00" },
  before_sleep: { start: "22:00", end: "23:59" },
};

/**
 * Default anchor times when client hasn't set custom times
 */
export const DEFAULT_ANCHOR_TIMES: ClientAnchorTimes = {
  wake_up: "06:30",
  breakfast: "08:00",
  lunch: "12:30",
  evening_snack: "16:00",
  dinner: "19:00",
  sleep: "22:30",
  pre_workout: "17:00",
  post_workout: "18:30",
};

/**
 * Order of time periods for sorting
 */
export const TIME_PERIOD_ORDER: Record<TimePeriod, number> = {
  early_morning: 1,
  morning: 2,
  midday: 3,
  afternoon: 4,
  evening: 5,
  night: 6,
  before_sleep: 7,
};

// =============================================================================
// TIME CONVERSION FUNCTIONS
// =============================================================================

/**
 * Convert a time period to its default time range
 */
export function getTimePeriodRange(period: TimePeriod): TimeRange {
  return TIME_PERIOD_RANGES[period];
}

/**
 * Get the midpoint of a time period (for sorting)
 */
export function getTimePeriodMidpoint(period: TimePeriod): string {
  const range = TIME_PERIOD_RANGES[period];
  const startMinutes = timeToMinutes(range.start);
  const endMinutes = timeToMinutes(range.end);
  const midMinutes = Math.floor((startMinutes + endMinutes) / 2);
  return minutesToTime(midMinutes);
}

/**
 * Convert HH:MM time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:MM time string
 */
export function minutesToTime(totalMinutes: number): string {
  // Handle negative minutes (before midnight)
  let normalized = totalMinutes;
  if (normalized < 0) {
    normalized = 0; // Clamp to start of day
  }
  if (normalized >= 24 * 60) {
    normalized = 24 * 60 - 1; // Clamp to end of day
  }

  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Format time for display (e.g., "8:00 AM")
 */
export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// =============================================================================
// RELATIVE TIME CALCULATION
// =============================================================================

/**
 * Calculate the actual time for a relative scheduling
 */
export function calculateRelativeTime(
  anchor: RelativeAnchor,
  offsetMinutes: number,
  clientAnchors: ClientAnchorTimes = DEFAULT_ANCHOR_TIMES
): string {
  const anchorTime = clientAnchors[anchor];
  if (!anchorTime) {
    // Fallback to default if anchor not found
    const defaultTime = DEFAULT_ANCHOR_TIMES[anchor];
    if (!defaultTime) {
      return "12:00"; // Safe fallback
    }
    const anchorMinutes = timeToMinutes(defaultTime);
    return minutesToTime(anchorMinutes + offsetMinutes);
  }

  const anchorMinutes = timeToMinutes(anchorTime);
  return minutesToTime(anchorMinutes + offsetMinutes);
}

/**
 * Format relative time for display
 * E.g., "30 min after breakfast", "15 min before workout"
 */
export function formatRelativeTimeDisplay(anchor: RelativeAnchor, offsetMinutes: number): string {
  const anchorLabels: Record<RelativeAnchor, string> = {
    wake_up: "wake up",
    pre_workout: "workout",
    post_workout: "workout",
    breakfast: "breakfast",
    lunch: "lunch",
    evening_snack: "evening snack",
    dinner: "dinner",
    sleep: "bed",
  };

  const anchorLabel = anchorLabels[anchor];

  if (offsetMinutes === 0) {
    if (anchor === "pre_workout") return "Before workout";
    if (anchor === "post_workout") return "After workout";
    return `At ${anchorLabel}`;
  }

  const absOffset = Math.abs(offsetMinutes);
  const direction = offsetMinutes > 0 ? "after" : "before";

  if (absOffset < 60) {
    return `${absOffset} min ${direction} ${anchorLabel}`;
  }

  const hours = Math.floor(absOffset / 60);
  const mins = absOffset % 60;

  if (mins === 0) {
    return `${hours} hr ${direction} ${anchorLabel}`;
  }

  return `${hours} hr ${mins} min ${direction} ${anchorLabel}`;
}

// =============================================================================
// TIMELINE ITEM SORTING
// =============================================================================

/**
 * Get the effective sort time for a timeline item
 * Returns minutes since midnight for comparison
 */
export function getEffectiveSortTime(
  scheduling: TimelineScheduling,
  clientAnchors: ClientAnchorTimes = DEFAULT_ANCHOR_TIMES
): number {
  switch (scheduling.time_type) {
    case "fixed":
      if (scheduling.time_start) {
        return timeToMinutes(scheduling.time_start);
      }
      return 12 * 60; // Noon fallback

    case "relative":
      if (scheduling.relative_anchor) {
        const time = calculateRelativeTime(
          scheduling.relative_anchor,
          scheduling.relative_offset_minutes,
          clientAnchors
        );
        return timeToMinutes(time);
      }
      return 12 * 60; // Noon fallback

    case "period":
      if (scheduling.time_period) {
        const midpoint = getTimePeriodMidpoint(scheduling.time_period);
        return timeToMinutes(midpoint);
      }
      return 12 * 60; // Noon fallback

    case "all_day":
      // All-day items are sorted last within their display order
      return 24 * 60; // End of day

    default:
      return 12 * 60; // Noon fallback
  }
}

/**
 * Sort timeline items by their effective time
 */
export function sortTimelineItems(
  items: TimelineItem[],
  clientAnchors: ClientAnchorTimes = DEFAULT_ANCHOR_TIMES
): TimelineItem[] {
  return [...items].sort((a, b) => {
    const timeA = getEffectiveSortTime(a.scheduling, clientAnchors);
    const timeB = getEffectiveSortTime(b.scheduling, clientAnchors);
    return timeA - timeB;
  });
}

/**
 * Group timeline items by time period
 */
export function groupTimelineItemsByPeriod(
  items: TimelineItem[],
  clientAnchors: ClientAnchorTimes = DEFAULT_ANCHOR_TIMES
): Map<TimePeriod | "all_day", TimelineItem[]> {
  const groups = new Map<TimePeriod | "all_day", TimelineItem[]>();

  // Initialize all groups
  const allPeriods: (TimePeriod | "all_day")[] = [
    "early_morning",
    "morning",
    "midday",
    "afternoon",
    "evening",
    "night",
    "before_sleep",
    "all_day",
  ];
  allPeriods.forEach((period) => groups.set(period, []));

  // Assign items to groups
  for (const item of items) {
    const period = getItemTimePeriod(item.scheduling, clientAnchors);
    const group = groups.get(period) || [];
    group.push(item);
    groups.set(period, group);
  }

  // Sort items within each group
  groups.forEach((groupItems, period) => {
    if (period !== "all_day") {
      groups.set(period, sortTimelineItems(groupItems, clientAnchors));
    }
  });

  return groups;
}

/**
 * Get the time period for a scheduling
 */
export function getItemTimePeriod(
  scheduling: TimelineScheduling,
  clientAnchors: ClientAnchorTimes = DEFAULT_ANCHOR_TIMES
): TimePeriod | "all_day" {
  if (scheduling.time_type === "all_day") {
    return "all_day";
  }

  if (scheduling.time_type === "period" && scheduling.time_period) {
    return scheduling.time_period;
  }

  // For fixed and relative times, determine the period based on the effective time
  const effectiveMinutes = getEffectiveSortTime(scheduling, clientAnchors);
  return getTimePeriodFromMinutes(effectiveMinutes);
}

/**
 * Determine which time period a given time falls into
 */
export function getTimePeriodFromMinutes(minutes: number): TimePeriod {
  for (const [period, range] of Object.entries(TIME_PERIOD_RANGES)) {
    const startMinutes = timeToMinutes(range.start);
    const endMinutes = timeToMinutes(range.end);

    if (minutes >= startMinutes && minutes < endMinutes) {
      return period as TimePeriod;
    }
  }

  // Handle edge cases
  if (minutes < timeToMinutes("05:00")) {
    return "before_sleep"; // After midnight but before early morning
  }

  return "before_sleep"; // Default to end of day
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get display text for a scheduling
 */
export function getSchedulingDisplayText(
  scheduling: TimelineScheduling,
  _clientAnchors: ClientAnchorTimes = DEFAULT_ANCHOR_TIMES
): string {
  switch (scheduling.time_type) {
    case "fixed":
      if (scheduling.time_start) {
        return formatTimeDisplay(scheduling.time_start);
      }
      return "Anytime";

    case "relative":
      if (scheduling.relative_anchor) {
        return formatRelativeTimeDisplay(
          scheduling.relative_anchor,
          scheduling.relative_offset_minutes
        );
      }
      return "Anytime";

    case "period":
      if (scheduling.time_period) {
        return formatTimePeriodDisplay(scheduling.time_period);
      }
      return "Anytime";

    case "all_day":
      return "All Day";

    default:
      return "Anytime";
  }
}

/**
 * Format time period for display
 */
export function formatTimePeriodDisplay(period: TimePeriod): string {
  const labels: Record<TimePeriod, string> = {
    early_morning: "Early Morning",
    morning: "Morning",
    midday: "Midday",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
    before_sleep: "Before Sleep",
  };
  return labels[period];
}

/**
 * Get icon name for a time period
 */
export function getTimePeriodIcon(period: TimePeriod): string {
  const icons: Record<TimePeriod, string> = {
    early_morning: "sunrise",
    morning: "sun",
    midday: "sun",
    afternoon: "cloud-sun",
    evening: "sunset",
    night: "moon",
    before_sleep: "moon",
  };
  return icons[period];
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate that a scheduling object has the required fields for its type
 */
export function validateScheduling(scheduling: TimelineScheduling): boolean {
  switch (scheduling.time_type) {
    case "fixed":
      return scheduling.time_start !== null;

    case "relative":
      return scheduling.relative_anchor !== null;

    case "period":
      return scheduling.time_period !== null;

    case "all_day":
      return true;

    default:
      return false;
  }
}

/**
 * Check if a time is within a time period
 */
export function isTimeInPeriod(time: string, period: TimePeriod): boolean {
  const minutes = timeToMinutes(time);
  const range = TIME_PERIOD_RANGES[period];
  const startMinutes = timeToMinutes(range.start);
  const endMinutes = timeToMinutes(range.end);

  return minutes >= startMinutes && minutes < endMinutes;
}
