import {
  getUnavailableDates,
  isDateUnavailable,
  hasOverlap,
  categorizeLimits,
  formatDateRange,
} from "../use-client-plan-limits";
import type { ClientPlanLimit } from "@/lib/database.types";

// Helper to create mock limit
function createMockLimit(overrides: Partial<ClientPlanLimit> = {}): ClientPlanLimit {
  return {
    id: "limit-1",
    client_id: "client-1",
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    max_calories_per_day: 2000,
    min_protein_per_day: 100,
    max_protein_per_day: null,
    min_carbs_per_day: null,
    max_carbs_per_day: null,
    min_fats_per_day: null,
    max_fats_per_day: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    created_by: null,
    ...overrides,
  };
}

describe("useClientPlanLimits utilities", () => {
  describe("getUnavailableDates", () => {
    it("returns empty array for empty ranges", () => {
      const result = getUnavailableDates([]);
      expect(result).toHaveLength(0);
    });

    it("returns all dates in a single range", () => {
      const limits = [
        createMockLimit({
          start_date: "2026-01-01",
          end_date: "2026-01-03",
        }),
      ];

      const result = getUnavailableDates(limits);
      expect(result).toHaveLength(3);
      expect(result[0].toISOString()).toContain("2026-01-01");
      expect(result[1].toISOString()).toContain("2026-01-02");
      expect(result[2].toISOString()).toContain("2026-01-03");
    });

    it("returns dates from multiple ranges", () => {
      const limits = [
        createMockLimit({
          id: "limit-1",
          start_date: "2026-01-01",
          end_date: "2026-01-02",
        }),
        createMockLimit({
          id: "limit-2",
          start_date: "2026-01-05",
          end_date: "2026-01-06",
        }),
      ];

      const result = getUnavailableDates(limits);
      expect(result).toHaveLength(4);
    });

    it("excludes specified range when excludeId is provided", () => {
      const limits = [
        createMockLimit({
          id: "limit-1",
          start_date: "2026-01-01",
          end_date: "2026-01-03",
        }),
        createMockLimit({
          id: "limit-2",
          start_date: "2026-01-05",
          end_date: "2026-01-06",
        }),
      ];

      const result = getUnavailableDates(limits, "limit-1");
      expect(result).toHaveLength(2); // Only limit-2 dates
    });
  });

  describe("isDateUnavailable", () => {
    it("returns true for dates in unavailable list", () => {
      const unavailable = [new Date("2026-01-15T00:00:00")];
      const date = new Date("2026-01-15T12:00:00"); // Different time, same day

      const result = isDateUnavailable(date, unavailable);
      expect(result).toBe(true);
    });

    it("returns false for dates not in unavailable list", () => {
      const unavailable = [new Date("2026-01-15T00:00:00")];
      const date = new Date("2026-01-16T00:00:00");

      const result = isDateUnavailable(date, unavailable);
      expect(result).toBe(false);
    });

    it("returns false for empty unavailable list", () => {
      const result = isDateUnavailable(new Date(), []);
      expect(result).toBe(false);
    });
  });

  describe("hasOverlap", () => {
    it("returns false for non-overlapping ranges", () => {
      const existing = [
        createMockLimit({
          start_date: "2026-01-01",
          end_date: "2026-01-10",
        }),
      ];

      const newStart = new Date("2026-01-15T00:00:00");
      const newEnd = new Date("2026-01-20T00:00:00");

      const result = hasOverlap(newStart, newEnd, existing);
      expect(result).toBe(false);
    });

    it("returns true when new range starts during existing range", () => {
      const existing = [
        createMockLimit({
          start_date: "2026-01-01",
          end_date: "2026-01-15",
        }),
      ];

      const newStart = new Date("2026-01-10T00:00:00");
      const newEnd = new Date("2026-01-20T00:00:00");

      const result = hasOverlap(newStart, newEnd, existing);
      expect(result).toBe(true);
    });

    it("returns true when new range ends during existing range", () => {
      const existing = [
        createMockLimit({
          start_date: "2026-01-10",
          end_date: "2026-01-20",
        }),
      ];

      const newStart = new Date("2026-01-01T00:00:00");
      const newEnd = new Date("2026-01-15T00:00:00");

      const result = hasOverlap(newStart, newEnd, existing);
      expect(result).toBe(true);
    });

    it("returns true when new range completely contains existing range", () => {
      const existing = [
        createMockLimit({
          start_date: "2026-01-10",
          end_date: "2026-01-15",
        }),
      ];

      const newStart = new Date("2026-01-01T00:00:00");
      const newEnd = new Date("2026-01-20T00:00:00");

      const result = hasOverlap(newStart, newEnd, existing);
      expect(result).toBe(true);
    });

    it("returns true when new range is within existing range", () => {
      const existing = [
        createMockLimit({
          start_date: "2026-01-01",
          end_date: "2026-01-20",
        }),
      ];

      const newStart = new Date("2026-01-05T00:00:00");
      const newEnd = new Date("2026-01-10T00:00:00");

      const result = hasOverlap(newStart, newEnd, existing);
      expect(result).toBe(true);
    });

    it("returns true when ranges touch at same day", () => {
      const existing = [
        createMockLimit({
          start_date: "2026-01-01",
          end_date: "2026-01-10",
        }),
      ];

      const newStart = new Date("2026-01-10T00:00:00");
      const newEnd = new Date("2026-01-15T00:00:00");

      const result = hasOverlap(newStart, newEnd, existing);
      expect(result).toBe(true);
    });

    it("excludes specified range when checking overlap", () => {
      const existing = [
        createMockLimit({
          id: "limit-1",
          start_date: "2026-01-01",
          end_date: "2026-01-15",
        }),
      ];

      const newStart = new Date("2026-01-05T00:00:00");
      const newEnd = new Date("2026-01-20T00:00:00");

      // Without exclude, should overlap
      expect(hasOverlap(newStart, newEnd, existing)).toBe(true);

      // With exclude, should not overlap
      expect(hasOverlap(newStart, newEnd, existing, "limit-1")).toBe(false);
    });
  });

  describe("categorizeLimits", () => {
    // Mock today's date as 2026-01-15
    const mockToday = new Date("2026-01-15T12:00:00Z");

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockToday);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns empty result for empty limits", () => {
      const result = categorizeLimits([]);
      expect(result.current).toBeNull();
      expect(result.future).toHaveLength(0);
      expect(result.past).toHaveLength(0);
    });

    it("identifies current range covering today", () => {
      const limits = [
        createMockLimit({
          start_date: "2026-01-10",
          end_date: "2026-01-20",
        }),
      ];

      const result = categorizeLimits(limits);
      expect(result.current).not.toBeNull();
      expect(result.current?.start_date).toBe("2026-01-10");
    });

    it("identifies future ranges", () => {
      const limits = [
        createMockLimit({
          id: "future-1",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
        }),
        createMockLimit({
          id: "future-2",
          start_date: "2026-03-01",
          end_date: "2026-03-31",
        }),
      ];

      const result = categorizeLimits(limits);
      expect(result.current).toBeNull();
      expect(result.future).toHaveLength(2);
      // Should be sorted by start_date ascending
      expect(result.future[0].start_date).toBe("2026-02-01");
      expect(result.future[1].start_date).toBe("2026-03-01");
    });

    it("identifies past ranges", () => {
      const limits = [
        createMockLimit({
          id: "past-1",
          start_date: "2025-12-01",
          end_date: "2025-12-31",
        }),
        createMockLimit({
          id: "past-2",
          start_date: "2026-01-01",
          end_date: "2026-01-10",
        }),
      ];

      const result = categorizeLimits(limits);
      expect(result.current).toBeNull();
      expect(result.past).toHaveLength(2);
      // Should be sorted by end_date descending (most recent first)
      expect(result.past[0].end_date).toBe("2026-01-10");
      expect(result.past[1].end_date).toBe("2025-12-31");
    });

    it("correctly categorizes mixed ranges", () => {
      const limits = [
        createMockLimit({
          id: "past-1",
          start_date: "2026-01-01",
          end_date: "2026-01-10",
        }),
        createMockLimit({
          id: "current-1",
          start_date: "2026-01-11",
          end_date: "2026-01-20",
        }),
        createMockLimit({
          id: "future-1",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
        }),
      ];

      const result = categorizeLimits(limits);
      expect(result.past).toHaveLength(1);
      expect(result.past[0].id).toBe("past-1");
      expect(result.current).not.toBeNull();
      expect(result.current?.id).toBe("current-1");
      expect(result.future).toHaveLength(1);
      expect(result.future[0].id).toBe("future-1");
    });
  });

  describe("formatDateRange", () => {
    it("formats date range without year for current year", () => {
      // Mock current year
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-06-15"));

      const result = formatDateRange("2026-01-15", "2026-02-15");
      expect(result).toBe("Jan 15 - Feb 15");

      jest.useRealTimers();
    });

    it("includes year when dates are not in current year", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-06-15"));

      const result = formatDateRange("2025-12-01", "2025-12-31");
      expect(result).toContain("2025");

      jest.useRealTimers();
    });

    it("formats same-month ranges", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-06-15"));

      const result = formatDateRange("2026-03-01", "2026-03-15");
      expect(result).toBe("Mar 1 - Mar 15");

      jest.useRealTimers();
    });
  });
});
