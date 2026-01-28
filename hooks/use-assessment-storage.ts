"use client";

import { useCallback, useMemo } from "react";
import { AssessmentScores } from "./use-assessment";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { saveAssessmentResults, saveCalculatorResults } from "./use-profile-completion";
import { generateUUID } from "@/lib/utils";

/**
 * LocalStorage keys for assessment and calculator history
 */
export const STORAGE_KEY_ASSESSMENT = "metabolikal_assessment_history";
export const STORAGE_KEY_CALCULATOR = "metabolikal_calculator_history";

/**
 * Stored assessment data structure for localStorage
 */
export interface StoredAssessment {
  date: string; // ISO date string
  scores: AssessmentScores;
  totalScore: number; // 0-100 (calculated)
  lifestyleScore: number; // 0-70 (sum of 7 categories)
}

/**
 * Stored calculator data structure for localStorage
 */
export interface StoredCalculator {
  date: string; // ISO date string
  inputs: {
    gender: "male" | "female";
    age: number;
    weight: number;
    height: number;
    activityLevel: string;
    goal: string;
  };
  results: {
    bmr: number;
    tdee: number;
    targetCalories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

/**
 * Check if localStorage is available (handles SSR and disabled localStorage)
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely parse JSON from localStorage
 * Returns null if data is missing, corrupted, or invalid
 */
function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Hook for managing assessment and calculator history in localStorage.
 * Provides functions to save, load, and clear stored data.
 *
 * For anonymous users, only the most recent assessment/calculator is stored.
 * Data persists across browser sessions until manually cleared.
 */
export function useAssessmentStorage() {
  const storageAvailable = useMemo(() => isLocalStorageAvailable(), []);

  /**
   * Get the previous assessment from localStorage
   */
  const getPreviousAssessment = useCallback((): StoredAssessment | null => {
    if (!storageAvailable) return null;
    const data = window.localStorage.getItem(STORAGE_KEY_ASSESSMENT);
    return safeJsonParse<StoredAssessment>(data);
  }, [storageAvailable]);

  /**
   * Save assessment to localStorage (overwrites previous)
   */
  const saveAssessment = useCallback(
    (scores: AssessmentScores, lifestyleScore: number): void => {
      if (!storageAvailable) return;

      const assessment: StoredAssessment = {
        date: new Date().toISOString(),
        scores,
        totalScore: lifestyleScore, // For anonymous users, lifestyle score is the total
        lifestyleScore,
      };

      try {
        window.localStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(assessment));
      } catch {
        // Storage full or other error - fail silently
        console.warn("Failed to save assessment to localStorage");
      }
    },
    [storageAvailable]
  );

  /**
   * Save assessment with health score (after calculator completion)
   */
  const saveAssessmentWithHealthScore = useCallback(
    (scores: AssessmentScores, lifestyleScore: number, healthScore: number): void => {
      if (!storageAvailable) return;

      const assessment: StoredAssessment = {
        date: new Date().toISOString(),
        scores,
        totalScore: healthScore,
        lifestyleScore,
      };

      try {
        window.localStorage.setItem(STORAGE_KEY_ASSESSMENT, JSON.stringify(assessment));
      } catch {
        console.warn("Failed to save assessment to localStorage");
      }
    },
    [storageAvailable]
  );

  /**
   * Get the previous calculator from localStorage
   */
  const getPreviousCalculator = useCallback((): StoredCalculator | null => {
    if (!storageAvailable) return null;
    const data = window.localStorage.getItem(STORAGE_KEY_CALCULATOR);
    return safeJsonParse<StoredCalculator>(data);
  }, [storageAvailable]);

  /**
   * Save calculator to localStorage (overwrites previous)
   */
  const saveCalculator = useCallback(
    (inputs: StoredCalculator["inputs"], results: StoredCalculator["results"]): void => {
      if (!storageAvailable) return;

      const calculator: StoredCalculator = {
        date: new Date().toISOString(),
        inputs,
        results,
      };

      try {
        window.localStorage.setItem(STORAGE_KEY_CALCULATOR, JSON.stringify(calculator));
      } catch {
        console.warn("Failed to save calculator to localStorage");
      }
    },
    [storageAvailable]
  );

  /**
   * Clear all assessment history from localStorage
   */
  const clearAssessment = useCallback((): void => {
    if (!storageAvailable) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY_ASSESSMENT);
    } catch {
      // Fail silently
    }
  }, [storageAvailable]);

  /**
   * Clear all calculator history from localStorage
   */
  const clearCalculator = useCallback((): void => {
    if (!storageAvailable) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY_CALCULATOR);
    } catch {
      // Fail silently
    }
  }, [storageAvailable]);

  /**
   * Clear all stored data (assessment and calculator)
   */
  const clearAll = useCallback((): void => {
    clearAssessment();
    clearCalculator();
  }, [clearAssessment, clearCalculator]);

  /**
   * Check if a previous assessment exists
   */
  const hasPreviousAssessment = useCallback((): boolean => {
    return getPreviousAssessment() !== null;
  }, [getPreviousAssessment]);

  /**
   * Check if a previous calculator exists
   */
  const hasPreviousCalculator = useCallback((): boolean => {
    return getPreviousCalculator() !== null;
  }, [getPreviousCalculator]);

  return {
    storageAvailable,
    // Assessment
    getPreviousAssessment,
    saveAssessment,
    saveAssessmentWithHealthScore,
    clearAssessment,
    hasPreviousAssessment,
    // Calculator
    getPreviousCalculator,
    saveCalculator,
    clearCalculator,
    hasPreviousCalculator,
    // Combined
    clearAll,
  };
}

