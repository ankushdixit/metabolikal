import { calculatePlanInfo, formatPlanDate, formatMacroRange } from "../use-client-profile-data";
import type { Profile } from "@/lib/database.types";

// Helper to create mock profile
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
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("useClientProfileData utilities", () => {
  describe("calculatePlanInfo", () => {
    // Mock today as 2026-01-15
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
      expect(result.progressPercent).toBe(21); // 6/28 * 100 = 21.4, rounded = 21
      expect(result.isBeforeStart).toBe(false);
      expect(result.isCompleted).toBe(false);
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
      expect(result.dayNumber).toBe(1); // Clamped to min 1
    });

    it("identifies completed plan", () => {
      const profile = createMockProfile({
        plan_start_date: "2026-01-01",
        plan_duration_days: 7,
      });

      // Plan was Jan 1-7, today is Jan 15
      const result = calculatePlanInfo(profile);

      expect(result.isConfigured).toBe(true);
      expect(result.isCompleted).toBe(true);
      expect(result.daysRemaining).toBe(0);
      expect(result.progressPercent).toBe(100); // Capped at 100
    });

    it("calculates end date correctly", () => {
      const profile = createMockProfile({
        plan_start_date: "2026-01-10",
        plan_duration_days: 10,
      });

      const result = calculatePlanInfo(profile);

      // Start Jan 10, duration 10 days = ends Jan 19 (inclusive)
      expect(result.endDate?.toISOString()).toContain("2026-01-19");
    });

    it("uses default duration of 7 days when not specified", () => {
      const profile = createMockProfile({
        plan_start_date: "2026-01-10",
        plan_duration_days: 7, // Default from schema
      });

      const result = calculatePlanInfo(profile);
      expect(result.durationDays).toBe(7);
    });

    it("clamps progress to 0-100 range", () => {
      // Future plan - should not have negative progress
      const futureProfile = createMockProfile({
        plan_start_date: "2026-02-01",
        plan_duration_days: 14,
      });

      const futureResult = calculatePlanInfo(futureProfile);
      expect(futureResult.progressPercent).toBeGreaterThanOrEqual(0);
      expect(futureResult.progressPercent).toBeLessThanOrEqual(100);

      // Completed plan - should not exceed 100
      const pastProfile = createMockProfile({
        plan_start_date: "2025-12-01",
        plan_duration_days: 7,
      });

      const pastResult = calculatePlanInfo(pastProfile);
      expect(pastResult.progressPercent).toBeLessThanOrEqual(100);
    });
  });

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
  });

  describe("formatMacroRange", () => {
    it("returns null when both min and max are null", () => {
      const result = formatMacroRange(null, null, "g");
      expect(result).toBeNull();
    });

    it("returns null when both min and max are undefined", () => {
      const result = formatMacroRange(undefined, undefined, "g");
      expect(result).toBeNull();
    });

    it("formats min only with 'min' suffix", () => {
      const result = formatMacroRange(100, null, "g");
      expect(result).toBe("100g min");
    });

    it("formats max only with 'max' suffix", () => {
      const result = formatMacroRange(null, 150, "g");
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

    it("handles zero values", () => {
      const result = formatMacroRange(0, 100, "g");
      expect(result).toBe("0 - 100g");
    });
  });
});
