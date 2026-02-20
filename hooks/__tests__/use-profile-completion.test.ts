/**
 * Tests for useProfileCompletion hook and exported utility functions:
 * - saveAssessmentResults
 * - saveCalculatorResults
 *
 * Covers:
 * - Auth context vs. fallback getUser() path
 * - Migration runs once per user, migration error doesn't crash
 * - Assessment exists but calculator missing (and vice versa)
 * - All completion percentage / boolean calculations
 * - Loading and error states
 * - Protein target rounding
 * - saveAssessmentResults (insert vs. update, error paths)
 * - saveCalculatorResults (insert vs. update, error paths)
 */

import { renderHook, waitFor, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE importing the module under test
// ---------------------------------------------------------------------------

// Mock migrateLocalStorageToDatabase
const mockMigrate = jest.fn().mockResolvedValue({
  success: true,
  assessmentMigrated: false,
  calculatorMigrated: false,
});

jest.mock("../use-assessment-storage", () => ({
  migrateLocalStorageToDatabase: (...args: unknown[]) => mockMigrate(...args),
}));

// Build a chainable mock Supabase builder
function createChainable(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockResolvedValue(resolvedValue);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockResolvedValue(resolvedValue);
  chain.maybeSingle = jest.fn().mockResolvedValue(resolvedValue);
  return chain;
}

// Default table responses (keyed by table name)
let tableResponses: Record<string, { data: unknown; error: unknown }> = {};

const mockUnsubscribe = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}));
const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: null },
  error: null,
});

// Create a from() mock that returns chainable builders whose terminal values
// are controlled by tableResponses.
const mockFrom = jest.fn((table: string) => {
  const response = tableResponses[table] || { data: null, error: null };
  return createChainable(response);
});

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  }),
}));

// Mock useOptionalAuth — we'll change the return value per test
let mockAuthReturn: {
  userId: string | null;
  profile: unknown;
  isLoading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
} | null = null;

jest.mock("@/contexts/auth-context", () => ({
  useOptionalAuth: () => mockAuthReturn,
}));

// Now import the module under test
import {
  useProfileCompletion,
  saveAssessmentResults,
  saveCalculatorResults,
} from "../use-profile-completion";

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

// Helper to restore mockFrom to its default table-based implementation
function restoreMockFrom() {
  mockFrom.mockImplementation((table: string) => {
    const response = tableResponses[table] || { data: null, error: null };
    return createChainable(response);
  });
}

