/**
 * Tests for useClientPlanLimits hook and exported utility functions.
 *
 * Part 1: Pure utility function tests (getUnavailableDates, isDateUnavailable,
 *          hasOverlap, categorizeLimits, formatDateRange)
 * Part 2: Hook tests (useClientPlanLimits) covering:
 *          - loading/error states
 *          - limits data and categorization
 *          - createLimitRange (success, overlap error, mutation error)
 *          - updateLimitRange (success, overlap error, mutation error, non-date update)
 *          - deleteLimitRange (success, mutation error)
 *          - isEditable / isDeletable for current/future/past limits
 *          - refetch / invalidation
 *          - query configuration (filters, sorters, enabled)
 *          - instance-level getUnavailableDates and hasOverlap helpers
 */

import { renderHook, act } from "@testing-library/react";
import {
  getUnavailableDates,
  isDateUnavailable,
  hasOverlap,
  categorizeLimits,
  formatDateRange,
} from "../use-client-plan-limits";
import type { ClientPlanLimit } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Mock Refine hooks
// ---------------------------------------------------------------------------

const mockUseList = jest.fn();
const mockCreateMutateAsync = jest.fn();
const mockUpdateMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();
const mockInvalidate = jest.fn();

jest.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
  useCreate: () => ({ mutateAsync: mockCreateMutateAsync }),
  useUpdate: () => ({ mutateAsync: mockUpdateMutateAsync }),
  useDelete: () => ({ mutateAsync: mockDeleteMutateAsync }),
  useInvalidate: () => mockInvalidate,
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { toast } from "sonner";
import { useClientPlanLimits } from "../use-client-plan-limits";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function mockListReturn(
  data: ClientPlanLimit[],
  opts?: { isLoading?: boolean; isError?: boolean }
) {
  return {
    query: {
      data: { data },
      isLoading: opts?.isLoading ?? false,
      isError: opts?.isError ?? false,
    },
  };
}

