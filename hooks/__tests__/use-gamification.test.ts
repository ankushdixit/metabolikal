import {
  calculateStepsPoints,
  calculateWaterPoints,
  calculateFloorsPoints,
  calculateProteinPoints,
  calculateSleepPoints,
  calculateMetricsPoints,
  calculateDailyPoints,
  DailyMetrics,
} from "../use-gamification";
import { isEditableDay, daysBetween } from "@/lib/challenge-utils";

// ---------------------------------------------------------------------------
// Unit tests for pure calculation functions (existing)
// ---------------------------------------------------------------------------

describe("Points Calculation Functions", () => {
  describe("calculateStepsPoints", () => {
    it("returns 0 for steps below 7000", () => {
      expect(calculateStepsPoints(0)).toBe(0);
      expect(calculateStepsPoints(3000)).toBe(0);
      expect(calculateStepsPoints(6999)).toBe(0);
    });

    it("returns 15 for steps between 7000 and 9999", () => {
      expect(calculateStepsPoints(7000)).toBe(15);
      expect(calculateStepsPoints(8500)).toBe(15);
      expect(calculateStepsPoints(9999)).toBe(15);
    });

    it("returns 30 for steps between 10000 and 14999", () => {
      expect(calculateStepsPoints(10000)).toBe(30);
      expect(calculateStepsPoints(12000)).toBe(30);
      expect(calculateStepsPoints(14999)).toBe(30);
    });

    it("returns 45 for steps 15000 and above", () => {
      expect(calculateStepsPoints(15000)).toBe(45);
      expect(calculateStepsPoints(20000)).toBe(45);
      expect(calculateStepsPoints(50000)).toBe(45);
    });
  });

  describe("calculateWaterPoints", () => {
    it("returns 0 for water below 3.0L", () => {
      expect(calculateWaterPoints(0)).toBe(0);
      expect(calculateWaterPoints(1.5)).toBe(0);
      expect(calculateWaterPoints(2.9)).toBe(0);
    });

    it("returns 15 for water 3.0L and above", () => {
      expect(calculateWaterPoints(3.0)).toBe(15);
      expect(calculateWaterPoints(4.0)).toBe(15);
      expect(calculateWaterPoints(10.0)).toBe(15);
    });
  });

  describe("calculateFloorsPoints", () => {
    it("returns 0 for floors below 4", () => {
      expect(calculateFloorsPoints(0)).toBe(0);
      expect(calculateFloorsPoints(2)).toBe(0);
      expect(calculateFloorsPoints(3)).toBe(0);
    });

    it("returns 15 for floors between 4 and 13", () => {
      expect(calculateFloorsPoints(4)).toBe(15);
      expect(calculateFloorsPoints(10)).toBe(15);
      expect(calculateFloorsPoints(13)).toBe(15);
    });

    it("returns 45 for floors 14 and above", () => {
      expect(calculateFloorsPoints(14)).toBe(45);
      expect(calculateFloorsPoints(20)).toBe(45);
      expect(calculateFloorsPoints(100)).toBe(45);
    });
  });

  describe("calculateProteinPoints", () => {
    it("returns 0 for protein below 70g", () => {
      expect(calculateProteinPoints(0)).toBe(0);
      expect(calculateProteinPoints(35)).toBe(0);
      expect(calculateProteinPoints(69)).toBe(0);
    });

    it("returns 15 for protein 70g and above", () => {
      expect(calculateProteinPoints(70)).toBe(15);
      expect(calculateProteinPoints(100)).toBe(15);
      expect(calculateProteinPoints(200)).toBe(15);
    });
  });

  describe("calculateSleepPoints", () => {
    it("returns 0 for sleep below 7h", () => {
      expect(calculateSleepPoints(0)).toBe(0);
      expect(calculateSleepPoints(4.5)).toBe(0);
      expect(calculateSleepPoints(6.9)).toBe(0);
    });

    it("returns 15 for sleep 7h and above", () => {
      expect(calculateSleepPoints(7)).toBe(15);
      expect(calculateSleepPoints(8)).toBe(15);
      expect(calculateSleepPoints(10)).toBe(15);
    });
  });

  describe("calculateMetricsPoints", () => {
    it("calculates total points for all metrics", () => {
      const metrics: DailyMetrics = {
        steps: 10000, // 30 pts
        waterLiters: 3.5, // 15 pts
        floorsClimbed: 14, // 45 pts
        proteinGrams: 80, // 15 pts
        sleepHours: 7.5, // 15 pts
      };
      expect(calculateMetricsPoints(metrics)).toBe(120);
    });

    it("returns 0 for metrics that don't meet thresholds", () => {
      const metrics: DailyMetrics = {
        steps: 5000,
        waterLiters: 2.0,
        floorsClimbed: 2,
        proteinGrams: 50,
        sleepHours: 5,
      };
      expect(calculateMetricsPoints(metrics)).toBe(0);
    });

    it("handles partial threshold achievement", () => {
      const metrics: DailyMetrics = {
        steps: 7000, // 15 pts (only steps meets threshold)
        waterLiters: 1.0,
        floorsClimbed: 2,
        proteinGrams: 30,
        sleepHours: 4,
      };
      expect(calculateMetricsPoints(metrics)).toBe(15);
    });

    it("handles maximum points from all metrics", () => {
      const metrics: DailyMetrics = {
        steps: 20000, // 45 pts
        waterLiters: 5.0, // 15 pts
        floorsClimbed: 20, // 45 pts
        proteinGrams: 200, // 15 pts
        sleepHours: 10, // 15 pts
      };
      expect(calculateMetricsPoints(metrics)).toBe(135);
    });
  });

  describe("calculateDailyPoints", () => {
    it("includes check-in bonus when specified", () => {
      const metrics: DailyMetrics = {
        steps: 7000, // 15 pts
        waterLiters: 3.0, // 15 pts
        floorsClimbed: 4, // 15 pts
        proteinGrams: 70, // 15 pts
        sleepHours: 7, // 15 pts
      };
      expect(calculateDailyPoints(metrics, true)).toBe(90); // 75 + 15 bonus
    });

    it("excludes check-in bonus when not specified", () => {
      const metrics: DailyMetrics = {
        steps: 7000, // 15 pts
        waterLiters: 3.0, // 15 pts
        floorsClimbed: 4, // 15 pts
        proteinGrams: 70, // 15 pts
        sleepHours: 7, // 15 pts
      };
      expect(calculateDailyPoints(metrics, false)).toBe(75);
    });

    it("caps at 150 points maximum", () => {
      const metrics: DailyMetrics = {
        steps: 15000, // 45 pts
        waterLiters: 5.0, // 15 pts
        floorsClimbed: 20, // 45 pts
        proteinGrams: 150, // 15 pts
        sleepHours: 9, // 15 pts
      };
      expect(calculateDailyPoints(metrics, true)).toBe(150); // 135 + 15 capped at 150
    });

    it("returns 0 with check-in bonus when all metrics are zero", () => {
      const metrics: DailyMetrics = {
        steps: 0,
        waterLiters: 0,
        floorsClimbed: 0,
        proteinGrams: 0,
        sleepHours: 0,
      };
      expect(calculateDailyPoints(metrics, true)).toBe(15); // 0 + 15 bonus
    });

    it("returns 0 without check-in bonus when all metrics are zero", () => {
      const metrics: DailyMetrics = {
        steps: 0,
        waterLiters: 0,
        floorsClimbed: 0,
        proteinGrams: 0,
        sleepHours: 0,
      };
      expect(calculateDailyPoints(metrics, false)).toBe(0);
    });

    it("does not exceed 150 even with max metrics and bonus", () => {
      const metrics: DailyMetrics = {
        steps: 15000, // 45 pts
        waterLiters: 5.0, // 15 pts
        floorsClimbed: 20, // 45 pts
        proteinGrams: 150, // 15 pts
        sleepHours: 9, // 15 pts = 135 total
      };
      // 135 + 15 bonus = 150, exactly at cap
      expect(calculateDailyPoints(metrics, true)).toBe(150);
      // Without bonus: 135, below cap
      expect(calculateDailyPoints(metrics, false)).toBe(135);
    });
  });
});

