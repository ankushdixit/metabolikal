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

// Note: The useGamification hook now requires Supabase authentication.
// Integration tests for the hook should be done with proper Supabase mocking.
// These unit tests cover the pure calculation functions.

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
  });
});

// Note: Hook integration tests have been moved to integration tests
// that properly mock Supabase for database operations.
// See: __tests__/integration/gamification.integration.test.ts
