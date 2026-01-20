import { getCalorieColor, getAlternativeCardClasses } from "../calorie-colors";

describe("getCalorieColor", () => {
  it("returns green for food within ±10% of target calories", () => {
    // Exact match
    const exact = getCalorieColor(400, 400);
    expect(exact.color).toBe("green");
    expect(exact.label).toBe("Optimal");

    // 10% above (edge case)
    const above10 = getCalorieColor(440, 400);
    expect(above10.color).toBe("green");

    // 10% below (edge case)
    const below10 = getCalorieColor(360, 400);
    expect(below10.color).toBe("green");

    // 5% above
    const above5 = getCalorieColor(420, 400);
    expect(above5.color).toBe("green");
  });

  it("returns red for food >10% above target calories", () => {
    // 11% above
    const above11 = getCalorieColor(444, 400);
    expect(above11.color).toBe("red");
    expect(above11.label).toBe("Higher cal");
    expect(above11.borderClass).toBe("border-red-500");
    expect(above11.bgClass).toBe("bg-red-500/10");
    expect(above11.textClass).toBe("text-red-500");

    // 50% above
    const above50 = getCalorieColor(600, 400);
    expect(above50.color).toBe("red");
  });

  it("returns yellow for food >10% below target calories", () => {
    // 11% below
    const below11 = getCalorieColor(356, 400);
    expect(below11.color).toBe("yellow");
    expect(below11.label).toBe("Lower cal");
    expect(below11.borderClass).toBe("border-yellow-500");
    expect(below11.bgClass).toBe("bg-yellow-500/10");
    expect(below11.textClass).toBe("text-yellow-500");

    // 50% below
    const below50 = getCalorieColor(200, 400);
    expect(below50.color).toBe("yellow");
  });

  it("returns green when target is 0 or negative", () => {
    const zeroTarget = getCalorieColor(400, 0);
    expect(zeroTarget.color).toBe("green");

    const negativeTarget = getCalorieColor(400, -100);
    expect(negativeTarget.color).toBe("green");
  });

  it("handles edge cases correctly", () => {
    // Very small numbers
    const small = getCalorieColor(10, 10);
    expect(small.color).toBe("green");

    // Large numbers
    const large = getCalorieColor(2000, 2000);
    expect(large.color).toBe("green");

    // Zero calories food
    const zeroCal = getCalorieColor(0, 400);
    expect(zeroCal.color).toBe("yellow");
  });
});

describe("getAlternativeCardClasses", () => {
  it("returns optimal card classes when isOptimal is true", () => {
    const classes = getAlternativeCardClasses(true, 400, 400);
    expect(classes).toContain("border-2");
    expect(classes).toContain("border-neon-green");
    expect(classes).toContain("bg-neon-green/10");
  });

  it("returns non-optimal card classes with correct color for higher calories", () => {
    const classes = getAlternativeCardClasses(false, 500, 400);
    expect(classes).toContain("border-l-4");
    expect(classes).toContain("border-red-500");
    expect(classes).not.toContain("border-2");
  });

  it("returns non-optimal card classes with correct color for lower calories", () => {
    const classes = getAlternativeCardClasses(false, 300, 400);
    expect(classes).toContain("border-l-4");
    expect(classes).toContain("border-yellow-500");
  });

  it("returns non-optimal card classes with green for optimal range", () => {
    const classes = getAlternativeCardClasses(false, 400, 400);
    expect(classes).toContain("border-l-4");
    expect(classes).toContain("border-neon-green");
  });
});