describe("useProfileCompletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthReturn = null; // outside AuthProvider by default
    tableResponses = {};
    restoreMockFrom();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockMigrate.mockResolvedValue({
      success: true,
      assessmentMigrated: false,
      calculatorMigrated: false,
    });
  });

  // -----------------------------------------------------------------------
  // Loading / unauthenticated states
  // -----------------------------------------------------------------------

  describe("loading and unauthenticated states", () => {
    it("starts in loading state", () => {
      const { result } = renderHook(() => useProfileCompletion());
      // Initially loading is true
      expect(result.current.isLoading).toBe(true);
    });

    it("returns unauthenticated state when no user (fallback getUser)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.hasAssessment).toBe(false);
      expect(result.current.hasCalculator).toBe(false);
      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.calculatorResults).toBeNull();
      expect(result.current.proteinTarget).toBeNull();
    });

    it("returns unauthenticated when auth context has no userId", async () => {
      mockAuthReturn = {
        userId: null,
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Auth context path (inside AuthProvider)
  // -----------------------------------------------------------------------

  describe("inside AuthProvider (uses auth context userId)", () => {
    const userId = "user-ctx-123";

    beforeEach(() => {
      mockAuthReturn = {
        userId,
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      };
    });

    it("does NOT call supabase.auth.getUser() when auth context is available", async () => {
      tableResponses["assessment_results"] = { data: { id: "a1" }, error: null };
      tableResponses["calculator_results"] = {
        data: { id: "c1", protein_grams: 150 },
        error: null,
      };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // getUser should NOT have been called
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({ id: userId });
    });

    it("does NOT subscribe to onAuthStateChange when inside AuthProvider", async () => {
      tableResponses["assessment_results"] = { data: null, error: null };
      tableResponses["calculator_results"] = { data: null, error: null };

      renderHook(() => useProfileCompletion());

      await waitFor(() => {});

      // onAuthStateChange is only called when auth is null (outside AuthProvider)
      expect(mockOnAuthStateChange).not.toHaveBeenCalled();
    });

    it("falls back to getUser when auth context is still loading", async () => {
      mockAuthReturn = {
        userId: null,
        profile: null,
        isLoading: true,
        authError: null,
        signOut: jest.fn(),
      };
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-from-getUser" } },
        error: null,
      });
      tableResponses["assessment_results"] = { data: null, error: null };
      tableResponses["calculator_results"] = { data: null, error: null };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockGetUser).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Fallback path (outside AuthProvider)
  // -----------------------------------------------------------------------

  describe("outside AuthProvider (fallback getUser)", () => {
    beforeEach(() => {
      mockAuthReturn = null;
    });

    it("calls supabase.auth.getUser()", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-fb-1" } },
        error: null,
      });
      tableResponses["assessment_results"] = { data: null, error: null };
      tableResponses["calculator_results"] = { data: null, error: null };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockGetUser).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("subscribes to onAuthStateChange when outside AuthProvider", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { unmount } = renderHook(() => useProfileCompletion());

      await waitFor(() => {});

      expect(mockOnAuthStateChange).toHaveBeenCalled();

      // Cleanup should unsubscribe
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Migration
  // -----------------------------------------------------------------------

  describe("migration behavior", () => {
    const userId = "mig-user-1";

    beforeEach(() => {
      mockAuthReturn = {
        userId,
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      };
      tableResponses["assessment_results"] = { data: null, error: null };
      tableResponses["calculator_results"] = { data: null, error: null };
    });

    it("calls migrateLocalStorageToDatabase once per user", async () => {
      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockMigrate).toHaveBeenCalledTimes(1);
      expect(mockMigrate).toHaveBeenCalledWith(userId);

      // Trigger refetch — migration should NOT run again
      await act(async () => {
        await result.current.refetch();
      });

      // Still only 1 call
      expect(mockMigrate).toHaveBeenCalledTimes(1);
    });

    it("does not crash when migration throws", async () => {
      mockMigrate.mockRejectedValueOnce(new Error("migration kaboom"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Hook should still resolve to a usable state
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);

      consoleSpy.mockRestore();
    });

    it("logs when migration completes with data migrated", async () => {
      mockMigrate.mockResolvedValueOnce({
        success: true,
        assessmentMigrated: true,
        calculatorMigrated: false,
      });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Migration completed:",
        expect.objectContaining({ assessment: true, calculator: false })
      );

      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // Assessment / calculator completion states
  // -----------------------------------------------------------------------

  describe("profile completion calculations", () => {
    const userId = "comp-user-1";

    beforeEach(() => {
      mockAuthReturn = {
        userId,
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      };
    });

    it("hasAssessment=true, hasCalculator=true -> isProfileComplete=true", async () => {
      tableResponses["assessment_results"] = { data: { id: "a1" }, error: null };
      tableResponses["calculator_results"] = {
        data: { id: "c1", protein_grams: 120.7 },
        error: null,
      };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasAssessment).toBe(true);
      expect(result.current.hasCalculator).toBe(true);
      expect(result.current.isProfileComplete).toBe(true);
      expect(result.current.calculatorResults).toBeTruthy();
      expect(result.current.proteinTarget).toBe(121); // Math.round(120.7)
    });

    it("hasAssessment=true, hasCalculator=false -> isProfileComplete=false", async () => {
      tableResponses["assessment_results"] = { data: { id: "a1" }, error: null };
      tableResponses["calculator_results"] = { data: null, error: null };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasAssessment).toBe(true);
      expect(result.current.hasCalculator).toBe(false);
      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.calculatorResults).toBeNull();
      expect(result.current.proteinTarget).toBeNull();
    });

    it("hasAssessment=false, hasCalculator=true -> isProfileComplete=false", async () => {
      tableResponses["assessment_results"] = { data: null, error: null };
      tableResponses["calculator_results"] = {
        data: { id: "c1", protein_grams: 150 },
        error: null,
      };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasAssessment).toBe(false);
      expect(result.current.hasCalculator).toBe(true);
      expect(result.current.isProfileComplete).toBe(false);
    });

    it("hasAssessment=false, hasCalculator=false -> isProfileComplete=false", async () => {
      tableResponses["assessment_results"] = { data: null, error: null };
      tableResponses["calculator_results"] = { data: null, error: null };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasAssessment).toBe(false);
      expect(result.current.hasCalculator).toBe(false);
      expect(result.current.isProfileComplete).toBe(false);
    });

    it("proteinTarget is null when protein_grams is missing", async () => {
      tableResponses["assessment_results"] = { data: { id: "a1" }, error: null };
      tableResponses["calculator_results"] = {
        data: { id: "c1" /* no protein_grams */ },
        error: null,
      };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.proteinTarget).toBeNull();
    });

    it("proteinTarget rounds correctly", async () => {
      tableResponses["assessment_results"] = { data: { id: "a1" }, error: null };
      tableResponses["calculator_results"] = {
        data: { id: "c1", protein_grams: 99.4 },
        error: null,
      };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.proteinTarget).toBe(99); // Math.round(99.4)
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe("error handling", () => {
    it("sets isLoading=false on general error without crashing", async () => {
      // Make the from() chain throw
      mockFrom.mockImplementationOnce(() => {
        throw new Error("DB down");
      });
      mockAuthReturn = {
        userId: "err-user",
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      };
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // refetch
  // -----------------------------------------------------------------------

  describe("refetch", () => {
    it("exposes a refetch function that re-runs completion check", async () => {
      mockAuthReturn = {
        userId: "refetch-user",
        profile: null,
        isLoading: false,
        authError: null,
        signOut: jest.fn(),
      };
      tableResponses["assessment_results"] = { data: null, error: null };
      tableResponses["calculator_results"] = { data: null, error: null };

      const { result } = renderHook(() => useProfileCompletion());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasAssessment).toBe(false);

      // Now update responses and refetch
      tableResponses["assessment_results"] = { data: { id: "a1" }, error: null };
      tableResponses["calculator_results"] = {
        data: { id: "c1", protein_grams: 200 },
        error: null,
      };

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => expect(result.current.hasAssessment).toBe(true));
      expect(result.current.isProfileComplete).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// saveAssessmentResults
// ---------------------------------------------------------------------------

describe("saveAssessmentResults", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tableResponses = {};
    restoreMockFrom();
  });

  const userId = "save-user-1";
  const scores = {
    sleep: 8,
    body: 7,
    nutrition: 6,
    mental: 9,
    stress: 5,
    support: 7,
    hydration: 8,
  };

  it("inserts assessment when no existing record", async () => {
    // maybeSingle returns null => insert path
    tableResponses["assessment_results"] = { data: null, error: null };

    const result = await saveAssessmentResults(userId, scores, "visitor-1");
    expect(result.success).toBe(true);

    // from("assessment_results") called for both check and insert
    expect(mockFrom).toHaveBeenCalledWith("assessment_results");
  });

  it("updates assessment when existing record found", async () => {
    tableResponses["assessment_results"] = { data: { id: "existing-1" }, error: null };

    const result = await saveAssessmentResults(userId, scores, "visitor-1");
    expect(result.success).toBe(true);
  });

  it("returns error when Supabase returns an error", async () => {
    // Make the chain resolve with an error on the insert/update step
    const errorResponse = {
      data: null,
      error: { message: "RLS denied", details: null, hint: null, code: "42501" },
    };

    // First call: maybeSingle (check existing) returns null
    // Second call: insert returns error
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Check existing
        return createChainable({ data: null, error: null });
      }
      // Insert — return error
      const chain = createChainable(errorResponse);
      chain.insert = jest.fn().mockResolvedValue(errorResponse);
      return chain;
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await saveAssessmentResults(userId, scores, "visitor-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("RLS denied");
    consoleSpy.mockRestore();
  });

  it("returns error on unexpected exception", async () => {
    mockFrom.mockImplementationOnce(() => {
      throw new Error("Network fail");
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await saveAssessmentResults(userId, scores, "visitor-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Network fail");
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// saveCalculatorResults
// ---------------------------------------------------------------------------

describe("saveCalculatorResults", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tableResponses = {};
    restoreMockFrom();
  });

  const userId = "save-user-2";
  const data = {
    gender: "male",
    age: 30,
    weightKg: 80,
    heightCm: 180,
    bodyFatPercent: 15,
    activityLevel: "moderately_active",
    goal: "fat_loss",
    goalWeightKg: 75,
    medicalConditions: ["none"],
  };
  const results = {
    bmr: 1780,
    tdee: 2759,
    targetCalories: 2209,
    proteinGrams: 160,
    carbsGrams: 200,
    fatsGrams: 70,
    metabolicImpactPercent: 5,
  };

  it("inserts calculator results when no existing record", async () => {
    tableResponses["calculator_results"] = { data: null, error: null };

    const result = await saveCalculatorResults(userId, data, results);
    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("calculator_results");
  });

  it("updates calculator results when existing record found", async () => {
    tableResponses["calculator_results"] = { data: { id: "existing-calc-1" }, error: null };

    const result = await saveCalculatorResults(userId, data, results);
    expect(result.success).toBe(true);
  });

  it("handles optional fields gracefully", async () => {
    tableResponses["calculator_results"] = { data: null, error: null };

    const minData = {
      gender: "female",
      age: 25,
      weightKg: 60,
      heightCm: 165,
      activityLevel: "sedentary",
      goal: "maintain",
    };
    const minResults = {
      bmr: 1345,
      tdee: 1614,
      targetCalories: 1614,
      proteinGrams: 108,
      carbsGrams: 180,
      fatsGrams: 50,
    };

    const result = await saveCalculatorResults(userId, minData, minResults);
    expect(result.success).toBe(true);
  });

  it("returns error when Supabase returns an error", async () => {
    const errorResponse = {
      data: null,
      error: { message: "Insert failed", details: null, hint: null, code: "23505" },
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createChainable({ data: null, error: null });
      }
      const chain = createChainable(errorResponse);
      chain.insert = jest.fn().mockResolvedValue(errorResponse);
      return chain;
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await saveCalculatorResults(userId, data, results);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Insert failed");
    consoleSpy.mockRestore();
  });

  it("returns generic error on unexpected exception", async () => {
    mockFrom.mockImplementationOnce(() => {
      throw new Error("Connection reset");
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await saveCalculatorResults(userId, data, results);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to save calculator results");
    consoleSpy.mockRestore();
  });
});
