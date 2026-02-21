import {
  calculatorFormSchema,
  assessmentResultsSchema,
  foodItemSchema,
  createClientSchema,
  checkInSchema,
  supplementSchema,
  exerciseSchema,
  updateClientSchema,
  uuidSchema,
  planTemplateSchema,
  testimonialVideoSchema,
  testimonialPhotoSchema,
  lifestyleActivityTypeSchema,
} from "../validations";

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
    metabolicImpactPercent: 0,
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

    it("accepts any string condition (conditions come from database)", () => {
      const result = calculatorFormSchema.safeParse({
        ...validData,
        medicalConditions: ["custom_condition", "type2-diabetes"],
      });
      expect(result.success).toBe(true);
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
  // serving_size, raw_quantity, cooked_quantity are now numeric (grams only)
  const validData = {
    name: "Grilled Chicken Breast",
    calories: 165,
    protein: 31,
    serving_size: 100, // Now numeric (grams)
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

    it("coerces negative carbs to null", () => {
      const result = foodItemSchema.safeParse({ ...validData, carbs: -1 });
      // Schema uses .catch(null) to coerce invalid values to null
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.carbs).toBe(null);
      }
    });

    it("coerces carbs above 500g to null", () => {
      const result = foodItemSchema.safeParse({ ...validData, carbs: 501 });
      // Schema uses .catch(null) to coerce invalid values to null
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.carbs).toBe(null);
      }
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

    it("coerces negative fats to null", () => {
      const result = foodItemSchema.safeParse({ ...validData, fats: -1 });
      // Schema uses .catch(null) to coerce invalid values to null
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fats).toBe(null);
      }
    });

    it("coerces fats above 500g to null", () => {
      const result = foodItemSchema.safeParse({ ...validData, fats: 501 });
      // Schema uses .catch(null) to coerce invalid values to null
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fats).toBe(null);
      }
    });

    it("accepts valid fats", () => {
      const result = foodItemSchema.safeParse({ ...validData, fats: 10 });
      expect(result.success).toBe(true);
    });
  });

  describe("serving_size validation", () => {
    // serving_size is now numeric (grams only)
    it("rejects zero serving size", () => {
      const result = foodItemSchema.safeParse({ ...validData, serving_size: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects negative serving size", () => {
      const result = foodItemSchema.safeParse({ ...validData, serving_size: -1 });
      expect(result.success).toBe(false);
    });

    it("rejects serving size above 5000g", () => {
      const result = foodItemSchema.safeParse({
        ...validData,
        serving_size: 5001,
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid serving sizes (numeric grams)", () => {
      expect(foodItemSchema.safeParse({ ...validData, serving_size: 100 }).success).toBe(true);
      expect(foodItemSchema.safeParse({ ...validData, serving_size: 150 }).success).toBe(true);
      expect(foodItemSchema.safeParse({ ...validData, serving_size: 250 }).success).toBe(true);
    });
  });

  describe("is_vegetarian validation", () => {
    it("is required", () => {
      const result = foodItemSchema.safeParse({
        name: "Test",
        calories: 100,
        protein: 10,
        serving_size: 100, // Now numeric
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

    it("accepts any string meal types (now dynamic from database)", () => {
      // Meal types are now dynamic from the database, so any string is valid
      const result = foodItemSchema.safeParse({
        ...validData,
        meal_types: ["custom-meal-type"],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("createClientSchema", () => {
  const validData = {
    full_name: "John Doe",
    email: "john@example.com",
  };

  it("validates correct data with required fields only", () => {
    const result = createClientSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates correct data with all fields", () => {
    const result = createClientSchema.safeParse({
      ...validData,
      date_of_birth: "1990-05-15",
      gender: "male",
      address: "123 Main St, City",
    });
    expect(result.success).toBe(true);
  });

  describe("full_name validation", () => {
    it("rejects empty full_name", () => {
      const result = createClientSchema.safeParse({ ...validData, full_name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects full_name over 100 characters", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        full_name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid full_name", () => {
      const result = createClientSchema.safeParse({ ...validData, full_name: "Jane Smith" });
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("rejects invalid email", () => {
      const result = createClientSchema.safeParse({ ...validData, email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects empty email", () => {
      const result = createClientSchema.safeParse({ ...validData, email: "" });
      expect(result.success).toBe(false);
    });

    it("accepts valid email", () => {
      const result = createClientSchema.safeParse({ ...validData, email: "test@example.com" });
      expect(result.success).toBe(true);
    });

    it("accepts email with subdomain", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        email: "user@mail.example.com",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("date_of_birth validation", () => {
    it("is optional", () => {
      const result = createClientSchema.safeParse({ ...validData, date_of_birth: undefined });
      expect(result.success).toBe(true);
    });

    it("accepts valid date format", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        date_of_birth: "1990-05-15",
      });
      expect(result.success).toBe(true);
    });

    it("rejects future date", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = createClientSchema.safeParse({
        ...validData,
        date_of_birth: futureDate.toISOString().split("T")[0],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid date format", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        date_of_birth: "not-a-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("gender validation", () => {
    it("is optional", () => {
      const result = createClientSchema.safeParse({ ...validData, gender: undefined });
      expect(result.success).toBe(true);
    });

    it("accepts male", () => {
      const result = createClientSchema.safeParse({ ...validData, gender: "male" });
      expect(result.success).toBe(true);
    });

    it("accepts female", () => {
      const result = createClientSchema.safeParse({ ...validData, gender: "female" });
      expect(result.success).toBe(true);
    });

    it("accepts other", () => {
      const result = createClientSchema.safeParse({ ...validData, gender: "other" });
      expect(result.success).toBe(true);
    });

    it("accepts prefer_not_to_say", () => {
      const result = createClientSchema.safeParse({ ...validData, gender: "prefer_not_to_say" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid gender", () => {
      const result = createClientSchema.safeParse({ ...validData, gender: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("address validation", () => {
    it("is optional", () => {
      const result = createClientSchema.safeParse({ ...validData, address: undefined });
      expect(result.success).toBe(true);
    });

    it("accepts valid address", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        address: "123 Main St, City, State 12345",
      });
      expect(result.success).toBe(true);
    });

    it("rejects address over 500 characters", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        address: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("accepts empty string", () => {
      const result = createClientSchema.safeParse({ ...validData, address: "" });
      expect(result.success).toBe(true);
    });
  });

  describe("phone validation", () => {
    it("accepts valid E.164 phone number", () => {
      const result = createClientSchema.safeParse({ ...validData, phone: "+1234567890" });
      expect(result.success).toBe(true);
    });

    it("accepts empty string for phone", () => {
      const result = createClientSchema.safeParse({ ...validData, phone: "" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid phone number", () => {
      const result = createClientSchema.safeParse({ ...validData, phone: "abc123" });
      expect(result.success).toBe(false);
    });
  });

  describe("plan_start_date validation", () => {
    it("accepts valid plan start date", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        plan_start_date: "2026-03-01",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid plan start date", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        plan_start_date: "not-a-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("plan_duration_days validation", () => {
    it("accepts valid duration", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        plan_duration_days: 30,
      });
      expect(result.success).toBe(true);
    });

    it("rejects duration below 1", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        plan_duration_days: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects duration above 365", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        plan_duration_days: 366,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer duration", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        plan_duration_days: 30.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("condition_ids validation", () => {
    it("accepts valid condition UUIDs", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        condition_ids: ["550e8400-e29b-41d4-a716-446655440000"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid condition UUIDs", () => {
      const result = createClientSchema.safeParse({
        ...validData,
        condition_ids: ["not-a-uuid"],
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("uuidSchema", () => {
  it("accepts valid UUID", () => {
    const result = uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("accepts test UUID with all zeros", () => {
    const result = uuidSchema.safeParse("00000000-0000-0000-0000-000000000206");
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID format", () => {
    const result = uuidSchema.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = uuidSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("checkInSchema", () => {
  const validData = {
    weight: 80,
    energy_rating: 7,
    sleep_rating: 7,
    stress_rating: 5,
    mood_rating: 8,
    diet_adherence: 90,
    workout_adherence: 85,
  };

  it("validates correct data", () => {
    const result = checkInSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects weight below 20", () => {
    const result = checkInSchema.safeParse({ ...validData, weight: 19 });
    expect(result.success).toBe(false);
  });

  it("rejects weight above 300", () => {
    const result = checkInSchema.safeParse({ ...validData, weight: 301 });
    expect(result.success).toBe(false);
  });

  it("accepts optional nullable fields", () => {
    const result = checkInSchema.safeParse({
      ...validData,
      body_fat_percent: null,
      chest_cm: null,
      waist_cm: null,
      hips_cm: null,
      arms_cm: null,
      thighs_cm: null,
      neck_cm: null,
      calves_cm: null,
      challenges: null,
      progress_notes: null,
      questions: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates measurement bounds", () => {
    // body_fat min/max
    expect(checkInSchema.safeParse({ ...validData, body_fat_percent: 0 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, body_fat_percent: 61 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, body_fat_percent: 15 }).success).toBe(true);

    // chest_cm min/max
    expect(checkInSchema.safeParse({ ...validData, chest_cm: 49 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, chest_cm: 201 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, chest_cm: 100 }).success).toBe(true);

    // neck_cm min/max
    expect(checkInSchema.safeParse({ ...validData, neck_cm: 19 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, neck_cm: 61 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, neck_cm: 38 }).success).toBe(true);

    // calves_cm min/max
    expect(checkInSchema.safeParse({ ...validData, calves_cm: 19 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, calves_cm: 71 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, calves_cm: 40 }).success).toBe(true);
  });

  it("validates rating bounds", () => {
    expect(checkInSchema.safeParse({ ...validData, energy_rating: 0 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, energy_rating: 11 }).success).toBe(false);
  });

  it("validates adherence bounds", () => {
    expect(checkInSchema.safeParse({ ...validData, diet_adherence: -1 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, diet_adherence: 101 }).success).toBe(false);
  });

  it("rejects too-long text fields", () => {
    expect(checkInSchema.safeParse({ ...validData, challenges: "a".repeat(1001) }).success).toBe(
      false
    );
    expect(
      checkInSchema.safeParse({ ...validData, progress_notes: "a".repeat(1001) }).success
    ).toBe(false);
    expect(checkInSchema.safeParse({ ...validData, questions: "a".repeat(1001) }).success).toBe(
      false
    );
  });
});

describe("supplementSchema", () => {
  const validData = {
    name: "Fish Oil",
    category: "fatty_acid" as const,
    default_dosage: 1000,
    dosage_unit: "mg",
    is_active: true,
  };

  it("validates correct data", () => {
    const result = supplementSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    expect(supplementSchema.safeParse({ ...validData, name: "A" }).success).toBe(false);
  });

  it("rejects invalid category", () => {
    expect(supplementSchema.safeParse({ ...validData, category: "invalid" }).success).toBe(false);
  });

  it("rejects non-positive dosage", () => {
    expect(supplementSchema.safeParse({ ...validData, default_dosage: 0 }).success).toBe(false);
    expect(supplementSchema.safeParse({ ...validData, default_dosage: -1 }).success).toBe(false);
  });

  it("accepts optional nullable fields", () => {
    const result = supplementSchema.safeParse({
      ...validData,
      instructions: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("exerciseSchema", () => {
  const validData = {
    name: "Push-ups",
    category: "strength" as const,
    muscle_group: "chest" as const,
  };

  it("validates correct data", () => {
    const result = exerciseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates with all optional fields", () => {
    const result = exerciseSchema.safeParse({
      ...validData,
      equipment: "None",
      default_sets: 3,
      default_reps: 12,
      default_duration_seconds: 60,
      rest_seconds: 30,
      instructions: "Keep core tight",
      video_url: "https://example.com/video",
      thumbnail_url: "https://example.com/thumb.jpg",
      difficulty_level: 3,
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid muscle group", () => {
    expect(exerciseSchema.safeParse({ ...validData, muscle_group: "invalid" }).success).toBe(false);
  });

  it("accepts empty string for video_url", () => {
    const result = exerciseSchema.safeParse({ ...validData, video_url: "" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL for video_url", () => {
    const result = exerciseSchema.safeParse({ ...validData, video_url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("validates difficulty_level bounds", () => {
    expect(exerciseSchema.safeParse({ ...validData, difficulty_level: 0 }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...validData, difficulty_level: 6 }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...validData, difficulty_level: 5 }).success).toBe(true);
  });
});

describe("updateClientSchema", () => {
  const validData = {
    full_name: "John Doe",
    email: "john@example.com",
  };

  it("validates correct data", () => {
    const result = updateClientSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts nullable phone", () => {
    const result = updateClientSchema.safeParse({ ...validData, phone: null });
    expect(result.success).toBe(true);
  });

  it("accepts nullable date_of_birth", () => {
    const result = updateClientSchema.safeParse({ ...validData, date_of_birth: null });
    expect(result.success).toBe(true);
  });

  it("accepts nullable gender", () => {
    const result = updateClientSchema.safeParse({ ...validData, gender: null });
    expect(result.success).toBe(true);
  });

  it("accepts nullable plan_start_date", () => {
    const result = updateClientSchema.safeParse({ ...validData, plan_start_date: null });
    expect(result.success).toBe(true);
  });

  it("accepts nullable plan_duration_days", () => {
    const result = updateClientSchema.safeParse({ ...validData, plan_duration_days: null });
    expect(result.success).toBe(true);
  });

  it("rejects invalid plan_start_date", () => {
    const result = updateClientSchema.safeParse({
      ...validData,
      plan_start_date: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects future date_of_birth", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = updateClientSchema.safeParse({
      ...validData,
      date_of_birth: futureDate.toISOString().split("T")[0],
    });
    expect(result.success).toBe(false);
  });
});

describe("planTemplateSchema", () => {
  it("validates correct data", () => {
    const result = planTemplateSchema.safeParse({
      name: "Weight Loss Plan",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all fields", () => {
    const result = planTemplateSchema.safeParse({
      name: "Weight Loss Plan",
      description: "A plan for losing weight",
      category: "weight_loss",
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = planTemplateSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = planTemplateSchema.safeParse({ name: "Plan", category: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("testimonialVideoSchema", () => {
  const validData = {
    youtube_video_id: "abc123xyz",
    title: "Amazing Results",
    video_type: "short" as const,
    is_active: true,
  };

  it("validates correct data", () => {
    const result = testimonialVideoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty youtube_video_id", () => {
    const result = testimonialVideoSchema.safeParse({ ...validData, youtube_video_id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid video_type", () => {
    const result = testimonialVideoSchema.safeParse({ ...validData, video_type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts landscape video type", () => {
    const result = testimonialVideoSchema.safeParse({ ...validData, video_type: "landscape" });
    expect(result.success).toBe(true);
  });

  it("accepts optional client_name", () => {
    const result = testimonialVideoSchema.safeParse({ ...validData, client_name: "John" });
    expect(result.success).toBe(true);
  });
});

describe("testimonialPhotoSchema", () => {
  const validData = {
    client_name: "Jane Doe",
    duration: "3 months",
    result: "Lost 10kg",
    before_image_url: "https://example.com/before.jpg",
    after_image_url: "https://example.com/after.jpg",
    is_active: true,
  };

  it("validates correct data", () => {
    const result = testimonialPhotoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty client_name", () => {
    const result = testimonialPhotoSchema.safeParse({ ...validData, client_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty before_image_url", () => {
    const result = testimonialPhotoSchema.safeParse({ ...validData, before_image_url: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = testimonialPhotoSchema.safeParse({
      ...validData,
      profession: "Engineer",
      display_order: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe("lifestyleActivityTypeSchema", () => {
  const validData = {
    name: "Walking",
    category: "movement" as const,
  };

  it("validates correct data", () => {
    const result = lifestyleActivityTypeSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates with all optional fields", () => {
    const result = lifestyleActivityTypeSchema.safeParse({
      ...validData,
      default_target_value: 10000,
      target_unit: "steps",
      description: "Daily walking target",
      rationale: "Walking improves metabolic health",
      icon: "footprints",
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = lifestyleActivityTypeSchema.safeParse({ ...validData, category: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = lifestyleActivityTypeSchema.safeParse({ ...validData, name: "A" });
    expect(result.success).toBe(false);
  });
});