// ============================================================================
// PART 1: Pure utility function tests
// ============================================================================

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

    it("returns single date for single-day range", () => {
      const limits = [
        createMockLimit({
          start_date: "2026-03-15",
          end_date: "2026-03-15",
        }),
      ];

      const result = getUnavailableDates(limits);
      expect(result).toHaveLength(1);
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

    it("returns false for empty existing ranges", () => {
      const result = hasOverlap(
        new Date("2026-01-01T00:00:00"),
        new Date("2026-01-10T00:00:00"),
        []
      );
      expect(result).toBe(false);
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

    it("identifies current range when today is the start date", () => {
      const limits = [
        createMockLimit({
          start_date: "2026-01-15",
          end_date: "2026-01-20",
        }),
      ];

      const result = categorizeLimits(limits);
      expect(result.current).not.toBeNull();
    });

    it("identifies current range when today is the end date", () => {
      const limits = [
        createMockLimit({
          start_date: "2026-01-10",
          end_date: "2026-01-15",
        }),
      ];

      const result = categorizeLimits(limits);
      expect(result.current).not.toBeNull();
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

    it("handles unsorted input correctly", () => {
      const limits = [
        createMockLimit({
          id: "future-1",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
        }),
        createMockLimit({
          id: "past-1",
          start_date: "2025-12-01",
          end_date: "2025-12-31",
        }),
        createMockLimit({
          id: "current-1",
          start_date: "2026-01-10",
          end_date: "2026-01-20",
        }),
      ];

      const result = categorizeLimits(limits);
      expect(result.past).toHaveLength(1);
      expect(result.current).not.toBeNull();
      expect(result.future).toHaveLength(1);
    });
  });

  describe("formatDateRange", () => {
    it("formats date range without year for current year", () => {
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

    it("includes year when start is current year but end is next year", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-06-15"));

      const result = formatDateRange("2026-12-01", "2027-01-15");
      expect(result).toContain("2027");

      jest.useRealTimers();
    });
  });
});

// ============================================================================
// PART 2: Hook tests
// ============================================================================

describe("useClientPlanLimits hook", () => {
  const clientId = "client-abc";

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue({});
    mockUpdateMutateAsync.mockResolvedValue({});
    mockDeleteMutateAsync.mockResolvedValue({});
  });

  // -----------------------------------------------------------------------
  // Loading / error states
  // -----------------------------------------------------------------------

  describe("loading and error states", () => {
    it("returns isLoading=true when query is loading", () => {
      mockUseList.mockReturnValue(mockListReturn([], { isLoading: true }));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      expect(result.current.isLoading).toBe(true);
    });

    it("returns isError=true when query fails", () => {
      mockUseList.mockReturnValue(mockListReturn([], { isError: true }));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      expect(result.current.isError).toBe(true);
    });

    it("returns empty limits when no data", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      expect(result.current.limits).toEqual([]);
      expect(result.current.categorizedLimits.current).toBeNull();
      expect(result.current.categorizedLimits.future).toEqual([]);
      expect(result.current.categorizedLimits.past).toEqual([]);
      expect(result.current.unavailableDates).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Query configuration
  // -----------------------------------------------------------------------

  describe("query configuration", () => {
    it("calls useList with correct resource and filters", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      renderHook(() => useClientPlanLimits({ clientId }));

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "client_plan_limits",
          filters: [{ field: "client_id", operator: "eq", value: clientId }],
          sorters: [{ field: "start_date", order: "asc" }],
        })
      );
    });

    it("passes enabled=true when clientId is provided", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      renderHook(() => useClientPlanLimits({ clientId }));

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: { enabled: true },
        })
      );
    });

    it("passes enabled=false when enabled option is false", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      renderHook(() => useClientPlanLimits({ clientId, enabled: false }));

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: { enabled: false },
        })
      );
    });

    it("passes enabled=false when clientId is empty string", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      renderHook(() => useClientPlanLimits({ clientId: "" }));

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: { enabled: false },
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // Data / categorization
  // -----------------------------------------------------------------------

  describe("limits data and categorization", () => {
    it("returns limits from query data", () => {
      const limits = [
        createMockLimit({ id: "l1", start_date: "2026-03-01", end_date: "2026-03-15" }),
        createMockLimit({ id: "l2", start_date: "2026-04-01", end_date: "2026-04-15" }),
      ];
      mockUseList.mockReturnValue(mockListReturn(limits));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      expect(result.current.limits).toEqual(limits);
    });

    it("computes unavailableDates from limits", () => {
      const limits = [
        createMockLimit({
          id: "l1",
          start_date: "2026-03-01",
          end_date: "2026-03-03",
        }),
      ];
      mockUseList.mockReturnValue(mockListReturn(limits));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      expect(result.current.unavailableDates).toHaveLength(3);
    });

    it("falls back to empty array when query data is undefined", () => {
      mockUseList.mockReturnValue({
        query: {
          data: undefined,
          isLoading: false,
          isError: false,
        },
      });

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      expect(result.current.limits).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // createLimitRange
  // -----------------------------------------------------------------------

  describe("createLimitRange", () => {
    it("creates a limit range successfully", async () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await act(async () => {
        await result.current.createLimitRange({
          start_date: "2026-05-01",
          end_date: "2026-05-15",
          max_calories_per_day: 2000,
          min_protein_per_day: 120,
        });
      });

      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        resource: "client_plan_limits",
        values: expect.objectContaining({
          client_id: clientId,
          start_date: "2026-05-01",
          end_date: "2026-05-15",
        }),
      });
      expect(toast.success).toHaveBeenCalledWith("Macro limit range created");
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "client_plan_limits",
        invalidates: ["list"],
      });
    });

    it("throws error when date range overlaps with existing", async () => {
      const existingLimits = [
        createMockLimit({
          id: "existing-1",
          start_date: "2026-05-01",
          end_date: "2026-05-15",
        }),
      ];
      mockUseList.mockReturnValue(mockListReturn(existingLimits));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await expect(
        act(async () => {
          await result.current.createLimitRange({
            start_date: "2026-05-10",
            end_date: "2026-05-20",
            max_calories_per_day: 1800,
          });
        })
      ).rejects.toThrow("Date range overlaps with existing range");

      expect(toast.error).toHaveBeenCalledWith("Date range overlaps with existing range");
      expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    });

    it("throws and shows error toast when mutation fails", async () => {
      mockUseList.mockReturnValue(mockListReturn([]));
      mockCreateMutateAsync.mockRejectedValueOnce(new Error("DB error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await expect(
        act(async () => {
          await result.current.createLimitRange({
            start_date: "2026-06-01",
            end_date: "2026-06-15",
            max_calories_per_day: 2200,
          });
        })
      ).rejects.toThrow("DB error");

      expect(toast.error).toHaveBeenCalledWith("Failed to create limit range");
      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // updateLimitRange
  // -----------------------------------------------------------------------

  describe("updateLimitRange", () => {
    it("updates a limit range successfully without date changes", async () => {
      const limits = [
        createMockLimit({
          id: "upd-1",
          start_date: "2026-05-01",
          end_date: "2026-05-15",
        }),
      ];
      mockUseList.mockReturnValue(mockListReturn(limits));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await act(async () => {
        await result.current.updateLimitRange("upd-1", {
          max_calories_per_day: 2100,
        });
      });

      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        resource: "client_plan_limits",
        id: "upd-1",
        values: { max_calories_per_day: 2100 },
      });
      expect(toast.success).toHaveBeenCalledWith("Macro limit range updated");
    });

    it("updates a limit range with date changes when no overlap", async () => {
      const limits = [
        createMockLimit({
          id: "upd-1",
          start_date: "2026-05-01",
          end_date: "2026-05-15",
        }),
      ];
      mockUseList.mockReturnValue(mockListReturn(limits));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await act(async () => {
        await result.current.updateLimitRange("upd-1", {
          start_date: "2026-05-05",
          end_date: "2026-05-20",
        });
      });

      expect(mockUpdateMutateAsync).toHaveBeenCalled();
    });

    it("throws error when updated dates overlap with another range", async () => {
      const limits = [
        createMockLimit({
          id: "upd-1",
          start_date: "2026-05-01",
          end_date: "2026-05-15",
        }),
        createMockLimit({
          id: "upd-2",
          start_date: "2026-05-20",
          end_date: "2026-05-31",
        }),
      ];
      mockUseList.mockReturnValue(mockListReturn(limits));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await expect(
        act(async () => {
          await result.current.updateLimitRange("upd-1", {
            end_date: "2026-05-25", // overlaps with upd-2
          });
        })
      ).rejects.toThrow("Date range overlaps with existing range");

      expect(toast.error).toHaveBeenCalledWith("Date range overlaps with existing range");
      expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
    });

    it("uses existing limit dates when only start_date is updated", async () => {
      const limits = [
        createMockLimit({
          id: "upd-1",
          start_date: "2026-05-01",
          end_date: "2026-05-15",
        }),
      ];
      mockUseList.mockReturnValue(mockListReturn(limits));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await act(async () => {
        await result.current.updateLimitRange("upd-1", {
          start_date: "2026-05-03",
        });
      });

      // Should succeed because it uses existing end_date and no other ranges exist
      expect(mockUpdateMutateAsync).toHaveBeenCalled();
    });

    it("throws and shows error toast when mutation fails", async () => {
      const limits = [
        createMockLimit({ id: "upd-1", start_date: "2026-05-01", end_date: "2026-05-15" }),
      ];
      mockUseList.mockReturnValue(mockListReturn(limits));
      mockUpdateMutateAsync.mockRejectedValueOnce(new Error("Update failed"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await expect(
        act(async () => {
          await result.current.updateLimitRange("upd-1", {
            max_calories_per_day: 1900,
          });
        })
      ).rejects.toThrow("Update failed");

      expect(toast.error).toHaveBeenCalledWith("Failed to update limit range");
      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // deleteLimitRange
  // -----------------------------------------------------------------------

  describe("deleteLimitRange", () => {
    it("deletes a limit range successfully", async () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await act(async () => {
        await result.current.deleteLimitRange("del-1");
      });

      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
        resource: "client_plan_limits",
        id: "del-1",
      });
      expect(toast.success).toHaveBeenCalledWith("Macro limit range deleted");
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "client_plan_limits",
        invalidates: ["list"],
      });
    });

    it("throws and shows error toast when deletion fails", async () => {
      mockUseList.mockReturnValue(mockListReturn([]));
      mockDeleteMutateAsync.mockRejectedValueOnce(new Error("Delete failed"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      await expect(
        act(async () => {
          await result.current.deleteLimitRange("del-1");
        })
      ).rejects.toThrow("Delete failed");

      expect(toast.error).toHaveBeenCalledWith("Failed to delete limit range");
      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // refetch
  // -----------------------------------------------------------------------

  describe("refetch", () => {
    it("calls invalidate with correct resource", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      act(() => {
        result.current.refetch();
      });

      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "client_plan_limits",
        invalidates: ["list"],
      });
    });
  });

  // -----------------------------------------------------------------------
  // isEditable / isDeletable
  // -----------------------------------------------------------------------

  describe("isEditable", () => {
    // Mock today as 2026-02-20
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T12:00:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns true for current limit (end_date is today)", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      const limit = createMockLimit({
        start_date: "2026-02-15",
        end_date: "2026-02-20",
      });
      expect(result.current.isEditable(limit)).toBe(true);
    });

    it("returns true for future limit", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      const limit = createMockLimit({
        start_date: "2026-03-01",
        end_date: "2026-03-15",
      });
      expect(result.current.isEditable(limit)).toBe(true);
    });

    it("returns false for past limit (end_date before today)", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      const limit = createMockLimit({
        start_date: "2026-01-01",
        end_date: "2026-02-19",
      });
      expect(result.current.isEditable(limit)).toBe(false);
    });
  });

  describe("isDeletable", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T12:00:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns true for future limit (start_date after today)", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      const limit = createMockLimit({
        start_date: "2026-03-01",
        end_date: "2026-03-15",
      });
      expect(result.current.isDeletable(limit)).toBe(true);
    });

    it("returns false for current limit (start_date is today)", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      const limit = createMockLimit({
        start_date: "2026-02-20",
        end_date: "2026-03-15",
      });
      expect(result.current.isDeletable(limit)).toBe(false);
    });

    it("returns false for past limit", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      const limit = createMockLimit({
        start_date: "2026-01-01",
        end_date: "2026-01-31",
      });
      expect(result.current.isDeletable(limit)).toBe(false);
    });

    it("returns false for limit that started in the past", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      const limit = createMockLimit({
        start_date: "2026-02-15",
        end_date: "2026-03-15",
      });
      expect(result.current.isDeletable(limit)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Instance-level helper methods
  // -----------------------------------------------------------------------

  describe("instance-level getUnavailableDates", () => {
    it("returns unavailable dates with excludeId", () => {
      const limits = [
        createMockLimit({ id: "l1", start_date: "2026-03-01", end_date: "2026-03-02" }),
        createMockLimit({ id: "l2", start_date: "2026-03-05", end_date: "2026-03-06" }),
      ];
      mockUseList.mockReturnValue(mockListReturn(limits));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      // Without exclude
      const allDates = result.current.getUnavailableDates();
      expect(allDates).toHaveLength(4);

      // With exclude
      const filteredDates = result.current.getUnavailableDates("l1");
      expect(filteredDates).toHaveLength(2);
    });
  });

  describe("instance-level hasOverlap", () => {
    it("checks overlap against current limits", () => {
      const limits = [
        createMockLimit({
          id: "l1",
          start_date: "2026-03-01",
          end_date: "2026-03-15",
        }),
      ];
      mockUseList.mockReturnValue(mockListReturn(limits));

      const { result } = renderHook(() => useClientPlanLimits({ clientId }));

      // Overlaps
      expect(
        result.current.hasOverlap(new Date("2026-03-10T00:00:00"), new Date("2026-03-20T00:00:00"))
      ).toBe(true);

      // Does not overlap
      expect(
        result.current.hasOverlap(new Date("2026-04-01T00:00:00"), new Date("2026-04-15T00:00:00"))
      ).toBe(false);

      // Overlaps but excluded
      expect(
        result.current.hasOverlap(
          new Date("2026-03-10T00:00:00"),
          new Date("2026-03-20T00:00:00"),
          "l1"
        )
      ).toBe(false);
    });
  });
});