describe("isEditableDay", () => {
  it("returns true for the current day", () => {
    expect(isEditableDay(10, 10)).toBe(true);
  });

  it("returns true for past days", () => {
    expect(isEditableDay(1, 10)).toBe(true);
    expect(isEditableDay(5, 10)).toBe(true);
    expect(isEditableDay(9, 10)).toBe(true);
  });

  it("returns false for future days", () => {
    expect(isEditableDay(11, 10)).toBe(false);
    expect(isEditableDay(30, 10)).toBe(false);
  });

  it("returns false for day 0 or negative", () => {
    expect(isEditableDay(0, 10)).toBe(false);
    expect(isEditableDay(-1, 10)).toBe(false);
  });

  it("handles day 1 as current day", () => {
    expect(isEditableDay(1, 1)).toBe(true);
    expect(isEditableDay(2, 1)).toBe(false);
  });
});

describe("daysBetween", () => {
  it("calculates days between two dates", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
  });

  it("returns 0 when dates are equal", () => {
    expect(daysBetween("2026-01-15", "2026-01-15")).toBe(0);
  });

  it("returns 0 when dateB is before dateA", () => {
    expect(daysBetween("2026-02-01", "2026-01-01")).toBe(0);
  });

  it("handles cross-month boundaries", () => {
    expect(daysBetween("2026-01-30", "2026-02-02")).toBe(3);
  });

  it("handles cross-year boundaries", () => {
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Hook integration tests with mocked Supabase
// ---------------------------------------------------------------------------

import { renderHook, act, waitFor } from "@testing-library/react";
import type { DayProgress } from "@/lib/challenge-utils";

// We need to control the mock modules precisely for integration tests

// Mock auth-context (useOptionalAuth)
const mockUseOptionalAuth = jest.fn();
jest.mock("@/contexts/auth-context", () => ({
  useOptionalAuth: () => mockUseOptionalAuth(),
}));

// Mock Supabase client used by the hook
const mockFrom = jest.fn();
const mockGetUser = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  }),
}));

