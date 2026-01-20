import { z } from "zod";

/**
 * Calculator form validation schema.
 * Validates user inputs for the metabolic calculator.
 */
export const calculatorFormSchema = z.object({
  gender: z.enum(["male", "female"], {
    message: "Please select your gender",
  }),
  age: z
    .number({
      message: "Age is required and must be a number",
    })
    .int({ message: "Age must be a whole number" })
    .min(18, { message: "Age must be at least 18" })
    .max(100, { message: "Age must be 100 or less" }),
  weightKg: z
    .number({
      message: "Weight is required and must be a number",
    })
    .min(30, { message: "Weight must be at least 30 kg" })
    .max(300, { message: "Weight must be 300 kg or less" }),
  heightCm: z
    .number({
      message: "Height is required and must be a number",
    })
    .min(100, { message: "Height must be at least 100 cm" })
    .max(250, { message: "Height must be 250 cm or less" }),
  bodyFatPercent: z
    .number()
    .min(3, { message: "Body fat must be at least 3%" })
    .max(60, { message: "Body fat must be 60% or less" })
    .optional(),
  activityLevel: z.enum(
    ["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"],
    {
      message: "Please select your activity level",
    }
  ),
  goal: z.enum(["fat_loss", "maintain", "muscle_gain"], {
    message: "Please select your goal",
  }),
  goalWeightKg: z
    .number({
      message: "Goal weight is required and must be a number",
    })
    .min(30, { message: "Goal weight must be at least 30 kg" })
    .max(300, { message: "Goal weight must be 300 kg or less" }),
  medicalConditions: z.array(
    z.enum([
      "hypothyroidism",
      "pcos",
      "type2_diabetes",
      "insulin_resistance",
      "sleep_apnea",
      "metabolic_syndrome",
      "thyroid_managed",
      "chronic_fatigue",
      "none",
    ])
  ),
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

/**
 * Assessment results schema for database storage.
 */
export const assessmentResultsSchema = z.object({
  visitor_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  sleep_score: z.number().min(0).max(10),
  body_score: z.number().min(0).max(10),
  nutrition_score: z.number().min(0).max(10),
  mental_score: z.number().min(0).max(10),
  stress_score: z.number().min(0).max(10),
  support_score: z.number().min(0).max(10),
  hydration_score: z.number().min(0).max(10),
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(18).max(100),
  weight_kg: z.number().min(30).max(300),
  height_cm: z.number().min(100).max(250),
  body_fat_percent: z.number().min(3).max(60).optional(),
  activity_level: z.string(),
  medical_conditions: z.array(z.string()),
  metabolic_impact_percent: z.number().min(0).max(100),
  goal: z.string(),
  goal_weight_kg: z.number().min(30).max(300),
  bmr: z.number().positive(),
  tdee: z.number().positive(),
  target_calories: z.number().positive(),
  health_score: z.number().min(0).max(100),
  lifestyle_score: z.number().min(0).max(100),
});

export type AssessmentResults = z.infer<typeof assessmentResultsSchema>;

/**
 * Check-in form validation schema.
 * Validates weekly check-in data including measurements, ratings, and compliance.
 */
export const checkInSchema = z.object({
  // Step 1: Measurements
  weight: z
    .number({
      error: "Weight is required and must be a number",
    })
    .min(20, { message: "Weight must be at least 20 kg" })
    .max(300, { message: "Weight must be 300 kg or less" }),
  body_fat_percent: z
    .number()
    .min(1, { message: "Body fat must be at least 1%" })
    .max(60, { message: "Body fat must be 60% or less" })
    .optional()
    .nullable(),
  chest_cm: z
    .number()
    .min(50, { message: "Chest must be at least 50 cm" })
    .max(200, { message: "Chest must be 200 cm or less" })
    .optional()
    .nullable(),
  waist_cm: z
    .number()
    .min(40, { message: "Waist must be at least 40 cm" })
    .max(200, { message: "Waist must be 200 cm or less" })
    .optional()
    .nullable(),
  hips_cm: z
    .number()
    .min(50, { message: "Hips must be at least 50 cm" })
    .max(200, { message: "Hips must be 200 cm or less" })
    .optional()
    .nullable(),
  arms_cm: z
    .number()
    .min(15, { message: "Arms must be at least 15 cm" })
    .max(60, { message: "Arms must be 60 cm or less" })
    .optional()
    .nullable(),
  thighs_cm: z
    .number()
    .min(30, { message: "Thighs must be at least 30 cm" })
    .max(100, { message: "Thighs must be 100 cm or less" })
    .optional()
    .nullable(),

  // Step 2: Photos (URLs from storage)
  photo_front: z.string().optional().nullable(),
  photo_side: z.string().optional().nullable(),
  photo_back: z.string().optional().nullable(),

  // Step 3: Subjective Ratings (1-10 scale)
  energy_rating: z
    .number()
    .min(1, { message: "Rating must be between 1 and 10" })
    .max(10, { message: "Rating must be between 1 and 10" }),
  sleep_rating: z
    .number()
    .min(1, { message: "Rating must be between 1 and 10" })
    .max(10, { message: "Rating must be between 1 and 10" }),
  stress_rating: z
    .number()
    .min(1, { message: "Rating must be between 1 and 10" })
    .max(10, { message: "Rating must be between 1 and 10" }),
  mood_rating: z
    .number()
    .min(1, { message: "Rating must be between 1 and 10" })
    .max(10, { message: "Rating must be between 1 and 10" }),

  // Step 4: Compliance & Notes (0-100%)
  diet_adherence: z
    .number()
    .min(0, { message: "Adherence must be between 0 and 100%" })
    .max(100, { message: "Adherence must be between 0 and 100%" }),
  workout_adherence: z
    .number()
    .min(0, { message: "Adherence must be between 0 and 100%" })
    .max(100, { message: "Adherence must be between 0 and 100%" }),
  challenges: z.string().max(1000, { message: "Maximum 1000 characters" }).optional().nullable(),
  progress_notes: z
    .string()
    .max(1000, { message: "Maximum 1000 characters" })
    .optional()
    .nullable(),
  questions: z.string().max(1000, { message: "Maximum 1000 characters" }).optional().nullable(),
});

export type CheckInFormData = z.infer<typeof checkInSchema>;

/**
 * Step 1 validation - just weight required
 */
export const checkInStep1Schema = checkInSchema.pick({
  weight: true,
  body_fat_percent: true,
  chest_cm: true,
  waist_cm: true,
  hips_cm: true,
  arms_cm: true,
  thighs_cm: true,
});

/**
 * Meal types for food items.
 */
export const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "pre-workout", label: "Pre-Workout" },
  { value: "post-workout", label: "Post-Workout" },
] as const;

