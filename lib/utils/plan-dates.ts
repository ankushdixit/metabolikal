/**
 * Plan Date Utilities
 *
 * Utility functions for working with plan start dates and day numbers.
 * Enables mapping between day numbers (Day 1, Day 2, etc.) and actual calendar dates.
 */

/**
 * Get the calendar date for a specific day number
 *
 * @param startDate - The plan start date (Day 1)
 * @param dayNumber - The day number (1-based)
 * @returns The calendar date for that day number
 */
export function getDayDate(startDate: Date, dayNumber: number): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayNumber - 1);
  return date;
}

/**
 * Get the day number for a specific calendar date
 *
 * @param startDate - The plan start date (Day 1)
 * @param targetDate - The calendar date to convert
 * @returns The day number (1-based)
 */
export function getDayNumber(startDate: Date, targetDate: Date): number {
  const diffTime = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Format day label with date (e.g., "Day 1 - Mon, Jan 27")
 *
 * @param startDate - The plan start date (Day 1), or null if not set
 * @param dayNumber - The day number (1-based)
 * @returns Formatted label like "Day 1 - Mon, Jan 27" or just "Day 1" if no start date
 */
export function formatDayLabel(startDate: Date | null, dayNumber: number): string {
  if (!startDate) {
    return `Day ${dayNumber}`;
  }
  const date = getDayDate(startDate, dayNumber);
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `Day ${dayNumber} - ${formatted}`;
}

/**
 * Format just the date portion (e.g., "Mon, Jan 27")
 *
 * @param startDate - The plan start date (Day 1)
 * @param dayNumber - The day number (1-based)
 * @returns Formatted date string or null if no start date
 */
export function formatDayDate(startDate: Date | null, dayNumber: number): string | null {
  if (!startDate) {
    return null;
  }
  const date = getDayDate(startDate, dayNumber);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Check if a day number is "today" based on plan start date
 *
 * @param startDate - The plan start date (Day 1)
 * @param dayNumber - The day number (1-based)
 * @returns true if the day number corresponds to today's date
 */
export function isToday(startDate: Date, dayNumber: number): boolean {
  const dayDate = getDayDate(startDate, dayNumber);
  const today = new Date();
  return dayDate.toDateString() === today.toDateString();
}

/**
 * Get today's day number based on plan start date
 *
 * @param startDate - The plan start date (Day 1)
 * @returns The day number for today, or null if today is before start date
 */
export function getTodaysDayNumber(startDate: Date): number | null {
  const today = new Date();
  const dayNumber = getDayNumber(startDate, today);

  // If today is before the start date, return null
  if (dayNumber < 1) {
    return null;
  }

  return dayNumber;
}

/**
 * Check if a day number is in the past based on plan start date
 *
 * @param startDate - The plan start date (Day 1)
 * @param dayNumber - The day number (1-based)
 * @returns true if the day is before today
 */
export function isPastDay(startDate: Date, dayNumber: number): boolean {
  const dayDate = getDayDate(startDate, dayNumber);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dayDate.setHours(0, 0, 0, 0);
  return dayDate < today;
}

/**
 * Check if a day number is in the future based on plan start date
 *
 * @param startDate - The plan start date (Day 1)
 * @param dayNumber - The day number (1-based)
 * @returns true if the day is after today
 */
export function isFutureDay(startDate: Date, dayNumber: number): boolean {
  const dayDate = getDayDate(startDate, dayNumber);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dayDate.setHours(0, 0, 0, 0);
  return dayDate > today;
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object
 *
 * @param dateString - The date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export function parsePlanDate(dateString: string | null | undefined): Date | null {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString + "T00:00:00");
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Format a Date to a date string (YYYY-MM-DD) for storage
 *
 * @param date - The Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function formatPlanDateForStorage(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