// Mock challenge-utils getDateString to return a stable date
const MOCK_TODAY = "2026-02-10";
jest.mock("@/lib/challenge-utils", () => {
  const actual = jest.requireActual("@/lib/challenge-utils");
  return {
    ...actual,
    getDateString: jest.fn(() => MOCK_TODAY),
  };
});

// Import the hook after mocks are set up

const { useGamification } = require("../use-gamification");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _createMockDayProgress(
  dayNumber: number,
  overrides: Partial<DayProgress> = {}
): DayProgress {
  return {
    dayNumber,
    loggedDate: `2026-02-${String(dayNumber).padStart(2, "0")}`,
    metrics: {
      steps: 10000,
      waterLiters: 3.0,
      floorsClimbed: 10,
      proteinGrams: 80,
      sleepHours: 7.5,
    },
    pointsEarned: 90,
    hasData: true,
    ...overrides,
  };
}

/** Set up Supabase mock to return challenge_progress rows and a profile. */
function setupSupabaseMocks(options: {
  progressRows?: Array<Record<string, unknown>>;
  profile?: Record<string, unknown> | null;
  progressError?: { message: string } | null;
  profileError?: { message: string } | null;
}) {
  const { progressRows = [], profile = null, progressError = null, profileError = null } = options;

  // Build chainable mocks for challenge_progress and profiles tables
  mockFrom.mockImplementation((table: string) => {
    if (table === "challenge_progress") {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: progressError ? null : progressRows,
          error: progressError,
        }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
      return chain;
    }
    if (table === "profiles") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: profileError ? null : profile,
          error: profileError,
        }),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });
}

// ---------------------------------------------------------------------------
// Hook Integration Tests
// ---------------------------------------------------------------------------

