import { renderHook, act } from "@testing-library/react";
import {
  useGamification,
  calculateStepsPoints,
  calculateWaterPoints,
  calculateFloorsPoints,
  calculateProteinPoints,
  calculateSleepPoints,
  calculateMetricsPoints,
  calculateDailyPoints,
  DailyMetrics,
} from "../use-gamification";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: jest.fn(() => "test-visitor-id-123"),
  },
});

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

describe("useGamification Hook", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it("initializes with default state for new visitors", () => {
    const { result } = renderHook(() => useGamification());

    // Wait for loading to complete
    expect(result.current.isLoading).toBe(false);
    expect(result.current.visitorId).toBe("test-visitor-id-123");
    expect(result.current.currentDay).toBe(1);
    expect(result.current.totalPoints).toBe(10); // Daily visit points
    expect(result.current.dayStreak).toBe(0);
    expect(result.current.weekUnlocked).toBe(1);
    expect(result.current.completionPercent).toBe(0);
  });

  it("generates and stores visitor ID on first visit", () => {
    renderHook(() => useGamification());

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "metabolikal_visitor_id",
      "test-visitor-id-123"
    );
  });

  it("loads existing visitor ID from localStorage", () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "metabolikal_visitor_id") return "existing-visitor-id";
      return null;
    });

    const { result } = renderHook(() => useGamification());
    expect(result.current.visitorId).toBe("existing-visitor-id");
  });

  it("saves progress to localStorage", () => {
    const { result } = renderHook(() => useGamification());

    const metrics: DailyMetrics = {
      steps: 10000,
      waterLiters: 3.5,
      floorsClimbed: 10,
      proteinGrams: 100,
      sleepHours: 8,
    };

    act(() => {
      result.current.saveTodayProgress(metrics);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "metabolikal_challenge_data",
      expect.any(String)
    );
  });

  it("calculates streak correctly when saving progress", () => {
    const { result } = renderHook(() => useGamification());

    const metrics: DailyMetrics = {
      steps: 7000,
      waterLiters: 3.0,
      floorsClimbed: 4,
      proteinGrams: 70,
      sleepHours: 7,
    };

    act(() => {
      result.current.saveTodayProgress(metrics);
    });

    expect(result.current.dayStreak).toBe(1);
  });

  it("allows editing current day", () => {
    const { result } = renderHook(() => useGamification());
    expect(result.current.canEditDay(result.current.currentDay)).toBe(true);
  });

  it("blocks editing future days", () => {
    const { result } = renderHook(() => useGamification());
    expect(result.current.canEditDay(result.current.currentDay + 1)).toBe(false);
  });

  it("awards assessment points only once", () => {
    const { result } = renderHook(() => useGamification());

    act(() => {
      result.current.awardAssessmentPoints(25);
    });

    expect(result.current.assessmentPoints).toBe(25);

    act(() => {
      result.current.awardAssessmentPoints(50);
    });

    // Should still be 25, not 50
    expect(result.current.assessmentPoints).toBe(25);
  });

  it("awards calculator points only once", () => {
    const { result } = renderHook(() => useGamification());

    act(() => {
      result.current.awardCalculatorPoints(25);
    });

    expect(result.current.calculatorPoints).toBe(25);

    act(() => {
      result.current.awardCalculatorPoints(50);
    });

    // Should still be 25, not 50
    expect(result.current.calculatorPoints).toBe(25);
  });

  it("awards daily visit points only once per day", () => {
    const { result } = renderHook(() => useGamification());

    // First render awards 10 points
    expect(result.current.dailyVisitPoints).toBe(10);

    // Re-render hook (simulating page refresh on same day)
    const { result: result2 } = renderHook(() => useGamification());

    // Should still have 10 points, not 20
    expect(result2.current.dailyVisitPoints).toBe(10);
  });

  it("calculates cumulative stats correctly", () => {
    const { result } = renderHook(() => useGamification());

    const metrics: DailyMetrics = {
      steps: 10000,
      waterLiters: 4.0,
      floorsClimbed: 15,
      proteinGrams: 100,
      sleepHours: 8,
    };

    act(() => {
      result.current.saveTodayProgress(metrics);
    });

    expect(result.current.cumulativeStats.totalSteps).toBe(10000);
    expect(result.current.cumulativeStats.totalWater).toBe(4.0);
    expect(result.current.cumulativeStats.totalFloors).toBe(15);
    expect(result.current.cumulativeStats.totalProtein).toBe(100);
    expect(result.current.cumulativeStats.totalSleepHours).toBe(8);
    expect(result.current.cumulativeStats.daysCompleted).toBe(1);
  });

  it("isDayUnlocked returns true for week 1 days", () => {
    const { result } = renderHook(() => useGamification());

    expect(result.current.isDayUnlocked(1)).toBe(true);
    expect(result.current.isDayUnlocked(7)).toBe(true);
  });

  it("isDayUnlocked returns false for locked weeks", () => {
    const { result } = renderHook(() => useGamification());

    // Week 2 should be locked initially
    expect(result.current.isDayUnlocked(8)).toBe(false);
    expect(result.current.isDayUnlocked(14)).toBe(false);
  });

  it("reset challenge clears all data", () => {
    const { result } = renderHook(() => useGamification());

    const metrics: DailyMetrics = {
      steps: 10000,
      waterLiters: 4.0,
      floorsClimbed: 15,
      proteinGrams: 100,
      sleepHours: 8,
    };

    act(() => {
      result.current.saveTodayProgress(metrics);
    });

    expect(result.current.cumulativeStats.daysCompleted).toBe(1);

    act(() => {
      result.current.resetChallenge();
    });

    expect(result.current.cumulativeStats.daysCompleted).toBe(0);
    expect(result.current.dayStreak).toBe(0);
  });

  it("getDayProgress returns null for days without data", () => {
    const { result } = renderHook(() => useGamification());
    expect(result.current.getDayProgress(5)).toBe(null);
  });

  it("getDayProgress returns data for logged days", () => {
    const { result } = renderHook(() => useGamification());

    const metrics: DailyMetrics = {
      steps: 10000,
      waterLiters: 4.0,
      floorsClimbed: 15,
      proteinGrams: 100,
      sleepHours: 8,
    };

    act(() => {
      result.current.saveTodayProgress(metrics);
    });

    const progress = result.current.getDayProgress(result.current.currentDay);
    expect(progress).not.toBe(null);
    expect(progress?.metrics.steps).toBe(10000);
  });
});
