"use client";

import { useState, useCallback, useMemo } from "react";

/**
 * Assessment slider categories with their metadata.
 * Each slider measures a different aspect of lifestyle health.
 */
export const ASSESSMENT_CATEGORIES = [
  {
    id: "sleep",
    label: "Sleep & Recovery",
    icon: "Bed",
    lowLabel: "Tossing, turning, waking tired",
    highLabel: "8h deep sleep, wake refreshed",
  },
  {
    id: "body",
    label: "Body Confidence",
    icon: "Heart",
    lowLabel: "Avoid mirrors, hide body",
    highLabel: "Command presence",
  },
  {
    id: "nutrition",
    label: "Nutrition Strategy Mastery",
    icon: "Utensils",
    lowLabel: "Stress eating, guilt cycles",
    highLabel: "Fuel for performance",
  },
  {
    id: "mental",
    label: "Mental Clarity",
    icon: "Brain",
    lowLabel: "Foggy, slow decisions",
    highLabel: "Laser-sharp execution",
  },
  {
    id: "stress",
    label: "Stress Management",
    icon: "ShieldHeart",
    lowLabel: "Reactive, overwhelmed",
    highLabel: "Calm under pressure",
  },
  {
    id: "support",
    label: "Support System",
    icon: "Users",
    lowLabel: "Isolated, going solo",
    highLabel: "Elite peer support",
  },
  {
    id: "hydration",
    label: "Hydration",
    icon: "Droplet",
    lowLabel: "Barely drinking, dehydrated",
    highLabel: "Optimal hydration (3-4L/day)",
  },
] as const;

export type AssessmentCategoryId = (typeof ASSESSMENT_CATEGORIES)[number]["id"];

export interface AssessmentScores {
  sleep: number;
  body: number;
  nutrition: number;
  mental: number;
  stress: number;
  support: number;
  hydration: number;
}

const DEFAULT_SCORES: AssessmentScores = {
  sleep: 5,
  body: 5,
  nutrition: 5,
  mental: 5,
  stress: 5,
  support: 5,
  hydration: 5,
};

/**
 * Hook to manage lifestyle assessment state and calculations.
 * Handles slider values, lifestyle score computation, and state persistence.
 */
export function useAssessment() {
  const [scores, setScores] = useState<AssessmentScores>(DEFAULT_SCORES);

  /**
   * Update a single assessment score.
   * @param category - The category ID to update
   * @param value - New value (0-10)
   */
  const updateScore = useCallback((category: AssessmentCategoryId, value: number) => {
    setScores((prev) => ({
      ...prev,
      [category]: Math.min(10, Math.max(0, value)),
    }));
  }, []);

  /**
   * Reset all scores to default (5).
   */
  const resetScores = useCallback(() => {
    setScores(DEFAULT_SCORES);
  }, []);

  /**
   * Calculate the lifestyle score as a percentage (0-100).
   * Based on the average of all 7 sliders multiplied by 10.
   */
  const lifestyleScore = useMemo(() => {
    const values = Object.values(scores);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.round(average * 10);
  }, [scores]);

  return {
    scores,
    updateScore,
    resetScores,
    lifestyleScore,
  };
}