/**
 * Utility function to format date as MM/DD/YYYY for display
 */
export function formatAssessmentDate(isoDate: string): string {
  const date = new Date(isoDate);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Calculate score comparison between new and previous scores
 */
export function calculateScoreComparison(
  newScore: number,
  previousScore: number
): {
  status: "improved" | "same" | "decreased";
  delta: number;
} {
  const delta = newScore - previousScore;

  if (delta > 0) {
    return { status: "improved", delta };
  } else if (delta < 0) {
    return { status: "decreased", delta: Math.abs(delta) };
  } else {
    return { status: "same", delta: 0 };
  }
}

/**
 * Migrate assessment and calculator data from localStorage to database after login/signup.
 * Called after successful authentication to persist anonymous user data.
 *
 * @param userId - The authenticated user's ID
 * @returns Promise with success status and migration details
 */
export async function migrateLocalStorageToDatabase(userId: string): Promise<{
  success: boolean;
  assessmentMigrated: boolean;
  calculatorMigrated: boolean;
  error?: string;
}> {
  // Check if localStorage is available
  if (typeof window === "undefined") {
    return { success: true, assessmentMigrated: false, calculatorMigrated: false };
  }

  const supabase = createBrowserSupabaseClient();
  let assessmentMigrated = false;
  let calculatorMigrated = false;
  const errors: string[] = [];

  // Generate or retrieve visitor ID
  const visitorId = window.localStorage.getItem("metabolikal_visitor_id") || generateUUID();

  // =====================
  // MIGRATE ASSESSMENT
  // =====================
  try {
    const storedAssessment = window.localStorage.getItem(STORAGE_KEY_ASSESSMENT);

    if (storedAssessment) {
      let assessment: StoredAssessment;
      try {
        assessment = JSON.parse(storedAssessment) as StoredAssessment;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY_ASSESSMENT);
        errors.push("Corrupted assessment data cleared");
        assessment = null as unknown as StoredAssessment;
      }

      if (assessment?.scores && assessment?.date) {
        // Check if user already has assessment in database
        const { data: existingAssessment } = await supabase
          .from("assessment_results")
          .select("id, assessed_at")
          .eq("user_id", userId)
          .maybeSingle();

        // Only migrate if no existing data or localStorage is newer
        let shouldMigrate = !existingAssessment;
        if (existingAssessment) {
          const localDate = new Date(assessment.date);
          const dbDate = new Date(existingAssessment.assessed_at);
          shouldMigrate = localDate > dbDate;
        }

        if (shouldMigrate) {
          const result = await saveAssessmentResults(userId, assessment.scores, visitorId);
          if (result.success) {
            assessmentMigrated = true;
            window.localStorage.removeItem(STORAGE_KEY_ASSESSMENT);
          } else {
            errors.push(`Assessment migration failed: ${result.error}`);
          }
        } else {
          // Database has newer data, clear localStorage
          window.localStorage.removeItem(STORAGE_KEY_ASSESSMENT);
        }
      }
    }
  } catch (error) {
    errors.push(`Assessment error: ${error instanceof Error ? error.message : String(error)}`);
  }

  // =====================
  // MIGRATE CALCULATOR
  // =====================
  try {
    const storedCalculator = window.localStorage.getItem(STORAGE_KEY_CALCULATOR);

    if (storedCalculator) {
      let calculator: StoredCalculator;
      try {
        calculator = JSON.parse(storedCalculator) as StoredCalculator;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY_CALCULATOR);
        errors.push("Corrupted calculator data cleared");
        calculator = null as unknown as StoredCalculator;
      }

      if (calculator?.inputs && calculator?.results && calculator?.date) {
        // Check if user already has calculator in database
        const { data: existingCalculator } = await supabase
          .from("calculator_results")
          .select("id, updated_at")
          .eq("user_id", userId)
          .maybeSingle();

        // Only migrate if no existing data or localStorage is newer
        let shouldMigrate = !existingCalculator;
        if (existingCalculator) {
          const localDate = new Date(calculator.date);
          const dbDate = new Date(existingCalculator.updated_at);
          shouldMigrate = localDate > dbDate;
        }

        if (shouldMigrate) {
          const result = await saveCalculatorResults(
            userId,
            {
              gender: calculator.inputs.gender,
              age: calculator.inputs.age,
              weightKg: calculator.inputs.weight,
              heightCm: calculator.inputs.height,
              activityLevel: calculator.inputs.activityLevel,
              goal: calculator.inputs.goal,
            },
            {
              bmr: calculator.results.bmr,
              tdee: calculator.results.tdee,
              targetCalories: calculator.results.targetCalories,
              proteinGrams: calculator.results.protein,
              carbsGrams: calculator.results.carbs,
              fatsGrams: calculator.results.fats,
            }
          );

          if (result.success) {
            calculatorMigrated = true;
            window.localStorage.removeItem(STORAGE_KEY_CALCULATOR);
          } else {
            errors.push(`Calculator migration failed: ${result.error}`);
          }
        } else {
          // Database has newer data, clear localStorage
          window.localStorage.removeItem(STORAGE_KEY_CALCULATOR);
        }
      }
    }
  } catch (error) {
    errors.push(`Calculator error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    success: errors.length === 0,
    assessmentMigrated,
    calculatorMigrated,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
}
