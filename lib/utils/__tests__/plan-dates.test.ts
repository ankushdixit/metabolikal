/**
 * Tests for plan-dates utility functions
 */

import {
  getDayDate,
  getDayNumber,
  formatDayLabel,
  formatDayDate,
  isToday,
  getTodaysDayNumber,
  isPastDay,
  isFutureDay,
  parsePlanDate,
  formatPlanDateForStorage,
} from "../plan-dates";

describe("plan-dates utilities", () => {
  // Use fixed dates for testing
  const fixedStartDate = new Date("2026-01-15T00:00:00");

  describe("getDayDate", () => {
    it("returns the start date for day 1", () => {
      const result = getDayDate(fixedStartDate, 1);
      expect(result.toISOString().split("T")[0]).toBe("2026-01-15");
    });

    it("returns correct date for day 2", () => {
      const result = getDayDate(fixedStartDate, 2);
      expect(result.toISOString().split("T")[0]).toBe("2026-01-16");
    });

    it("returns correct date for day 7", () => {
      const result = getDayDate(fixedStartDate, 7);
      expect(result.toISOString().split("T")[0]).toBe("2026-01-21");
    });

    it("returns correct date for day 30", () => {
      const result = getDayDate(fixedStartDate, 30);
      expect(result.toISOString().split("T")[0]).toBe("2026-02-13");
    });
  });

  describe("getDayNumber", () => {
    it("returns 1 for the start date itself", () => {
      const result = getDayNumber(fixedStartDate, fixedStartDate);
      expect(result).toBe(1);
    });

    it("returns 2 for the next day", () => {
      const nextDay = new Date("2026-01-16T00:00:00");
      const result = getDayNumber(fixedStartDate, nextDay);
      expect(result).toBe(2);
    });

    it("returns 7 for day 7", () => {
      const day7 = new Date("2026-01-21T00:00:00");
      const result = getDayNumber(fixedStartDate, day7);
      expect(result).toBe(7);
    });

    it("returns negative for dates before start", () => {
      const beforeStart = new Date("2026-01-10T00:00:00");
      const result = getDayNumber(fixedStartDate, beforeStart);
      expect(result).toBeLessThan(1);
    });
  });

  describe("formatDayLabel", () => {
    it("returns just Day N when start date is null", () => {
      const result = formatDayLabel(null, 1);
      expect(result).toBe("Day 1");
    });

    it("returns formatted label with date when start date is provided", () => {
      const result = formatDayLabel(fixedStartDate, 1);
      expect(result).toMatch(/Day 1 - /);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/15/);
    });

    it("formats day 7 correctly", () => {
      const result = formatDayLabel(fixedStartDate, 7);
      expect(result).toMatch(/Day 7 - /);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/21/);
    });
  });

  describe("formatDayDate", () => {
    it("returns null when start date is null", () => {
      const result = formatDayDate(null, 1);
      expect(result).toBeNull();
    });

    it("returns formatted date when start date is provided", () => {
      const result = formatDayDate(fixedStartDate, 1);
      expect(result).not.toBeNull();
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/15/);
    });
  });

  describe("isToday", () => {
    it("returns true when day matches today", () => {
      const today = new Date();
      // Create a start date such that day 1 is today
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);

      const result = isToday(startDate, 1);
      expect(result).toBe(true);
    });

    it("returns false when day does not match today", () => {
      // Use a start date from 10 days ago, check day 1
      // Day 1 would be 10 days ago, not today
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const result = isToday(tenDaysAgo, 1);
      expect(result).toBe(false);
    });
  });

  describe("getTodaysDayNumber", () => {
    it("returns 1 when today is the start date", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = getTodaysDayNumber(today);
      expect(result).toBe(1);
    });

    it("returns null when today is before the start date", () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 10);

      const result = getTodaysDayNumber(futureStart);
      expect(result).toBeNull();
    });

    it("returns correct day number for past start date", () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 4);
      fiveDaysAgo.setHours(0, 0, 0, 0);

      const result = getTodaysDayNumber(fiveDaysAgo);
      expect(result).toBe(5);
    });
  });

  describe("isPastDay", () => {
    it("returns true for days before today", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Start date 10 days ago, check day 1
      const tenDaysAgo = new Date(today);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const result = isPastDay(tenDaysAgo, 1);
      expect(result).toBe(true);
    });

    it("returns false for today", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = isPastDay(today, 1);
      expect(result).toBe(false);
    });

    it("returns false for future days", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const result = isPastDay(tomorrow, 1);
      expect(result).toBe(false);
    });
  });

  describe("isFutureDay", () => {
    it("returns false for days before today", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const result = isFutureDay(yesterday, 1);
      expect(result).toBe(false);
    });

    it("returns false for today", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = isFutureDay(today, 1);
      expect(result).toBe(false);
    });

    it("returns true for future days", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const result = isFutureDay(tomorrow, 1);
      expect(result).toBe(true);
    });
  });

  describe("parsePlanDate", () => {
    it("returns null for null input", () => {
      const result = parsePlanDate(null);
      expect(result).toBeNull();
    });

    it("returns null for undefined input", () => {
      const result = parsePlanDate(undefined);
      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = parsePlanDate("");
      expect(result).toBeNull();
    });

    it("parses valid date string", () => {
      const result = parsePlanDate("2026-01-15");
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(0); // January is 0
      expect(result?.getDate()).toBe(15);
    });

    it("returns null for invalid date string", () => {
      const result = parsePlanDate("invalid-date");
      expect(result).toBeNull();
    });
  });

  describe("formatPlanDateForStorage", () => {
    it("formats date correctly", () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      const result = formatPlanDateForStorage(date);
      expect(result).toBe("2026-01-15");
    });

    it("pads single-digit months", () => {
      const date = new Date(2026, 5, 5); // June 5, 2026
      const result = formatPlanDateForStorage(date);
      expect(result).toBe("2026-06-05");
    });

    it("handles December correctly", () => {
      const date = new Date(2026, 11, 25); // December 25, 2026
      const result = formatPlanDateForStorage(date);
      expect(result).toBe("2026-12-25");
    });
  });
});
