import { renderHook, act } from "@testing-library/react";
import {
  useAssessmentStorage,
  formatAssessmentDate,
  calculateScoreComparison,
  migrateLocalStorageToDatabase,
  STORAGE_KEY_ASSESSMENT,
  STORAGE_KEY_CALCULATOR,
  StoredAssessment,
  StoredCalculator,
} from "../use-assessment-storage";
import { AssessmentScores } from "../use-assessment";

// Mock Supabase client
const mockSupabaseFrom = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseMaybeSingle = jest.fn();

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    from: mockSupabaseFrom,
  }),
}));

// Mock saveAssessmentResults and saveCalculatorResults
const mockSaveAssessmentResults = jest.fn();
const mockSaveCalculatorResults = jest.fn();
jest.mock("../use-profile-completion", () => ({
  saveAssessmentResults: (...args: unknown[]) => mockSaveAssessmentResults(...args),
  saveCalculatorResults: (...args: unknown[]) => mockSaveCalculatorResults(...args),
}));

// Mock generateUUID
jest.mock("@/lib/utils", () => ({
  ...jest.requireActual("@/lib/utils"),
  generateUUID: () => "mock-uuid-1234",
}));

// Mock localStorage
const mockLocalStorage = (() => {
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

Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Shared test data
const mockScores: AssessmentScores = {
  sleep: 7,
  body: 6,
  nutrition: 8,
  mental: 5,
  stress: 6,
  support: 7,
  hydration: 8,
};

const validAssessment: StoredAssessment = {
  date: "2026-01-20T10:00:00.000Z",
  scores: mockScores,
  totalScore: 70,
  lifestyleScore: 67,
};

const validCalculator: StoredCalculator = {
  date: "2026-01-20T10:00:00.000Z",
  inputs: {
    gender: "male",
    age: 35,
    weight: 80,
    height: 180,
    activityLevel: "moderate",
    goal: "fat_loss",
  },
  results: {
    bmr: 1800,
    tdee: 2500,
    targetCalories: 2000,
    protein: 160,
    carbs: 200,
    fats: 67,
  },
};

describe("useAssessmentStorage", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe("getPreviousAssessment", () => {
    it("returns null when no previous assessment exists", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.getPreviousAssessment()).toBeNull();
    });

    it("returns stored assessment when it exists", () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));

      const { result } = renderHook(() => useAssessmentStorage());
      const retrieved = result.current.getPreviousAssessment();

      expect(retrieved).toEqual(validAssessment);
    });

    it("returns null for corrupted JSON data", () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, "not valid json{{{");

      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.getPreviousAssessment()).toBeNull();
    });
  });

  describe("saveAssessment", () => {
    it("saves assessment to localStorage", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveAssessment(mockScores, 67);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY_ASSESSMENT,
        expect.any(String)
      );

      const assessmentCall = mockLocalStorage.setItem.mock.calls.find(
        (call: [string, string]) => call[0] === STORAGE_KEY_ASSESSMENT
      );
      expect(assessmentCall).toBeTruthy();

      const savedData = JSON.parse(assessmentCall![1]) as StoredAssessment;
      expect(savedData.scores).toEqual(mockScores);
      expect(savedData.lifestyleScore).toBe(67);
      expect(savedData.totalScore).toBe(67);
      expect(savedData.date).toBeTruthy();
    });

    it("fails silently when localStorage.setItem throws", () => {
      // Make setItem throw on STORAGE_KEY_ASSESSMENT
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn((key: string, value: string) => {
        if (key === STORAGE_KEY_ASSESSMENT) {
          throw new Error("QuotaExceededError");
        }
        // Allow storage test to pass
        originalSetItem(key, value);
      });

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveAssessment(mockScores, 67);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Failed to save assessment to localStorage");
      consoleSpy.mockRestore();
      mockLocalStorage.setItem = originalSetItem;
    });
  });

  describe("saveAssessmentWithHealthScore", () => {
    it("saves assessment with separate health score", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveAssessmentWithHealthScore(mockScores, 67, 75);
      });

      const assessmentCall = mockLocalStorage.setItem.mock.calls.find(
        (call: [string, string]) => call[0] === STORAGE_KEY_ASSESSMENT
      );
      expect(assessmentCall).toBeTruthy();

      const savedData = JSON.parse(assessmentCall![1]) as StoredAssessment;
      expect(savedData.scores).toEqual(mockScores);
      expect(savedData.lifestyleScore).toBe(67);
      expect(savedData.totalScore).toBe(75);
    });

    it("fails silently when localStorage.setItem throws", () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn((key: string, value: string) => {
        if (key === STORAGE_KEY_ASSESSMENT) {
          throw new Error("QuotaExceededError");
        }
        originalSetItem(key, value);
      });

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveAssessmentWithHealthScore(mockScores, 67, 75);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Failed to save assessment to localStorage");
      consoleSpy.mockRestore();
      mockLocalStorage.setItem = originalSetItem;
    });
  });

  describe("clearAssessment", () => {
    it("removes assessment from localStorage", () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));

      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.clearAssessment();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
    });

    it("fails silently when localStorage.removeItem throws", () => {
      // Render hook first with working localStorage so storageAvailable = true
      const { result } = renderHook(() => useAssessmentStorage());

      // Now make removeItem throw only for the assessment key
      const originalRemoveItem = mockLocalStorage.removeItem;
      mockLocalStorage.removeItem = jest.fn((key: string) => {
        if (key === STORAGE_KEY_ASSESSMENT) {
          throw new Error("SecurityError");
        }
        originalRemoveItem(key);
      });

      // Should not throw - exercises the catch block on lines 181-182
      expect(() => {
        act(() => {
          result.current.clearAssessment();
        });
      }).not.toThrow();

      mockLocalStorage.removeItem = originalRemoveItem;
    });
  });

  describe("hasPreviousAssessment", () => {
    it("returns false when no previous assessment exists", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.hasPreviousAssessment()).toBe(false);
    });

    it("returns true when previous assessment exists", () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));

      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.hasPreviousAssessment()).toBe(true);
    });
  });

  describe("calculator storage", () => {
    it("saves and retrieves calculator data", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveCalculator(validCalculator.inputs, validCalculator.results);
      });

      const retrieved = result.current.getPreviousCalculator();
      expect(retrieved?.inputs).toEqual(validCalculator.inputs);
      expect(retrieved?.results).toEqual(validCalculator.results);
    });

    it("returns null when no calculator data exists", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.getPreviousCalculator()).toBeNull();
    });

    it("clears calculator data", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveCalculator(validCalculator.inputs, validCalculator.results);
      });

      act(() => {
        result.current.clearCalculator();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_CALCULATOR);
    });

    it("fails silently when saveCalculator throws due to storage full", () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn((key: string, value: string) => {
        if (key === STORAGE_KEY_CALCULATOR) {
          throw new Error("QuotaExceededError");
        }
        originalSetItem(key, value);
      });

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveCalculator(validCalculator.inputs, validCalculator.results);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Failed to save calculator to localStorage");
      consoleSpy.mockRestore();
      mockLocalStorage.setItem = originalSetItem;
    });

    it("fails silently when clearCalculator throws", () => {
      // Render hook first with working localStorage so storageAvailable = true
      const { result } = renderHook(() => useAssessmentStorage());

      // Now make removeItem throw only for the calculator key
      const originalRemoveItem = mockLocalStorage.removeItem;
      mockLocalStorage.removeItem = jest.fn((key: string) => {
        if (key === STORAGE_KEY_CALCULATOR) {
          throw new Error("SecurityError");
        }
        originalRemoveItem(key);
      });

      // Should not throw - exercises the catch block on lines 193-194
      expect(() => {
        act(() => {
          result.current.clearCalculator();
        });
      }).not.toThrow();

      mockLocalStorage.removeItem = originalRemoveItem;
    });
  });

  describe("hasPreviousCalculator", () => {
    it("returns false when no calculator data exists", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.hasPreviousCalculator()).toBe(false);
    });

    it("returns true when calculator data exists", () => {
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(validCalculator));

      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.hasPreviousCalculator()).toBe(true);
    });
  });

  describe("clearAll", () => {
    it("clears both assessment and calculator data", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.clearAll();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_CALCULATOR);
    });
  });

  describe("storageAvailable", () => {
    it("returns true when localStorage is available", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.storageAvailable).toBe(true);
    });
  });

  describe("when storage is unavailable", () => {
    let originalSetItem: typeof mockLocalStorage.setItem;

    beforeEach(() => {
      // Make the isLocalStorageAvailable check fail by throwing on setItem
      originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error("SecurityError: localStorage is disabled");
      });
    });

    afterEach(() => {
      mockLocalStorage.setItem = originalSetItem;
    });

    it("reports storageAvailable as false", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.storageAvailable).toBe(false);
    });

    it("getPreviousAssessment returns null when storage unavailable", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.getPreviousAssessment()).toBeNull();
    });

    it("saveAssessment is a no-op when storage unavailable", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveAssessment(mockScores, 67);
      });

      // setItem was called once by isLocalStorageAvailable, but not for actual save
      // The save should be a no-op since storageAvailable is false
      const assessmentCalls = mockLocalStorage.setItem.mock.calls.filter(
        (call: [string, string]) => call[0] === STORAGE_KEY_ASSESSMENT
      );
      expect(assessmentCalls).toHaveLength(0);
    });

    it("saveAssessmentWithHealthScore is a no-op when storage unavailable", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveAssessmentWithHealthScore(mockScores, 67, 75);
      });

      const assessmentCalls = mockLocalStorage.setItem.mock.calls.filter(
        (call: [string, string]) => call[0] === STORAGE_KEY_ASSESSMENT
      );
      expect(assessmentCalls).toHaveLength(0);
    });

    it("getPreviousCalculator returns null when storage unavailable", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.getPreviousCalculator()).toBeNull();
    });

    it("saveCalculator is a no-op when storage unavailable", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.saveCalculator(validCalculator.inputs, validCalculator.results);
      });

      const calculatorCalls = mockLocalStorage.setItem.mock.calls.filter(
        (call: [string, string]) => call[0] === STORAGE_KEY_CALCULATOR
      );
      expect(calculatorCalls).toHaveLength(0);
    });

    it("clearAssessment is a no-op when storage unavailable", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.clearAssessment();
      });

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });

    it("clearCalculator is a no-op when storage unavailable", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.clearCalculator();
      });

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });

    it("hasPreviousAssessment returns false when storage unavailable", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.hasPreviousAssessment()).toBe(false);
    });

    it("hasPreviousCalculator returns false when storage unavailable", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.hasPreviousCalculator()).toBe(false);
    });
  });
});

