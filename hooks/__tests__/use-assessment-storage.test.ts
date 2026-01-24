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

// Mock saveAssessmentResults
const mockSaveAssessmentResults = jest.fn();
jest.mock("../use-profile-completion", () => ({
  saveAssessmentResults: (...args: unknown[]) => mockSaveAssessmentResults(...args),
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
      const storedAssessment: StoredAssessment = {
        date: "2026-01-20T10:00:00.000Z",
        scores: {
          sleep: 7,
          body: 6,
          nutrition: 8,
          mental: 5,
          stress: 6,
          support: 7,
          hydration: 8,
        },
        totalScore: 70,
        lifestyleScore: 67,
      };

      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(storedAssessment));

      const { result } = renderHook(() => useAssessmentStorage());
      const retrieved = result.current.getPreviousAssessment();

      expect(retrieved).toEqual(storedAssessment);
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

      const scores: AssessmentScores = {
        sleep: 7,
        body: 6,
        nutrition: 8,
        mental: 5,
        stress: 6,
        support: 7,
        hydration: 8,
      };

      act(() => {
        result.current.saveAssessment(scores, 67);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY_ASSESSMENT,
        expect.any(String)
      );

      // Find the call that saved to STORAGE_KEY_ASSESSMENT (not the storage test)
      const assessmentCall = mockLocalStorage.setItem.mock.calls.find(
        (call: [string, string]) => call[0] === STORAGE_KEY_ASSESSMENT
      );
      expect(assessmentCall).toBeTruthy();

      const savedData = JSON.parse(assessmentCall![1]) as StoredAssessment;
      expect(savedData.scores).toEqual(scores);
      expect(savedData.lifestyleScore).toBe(67);
      expect(savedData.totalScore).toBe(67); // For saveAssessment, totalScore = lifestyleScore
      expect(savedData.date).toBeTruthy();
    });
  });

  describe("saveAssessmentWithHealthScore", () => {
    it("saves assessment with separate health score", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      const scores: AssessmentScores = {
        sleep: 7,
        body: 6,
        nutrition: 8,
        mental: 5,
        stress: 6,
        support: 7,
        hydration: 8,
      };

      act(() => {
        result.current.saveAssessmentWithHealthScore(scores, 67, 75);
      });

      // Find the call that saved to STORAGE_KEY_ASSESSMENT (not the storage test)
      const assessmentCall = mockLocalStorage.setItem.mock.calls.find(
        (call: [string, string]) => call[0] === STORAGE_KEY_ASSESSMENT
      );
      expect(assessmentCall).toBeTruthy();

      const savedData = JSON.parse(assessmentCall![1]) as StoredAssessment;
      expect(savedData.scores).toEqual(scores);
      expect(savedData.lifestyleScore).toBe(67);
      expect(savedData.totalScore).toBe(75); // healthScore is used for totalScore
    });
  });

  describe("clearAssessment", () => {
    it("removes assessment from localStorage", () => {
      const storedAssessment: StoredAssessment = {
        date: "2026-01-20T10:00:00.000Z",
        scores: {
          sleep: 7,
          body: 6,
          nutrition: 8,
          mental: 5,
          stress: 6,
          support: 7,
          hydration: 8,
        },
        totalScore: 70,
        lifestyleScore: 67,
      };

      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(storedAssessment));

      const { result } = renderHook(() => useAssessmentStorage());

      act(() => {
        result.current.clearAssessment();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
    });
  });

  describe("hasPreviousAssessment", () => {
    it("returns false when no previous assessment exists", () => {
      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.hasPreviousAssessment()).toBe(false);
    });

    it("returns true when previous assessment exists", () => {
      const storedAssessment: StoredAssessment = {
        date: "2026-01-20T10:00:00.000Z",
        scores: {
          sleep: 7,
          body: 6,
          nutrition: 8,
          mental: 5,
          stress: 6,
          support: 7,
          hydration: 8,
        },
        totalScore: 70,
        lifestyleScore: 67,
      };

      mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(storedAssessment));

      const { result } = renderHook(() => useAssessmentStorage());
      expect(result.current.hasPreviousAssessment()).toBe(true);
    });
  });

  describe("calculator storage", () => {
    it("saves and retrieves calculator data", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      const inputs: StoredCalculator["inputs"] = {
        gender: "male",
        age: 35,
        weight: 80,
        height: 180,
        activityLevel: "moderate",
        goal: "fat_loss",
      };

      const results: StoredCalculator["results"] = {
        bmr: 1800,
        tdee: 2500,
        targetCalories: 2000,
        protein: 160,
        carbs: 200,
        fats: 67,
      };

      act(() => {
        result.current.saveCalculator(inputs, results);
      });

      const retrieved = result.current.getPreviousCalculator();
      expect(retrieved?.inputs).toEqual(inputs);
      expect(retrieved?.results).toEqual(results);
    });

    it("clears calculator data", () => {
      const { result } = renderHook(() => useAssessmentStorage());

      const inputs: StoredCalculator["inputs"] = {
        gender: "male",
        age: 35,
        weight: 80,
        height: 180,
        activityLevel: "moderate",
        goal: "fat_loss",
      };

      const results: StoredCalculator["results"] = {
        bmr: 1800,
        tdee: 2500,
        targetCalories: 2000,
        protein: 160,
        carbs: 200,
        fats: 67,
      };

      act(() => {
        result.current.saveCalculator(inputs, results);
      });

      act(() => {
        result.current.clearCalculator();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_CALCULATOR);
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
    expect(comparison.delta).toBe(10); // Delta is always positive
  });

  it("handles edge cases with extreme scores", () => {
    expect(calculateScoreComparison(100, 0)).toEqual({ status: "improved", delta: 100 });
    expect(calculateScoreComparison(0, 100)).toEqual({ status: "decreased", delta: 100 });
    expect(calculateScoreComparison(50, 49)).toEqual({ status: "improved", delta: 1 });
  });
});

