/**
 * Tests for useClientProfileData hook and utility functions
 *
 * Covers:
 * - useClientProfileData hook (conditions, limits, loading, error, refetch)
 * - calculatePlanInfo (null profile, no start date, future plan, active plan, completed plan, edge cases)
 * - formatPlanDate (various months, single digits)
 * - formatMacroRange (null/undefined, min-only, max-only, range, same value, large numbers, zero)
 */

import { renderHook, act } from "@testing-library/react";
import {
  useClientProfileData,
  calculatePlanInfo,
  formatPlanDate,
  formatMacroRange,
} from "../use-client-profile-data";
import type { Profile } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockUseList = jest.fn();
const mockRefetchConditions = jest.fn();
const mockRefetchLimits = jest.fn();

jest.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

jest.mock("../use-client-plan-limits", () => ({
  categorizeLimits: jest.fn((limits: unknown[]) => {
    // Simple mock: return first item as current, rest as future/past
    return {
      current: limits.length > 0 ? limits[0] : null,
      future: limits.slice(1),
      past: [],
    };
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-123",
    email: "test@example.com",
    full_name: "John Doe",
    phone: null,
    role: "client",
    avatar_url: null,
    date_of_birth: null,
    gender: null,
    address: null,
    invited_at: null,
    invitation_accepted_at: null,
    is_deactivated: false,
    deactivated_at: null,
    deactivation_reason: null,
    plan_start_date: null,
    plan_duration_days: 7,
    current_plan_cycle: 1,
    challenge_start_date: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function setupListMock(
  conditionsData: unknown[] = [],
  limitsData: unknown[] = [],
  opts?: {
    conditionsLoading?: boolean;
    conditionsError?: boolean;
    limitsLoading?: boolean;
    limitsError?: boolean;
  }
) {
  mockUseList.mockImplementation((config: { resource: string }) => {
    if (config.resource === "client_conditions") {
      return {
        query: {
          isLoading: opts?.conditionsLoading ?? false,
          isError: opts?.conditionsError ?? false,
          data: { data: conditionsData },
          refetch: mockRefetchConditions,
        },
      };
    }
    if (config.resource === "client_plan_limits") {
      return {
        query: {
          isLoading: opts?.limitsLoading ?? false,
          isError: opts?.limitsError ?? false,
          data: { data: limitsData },
          refetch: mockRefetchLimits,
        },
      };
    }
    return {
      query: {
        isLoading: false,
        isError: false,
        data: { data: [] },
        refetch: jest.fn(),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Tests: useClientProfileData hook
// ---------------------------------------------------------------------------

describe("useClientProfileData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hook data fetching", () => {
    it("should return empty conditions and limits when no data", () => {
      setupListMock();

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.conditions).toEqual([]);
      expect(result.current.limits).toEqual([]);
      expect(result.current.currentLimits).toBeNull();
      expect(result.current.futureLimits).toEqual([]);
    });

    it("should return conditions with medical condition details", () => {
      const conditions = [
        {
          id: "cc-1",
          client_id: "user-123",
          condition_id: "cond-1",
          medical_conditions: {
            id: "cond-1",
            name: "Hypothyroidism",
            description: "Underactive thyroid",
            impact_percent: 8,
          },
        },
        {
          id: "cc-2",
          client_id: "user-123",
          condition_id: "cond-2",
          medical_conditions: {
            id: "cond-2",
            name: "PCOS",
            description: null,
            impact_percent: 10,
          },
        },
      ];

      setupListMock(conditions);

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.conditions).toHaveLength(2);
      expect(result.current.conditions[0].medical_conditions?.name).toBe("Hypothyroidism");
      expect(result.current.conditions[1].medical_conditions?.name).toBe("PCOS");
    });

    it("should return limits and categorize them", () => {
      const limits = [
        {
          id: "limit-1",
          client_id: "user-123",
          start_date: "2026-01-01",
          end_date: "2026-01-31",
          max_calories_per_day: 2000,
        },
        {
          id: "limit-2",
          client_id: "user-123",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
          max_calories_per_day: 2200,
        },
      ];

      setupListMock([], limits);

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.limits).toHaveLength(2);
      // Based on our mock categorizeLimits: first item is current, rest are future
      expect(result.current.currentLimits).toBeDefined();
      expect(result.current.currentLimits?.id).toBe("limit-1");
      expect(result.current.futureLimits).toHaveLength(1);
    });

    it("should not fetch when userId is null", () => {
      setupListMock();

      renderHook(() => useClientProfileData({ userId: null }));

      // useList should be called with enabled: false
      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: expect.objectContaining({ enabled: false }),
        })
      );
    });

    it("should fetch when userId is provided", () => {
      setupListMock();

      renderHook(() => useClientProfileData({ userId: "user-123" }));

      // Both calls should have enabled: true
      const calls = mockUseList.mock.calls;
      expect(calls.length).toBe(2);
      calls.forEach((call) => {
        expect(call[0].queryOptions.enabled).toBe(true);
      });
    });

    it("should filter conditions by client_id", () => {
      setupListMock();

      renderHook(() => useClientProfileData({ userId: "user-456" }));

      const conditionsCall = mockUseList.mock.calls.find(
        (call) => call[0].resource === "client_conditions"
      );
      expect(conditionsCall?.[0].filters).toEqual([
        { field: "client_id", operator: "eq", value: "user-456" },
      ]);
    });

    it("should filter limits by client_id", () => {
      setupListMock();

      renderHook(() => useClientProfileData({ userId: "user-456" }));

      const limitsCall = mockUseList.mock.calls.find(
        (call) => call[0].resource === "client_plan_limits"
      );
      expect(limitsCall?.[0].filters).toEqual([
        { field: "client_id", operator: "eq", value: "user-456" },
      ]);
    });

    it("should sort limits by start_date ascending", () => {
      setupListMock();

      renderHook(() => useClientProfileData({ userId: "user-123" }));

      const limitsCall = mockUseList.mock.calls.find(
        (call) => call[0].resource === "client_plan_limits"
      );
      expect(limitsCall?.[0].sorters).toEqual([{ field: "start_date", order: "asc" }]);
    });

    it("should request medical condition details in meta.select", () => {
      setupListMock();

      renderHook(() => useClientProfileData({ userId: "user-123" }));

      const conditionsCall = mockUseList.mock.calls.find(
        (call) => call[0].resource === "client_conditions"
      );
      expect(conditionsCall?.[0].meta?.select).toContain("medical_conditions");
    });
  });

  describe("loading state", () => {
    it("should be loading when conditions are loading", () => {
      setupListMock([], [], { conditionsLoading: true });

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.isLoading).toBe(true);
    });

    it("should be loading when limits are loading", () => {
      setupListMock([], [], { limitsLoading: true });

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.isLoading).toBe(true);
    });

    it("should not be loading when both are loaded", () => {
      setupListMock();

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("error state", () => {
    it("should be in error when conditions query has error", () => {
      setupListMock([], [], { conditionsError: true });

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.isError).toBe(true);
    });

    it("should be in error when limits query has error", () => {
      setupListMock([], [], { limitsError: true });

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.isError).toBe(true);
    });

    it("should not be in error when both succeed", () => {
      setupListMock();

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.isError).toBe(false);
    });

    it("should be in error when both have errors", () => {
      setupListMock([], [], { conditionsError: true, limitsError: true });

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      expect(result.current.isError).toBe(true);
    });
  });

  describe("refetch", () => {
    it("should refetch both conditions and limits queries", () => {
      setupListMock();

      const { result } = renderHook(() => useClientProfileData({ userId: "user-123" }));

      act(() => {
        result.current.refetch();
      });

      expect(mockRefetchConditions).toHaveBeenCalled();
      expect(mockRefetchLimits).toHaveBeenCalled();
    });
  });

  describe("empty userId filtering", () => {
    it("should pass empty string as filter value when userId is null", () => {
      setupListMock();

      renderHook(() => useClientProfileData({ userId: null }));

      const conditionsCall = mockUseList.mock.calls.find(
        (call) => call[0].resource === "client_conditions"
      );
      expect(conditionsCall?.[0].filters[0].value).toBe("");
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: calculatePlanInfo
// ---------------------------------------------------------------------------

describe("calculatePlanInfo", () => {
  const mockToday = new Date("2026-01-15T00:00:00");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockToday);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("returns isConfigured: false when plan_start_date is null", () => {
    const profile = createMockProfile({ plan_start_date: null });
    const result = calculatePlanInfo(profile);

    expect(result.isConfigured).toBe(false);
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
    expect(result.dayNumber).toBeUndefined();
  });

  it("returns isConfigured: false for null profile", () => {
    const result = calculatePlanInfo(null);
    expect(result.isConfigured).toBe(false);
  });

  it("returns isConfigured: false for undefined profile", () => {
    const result = calculatePlanInfo(undefined);
    expect(result.isConfigured).toBe(false);
  });

  it("calculates correct plan info for active plan", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-10",
      plan_duration_days: 28,
    });

    const result = calculatePlanInfo(profile);

    expect(result.isConfigured).toBe(true);
    expect(result.startDate?.toISOString()).toContain("2026-01-10");
    expect(result.durationDays).toBe(28);
    expect(result.dayNumber).toBe(6); // Jan 15 - Jan 10 + 1 = 6
    expect(result.daysRemaining).toBe(23); // 28 - 6 + 1 = 23
    expect(result.progressPercent).toBe(21); // Math.round(6/28 * 100) = 21
    expect(result.isBeforeStart).toBe(false);
    expect(result.isCompleted).toBe(false);
    expect(result.daysUntilStart).toBe(0);
  });

  it("identifies plan starting in the future", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-20",
      plan_duration_days: 14,
    });

    const result = calculatePlanInfo(profile);

    expect(result.isConfigured).toBe(true);
    expect(result.isBeforeStart).toBe(true);
    expect(result.isCompleted).toBe(false);
    expect(result.dayNumber).toBe(0);
    expect(result.daysUntilStart).toBe(5); // Jan 20 - Jan 15 = 5
    expect(result.daysRemaining).toBe(14); // Full duration
    expect(result.progressPercent).toBe(0);
  });

  it("identifies completed plan", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-01",
      plan_duration_days: 7,
    });

    // Plan was Jan 1-7, today is Jan 15, rawDayNumber = 15
    const result = calculatePlanInfo(profile);

    expect(result.isConfigured).toBe(true);
    expect(result.isCompleted).toBe(true);
    expect(result.daysRemaining).toBe(0);
    expect(result.dayNumber).toBe(7); // Clamped to durationDays
    expect(result.progressPercent).toBe(100);
    expect(result.isBeforeStart).toBe(false);
  });

  it("calculates end date correctly", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-10",
      plan_duration_days: 10,
    });

    const result = calculatePlanInfo(profile);

    // Start Jan 10 + 9 days = Jan 19 (inclusive)
    expect(result.endDate?.toISOString()).toContain("2026-01-19");
  });

  it("uses default duration of 7 days when plan_duration_days is 0", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-10",
      plan_duration_days: 0,
    });

    const result = calculatePlanInfo(profile);
    expect(result.durationDays).toBe(7);
  });

  it("uses default duration of 7 days when plan_duration_days is null-ish", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-10",
    });
    // Override to simulate null-like (falsy)
    (profile as Record<string, unknown>).plan_duration_days = null;

    const result = calculatePlanInfo(profile);
    expect(result.durationDays).toBe(7);
  });

  it("clamps progress to 0-100 range for future plan", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-02-01",
      plan_duration_days: 14,
    });

    const result = calculatePlanInfo(profile);
    expect(result.progressPercent).toBe(0);
    expect(result.progressPercent).toBeGreaterThanOrEqual(0);
    expect(result.progressPercent).toBeLessThanOrEqual(100);
  });

  it("clamps progress to 100 for completed plan", () => {
    const profile = createMockProfile({
      plan_start_date: "2025-12-01",
      plan_duration_days: 7,
    });

    const result = calculatePlanInfo(profile);
    expect(result.progressPercent).toBeLessThanOrEqual(100);
  });

  it("handles plan starting today", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-15",
      plan_duration_days: 14,
    });

    const result = calculatePlanInfo(profile);

    expect(result.isConfigured).toBe(true);
    expect(result.isBeforeStart).toBe(false);
    expect(result.dayNumber).toBe(1);
    expect(result.daysRemaining).toBe(14); // 14 - 1 + 1 = 14
    expect(result.progressPercent).toBe(7); // Math.round(1/14 * 100) = 7
    expect(result.isCompleted).toBe(false);
  });

  it("handles plan ending today (last day)", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-08",
      plan_duration_days: 8,
    });

    // rawDayNumber = (Jan 15 - Jan 8) in days + 1 = 7 + 1 = 8
    // dayNumber = min(8, 8) = 8
    // daysRemaining = max(0, 8 - 8 + 1) = 1
    const result = calculatePlanInfo(profile);

    expect(result.dayNumber).toBe(8);
    expect(result.daysRemaining).toBe(1);
    expect(result.isCompleted).toBe(false);
    expect(result.progressPercent).toBe(100); // 8/8 * 100 = 100
  });

  it("handles plan that ended yesterday", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-07",
      plan_duration_days: 8,
    });

    // rawDayNumber = (Jan 15 - Jan 7) + 1 = 9
    // isCompleted = 9 > 8 = true
    // dayNumber = min(9, 8) = 8
    // daysRemaining = 0
    const result = calculatePlanInfo(profile);

    expect(result.isCompleted).toBe(true);
    expect(result.dayNumber).toBe(8);
    expect(result.daysRemaining).toBe(0);
  });

  it("creates startDate with T00:00:00 to avoid timezone issues", () => {
    const profile = createMockProfile({
      plan_start_date: "2026-01-10",
      plan_duration_days: 7,
    });

    const result = calculatePlanInfo(profile);
    // The date should be midnight local time
    expect(result.startDate?.getHours()).toBe(0);
    expect(result.startDate?.getMinutes()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: formatPlanDate
// ---------------------------------------------------------------------------

describe("formatPlanDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2026-01-15T00:00:00");
    const result = formatPlanDate(date);
    expect(result).toBe("January 15, 2026");
  });

  it("handles different months", () => {
    const date = new Date("2026-12-25T00:00:00");
    const result = formatPlanDate(date);
    expect(result).toBe("December 25, 2026");
  });

  it("handles single digit days", () => {
    const date = new Date("2026-03-05T00:00:00");
    const result = formatPlanDate(date);
    expect(result).toBe("March 5, 2026");
  });

  it("handles February", () => {
    const date = new Date("2026-02-14T00:00:00");
    const result = formatPlanDate(date);
    expect(result).toBe("February 14, 2026");
  });

  it("handles first day of year", () => {
    const date = new Date("2026-01-01T00:00:00");
    const result = formatPlanDate(date);
    expect(result).toBe("January 1, 2026");
  });

  it("handles last day of year", () => {
    const date = new Date("2026-12-31T00:00:00");
    const result = formatPlanDate(date);
    expect(result).toBe("December 31, 2026");
  });

  it("handles different year", () => {
    const date = new Date("2025-06-15T00:00:00");
    const result = formatPlanDate(date);
    expect(result).toBe("June 15, 2025");
  });
});

