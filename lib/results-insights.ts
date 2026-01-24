/**
 * Utility functions for generating personalized insights and recommendations
 * for the results modal based on assessment and calculator data.
 */

import {
  AssessmentScores,
  ASSESSMENT_CATEGORIES,
  AssessmentCategoryId,
} from "@/hooks/use-assessment";
import { Goal } from "@/hooks/use-calculator";

/**
 * Health score status tier configuration
 */
export interface HealthScoreTier {
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
}

export const HEALTH_SCORE_TIERS: HealthScoreTier[] = [
  {
    name: "Elite Metabolic Health",
    description: "Outstanding foundation with peak performance potential",
    minScore: 86,
    maxScore: 100,
  },
  {
    name: "Good Metabolic Health",
    description: "Solid foundation with room for optimization",
    minScore: 71,
    maxScore: 85,
  },
  {
    name: "Moderate Metabolic Health",
    description: "Functional baseline with clear improvement opportunities",
    minScore: 51,
    maxScore: 70,
  },
  {
    name: "Needs Attention",
    description: "Significant optimization potential to unlock your metabolism",
    minScore: 0,
    maxScore: 50,
  },
];

/**
 * Get the health score tier based on score value
 */
export function getHealthScoreTier(score: number): HealthScoreTier {
  return (
    HEALTH_SCORE_TIERS.find((tier) => score >= tier.minScore && score <= tier.maxScore) ||
    HEALTH_SCORE_TIERS[HEALTH_SCORE_TIERS.length - 1]
  );
}

/**
 * Action plan strategy configuration based on goal
 */
export interface ActionPlanStrategy {
  name: string;
  target: string;
  focus: string;
  training: string;
  goal: string;
}

export function getActionPlanStrategy(goal: Goal, targetCalories: number): ActionPlanStrategy {
  const strategies: Record<Goal, ActionPlanStrategy> = {
    fat_loss: {
      name: "Fat Loss Strategy",
      target: `${targetCalories.toLocaleString()} cal/day`,
      focus: "Metabolic optimization and body recomposition",
      training: "4-5x resistance training with strategic cardio",
      goal: "Sustainable fat loss while preserving muscle mass",
    },
    maintain: {
      name: "Maintenance Strategy",
      target: `${targetCalories.toLocaleString()} cal/day`,
      focus: "Body recomposition and performance",
      training: "3-4x balanced training per week",
      goal: "Maintain weight while improving composition",
    },
    muscle_gain: {
      name: "Muscle Building Strategy",
      target: `${targetCalories.toLocaleString()} cal/day`,
      focus: "Progressive overload and recovery optimization",
      training: "4-5x hypertrophy-focused resistance training",
      goal: "Maximize lean muscle growth with minimal fat gain",
    },
  };

  return strategies[goal];
}

/**
 * Priority recommendation configuration
 */
export interface PriorityRecommendation {
  priority: number;
  categoryId: AssessmentCategoryId;
  categoryLabel: string;
  icon: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  timeline: string;
}

/**
 * Category-specific recommendations based on score level
 */
const CATEGORY_RECOMMENDATIONS: Record<
  AssessmentCategoryId,
  {
    icon: string;
    lowDescription: string;
    mediumDescription: string;
    impact: "High" | "Medium" | "Low";
    timeline: string;
  }
> = {
  sleep: {
    icon: "Moon",
    lowDescription:
      "Poor sleep is significantly impacting your metabolic function. Prioritize sleep hygiene for rapid improvements.",
    mediumDescription:
      "Moderate rest patterns affect metabolic efficiency. Focus on gradual improvements.",
    impact: "High",
    timeline: "2-4 weeks",
  },
  body: {
    icon: "Heart",
    lowDescription:
      "Building body confidence is foundational. The METABOLIKAL system will help elevate your self-image.",
    mediumDescription:
      "Good foundation in place. The METABOLIKAL system will help elevate your confidence.",
    impact: "Medium",
    timeline: "8-16 weeks",
  },
  nutrition: {
    icon: "Utensils",
    lowDescription:
      "Nutritional inconsistency is limiting your results. Strategic nutrition planning is critical.",
    mediumDescription: "Good nutritional awareness. Focus on consistency and strategic refinement.",
    impact: "High",
    timeline: "2-4 weeks",
  },
  mental: {
    icon: "Brain",
    lowDescription:
      "Mental fog is reducing your performance potential. Cognitive optimization can unlock major gains.",
    mediumDescription:
      "Decent mental clarity. Fine-tuning focus strategies will enhance performance.",
    impact: "High",
    timeline: "4-8 weeks",
  },
  stress: {
    icon: "Shield",
    lowDescription:
      "Chronic stress is sabotaging your metabolism. Stress management is a top priority.",
    mediumDescription:
      "Managing stress adequately. Advanced techniques will optimize your cortisol levels.",
    impact: "High",
    timeline: "4-8 weeks",
  },
  support: {
    icon: "Users",
    lowDescription:
      "Lack of support system reduces accountability. Building your network is essential for long-term success.",
    mediumDescription: "Some support in place. Strengthening your network will amplify results.",
    impact: "Medium",
    timeline: "4-12 weeks",
  },
  hydration: {
    icon: "Droplet",
    lowDescription:
      "Dehydration is impacting metabolic function and energy. Prioritize hydration immediately.",
    mediumDescription:
      "Hydration could be improved. Consistent intake will boost metabolic efficiency.",
    impact: "Medium",
    timeline: "1-2 weeks",
  },
};

/**
 * Generate priority recommendations based on lowest scoring categories
 * @param scores - The assessment scores object
 * @param count - Number of recommendations to generate (default 3)
 */
export function generatePriorityRecommendations(
  scores: AssessmentScores,
  count: number = 3
): PriorityRecommendation[] {
  // Convert scores to array with category info and sort by score (lowest first)
  const sortedCategories = ASSESSMENT_CATEGORIES.map((category) => ({
    categoryId: category.id,
    categoryLabel: category.label,
    score: scores[category.id],
  })).sort((a, b) => a.score - b.score);

  // Take the lowest scoring categories
  const lowestCategories = sortedCategories.slice(0, count);

  // Generate recommendations
  return lowestCategories.map((category, index) => {
    const config = CATEGORY_RECOMMENDATIONS[category.categoryId];
    const isLow = category.score <= 4;

    return {
      priority: index + 1,
      categoryId: category.categoryId,
      categoryLabel: category.categoryLabel,
      icon: config.icon,
      description: isLow ? config.lowDescription : config.mediumDescription,
      impact: config.impact,
      timeline: config.timeline,
    };
  });
}

/**
 * Calculate the lifestyle boost (difference between TDEE and BMR)
 */
export function calculateLifestyleBoost(
  bmr: number,
  tdee: number
): { calories: number; percentage: number } {
  const calories = tdee - bmr;
  const percentage = Math.round((calories / bmr) * 100);
  return { calories, percentage };
}

/**
 * Calculate physical metrics score (0-100)
 * Based on the metabolic component of the health score calculation
 * (inverse of metabolic impact, normalized)
 */
export function calculatePhysicalMetricsScore(metabolicImpactPercent: number): number {
  // 0% impact = 100, 30% impact = 0
  return Math.round(((30 - metabolicImpactPercent) / 30) * 100);
}