describe("migrateLocalStorageToDatabase", () => {
  const validAssessment: StoredAssessment = {
    date: "2026-01-20T10:00:00.000Z",
    scores: {
      sleep: 7,
      body: 6,
      nutrition: 8,
      mental: 5,
      stress: 6,
      support: 7,
      hydration: 8,
    },
    totalScore: 70,
    lifestyleScore: 67,
  };

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

  it("returns migrated: false when no localStorage data exists", async () => {
    const result = await migrateLocalStorageToDatabase("user-123");

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(false);
    expect(mockSaveAssessmentResults).not.toHaveBeenCalled();
  });

  it("migrates localStorage data to database when no existing DB data", async () => {
    mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
    mockSaveAssessmentResults.mockResolvedValue({ success: true });

    const result = await migrateLocalStorageToDatabase("user-123");

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    expect(mockSaveAssessmentResults).toHaveBeenCalledWith(
      "user-123",
      validAssessment.scores,
      expect.any(String) // visitor ID
    );
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
  });

  it("skips migration when database has newer data", async () => {
    mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));

    // Database has newer data
    mockSupabaseMaybeSingle.mockResolvedValue({
      data: { id: "db-1", assessed_at: "2026-01-25T10:00:00.000Z" },
      error: null,
    });

    const result = await migrateLocalStorageToDatabase("user-123");

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(false);
    expect(mockSaveAssessmentResults).not.toHaveBeenCalled();
    // Should still clear localStorage
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
  });

  it("migrates when localStorage data is newer than database", async () => {
    // Set localStorage date to be newer
    const newerAssessment = {
      ...validAssessment,
      date: "2026-01-25T10:00:00.000Z",
    };
    mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(newerAssessment));
    mockSaveAssessmentResults.mockResolvedValue({ success: true });

    // Database has older data
    mockSupabaseMaybeSingle.mockResolvedValue({
      data: { id: "db-1", assessed_at: "2026-01-20T10:00:00.000Z" },
      error: null,
    });

    const result = await migrateLocalStorageToDatabase("user-123");

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    expect(mockSaveAssessmentResults).toHaveBeenCalled();
  });

  it("clears corrupted localStorage data", async () => {
    mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, "not valid json{{{");

    const result = await migrateLocalStorageToDatabase("user-123");

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(false);
    expect(result.error).toContain("Corrupted");
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
  });

  it("clears invalid localStorage data (missing required fields)", async () => {
    mockLocalStorage.setItem(
      STORAGE_KEY_ASSESSMENT,
      JSON.stringify({ totalScore: 70 }) // Missing scores and date
    );

    const result = await migrateLocalStorageToDatabase("user-123");

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(false);
    expect(result.error).toContain("Invalid");
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
  });

  it("returns error when saveAssessmentResults fails", async () => {
    mockLocalStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(validAssessment));
    mockSaveAssessmentResults.mockResolvedValue({
      success: false,
      error: "Database error",
    });

    const result = await migrateLocalStorageToDatabase("user-123");

    expect(result.success).toBe(false);
    expect(result.migrated).toBe(false);
    expect(result.error).toBe("Database error");
    // Should NOT clear localStorage on failure
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith(STORAGE_KEY_ASSESSMENT);
  });
});
