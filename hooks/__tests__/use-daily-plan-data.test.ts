/**
 * Tests for useDailyPlanData hook
 */

import { calculateCurrentDay } from "../use-daily-plan-data";

describe("useDailyPlanData", () => {
  describe("calculateCurrentDay", () => {
    it("returns 1 when today is the start date", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = calculateCurrentDay(today, 30);
      expect(result).toBe(1);
    });

    it("returns correct day when today is after start date", () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - 5); // 5 days ago
      const result = calculateCurrentDay(startDate, 30);
      expect(result).toBe(6); // Day 6 (0 + 5 + 1)
    });

    it("returns 1 when today is before start date", () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() + 5); // 5 days in future
      const result = calculateCurrentDay(startDate, 30);
      expect(result).toBe(1);
    });

    it("returns last day when today is after plan end", () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - 50); // 50 days ago
      const result = calculateCurrentDay(startDate, 30);
      expect(result).toBe(30); // Max day
    });

    it("handles exact day boundary correctly", () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - 29); // Exactly at day 30
      const result = calculateCurrentDay(startDate, 30);
      expect(result).toBe(30);
    });

    it("returns 1 for single day plan on start date", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = calculateCurrentDay(today, 1);
      expect(result).toBe(1);
    });

    it("clamps to duration when far in future", () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - 100); // 100 days ago
      const result = calculateCurrentDay(startDate, 7);
      expect(result).toBe(7);
    });
  });
});
