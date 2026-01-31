import {
  parseQuantityString,
  getAvailableQuantityTypes,
  getDefaultQuantityType,
  getReferenceQuantity,
  calculateMultiplier,
  calculateQuantityFromMultiplier,
  validateQuantityInput,
  formatQuantityDisplay,
  hasQuantityDefinitions,
  shouldShowQuantityTypeToggle,
  getInitialQuantity,
} from "../quantity";

describe("parseQuantityString", () => {
  it("parses quantity with g suffix", () => {
    expect(parseQuantityString("100g")).toBe(100);
    expect(parseQuantityString("150g")).toBe(150);
  });

  it("parses quantity with space before g", () => {
    expect(parseQuantityString("100 g")).toBe(100);
    expect(parseQuantityString("150 g")).toBe(150);
  });

  it("parses quantity without unit", () => {
    expect(parseQuantityString("100")).toBe(100);
    expect(parseQuantityString("75")).toBe(75);
  });

  it("parses decimal quantities", () => {
    expect(parseQuantityString("100.5g")).toBe(100.5);
    expect(parseQuantityString("75.25")).toBe(75.25);
  });

  it("returns null for null/undefined input", () => {
    expect(parseQuantityString(null)).toBeNull();
    expect(parseQuantityString(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseQuantityString("")).toBeNull();
  });

  it("returns null for non-numeric string", () => {
    expect(parseQuantityString("invalid")).toBeNull();
    expect(parseQuantityString("abc")).toBeNull();
  });

  it("handles grams text", () => {
    expect(parseQuantityString("100 grams")).toBe(100);
    expect(parseQuantityString("100grams")).toBe(100);
  });
});

describe("getAvailableQuantityTypes", () => {
  it("returns both types when both defined", () => {
    const food = { raw_quantity: "100g", cooked_quantity: "75g" };
    expect(getAvailableQuantityTypes(food)).toEqual(["raw", "cooked"]);
  });

  it("returns only raw when only raw defined", () => {
    const food = { raw_quantity: "100g", cooked_quantity: null };
    expect(getAvailableQuantityTypes(food)).toEqual(["raw"]);
  });

  it("returns only cooked when only cooked defined", () => {
    const food = { raw_quantity: null, cooked_quantity: "75g" };
    expect(getAvailableQuantityTypes(food)).toEqual(["cooked"]);
  });

  it("returns empty array when neither defined", () => {
    const food = { raw_quantity: null, cooked_quantity: null };
    expect(getAvailableQuantityTypes(food)).toEqual([]);
  });

  it("returns empty array for null food", () => {
    expect(getAvailableQuantityTypes(null)).toEqual([]);
    expect(getAvailableQuantityTypes(undefined)).toEqual([]);
  });

  it("excludes invalid quantity strings", () => {
    const food = { raw_quantity: "invalid", cooked_quantity: "75g" };
    expect(getAvailableQuantityTypes(food)).toEqual(["cooked"]);
  });
});

describe("getDefaultQuantityType", () => {
  it("returns raw when both available", () => {
    const food = { raw_quantity: "100g", cooked_quantity: "75g" };
    expect(getDefaultQuantityType(food)).toBe("raw");
  });

  it("returns raw when only raw available", () => {
    const food = { raw_quantity: "100g", cooked_quantity: null };
    expect(getDefaultQuantityType(food)).toBe("raw");
  });

  it("returns cooked when only cooked available", () => {
    const food = { raw_quantity: null, cooked_quantity: "75g" };
    expect(getDefaultQuantityType(food)).toBe("cooked");
  });

  it("returns null when neither available", () => {
    const food = { raw_quantity: null, cooked_quantity: null };
    expect(getDefaultQuantityType(food)).toBeNull();
  });

  it("returns null for null food", () => {
    expect(getDefaultQuantityType(null)).toBeNull();
  });
});

describe("getReferenceQuantity", () => {
  it("returns raw quantity when type is raw", () => {
    const food = { raw_quantity: "100g", cooked_quantity: "75g" };
    expect(getReferenceQuantity(food, "raw")).toBe(100);
  });

  it("returns cooked quantity when type is cooked", () => {
    const food = { raw_quantity: "100g", cooked_quantity: "75g" };
    expect(getReferenceQuantity(food, "cooked")).toBe(75);
  });

  it("returns 100 as fallback when food is null", () => {
    expect(getReferenceQuantity(null, "raw")).toBe(100);
  });

  it("returns 100 as fallback when type is null", () => {
    const food = { raw_quantity: "100g", cooked_quantity: "75g" };
    expect(getReferenceQuantity(food, null)).toBe(100);
  });

  it("returns 100 as fallback when quantity string is invalid", () => {
    const food = { raw_quantity: "invalid", cooked_quantity: null };
    expect(getReferenceQuantity(food, "raw")).toBe(100);
  });
});

describe("calculateMultiplier", () => {
  it("calculates correct multiplier for 1.5x quantity", () => {
    const food = { raw_quantity: "100g", cooked_quantity: null };
    expect(calculateMultiplier(150, "raw", food)).toBe(1.5);
  });

  it("calculates correct multiplier for 0.5x quantity", () => {
    const food = { raw_quantity: "100g", cooked_quantity: null };
    expect(calculateMultiplier(50, "raw", food)).toBe(0.5);
  });

  it("calculates correct multiplier for cooked type", () => {
    const food = { raw_quantity: "100g", cooked_quantity: "80g" };
    expect(calculateMultiplier(160, "cooked", food)).toBe(2);
  });

  it("returns 1 for null/zero quantity", () => {
    const food = { raw_quantity: "100g", cooked_quantity: null };
    expect(calculateMultiplier(null, "raw", food)).toBe(1);
    expect(calculateMultiplier(0, "raw", food)).toBe(1);
    expect(calculateMultiplier(-10, "raw", food)).toBe(1);
  });

  it("rounds to 2 decimal places", () => {
    const food = { raw_quantity: "100g", cooked_quantity: null };
    expect(calculateMultiplier(133, "raw", food)).toBe(1.33);
  });
});

describe("calculateQuantityFromMultiplier", () => {
  it("calculates correct quantity from multiplier", () => {
    const food = { raw_quantity: "100g", cooked_quantity: null };
    expect(calculateQuantityFromMultiplier(1.5, "raw", food)).toBe(150);
  });

  it("calculates correct quantity for cooked type", () => {
    const food = { raw_quantity: "100g", cooked_quantity: "80g" };
    expect(calculateQuantityFromMultiplier(2, "cooked", food)).toBe(160);
  });

  it("rounds to nearest integer", () => {
    const food = { raw_quantity: "100g", cooked_quantity: null };
    expect(calculateQuantityFromMultiplier(1.33, "raw", food)).toBe(133);
  });
});

describe("validateQuantityInput", () => {
  const food = { raw_quantity: "100g", cooked_quantity: "75g" };

  it("returns valid for correct input", () => {
    const result = validateQuantityInput(150, "raw", food);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns error when quantity is null", () => {
    const result = validateQuantityInput(null, "raw", food);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity is required");
  });

  it("returns error when quantity is zero or negative", () => {
    expect(validateQuantityInput(0, "raw", food).valid).toBe(false);
    expect(validateQuantityInput(-10, "raw", food).valid).toBe(false);
  });

  it("returns error when quantity exceeds 5000g", () => {
    const result = validateQuantityInput(5001, "raw", food);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity cannot exceed 5000g");
  });

  it("returns error when quantity type is null", () => {
    const result = validateQuantityInput(150, null, food);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Please select raw or cooked");
  });

  it("returns error when quantity type not available on food", () => {
    const foodOnlyRaw = { raw_quantity: "100g", cooked_quantity: null };
    const result = validateQuantityInput(150, "cooked", foodOnlyRaw);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("only has");
  });

  it("allows any type when food has no quantity definitions", () => {
    const foodNoQty = { raw_quantity: null, cooked_quantity: null };
    const result = validateQuantityInput(150, "raw", foodNoQty);
    expect(result.valid).toBe(true);
  });
});

describe("formatQuantityDisplay", () => {
  it("formats quantity with type", () => {
    expect(formatQuantityDisplay(150, "raw", null)).toBe("150g (raw)");
    expect(formatQuantityDisplay(100, "cooked", null)).toBe("100g (cooked)");
  });

  it("formats quantity with type and note", () => {
    expect(formatQuantityDisplay(150, "cooked", "2 pieces")).toBe("150g (cooked) - 2 pieces");
  });

  it("rounds quantity to integer", () => {
    expect(formatQuantityDisplay(150.7, "raw", null)).toBe("151g (raw)");
  });

  it("returns empty string for null quantity", () => {
    expect(formatQuantityDisplay(null, "raw", null)).toBe("");
    expect(formatQuantityDisplay(undefined, "raw", null)).toBe("");
  });

  it("handles missing type", () => {
    expect(formatQuantityDisplay(150, null, null)).toBe("150g");
  });

  it("trims note whitespace", () => {
    expect(formatQuantityDisplay(150, "raw", "  2 pieces  ")).toBe("150g (raw) - 2 pieces");
  });
});

describe("hasQuantityDefinitions", () => {
  it("returns true when raw defined", () => {
    expect(hasQuantityDefinitions({ raw_quantity: "100g", cooked_quantity: null })).toBe(true);
  });

  it("returns true when cooked defined", () => {
    expect(hasQuantityDefinitions({ raw_quantity: null, cooked_quantity: "75g" })).toBe(true);
  });

  it("returns true when both defined", () => {
    expect(hasQuantityDefinitions({ raw_quantity: "100g", cooked_quantity: "75g" })).toBe(true);
  });

  it("returns false when neither defined", () => {
    expect(hasQuantityDefinitions({ raw_quantity: null, cooked_quantity: null })).toBe(false);
  });

  it("returns false for null food", () => {
    expect(hasQuantityDefinitions(null)).toBe(false);
  });
});

describe("shouldShowQuantityTypeToggle", () => {
  it("returns true when both types available", () => {
    expect(
      shouldShowQuantityTypeToggle({
        raw_quantity: "100g",
        cooked_quantity: "75g",
      })
    ).toBe(true);
  });

  it("returns false when only one type available", () => {
    expect(
      shouldShowQuantityTypeToggle({
        raw_quantity: "100g",
        cooked_quantity: null,
      })
    ).toBe(false);
    expect(
      shouldShowQuantityTypeToggle({
        raw_quantity: null,
        cooked_quantity: "75g",
      })
    ).toBe(false);
  });

  it("returns false when neither available", () => {
    expect(
      shouldShowQuantityTypeToggle({
        raw_quantity: null,
        cooked_quantity: null,
      })
    ).toBe(false);
  });
});

describe("getInitialQuantity", () => {
  it("returns raw reference quantity when raw is default", () => {
    expect(getInitialQuantity({ raw_quantity: "100g", cooked_quantity: "75g" })).toBe(100);
  });

  it("returns cooked reference quantity when only cooked available", () => {
    expect(getInitialQuantity({ raw_quantity: null, cooked_quantity: "75g" })).toBe(75);
  });

  it("returns 100 as fallback when no quantities defined", () => {
    expect(getInitialQuantity({ raw_quantity: null, cooked_quantity: null })).toBe(100);
  });
});