describe("formatAssessmentDate", () => {
  it("formats ISO date to MM/DD/YYYY", () => {
    expect(formatAssessmentDate("2026-01-20T10:00:00.000Z")).toBe("01/20/2026");
    expect(formatAssessmentDate("2026-12-05T15:30:00.000Z")).toBe("12/05/2026");
    expect(formatAssessmentDate("2025-06-15T00:00:00.000Z")).toBe("06/15/2025");
  });

  it("handles dates with single-digit month and day", () => {
    expect(formatAssessmentDate("2026-01-05T10:00:00.000Z")).toBe("01/05/2026");
    expect(formatAssessmentDate("2026-09-01T10:00:00.000Z")).toBe("09/01/2026");
  });
});

describe("calculateScoreComparison", () => {
  it("returns improved status when new score is higher", () => {
    const comparison = calculateScoreComparison(80, 70);
    expect(comparison.status).toBe("improved");
    expect(comparison.delta).toBe(10);
  });

  it("returns same status when scores are equal", () => {
    const comparison = calculateScoreComparison(70, 70);
    expect(comparison.status).toBe("same");
    expect(comparison.delta).toBe(0);
  });

  it("returns decreased status when new score is lower", () => {
    const comparison = calculateScoreComparison(60, 70);
    expect(comparison.status).toBe("decreased");
    expect(comparison.delta).toBe(10);
  });

  it("handles edge cases with extreme scores", () => {
    expect(calculateScoreComparison(100, 0)).toEqual({ status: "improved", delta: 100 });
    expect(calculateScoreComparison(0, 100)).toEqual({ status: "decreased", delta: 100 });
    expect(calculateScoreComparison(50, 49)).toEqual({ status: "improved", delta: 1 });
  });
});