// ---------------------------------------------------------------------------
// Tests: formatMacroRange
// ---------------------------------------------------------------------------

describe("formatMacroRange", () => {
  it("returns null when both min and max are null", () => {
    expect(formatMacroRange(null, null, "g")).toBeNull();
  });

  it("returns null when both min and max are undefined", () => {
    expect(formatMacroRange(undefined, undefined, "g")).toBeNull();
  });

  it("returns null when min is null and max is undefined", () => {
    expect(formatMacroRange(null, undefined, "g")).toBeNull();
  });

  it("returns null when min is undefined and max is null", () => {
    expect(formatMacroRange(undefined, null, "g")).toBeNull();
  });

  it("formats min only with 'min' suffix", () => {
    const result = formatMacroRange(100, null, "g");
    expect(result).toBe("100g min");
  });

  it("formats min only with undefined max", () => {
    const result = formatMacroRange(100, undefined, "g");
    expect(result).toBe("100g min");
  });

  it("formats max only with 'max' suffix", () => {
    const result = formatMacroRange(null, 150, "g");
    expect(result).toBe("150g max");
  });

  it("formats max only with undefined min", () => {
    const result = formatMacroRange(undefined, 150, "g");
    expect(result).toBe("150g max");
  });

  it("formats range when both min and max are set", () => {
    const result = formatMacroRange(100, 150, "g");
    expect(result).toBe("100 - 150g");
  });

  it("formats same value when min equals max", () => {
    const result = formatMacroRange(100, 100, "g");
    expect(result).toBe("100g");
  });

  it("handles different units", () => {
    const result = formatMacroRange(1800, 2000, " kcal");
    expect(result).toBe("1,800 - 2,000 kcal");
  });

  it("formats large numbers with locale separators", () => {
    const result = formatMacroRange(1500, 2500, "g");
    expect(result).toBe("1,500 - 2,500g");
  });

  it("handles zero values for min", () => {
    const result = formatMacroRange(0, 100, "g");
    expect(result).toBe("0 - 100g");
  });

  it("handles zero for both", () => {
    const result = formatMacroRange(0, 0, "g");
    expect(result).toBe("0g");
  });

  it("handles zero max only", () => {
    const result = formatMacroRange(null, 0, "g");
    expect(result).toBe("0g max");
  });

  it("handles zero min only", () => {
    const result = formatMacroRange(0, null, "g");
    expect(result).toBe("0g min");
  });

  it("handles very large numbers", () => {
    const result = formatMacroRange(10000, 20000, " kcal");
    expect(result).toBe("10,000 - 20,000 kcal");
  });

  it("handles empty string unit", () => {
    const result = formatMacroRange(100, 200, "");
    expect(result).toBe("100 - 200");
  });
});
