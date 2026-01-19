import { renderHook, act } from "@testing-library/react";
import { useAssessment, ASSESSMENT_CATEGORIES } from "../use-assessment";

describe("useAssessment", () => {
  it("initializes with default scores of 5 for all categories", () => {
    const { result } = renderHook(() => useAssessment());

    expect(result.current.scores).toEqual({
      sleep: 5,
      body: 5,
      nutrition: 5,
      mental: 5,
      stress: 5,
      support: 5,
      hydration: 5,
    });
  });

  it("updates a single score correctly", () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.updateScore("sleep", 8);
    });

    expect(result.current.scores.sleep).toBe(8);
    expect(result.current.scores.body).toBe(5); // Others unchanged
  });

  it("clamps scores to minimum of 0", () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.updateScore("sleep", -5);
    });

    expect(result.current.scores.sleep).toBe(0);
  });

  it("clamps scores to maximum of 10", () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.updateScore("sleep", 15);
    });

    expect(result.current.scores.sleep).toBe(10);
  });

  it("resets all scores to default", () => {
    const { result } = renderHook(() => useAssessment());

    // Update some scores
    act(() => {
      result.current.updateScore("sleep", 8);
      result.current.updateScore("body", 3);
      result.current.updateScore("nutrition", 10);
    });

    // Verify scores were updated
    expect(result.current.scores.sleep).toBe(8);
    expect(result.current.scores.body).toBe(3);
    expect(result.current.scores.nutrition).toBe(10);

    // Reset
    act(() => {
      result.current.resetScores();
    });

    expect(result.current.scores).toEqual({
      sleep: 5,
      body: 5,
      nutrition: 5,
      mental: 5,
      stress: 5,
      support: 5,
      hydration: 5,
    });
  });

  it("calculates lifestyle score as average of sliders × 10", () => {
    const { result } = renderHook(() => useAssessment());

    // Default scores of 5 should give 50
    expect(result.current.lifestyleScore).toBe(50);
  });

  it("calculates lifestyle score correctly for varied scores", () => {
    const { result } = renderHook(() => useAssessment());

    // Set all scores to 10
    act(() => {
      result.current.updateScore("sleep", 10);
      result.current.updateScore("body", 10);
      result.current.updateScore("nutrition", 10);
      result.current.updateScore("mental", 10);
      result.current.updateScore("stress", 10);
      result.current.updateScore("support", 10);
      result.current.updateScore("hydration", 10);
    });

    expect(result.current.lifestyleScore).toBe(100);
  });

  it("calculates lifestyle score correctly for minimum scores", () => {
    const { result } = renderHook(() => useAssessment());

    // Set all scores to 0
    act(() => {
      result.current.updateScore("sleep", 0);
      result.current.updateScore("body", 0);
      result.current.updateScore("nutrition", 0);
      result.current.updateScore("mental", 0);
      result.current.updateScore("stress", 0);
      result.current.updateScore("support", 0);
      result.current.updateScore("hydration", 0);
    });

    expect(result.current.lifestyleScore).toBe(0);
  });

  it("rounds lifestyle score to nearest integer", () => {
    const { result } = renderHook(() => useAssessment());

    // 7 + 7 + 7 + 7 + 7 + 7 + 8 = 50 / 7 = 7.14... × 10 = 71.4... ≈ 71
    act(() => {
      result.current.updateScore("sleep", 7);
      result.current.updateScore("body", 7);
      result.current.updateScore("nutrition", 7);
      result.current.updateScore("mental", 7);
      result.current.updateScore("stress", 7);
      result.current.updateScore("support", 7);
      result.current.updateScore("hydration", 8);
    });

    expect(result.current.lifestyleScore).toBe(71);
  });
});

describe("ASSESSMENT_CATEGORIES", () => {
  it("has exactly 7 categories", () => {
    expect(ASSESSMENT_CATEGORIES).toHaveLength(7);
  });

  it("has all required category IDs", () => {
    const categoryIds = ASSESSMENT_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain("sleep");
    expect(categoryIds).toContain("body");
    expect(categoryIds).toContain("nutrition");
    expect(categoryIds).toContain("mental");
    expect(categoryIds).toContain("stress");
    expect(categoryIds).toContain("support");
    expect(categoryIds).toContain("hydration");
  });

  it("has labels, icons, and descriptions for all categories", () => {
    ASSESSMENT_CATEGORIES.forEach((category) => {
      expect(category.label).toBeTruthy();
      expect(category.icon).toBeTruthy();
      expect(category.lowLabel).toBeTruthy();
      expect(category.highLabel).toBeTruthy();
    });
  });
});