describe("migrateLocalStorageToDatabase", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();

    // Setup Supabase mock chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
    });
    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
    });
    mockSupabaseEq.mockReturnValue({
      maybeSingle: mockSupabaseMaybeSingle,
    });
    mockSupabaseMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe("assessment migration", () => {
    it("returns migrated: false when no localStorage data exists", async () => {
      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(true);
      expect(result.assessmentMigrated).toBe(false);
      expect(mockSaveAssessmentResults).not.toHaveBeenCalled();
    });

    it("migrates localStorage data to database when no existing DB data", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
      mockSaveAssessmentResults.mockResolvedValue({ success: true });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(true);
      expect(result.assessmentMigrated).toBe(true);
      expect(mockSaveAssessmentResults).toHaveBeenCalledWith(
        "user-123",
        validAssessment.scores,
        expect.any(String)
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
    });

    it("skips migration when database has newer data", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));

      mockSupabaseMaybeSingle.mockResolvedValue({
        data: { id: "db-1", assessed_at: "2026-01-25T10:00:00.000Z" },
        error: null,
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(true);
      expect(result.assessmentMigrated).toBe(false);
      expect(mockSaveAssessmentResults).not.toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
    });

    it("migrates when localStorage data is newer than database", async () => {
      const newerAssessment = {
        ...validAssessment,
        date: "2026-01-25T10:00:00.000Z",
      };
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(newerAssessment));
      mockSaveAssessmentResults.mockResolvedValue({ success: true });

      mockSupabaseMaybeSingle.mockResolvedValue({
        data: { id: "db-1", assessed_at: "2026-01-20T10:00:00.000Z" },
        error: null,
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(true);
      expect(result.assessmentMigrated).toBe(true);
      expect(mockSaveAssessmentResults).toHaveBeenCalled();
    });

    it("clears corrupted localStorage data", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, "not valid json{{{");

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.assessmentMigrated).toBe(false);
      expect(result.error).toContain("Corrupted assessment data");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
    });

    it("skips invalid localStorage data (missing required fields)", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify({ totalScore: 70 }));

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(true);
      expect(result.assessmentMigrated).toBe(false);
      expect(mockSaveAssessmentResults).not.toHaveBeenCalled();
    });

    it("returns error when saveAssessmentResults fails", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
      mockSaveAssessmentResults.mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(false);
      expect(result.assessmentMigrated).toBe(false);
      expect(result.error).toContain("Database error");
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
    });

    it("catches unexpected errors during assessment migration", async () => {
      // Make getItem return valid JSON, but cause supabase to throw
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
      mockSupabaseFrom.mockImplementation(() => {
        throw new Error("Unexpected network error");
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(false);
      expect(result.assessmentMigrated).toBe(false);
      expect(result.error).toContain("Assessment error: Unexpected network error");
    });

    it("catches non-Error thrown objects during assessment migration", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
      mockSupabaseFrom.mockImplementation(() => {
        throw "string error";
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Assessment error: string error");
    });
  });

  describe("calculator migration", () => {
    it("returns calculatorMigrated: false when no calculator data exists", async () => {
      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.calculatorMigrated).toBe(false);
      expect(mockSaveCalculatorResults).not.toHaveBeenCalled();
    });

    it("migrates calculator data when no existing DB data", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(validCalculator));
      mockSaveCalculatorResults.mockResolvedValue({ success: true });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(true);
      expect(result.calculatorMigrated).toBe(true);
      expect(mockSaveCalculatorResults).toHaveBeenCalledWith(
        "user-123",
        {
          gender: validCalculator.inputs.gender,
          age: validCalculator.inputs.age,
          weightKg: validCalculator.inputs.weight,
          heightCm: validCalculator.inputs.height,
          activityLevel: validCalculator.inputs.activityLevel,
          goal: validCalculator.inputs.goal,
        },
        {
          bmr: validCalculator.results.bmr,
          tdee: validCalculator.results.tdee,
          targetCalories: validCalculator.results.targetCalories,
          proteinGrams: validCalculator.results.protein,
          carbsGrams: validCalculator.results.carbs,
          fatsGrams: validCalculator.results.fats,
        }
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_CALCULATOR);
    });

    it("skips calculator migration when database has newer data", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(validCalculator));

      // No assessment data, so only the calculator section calls maybeSingle
      mockSupabaseMaybeSingle.mockResolvedValue({
        data: { id: "db-calc-1", updated_at: "2026-02-01T10:00:00.000Z" },
        error: null,
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.calculatorMigrated).toBe(false);
      expect(mockSaveCalculatorResults).not.toHaveBeenCalled();
      // Should still clear localStorage since DB has newer data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_CALCULATOR);
    });

    it("migrates calculator when localStorage data is newer than database", async () => {
      const newerCalculator = {
        ...validCalculator,
        date: "2026-02-15T10:00:00.000Z",
      };
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(newerCalculator));
      mockSaveCalculatorResults.mockResolvedValue({ success: true });

      mockSupabaseMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // assessment
        .mockResolvedValueOnce({
          data: { id: "db-calc-1", updated_at: "2026-01-20T10:00:00.000Z" },
          error: null,
        }); // calculator - older

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.calculatorMigrated).toBe(true);
      expect(mockSaveCalculatorResults).toHaveBeenCalled();
    });

    it("clears corrupted calculator data", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, "not valid json{{{");

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.calculatorMigrated).toBe(false);
      expect(result.error).toContain("Corrupted calculator data");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_CALCULATOR);
    });

    it("skips invalid calculator data (missing required fields)", async () => {
      mockLocalStorage.setItem(
        STORAGE_KEY_CALCULATOR,
        JSON.stringify({ date: "2026-01-20T10:00:00.000Z" }) // Missing inputs and results
      );

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(true);
      expect(result.calculatorMigrated).toBe(false);
      expect(mockSaveCalculatorResults).not.toHaveBeenCalled();
    });

    it("returns error when saveCalculatorResults fails", async () => {
      // Explicitly reset the maybeSingle mock to avoid stale state from prior tests
      mockSupabaseMaybeSingle.mockReset();
      mockSupabaseMaybeSingle.mockResolvedValue({ data: null, error: null });

      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(validCalculator));
      mockSaveCalculatorResults.mockResolvedValue({
        success: false,
        error: "Calculator DB error",
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(mockSaveCalculatorResults).toHaveBeenCalled();
      expect(result.calculatorMigrated).toBe(false);
      expect(result.error).toContain("Calculator migration failed: Calculator DB error");
      expect(result.success).toBe(false);
      // Should NOT clear localStorage on failure
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith(STORAGE_KEY_CALCULATOR);
    });

    it("catches unexpected errors during calculator migration", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(validCalculator));

      // No assessment data, so from() is only called by the calculator section.
      // Make from() throw to trigger the catch block.
      mockSupabaseFrom.mockImplementation(() => {
        throw new Error("Calculator network error");
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.calculatorMigrated).toBe(false);
      expect(result.error).toContain("Calculator error: Calculator network error");
    });

    it("catches non-Error thrown objects during calculator migration", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(validCalculator));

      // No assessment data, so from() is only called by the calculator section.
      mockSupabaseFrom.mockImplementation(() => {
        throw "calculator string error";
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.error).toContain("Calculator error: calculator string error");
    });
  });

  describe("combined migration scenarios", () => {
    it("migrates both assessment and calculator when both exist", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(validCalculator));
      mockSaveAssessmentResults.mockResolvedValue({ success: true });
      mockSaveCalculatorResults.mockResolvedValue({ success: true });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(true);
      expect(result.assessmentMigrated).toBe(true);
      expect(result.calculatorMigrated).toBe(true);
    });

    it("collects errors from both assessment and calculator migrations", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(validCalculator));
      mockSaveAssessmentResults.mockResolvedValue({
        success: false,
        error: "Assessment DB error",
      });
      mockSaveCalculatorResults.mockResolvedValue({
        success: false,
        error: "Calculator DB error",
      });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.success).toBe(false);
      expect(result.assessmentMigrated).toBe(false);
      expect(result.calculatorMigrated).toBe(false);
      expect(result.error).toContain("Assessment migration failed: Assessment DB error");
      expect(result.error).toContain("Calculator migration failed: Calculator DB error");
    });

    it("uses existing visitor ID from localStorage", async () => {
      mockLocalStorage.setItem("metabolikal_visitor_id", "existing-visitor-id");
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
      mockSaveAssessmentResults.mockResolvedValue({ success: true });

      await migrateLocalStorageToDatabase("user-123");

      expect(mockSaveAssessmentResults).toHaveBeenCalledWith(
        "user-123",
        validAssessment.scores,
        "existing-visitor-id"
      );
    });

    it("generates a visitor ID when none exists in localStorage", async () => {
      // No metabolikal_visitor_id in localStorage
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
      mockSaveAssessmentResults.mockResolvedValue({ success: true });

      await migrateLocalStorageToDatabase("user-123");

      // Should use generated UUID from our mock
      expect(mockSaveAssessmentResults).toHaveBeenCalledWith(
        "user-123",
        validAssessment.scores,
        expect.any(String)
      );
    });

    it("returns no error when both succeed", async () => {
      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
      mockLocalStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(validCalculator));
      mockSaveAssessmentResults.mockResolvedValue({ success: true });
      mockSaveCalculatorResults.mockResolvedValue({ success: true });

      const result = await migrateLocalStorageToDatabase("user-123");

      expect(result.error).toBeUndefined();
    });
  });
});
