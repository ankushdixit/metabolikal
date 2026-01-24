"use client";

import { useCallback, useMemo } from "react";
import { AssessmentScores } from "./use-assessment";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { saveAssessmentResults } from "./use-profile-completion";

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
 * Migrate assessment data from localStorage to database after login/signup.
 * Called after successful authentication to persist anonymous user data.
 *
 * @param userId - The authenticated user's ID
 * @returns Promise with success status and any errors
 */
export async function migrateLocalStorageToDatabase(
  userId: string
): Promise<{ success: boolean; migrated: boolean; error?: string }> {
  // Check if localStorage is available
  if (typeof window === "undefined") {
    return { success: true, migrated: false };
  }

  try {
    // Check for stored assessment data
    const storedData = window.localStorage.getItem(STORAGE_KEY_ASSESSMENT);

    if (!storedData) {
      // No data to migrate
      return { success: true, migrated: false };
    }

    // Parse the stored assessment
    let assessment: StoredAssessment;
    try {
      assessment = JSON.parse(storedData) as StoredAssessment;
    } catch {
      // Corrupted data - clear it and return
      window.localStorage.removeItem(STORAGE_KEY_ASSESSMENT);
      return { success: true, migrated: false, error: "Corrupted localStorage data cleared" };
    }

    // Validate assessment data has required fields
    if (!assessment.scores || !assessment.date) {
      window.localStorage.removeItem(STORAGE_KEY_ASSESSMENT);
      return { success: true, migrated: false, error: "Invalid localStorage data cleared" };
    }

    // Check if user already has assessment data in database
    const supabase = createBrowserSupabaseClient();
    const { data: existingAssessment } = await supabase
      .from("assessment_results")
      .select("id, assessed_at")
      .eq("user_id", userId)
      .maybeSingle();

    // If user already has database data, compare dates
    if (existingAssessment) {
      const localDate = new Date(assessment.date);
      const dbDate = new Date(existingAssessment.assessed_at);

      // Only migrate if localStorage data is newer
      if (localDate <= dbDate) {
        // Database has newer or same data, clear localStorage
        window.localStorage.removeItem(STORAGE_KEY_ASSESSMENT);
        return { success: true, migrated: false };
      }
    }

    // Generate or retrieve visitor ID
    const visitorId = window.localStorage.getItem("metabolikal_visitor_id") || crypto.randomUUID();

    // Migrate assessment to database
    const result = await saveAssessmentResults(userId, assessment.scores, visitorId);

    if (!result.success) {
      return { success: false, migrated: false, error: result.error };
    }

    // Clear localStorage after successful migration
    window.localStorage.removeItem(STORAGE_KEY_ASSESSMENT);

    return { success: true, migrated: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, migrated: false, error: errorMessage };
  }
}
