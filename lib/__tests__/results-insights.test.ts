import {
  getHealthScoreTier,
  getActionPlanStrategy,
  generatePriorityRecommendations,
  calculateLifestyleBoost,
  calculatePhysicalMetricsScore,
} from "../results-insights";
import { AssessmentScores } from "@/hooks/use-assessment";

describe("results-insights", () => {
  describe("getHealthScoreTier", () => {
    it("returns Elite tier for score >= 86", () => {
      expect(getHealthScoreTier(86).name).toBe("Elite Metabolic Health");
      expect(getHealthScoreTier(100).name).toBe("Elite Metabolic Health");
    });

    it("returns Good tier for score 71-85", () => {
      expect(getHealthScoreTier(71).name).toBe("Good Metabolic Health");
      expect(getHealthScoreTier(85).name).toBe("Good Metabolic Health");
    });

    it("returns Moderate tier for score 51-70", () => {
      expect(getHealthScoreTier(51).name).toBe("Moderate Metabolic Health");
      expect(getHealthScoreTier(70).name).toBe("Moderate Metabolic Health");
    });

    it("returns Needs Attention tier for score <= 50", () => {
      expect(getHealthScoreTier(50).name).toBe("Needs Attention");
      expect(getHealthScoreTier(0).name).toBe("Needs Attention");
    });

    it("includes description for each tier", () => {
      expect(getHealthScoreTier(90).description).toBe(
        "Outstanding foundation with peak performance potential"
      );
      expect(getHealthScoreTier(75).description).toBe(
        "Solid foundation with room for optimization"
      );
    });
  });

  describe("getActionPlanStrategy", () => {
    it("returns Fat Loss Strategy for fat_loss goal", () => {
      const strategy = getActionPlanStrategy("fat_loss", 2000);
      expect(strategy.name).toBe("Fat Loss Strategy");
      expect(strategy.target).toBe("2,000 cal/day");
      expect(strategy.goal).toContain("fat loss");
    });

    it("returns Maintenance Strategy for maintain goal", () => {
      const strategy = getActionPlanStrategy("maintain", 2500);
      expect(strategy.name).toBe("Maintenance Strategy");
      expect(strategy.target).toBe("2,500 cal/day");
    });

    it("returns Muscle Building Strategy for muscle_gain goal", () => {
      const strategy = getActionPlanStrategy("muscle_gain", 3000);
      expect(strategy.name).toBe("Muscle Building Strategy");
      expect(strategy.target).toBe("3,000 cal/day");
      expect(strategy.goal).toContain("muscle");
    });

    it("includes all required fields", () => {
      const strategy = getActionPlanStrategy("fat_loss", 2000);
      expect(strategy).toHaveProperty("name");
      expect(strategy).toHaveProperty("target");
      expect(strategy).toHaveProperty("focus");
      expect(strategy).toHaveProperty("training");
      expect(strategy).toHaveProperty("goal");
    });
  });

  describe("generatePriorityRecommendations", () => {
    const testScores: AssessmentScores = {
      sleep: 3, // Lowest
      body: 5,
      nutrition: 7,
      mental: 2, // Second lowest
      stress: 8,
      support: 4, // Third lowest
      hydration: 9,
    };

    it("returns 3 recommendations by default", () => {
      const recommendations = generatePriorityRecommendations(testScores);
      expect(recommendations).toHaveLength(3);
    });

    it("prioritizes lowest scoring categories", () => {
      const recommendations = generatePriorityRecommendations(testScores);
      // mental (2), sleep (3), support (4) should be the top 3
      expect(recommendations[0].categoryId).toBe("mental");
      expect(recommendations[1].categoryId).toBe("sleep");
      expect(recommendations[2].categoryId).toBe("support");
    });

    it("assigns correct priority numbers", () => {
      const recommendations = generatePriorityRecommendations(testScores);
      expect(recommendations[0].priority).toBe(1);
      expect(recommendations[1].priority).toBe(2);
      expect(recommendations[2].priority).toBe(3);
    });

    it("includes all required fields for each recommendation", () => {
      const recommendations = generatePriorityRecommendations(testScores);
      recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("priority");
        expect(rec).toHaveProperty("categoryId");
        expect(rec).toHaveProperty("categoryLabel");
        expect(rec).toHaveProperty("icon");
        expect(rec).toHaveProperty("description");
        expect(rec).toHaveProperty("impact");
        expect(rec).toHaveProperty("timeline");
      });
    });

    it("respects custom count parameter", () => {
      const recommendations = generatePriorityRecommendations(testScores, 2);
      expect(recommendations).toHaveLength(2);
    });

    it("uses low description for scores <= 4", () => {
      const recommendations = generatePriorityRecommendations(testScores);
      // mental has score 2, should use low description
      const mentalRec = recommendations.find((r) => r.categoryId === "mental");
      expect(mentalRec?.description).toContain("fog");
    });

    it("uses medium description for scores > 4", () => {
      const scoresWithMedium: AssessmentScores = {
        sleep: 5, // Medium (lowest in this set)
        body: 6,
        nutrition: 7,
        mental: 8,
        stress: 8,
        support: 9,
        hydration: 10,
      };
      const recommendations = generatePriorityRecommendations(scoresWithMedium);
      const sleepRec = recommendations.find((r) => r.categoryId === "sleep");
      expect(sleepRec?.description).toContain("Moderate");
    });
  });

  describe("calculateLifestyleBoost", () => {
    it("calculates correct calorie difference", () => {
      const boost = calculateLifestyleBoost(1500, 2500);
      expect(boost.calories).toBe(1000);
    });

    it("calculates correct percentage boost", () => {
      const boost = calculateLifestyleBoost(1500, 2250);
      expect(boost.percentage).toBe(50); // 750/1500 = 0.5 = 50%
    });

    it("handles zero boost", () => {
      const boost = calculateLifestyleBoost(2000, 2000);
      expect(boost.calories).toBe(0);
      expect(boost.percentage).toBe(0);
    });
  });

  describe("calculatePhysicalMetricsScore", () => {
    it("returns 100 for 0% metabolic impact", () => {
      expect(calculatePhysicalMetricsScore(0)).toBe(100);
    });

    it("returns 0 for 30% metabolic impact", () => {
      expect(calculatePhysicalMetricsScore(30)).toBe(0);
    });

    it("returns intermediate values for partial impact", () => {
      expect(calculatePhysicalMetricsScore(15)).toBe(50);
      expect(calculatePhysicalMetricsScore(10)).toBe(67);
    });

    it("handles values above 30%", () => {
      // Should cap at 0 for values > 30
      expect(calculatePhysicalMetricsScore(40)).toBeLessThanOrEqual(0);
    });
  });
});
