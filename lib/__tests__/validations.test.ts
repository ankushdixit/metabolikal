import { calculatorFormSchema, assessmentResultsSchema, foodItemSchema } from "../validations";

describe("calculatorFormSchema", () => {
  const validData = {
    gender: "male",
    age: 30,
    weightKg: 80,
    heightCm: 180,
    activityLevel: "moderately_active",
    goal: "fat_loss",
    goalWeightKg: 75,
    medicalConditions: [],
  };

  it("validates correct data", () => {
    const result = calculatorFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates with optional body fat", () => {
    const result = calculatorFormSchema.safeParse({
      ...validData,
      bodyFatPercent: 20,
    });
    expect(result.success).toBe(true);
  });

  describe("gender validation", () => {
    it("accepts male", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, gender: "male" });
      expect(result.success).toBe(true);
    });

    it("accepts female", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, gender: "female" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid gender", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, gender: "other" });
      expect(result.success).toBe(false);
    });
  });

  describe("age validation", () => {
    it("rejects age below 18", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, age: 17 });
      expect(result.success).toBe(false);
    });

    it("rejects age above 100", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, age: 101 });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer age", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, age: 30.5 });
      expect(result.success).toBe(false);
    });

    it("accepts valid age", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, age: 25 });
      expect(result.success).toBe(true);
    });
  });

  describe("weight validation", () => {
    it("rejects weight below 30kg", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, weightKg: 29 });
      expect(result.success).toBe(false);
    });

    it("rejects weight above 300kg", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, weightKg: 301 });
      expect(result.success).toBe(false);
    });

    it("accepts valid weight", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, weightKg: 80 });
      expect(result.success).toBe(true);
    });
  });

  describe("height validation", () => {
    it("rejects height below 100cm", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, heightCm: 99 });
      expect(result.success).toBe(false);
    });

    it("rejects height above 250cm", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, heightCm: 251 });
      expect(result.success).toBe(false);
    });

    it("accepts valid height", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, heightCm: 180 });
      expect(result.success).toBe(true);
    });
  });

  describe("bodyFatPercent validation", () => {
    it("is optional", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, bodyFatPercent: undefined });
      expect(result.success).toBe(true);
    });

    it("rejects below 3%", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, bodyFatPercent: 2 });
      expect(result.success).toBe(false);
    });

    it("rejects above 60%", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, bodyFatPercent: 61 });
      expect(result.success).toBe(false);
    });

    it("accepts valid body fat", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, bodyFatPercent: 20 });
      expect(result.success).toBe(true);
    });
  });

  describe("activityLevel validation", () => {
    const validLevels = [
      "sedentary",
      "lightly_active",
      "moderately_active",
      "very_active",
      "extremely_active",
    ];

    validLevels.forEach((level) => {
      it(`accepts ${level}`, () => {
        const result = calculatorFormSchema.safeParse({ ...validData, activityLevel: level });
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid activity level", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, activityLevel: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("goal validation", () => {
    const validGoals = ["fat_loss", "maintain", "muscle_gain"];

    validGoals.forEach((goal) => {
      it(`accepts ${goal}`, () => {
        const result = calculatorFormSchema.safeParse({ ...validData, goal });
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid goal", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, goal: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("medicalConditions validation", () => {
    it("accepts empty array", () => {
      const result = calculatorFormSchema.safeParse({ ...validData, medicalConditions: [] });
      expect(result.success).toBe(true);
    });

    it("accepts valid conditions", () => {
      const result = calculatorFormSchema.safeParse({
        ...validData,
        medicalConditions: ["hypothyroidism", "type2_diabetes"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts 'none'", () => {
      const result = calculatorFormSchema.safeParse({
        ...validData,
        medicalConditions: ["none"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid condition", () => {
      const result = calculatorFormSchema.safeParse({
        ...validData,
        medicalConditions: ["invalid_condition"],
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("assessmentResultsSchema", () => {
  const validResults = {
    visitor_id: "550e8400-e29b-41d4-a716-446655440000",
    sleep_score: 7,
    body_score: 6,
    nutrition_score: 5,
    mental_score: 8,
    stress_score: 4,
    support_score: 6,
    hydration_score: 7,
    gender: "male",
    age: 30,
    weight_kg: 80,
    height_cm: 180,
    activity_level: "moderately_active",
    medical_conditions: ["hypothyroidism"],
    metabolic_impact_percent: 8,
    goal: "fat_loss",
    goal_weight_kg: 75,
    bmr: 1780,
    tdee: 2759,
    target_calories: 2259,
    health_score: 65,
    lifestyle_score: 61,
  };

  it("validates complete results", () => {
    const result = assessmentResultsSchema.safeParse(validResults);
    expect(result.success).toBe(true);
  });

  it("validates with optional body fat", () => {
    const result = assessmentResultsSchema.safeParse({
      ...validResults,
      body_fat_percent: 20,
    });
    expect(result.success).toBe(true);
  });

  it("validates with optional user_id", () => {
    const result = assessmentResultsSchema.safeParse({
      ...validResults,
      user_id: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid visitor_id format", () => {
    const result = assessmentResultsSchema.safeParse({
      ...validResults,
      visitor_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects scores outside 0-10 range", () => {
    const result = assessmentResultsSchema.safeParse({
      ...validResults,
      sleep_score: 11,
    });
    expect(result.success).toBe(false);
  });

  it("rejects health score outside 0-100 range", () => {
    const result = assessmentResultsSchema.safeParse({
      ...validResults,
      health_score: 101,
    });
    expect(result.success).toBe(false);
  });
});

describe("foodItemSchema", () => {
  const validData = {
    name: "Grilled Chicken Breast",
    calories: 165,
    protein: 31,
    serving_size: "100g",
    is_vegetarian: false,
  };

  it("validates correct data", () => {
    const result = foodItemSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates with optional fields", () => {
    const result = foodItemSchema.safeParse({
      ...validData,
      carbs: 0,
      fats: 3.6,
      meal_types: ["lunch", "dinner"],
    });
    expect(result.success).toBe(true);
  });

  describe("name validation", () => {
    it("rejects empty name", () => {
      const result = foodItemSchema.safeParse({ ...validData, name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name over 100 characters", () => {
      const result = foodItemSchema.safeParse({
        ...validData,
        name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid name", () => {
      const result = foodItemSchema.safeParse({ ...validData, name: "Salmon Fillet" });
      expect(result.success).toBe(true);
    });
  });

  describe("calories validation", () => {
    it("rejects negative calories", () => {
      const result = foodItemSchema.safeParse({ ...validData, calories: -1 });
      expect(result.success).toBe(false);
    });

    it("rejects calories above 5000", () => {
      const result = foodItemSchema.safeParse({ ...validData, calories: 5001 });
      expect(result.success).toBe(false);
    });

    it("accepts valid calories", () => {
      const result = foodItemSchema.safeParse({ ...validData, calories: 200 });
      expect(result.success).toBe(true);
    });

    it("accepts zero calories", () => {
      const result = foodItemSchema.safeParse({ ...validData, calories: 0 });
      expect(result.success).toBe(true);
    });
  });

  describe("protein validation", () => {
    it("rejects negative protein", () => {
      const result = foodItemSchema.safeParse({ ...validData, protein: -1 });
      expect(result.success).toBe(false);
    });

    it("rejects protein above 500g", () => {
      const result = foodItemSchema.safeParse({ ...validData, protein: 501 });
      expect(result.success).toBe(false);
    });

    it("accepts valid protein", () => {
      const result = foodItemSchema.safeParse({ ...validData, protein: 25 });
      expect(result.success).toBe(true);
    });
  });

  describe("carbs validation", () => {
    it("is optional", () => {
      const result = foodItemSchema.safeParse({ ...validData, carbs: undefined });
      expect(result.success).toBe(true);
    });

    it("accepts null", () => {
      const result = foodItemSchema.safeParse({ ...validData, carbs: null });
      expect(result.success).toBe(true);
    });

    it("rejects negative carbs", () => {
      const result = foodItemSchema.safeParse({ ...validData, carbs: -1 });
      expect(result.success).toBe(false);
    });

    it("rejects carbs above 500g", () => {
      const result = foodItemSchema.safeParse({ ...validData, carbs: 501 });
      expect(result.success).toBe(false);
    });

    it("accepts valid carbs", () => {
      const result = foodItemSchema.safeParse({ ...validData, carbs: 30 });
      expect(result.success).toBe(true);
    });
  });

  describe("fats validation", () => {
    it("is optional", () => {
      const result = foodItemSchema.safeParse({ ...validData, fats: undefined });
      expect(result.success).toBe(true);
    });

    it("accepts null", () => {
      const result = foodItemSchema.safeParse({ ...validData, fats: null });
      expect(result.success).toBe(true);
    });

    it("rejects negative fats", () => {
      const result = foodItemSchema.safeParse({ ...validData, fats: -1 });
      expect(result.success).toBe(false);
    });

    it("rejects fats above 500g", () => {
      const result = foodItemSchema.safeParse({ ...validData, fats: 501 });
      expect(result.success).toBe(false);
    });

    it("accepts valid fats", () => {
      const result = foodItemSchema.safeParse({ ...validData, fats: 10 });
      expect(result.success).toBe(true);
    });
  });

  describe("serving_size validation", () => {
    it("rejects empty serving size", () => {
      const result = foodItemSchema.safeParse({ ...validData, serving_size: "" });
      expect(result.success).toBe(false);
    });

    it("rejects serving size over 50 characters", () => {
      const result = foodItemSchema.safeParse({
        ...validData,
        serving_size: "a".repeat(51),
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid serving sizes", () => {
      expect(foodItemSchema.safeParse({ ...validData, serving_size: "100g" }).success).toBe(true);
      expect(foodItemSchema.safeParse({ ...validData, serving_size: "1 cup" }).success).toBe(true);
      expect(foodItemSchema.safeParse({ ...validData, serving_size: "1 medium" }).success).toBe(
        true
      );
    });
  });

  describe("is_vegetarian validation", () => {
    it("is required", () => {
      const result = foodItemSchema.safeParse({
        name: "Test",
        calories: 100,
        protein: 10,
        serving_size: "100g",
      });
      expect(result.success).toBe(false);
    });

    it("accepts true", () => {
      const result = foodItemSchema.safeParse({ ...validData, is_vegetarian: true });
      expect(result.success).toBe(true);
    });

    it("accepts false", () => {
      const result = foodItemSchema.safeParse({ ...validData, is_vegetarian: false });
      expect(result.success).toBe(true);
    });
  });

  describe("meal_types validation", () => {
    it("is optional", () => {
      const result = foodItemSchema.safeParse({ ...validData, meal_types: undefined });
      expect(result.success).toBe(true);
    });

    it("accepts null", () => {
      const result = foodItemSchema.safeParse({ ...validData, meal_types: null });
      expect(result.success).toBe(true);
    });

    it("accepts empty array", () => {
      const result = foodItemSchema.safeParse({ ...validData, meal_types: [] });
      expect(result.success).toBe(true);
    });

    it("accepts valid meal types", () => {
      const validTypes = ["breakfast", "lunch", "dinner", "snack", "pre-workout", "post-workout"];
      validTypes.forEach((type) => {
        const result = foodItemSchema.safeParse({ ...validData, meal_types: [type] });
        expect(result.success).toBe(true);
      });
    });

    it("accepts multiple meal types", () => {
      const result = foodItemSchema.safeParse({
        ...validData,
        meal_types: ["breakfast", "snack"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid meal types", () => {
      const result = foodItemSchema.safeParse({
        ...validData,
        meal_types: ["invalid_type"],
      });
      expect(result.success).toBe(false);
    });
  });
});
