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
