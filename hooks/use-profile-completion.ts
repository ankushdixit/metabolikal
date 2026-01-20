"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { User } from "@supabase/supabase-js";
import { CalculatorResult } from "@/lib/database.types";

interface ProfileCompletionState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  hasAssessment: boolean;
  hasCalculator: boolean;
  isProfileComplete: boolean;
  calculatorResults: CalculatorResult | null;
  proteinTarget: number | null;
}

interface UseProfileCompletionReturn extends ProfileCompletionState {
  refetch: () => Promise<void>;
}

/**
 * Hook to check if a user has completed their profile for the 30-day challenge.
 * A complete profile requires:
 * 1. Being authenticated
 * 2. Having completed the lifestyle assessment
 * 3. Having completed the metabolic calculator
 */
export function useProfileCompletion(): UseProfileCompletionReturn {
  const [state, setState] = useState<ProfileCompletionState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    hasAssessment: false,
    hasCalculator: false,
    isProfileComplete: false,
    calculatorResults: null,
    proteinTarget: null,
  });

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const checkProfileCompletion = useCallback(async () => {
    if (!supabase) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Check authentication status
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          hasAssessment: false,
          hasCalculator: false,
          isProfileComplete: false,
          calculatorResults: null,
          proteinTarget: null,
        });
        return;
      }

      // Check for assessment results
      const { data: assessmentData } = await supabase
        .from("assessment_results")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      const hasAssessment = !!assessmentData;

      // Check for calculator results
      const { data: calculatorData } = await supabase
        .from("calculator_results")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const hasCalculator = !!calculatorData;

      // Get protein target from calculator results
      const proteinTarget = calculatorData?.protein_grams
        ? Math.round(Number(calculatorData.protein_grams))
        : null;

      setState({
        isLoading: false,
        isAuthenticated: true,
        user,
        hasAssessment,
        hasCalculator,
        isProfileComplete: hasAssessment && hasCalculator,
        calculatorResults: calculatorData as CalculatorResult | null,
        proteinTarget,
      });
    } catch (error) {
      console.error("Error checking profile completion:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [supabase]);

  // Check on mount and when auth state changes
  useEffect(() => {
    if (!supabase) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    checkProfileCompletion();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkProfileCompletion();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkProfileCompletion, supabase]);

  return {
    ...state,
    refetch: checkProfileCompletion,
  };
}

/**
 * Saves assessment results to the database for an authenticated user.
 * Updates existing results or creates new ones.
 */
export async function saveAssessmentResults(
  userId: string,
  scores: {
    sleep: number;
    body: number;
    nutrition: number;
    mental: number;
    stress: number;
    support: number;
    hydration: number;
  },
  visitorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserSupabaseClient();

  try {
    const { error } = await supabase.from("assessment_results").upsert(
      {
        visitor_id: visitorId,
        user_id: userId,
        sleep_score: scores.sleep,
        body_score: scores.body,
        nutrition_score: scores.nutrition,
        mental_score: scores.mental,
        stress_score: scores.stress,
        support_score: scores.support,
        hydration_score: scores.hydration,
        assessed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.error("Error saving assessment results:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving assessment results:", error);
    return { success: false, error: "Failed to save assessment results" };
  }
}

/**
 * Saves calculator results to the database for an authenticated user.
 * Updates existing results or creates new ones.
 */
export async function saveCalculatorResults(
  userId: string,
  data: {
    gender: string;
    age: number;
    weightKg: number;
    heightCm: number;
    bodyFatPercent?: number;
    activityLevel: string;
    goal: string;
    goalWeightKg?: number;
    medicalConditions?: string[];
  },
  results: {
    bmr: number;
    tdee: number;
    targetCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
    metabolicImpactPercent?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserSupabaseClient();

  try {
    const { error } = await supabase.from("calculator_results").upsert(
      {
        user_id: userId,
        gender: data.gender,
        age: data.age,
        weight_kg: data.weightKg,
        height_cm: data.heightCm,
        body_fat_percent: data.bodyFatPercent || null,
        activity_level: data.activityLevel,
        goal: data.goal,
        goal_weight_kg: data.goalWeightKg || null,
        medical_conditions: data.medicalConditions || null,
        bmr: results.bmr,
        tdee: results.tdee,
        target_calories: results.targetCalories,
        protein_grams: results.proteinGrams,
        carbs_grams: results.carbsGrams,
        fats_grams: results.fatsGrams,
        metabolic_impact_percent: results.metabolicImpactPercent || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.error("Error saving calculator results:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving calculator results:", error);
    return { success: false, error: "Failed to save calculator results" };
  }
}