export type MealType = (typeof MEAL_TYPES)[number]["value"];

/**
 * Food item validation schema.
 * Validates food item data for the admin food database.
 */
export const foodItemSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be 100 characters or less" }),
  calories: z
    .number({
      message: "Calories is required and must be a number",
    })
    .min(0, { message: "Calories must be at least 0" })
    .max(5000, { message: "Calories must be 5000 or less" }),
  protein: z
    .number({
      message: "Protein is required and must be a number",
    })
    .min(0, { message: "Protein must be at least 0" })
    .max(500, { message: "Protein must be 500g or less" }),
  carbs: z
    .number()
    .min(0, { message: "Carbs must be at least 0" })
    .max(500, { message: "Carbs must be 500g or less" })
    .optional()
    .nullable(),
  fats: z
    .number()
    .min(0, { message: "Fats must be at least 0" })
    .max(500, { message: "Fats must be 500g or less" })
    .optional()
    .nullable(),
  serving_size: z
    .string()
    .min(1, { message: "Serving size is required" })
    .max(50, { message: "Serving size must be 50 characters or less" }),
  is_vegetarian: z.boolean(),
  meal_types: z
    .array(z.enum(["breakfast", "lunch", "dinner", "snack", "pre-workout", "post-workout"]))
    .optional()
    .nullable(),
});

export type FoodItemFormData = z.infer<typeof foodItemSchema>;