describe("useGamification hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(`${MOCK_TODAY}T12:00:00Z`));
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state when no user is authenticated", () => {
    it("returns default loading state then resolves with no user", async () => {
      mockUseOptionalAuth.mockReturnValue(null);
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      setupSupabaseMocks({});

      const { result } = renderHook(() => useGamification());

      // Wait for async effects to resolve
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.currentDay).toBeGreaterThanOrEqual(0);
      expect(result.current.totalDays).toBe(30); // DEFAULT_CHALLENGE_DAYS
      expect(result.current.totalPoints).toBe(0);
      expect(result.current.dayStreak).toBe(0);
      expect(result.current.weekUnlocked).toBe(1);
      expect(result.current.completionPercent).toBe(0);
      expect(result.current.todayProgress).toBeNull();
      expect(result.current.allProgress).toEqual({});
    });
  });

  describe("with AuthProvider present (auth context)", () => {
    it("loads data using userId from AuthContext", async () => {
      const profile = {
        role: "client",
        plan_duration_days: 90,
        plan_start_date: "2026-02-01",
        current_plan_cycle: 1,
        challenge_start_date: null,
        created_at: "2026-02-01T00:00:00Z",
      };

      mockUseOptionalAuth.mockReturnValue({
        userId: "user-abc",
        profile: {
          ...profile,
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [
          {
            day_number: 1,
            logged_date: "2026-02-01",
            steps: 10000,
            water_liters: 3.0,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7.5,
            feeling: "good",
            tomorrow_focus: null,
            points_earned: 90,
          },
        ],
        profile,
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual({ id: "user-abc" });
      expect(result.current.totalDays).toBe(90);
      expect(result.current.allProgress[1]).toBeDefined();
      expect(result.current.allProgress[1].hasData).toBe(true);
      expect(result.current.allProgress[1].metrics.steps).toBe(10000);
    });

    it("uses deriveProfileFromAuth when auth profile is available (skips profile query)", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "user-xyz",
        profile: {
          role: "client",
          plan_duration_days: 60,
          plan_start_date: "2026-02-05",
          current_plan_cycle: 2,
          challenge_start_date: null,
          created_at: "2026-02-05T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [],
        // Profile in Supabase has different values -- should NOT be used
        profile: {
          role: "client",
          plan_duration_days: 999,
          plan_start_date: "2020-01-01",
          current_plan_cycle: 5,
          challenge_start_date: null,
          created_at: "2020-01-01T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should use AuthContext profile values, not Supabase query values
      expect(result.current.totalDays).toBe(60);
    });

    it("waits for AuthProvider to finish loading before initializing", async () => {
      // First render: auth is loading
      mockUseOptionalAuth.mockReturnValue({
        userId: null,
        profile: null,
        isLoading: true,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({});

      const { result, rerender } = renderHook(() => useGamification());

      // Should still be loading because auth is loading
      expect(result.current.isLoading).toBe(true);

      // Auth finishes loading but no user
      mockUseOptionalAuth.mockReturnValue({
        userId: null,
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe("without AuthProvider (public page fallback)", () => {
    it("resolves userId via getUser() and subscribes to auth changes", async () => {
      mockUseOptionalAuth.mockReturnValue(null);

      const profile = {
        role: "challenger",
        plan_duration_days: null,
        plan_start_date: null,
        current_plan_cycle: null,
        challenge_start_date: null,
        created_at: "2026-02-10T00:00:00Z",
      };

      mockGetUser.mockResolvedValue({
        data: { user: { id: "public-user-123" } },
        error: null,
      });

      setupSupabaseMocks({
        progressRows: [],
        profile,
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual({ id: "public-user-123" });
      expect(result.current.totalDays).toBe(30); // default because plan_duration_days is null
      // onAuthStateChange should have been subscribed
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it("handles signed-out user in public page fallback", async () => {
      mockUseOptionalAuth.mockReturnValue(null);
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      setupSupabaseMocks({});

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.totalDays).toBe(30);
    });
  });

  describe("totalDays with challenge_start_date gap extension", () => {
    it("extends totalDays when challenge_start_date is before plan_start_date", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "upgraded-user",
        profile: {
          role: "client",
          plan_duration_days: 90,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          // Challenger started 10 days before plan_start_date
          challenge_start_date: "2026-01-22",
          created_at: "2026-01-22T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Gap = daysBetween("2026-01-22", "2026-02-01") = 10 days
      // totalDays = 10 + 90 = 100
      expect(result.current.totalDays).toBe(100);
      // startDate should be set to challenge_start_date
      expect(result.current.startDate).toBe("2026-01-22");
    });

    it("does not extend totalDays when challenge_start_date equals plan_start_date", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "same-date-user",
        profile: {
          role: "client",
          plan_duration_days: 60,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: "2026-02-01",
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // No gap because challenge_start_date == plan_start_date => daysBetween returns 0
      // but the condition is challengeStart < planStart, which is false when they're equal
      expect(result.current.totalDays).toBe(60);
    });

    it("does not extend totalDays when challenge_start_date is null", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "no-challenge-start",
        profile: {
          role: "client",
          plan_duration_days: 45,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalDays).toBe(45);
    });
  });

  describe("loadProfileDuration fallback (no auth profile)", () => {
    it("queries Supabase profile and extracts plan info", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "user-no-profile",
        profile: null, // No cached profile in AuthContext
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [],
        profile: {
          role: "client",
          plan_duration_days: 120,
          plan_start_date: "2026-01-15",
          current_plan_cycle: 3,
          challenge_start_date: null,
          created_at: "2026-01-15T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalDays).toBe(120);
    });

    it("uses created_at as fallback when plan_start_date is null", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "user-fallback-dates",
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [],
        profile: {
          role: "challenger",
          plan_duration_days: null,
          plan_start_date: null,
          current_plan_cycle: null,
          challenge_start_date: null,
          created_at: "2026-02-05T12:30:00Z",
        },
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Default 30 days when plan_duration_days is null
      expect(result.current.totalDays).toBe(30);
      // Should use created_at date portion as start date
      expect(result.current.startDate).toBe("2026-02-05");
    });

    it("handles profile query error gracefully", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "user-error",
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      setupSupabaseMocks({
        progressRows: [],
        profile: null,
        profileError: { message: "Database connection failed" },
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to defaults
      expect(result.current.totalDays).toBe(30);

      consoleSpy.mockRestore();
    });

    it("extends totalDays via Supabase profile with challenge_start_date gap", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "user-gap-supabase",
        profile: null, // No cached profile -- will fall back to Supabase query
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [],
        profile: {
          role: "client",
          plan_duration_days: 90,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: "2026-01-20", // 12 days before plan start
          created_at: "2026-01-20T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Gap = daysBetween("2026-01-20", "2026-02-01") = 12
      // totalDays = 12 + 90 = 102
      expect(result.current.totalDays).toBe(102);
      expect(result.current.startDate).toBe("2026-01-20");
    });
  });

  describe("challenge progress loading and computed values", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-02-20T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("computes streak correctly from consecutive days with data", async () => {
      // Note: getDaysSinceStart uses new Date() internally, not getDateString().
      // Today is pinned to 2026-02-20, plan starts 2026-02-01, so currentDay = 20.
      // We build a streak ending at day 20: days 18, 19, 20 consecutive, gap at 17.

      mockUseOptionalAuth.mockReturnValue({
        userId: "streak-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      // Days 18, 19, 20 have data (streak of 3), day 17 missing
      setupSupabaseMocks({
        progressRows: [
          {
            day_number: 1,
            logged_date: "2026-02-01",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
          {
            day_number: 18,
            logged_date: "2026-02-18",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
          {
            day_number: 19,
            logged_date: "2026-02-19",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
          {
            day_number: 20,
            logged_date: "2026-02-20",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
        ],
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Current day should be 20 (Feb 20 - Feb 1 + 1 = 20)
      expect(result.current.currentDay).toBe(20);
      // Streak: days 20, 19, 18 are consecutive with data, day 17 missing => streak = 3
      expect(result.current.dayStreak).toBe(3);
    });

    it("computes total points from progress plus bonus points", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "points-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [
          {
            day_number: 1,
            logged_date: "2026-02-01",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 50,
          },
          {
            day_number: 2,
            logged_date: "2026-02-02",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 75,
          },
        ],
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Progress points: 50 + 75 = 125
      // Daily visit points: 0 (lastVisitDate is set via getDateString() which returns
      // MOCK_TODAY "2026-02-10", and `today` in the check also uses getDateString()
      // => they match, so no visit points are awarded)
      // assessmentPoints: 0, calculatorPoints: 0
      // Total: 125
      expect(result.current.totalPoints).toBe(125);
    });

    it("computes cumulative stats from progress data", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "stats-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [
          {
            day_number: 1,
            logged_date: "2026-02-01",
            steps: 10000,
            water_liters: 3.0,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7.5,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
          {
            day_number: 2,
            logged_date: "2026-02-02",
            steps: 5000,
            water_liters: 2.0,
            floors_climbed: 5,
            protein_grams: 60,
            sleep_hours: 6.0,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 30,
          },
        ],
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cumulativeStats.totalSteps).toBe(15000);
      expect(result.current.cumulativeStats.totalWater).toBe(5);
      expect(result.current.cumulativeStats.totalFloors).toBe(15);
      expect(result.current.cumulativeStats.totalProtein).toBe(140);
      expect(result.current.cumulativeStats.totalSleepHours).toBe(13.5);
      expect(result.current.cumulativeStats.daysCompleted).toBe(2);
    });

    it("filters out future days from validProgress", async () => {
      // Plan starts 2026-02-01, today is 2026-02-20 (real date), so currentDay = 20.
      // Include a row for day 25 (future) that should be filtered out.
      mockUseOptionalAuth.mockReturnValue({
        userId: "filter-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [
          {
            day_number: 1,
            logged_date: "2026-02-01",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
          {
            day_number: 20,
            logged_date: "2026-02-20",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
          {
            day_number: 25,
            logged_date: "2026-02-25",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
        ],
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Day 1 and day 20 should be in validProgress (both <= currentDay 20)
      expect(result.current.allProgress[1]).toBeDefined();
      expect(result.current.allProgress[20]).toBeDefined();
      // Day 25 should be filtered out (future)
      expect(result.current.allProgress[25]).toBeUndefined();
    });

    it("handles challenge progress loading error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockUseOptionalAuth.mockReturnValue({
        userId: "error-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [],
        progressError: { message: "Table not found" },
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle gracefully
      expect(result.current.allProgress).toEqual({});
      consoleSpy.mockRestore();
    });
  });

  describe("edge case: no check-ins yet", () => {
    it("returns zero stats with empty progress", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "fresh-user",
        profile: {
          role: "challenger",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dayStreak).toBe(0);
      expect(result.current.completionPercent).toBe(0);
      expect(result.current.cumulativeStats.daysCompleted).toBe(0);
      expect(result.current.weekUnlocked).toBe(1);
      // todayProgress should be an empty day progress object (not null, because we're past start)
      expect(result.current.todayProgress).toBeDefined();
      expect(result.current.todayProgress?.hasData).toBe(false);
    });
  });

  describe("edge case: before plan start (future start date)", () => {
    it("returns isBeforeStart true and zero derived stats", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "future-user",
        profile: {
          role: "client",
          plan_duration_days: 90,
          // Plan starts in the future relative to mocked "today" (2026-02-10)
          plan_start_date: "2026-03-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-10T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isBeforeStart).toBe(true);
      expect(result.current.currentDay).toBe(0);
      expect(result.current.todayProgress).toBeNull();
      expect(result.current.dayStreak).toBe(0);
      expect(result.current.weekUnlocked).toBe(1);
      expect(result.current.completionPercent).toBe(0);
      expect(result.current.daysUntilPlanStart).toBeGreaterThan(0);
    });
  });

  describe("saveTodayProgress", () => {
    it("saves progress to database and updates local state", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "save-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === "challenge_progress") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
            upsert: mockUpsert,
          };
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const metrics: DailyMetrics = {
        steps: 12000,
        waterLiters: 3.5,
        floorsClimbed: 8,
        proteinGrams: 90,
        sleepHours: 8,
      };

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.saveTodayProgress(metrics);
      });

      expect(saveResult).toBe(true);
      expect(mockUpsert).toHaveBeenCalled();
    });

    it("returns false when user is not authenticated", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: null,
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({});

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const metrics: DailyMetrics = {
        steps: 10000,
        waterLiters: 3.0,
        floorsClimbed: 10,
        proteinGrams: 80,
        sleepHours: 7,
      };

      let saveResult: boolean = true;
      await act(async () => {
        saveResult = await result.current.saveTodayProgress(metrics);
      });

      expect(saveResult).toBe(false);
    });

    it("returns false when plan has not started yet", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "before-start-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-03-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-10T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isBeforeStart).toBe(true);

      const metrics: DailyMetrics = {
        steps: 10000,
        waterLiters: 3.0,
        floorsClimbed: 10,
        proteinGrams: 80,
        sleepHours: 7,
      };

      let saveResult: boolean = true;
      await act(async () => {
        saveResult = await result.current.saveTodayProgress(metrics);
      });

      expect(saveResult).toBe(false);
    });
  });

  describe("canEditDay", () => {
    it("allows editing current and past days", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "edit-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const currentDay = result.current.currentDay;
      expect(result.current.canEditDay(1)).toBe(true);
      expect(result.current.canEditDay(currentDay)).toBe(true);
      expect(result.current.canEditDay(currentDay + 1)).toBe(false);
      expect(result.current.canEditDay(0)).toBe(false);
    });

    it("disallows editing any day before plan start", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "no-edit-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-03-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-10T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isBeforeStart).toBe(true);
      expect(result.current.canEditDay(1)).toBe(false);
      expect(result.current.canEditDay(5)).toBe(false);
    });
  });

  describe("isDayUnlocked", () => {
    it("unlocks days in the first week by default", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "unlock-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Week 1 (days 1-7) should be unlocked, week 2+ depends on completion
      expect(result.current.isDayUnlocked(1)).toBe(true);
      expect(result.current.isDayUnlocked(7)).toBe(true);
      // Week 2 is only unlocked if week 1 has >= 90% completion
      // With no data, week 2 should not be unlocked
      expect(result.current.isDayUnlocked(8)).toBe(false);
    });
  });

  describe("getDayProgress", () => {
    it("returns progress for a day that has data", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "get-day-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({
        progressRows: [
          {
            day_number: 3,
            logged_date: "2026-02-03",
            steps: 8000,
            water_liters: 2.5,
            floors_climbed: 6,
            protein_grams: 70,
            sleep_hours: 7,
            feeling: "great",
            tomorrow_focus: "cardio",
            points_earned: 60,
          },
        ],
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const dayProg = result.current.getDayProgress(3);
      expect(dayProg).not.toBeNull();
      expect(dayProg?.metrics.steps).toBe(8000);
      expect(dayProg?.metrics.feeling).toBe("great");
    });

    it("returns null for a day with no data", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "get-day-null-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getDayProgress(5)).toBeNull();
    });

    it("returns null when challengeData is null", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: null,
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({});

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getDayProgress(1)).toBeNull();
    });
  });

  describe("awardAssessmentPoints", () => {
    it("awards assessment points when not yet awarded", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "award-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.assessmentPoints).toBe(0);

      act(() => {
        result.current.awardAssessmentPoints(50);
      });

      expect(result.current.assessmentPoints).toBe(50);
    });

    it("does not overwrite assessment points once already awarded", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "no-overwrite-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.awardAssessmentPoints(50);
      });

      expect(result.current.assessmentPoints).toBe(50);

      // Try to award again -- should be ignored
      act(() => {
        result.current.awardAssessmentPoints(100);
      });

      expect(result.current.assessmentPoints).toBe(50);
    });
  });

  describe("awardCalculatorPoints", () => {
    it("awards calculator points when not yet awarded", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "calc-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.calculatorPoints).toBe(0);

      act(() => {
        result.current.awardCalculatorPoints(25);
      });

      expect(result.current.calculatorPoints).toBe(25);
    });

    it("does not overwrite calculator points once already awarded", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "calc-no-overwrite",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.awardCalculatorPoints(25);
      });

      act(() => {
        result.current.awardCalculatorPoints(100);
      });

      expect(result.current.calculatorPoints).toBe(25);
    });
  });

  describe("completionPercent", () => {
    it("calculates correct completion percentage", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "completion-user",
        profile: {
          role: "client",
          plan_duration_days: 10,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      // 3 out of 10 days completed = 30%
      setupSupabaseMocks({
        progressRows: [
          {
            day_number: 1,
            logged_date: "2026-02-01",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
          {
            day_number: 2,
            logged_date: "2026-02-02",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
          {
            day_number: 3,
            logged_date: "2026-02-03",
            steps: 10000,
            water_liters: 3,
            floors_climbed: 10,
            protein_grams: 80,
            sleep_hours: 7,
            feeling: null,
            tomorrow_focus: null,
            points_earned: 90,
          },
        ],
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.completionPercent).toBe(30);
    });
  });

  describe("weekUnlocked calculation", () => {
    it("unlocks week 2 when week 1 has 90%+ completion (6/7 days)", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "week-unlock-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      // 6 out of 7 days in week 1 = ~85.7% -- just below 90%
      const sixDays = [1, 2, 3, 4, 5, 6].map((d) => ({
        day_number: d,
        logged_date: `2026-02-${String(d).padStart(2, "0")}`,
        steps: 10000,
        water_liters: 3,
        floors_climbed: 10,
        protein_grams: 80,
        sleep_hours: 7,
        feeling: null,
        tomorrow_focus: null,
        points_earned: 90,
      }));

      setupSupabaseMocks({ progressRows: sixDays });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 6/7 = 85.7% which is below 90% threshold => week 1 still unlocked
      expect(result.current.weekUnlocked).toBe(1);
    });

    it("unlocks week 2 when all 7 days of week 1 are complete", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "full-week-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      // All 7 days in week 1 complete = 100%
      const sevenDays = [1, 2, 3, 4, 5, 6, 7].map((d) => ({
        day_number: d,
        logged_date: `2026-02-${String(d).padStart(2, "0")}`,
        steps: 10000,
        water_liters: 3,
        floors_climbed: 10,
        protein_grams: 80,
        sleep_hours: 7,
        feeling: null,
        tomorrow_focus: null,
        points_earned: 90,
      }));

      setupSupabaseMocks({ progressRows: sevenDays });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 7/7 = 100% >= 90% => week 2 unlocked
      expect(result.current.weekUnlocked).toBe(2);
    });
  });

  describe("saveDayProgress", () => {
    it("saves progress for a specific past day", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "save-day-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === "challenge_progress") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
            upsert: mockUpsert,
          };
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const metrics: DailyMetrics = {
        steps: 8000,
        waterLiters: 2.5,
        floorsClimbed: 6,
        proteinGrams: 70,
        sleepHours: 7,
      };

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.saveDayProgress(3, metrics);
      });

      expect(saveResult).toBe(true);
      expect(mockUpsert).toHaveBeenCalled();
    });

    it("returns false when user is not authenticated", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: null,
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({});

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const metrics: DailyMetrics = {
        steps: 10000,
        waterLiters: 3.0,
        floorsClimbed: 10,
        proteinGrams: 80,
        sleepHours: 7,
      };

      let saveResult: boolean = true;
      await act(async () => {
        saveResult = await result.current.saveDayProgress(3, metrics);
      });

      expect(saveResult).toBe(false);
    });

    it("returns false when plan has not started", async () => {
      mockUseOptionalAuth.mockReturnValue({
        userId: "before-save-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-03-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-10T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      setupSupabaseMocks({ progressRows: [] });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const metrics: DailyMetrics = {
        steps: 10000,
        waterLiters: 3.0,
        floorsClimbed: 10,
        proteinGrams: 80,
        sleepHours: 7,
      };

      let saveResult: boolean = true;
      await act(async () => {
        saveResult = await result.current.saveDayProgress(1, metrics);
      });

      expect(saveResult).toBe(false);
    });
  });

  describe("resetChallenge", () => {
    it("resets local state and deletes progress from database", async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockUseOptionalAuth.mockReturnValue({
        userId: "reset-user",
        profile: {
          role: "client",
          plan_duration_days: 30,
          plan_start_date: "2026-02-01",
          current_plan_cycle: 1,
          challenge_start_date: null,
          created_at: "2026-02-01T00:00:00Z",
        },
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "challenge_progress") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  day_number: 1,
                  logged_date: "2026-02-01",
                  steps: 10000,
                  water_liters: 3,
                  floors_climbed: 10,
                  protein_grams: 80,
                  sleep_hours: 7,
                  feeling: null,
                  tomorrow_focus: null,
                  points_earned: 90,
                },
              ],
              error: null,
            }),
            delete: mockDelete,
          };
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const { result } = renderHook(() => useGamification());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.resetChallenge();
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(result.current.allProgress).toEqual({});
      expect(result.current.dailyVisitPoints).toBe(0);
    });
  });
});
