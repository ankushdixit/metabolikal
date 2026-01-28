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
  medicalConditions: z.array(z.string()),
  /**
   * Pre-calculated metabolic impact percentage from selected conditions.
   * This is calculated from database conditions in the calculator modal
   * and passed along with the form data.
   */
  metabolicImpactPercent: z.number().min(0).max(100),
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
  // meal_types is now dynamic from database, so accept any string array
  meal_types: z.array(z.string()).optional().nullable(),
  // Quantity information for raw vs cooked tracking
  raw_quantity: z
    .string()
    .max(50, { message: "Raw quantity must be 50 characters or less" })
    .optional()
    .nullable(),
  cooked_quantity: z
    .string()
    .max(50, { message: "Cooked quantity must be 50 characters or less" })
    .optional()
    .nullable(),
  // Avoid for conditions - array of condition IDs
  avoid_for_conditions: z.array(z.string().uuid()).optional().nullable(),
  // Food alternatives - array of food item IDs
  alternative_food_ids: z.array(z.string().uuid()).optional().nullable(),
});

export type FoodItemFormData = z.infer<typeof foodItemSchema>;

/**
 * Client creation validation schema.
 * Used by admin to create new client accounts with invite.
 */
export const createClientSchema = z.object({
  full_name: z
    .string()
    .min(1, { message: "Full name is required" })
    .max(100, { message: "Full name must be 100 characters or less" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message: "Invalid phone number format (use E.164: +1234567890)",
    })
    .optional()
    .or(z.literal("")),
  date_of_birth: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Please enter a valid date" }
    )
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        const today = new Date();
        return date < today;
      },
      { message: "Date of birth must be in the past" }
    ),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  address: z.string().max(500, { message: "Address must be 500 characters or less" }).optional(),
  plan_start_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Please enter a valid date" }
    ),
  plan_duration_days: z
    .number()
    .int({ message: "Duration must be a whole number" })
    .min(1, { message: "Duration must be at least 1 day" })
    .max(365, { message: "Duration must be 365 days or less" })
    .optional(),
  condition_ids: z.array(z.string().uuid()).optional(),
});

export type CreateClientFormData = z.infer<typeof createClientSchema>;

/**
 * Client update validation schema.
 * Used by admin to update existing client profiles.
 * Similar to createClientSchema but all fields optional except required identifiers.
 */
export const updateClientSchema = z.object({
  full_name: z
    .string()
    .min(1, { message: "Full name is required" })
    .max(100, { message: "Full name must be 100 characters or less" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message: "Invalid phone number format (use E.164: +1234567890)",
    })
    .optional()
    .or(z.literal(""))
    .nullable(),
  date_of_birth: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Please enter a valid date" }
    )
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        const today = new Date();
        return date < today;
      },
      { message: "Date of birth must be in the past" }
    ),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional().nullable(),
  address: z
    .string()
    .max(500, { message: "Address must be 500 characters or less" })
    .optional()
    .nullable(),
  plan_start_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Please enter a valid date" }
    ),
  plan_duration_days: z
    .number()
    .int({ message: "Duration must be a whole number" })
    .min(1, { message: "Duration must be at least 1 day" })
    .max(365, { message: "Duration must be 365 days or less" })
    .optional()
    .nullable(),
  condition_ids: z.array(z.string().uuid()).optional().nullable(),
});

export type UpdateClientFormData = z.infer<typeof updateClientSchema>;

/**
 * Supplement categories for the supplements database.
 */
export const SUPPLEMENT_CATEGORIES = [
  { value: "vitamin", label: "Vitamin" },
  { value: "mineral", label: "Mineral" },
  { value: "protein", label: "Protein" },
  { value: "amino_acid", label: "Amino Acid" },
  { value: "fatty_acid", label: "Fatty Acid" },
  { value: "herbal", label: "Herbal" },
  { value: "probiotic", label: "Probiotic" },
  { value: "other", label: "Other" },
] as const;

export type SupplementCategoryValue = (typeof SUPPLEMENT_CATEGORIES)[number]["value"];

/**
 * Supplement validation schema.
 * Validates supplement data for the admin supplements database.
 */
export const supplementSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be 100 characters or less" }),
  category: z.enum(
    ["vitamin", "mineral", "protein", "amino_acid", "fatty_acid", "herbal", "probiotic", "other"],
    { message: "Please select a category" }
  ),
  default_dosage: z
    .number({
      message: "Dosage is required and must be a number",
    })
    .positive({ message: "Dosage must be positive" })
    .max(10000, { message: "Dosage must be 10000 or less" }),
  dosage_unit: z
    .string()
    .min(1, { message: "Dosage unit is required" })
    .max(20, { message: "Dosage unit must be 20 characters or less" }),
  instructions: z
    .string()
    .max(500, { message: "Instructions must be 500 characters or less" })
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, { message: "Notes must be 500 characters or less" })
    .optional()
    .nullable(),
  is_active: z.boolean(),
});

export type SupplementFormData = z.infer<typeof supplementSchema>;

/**
 * Exercise categories for the exercises database.
 */
export const EXERCISE_CATEGORIES = [
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" },
  { value: "balance", label: "Balance" },
  { value: "hiit", label: "HIIT" },
  { value: "warmup", label: "Warmup" },
  { value: "cooldown", label: "Cooldown" },
  { value: "other", label: "Other" },
] as const;

export type ExerciseCategoryValue = (typeof EXERCISE_CATEGORIES)[number]["value"];

/**
 * Muscle groups for the exercises database.
 */
export const MUSCLE_GROUPS = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "forearms", label: "Forearms" },
  { value: "core", label: "Core" },
  { value: "quadriceps", label: "Quadriceps" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Calves" },
  { value: "full_body", label: "Full Body" },
  { value: "other", label: "Other" },
] as const;

export type MuscleGroupValue = (typeof MUSCLE_GROUPS)[number]["value"];

/**
 * Exercise validation schema.
 * Validates exercise data for the admin exercises database.
 */
export const exerciseSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be 100 characters or less" }),
  category: z.enum(
    ["strength", "cardio", "flexibility", "balance", "hiit", "warmup", "cooldown", "other"],
    { message: "Please select a category" }
  ),
  muscle_group: z.enum(
    [
      "chest",
      "back",
      "shoulders",
      "biceps",
      "triceps",
      "forearms",
      "core",
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "full_body",
      "other",
    ],
    { message: "Please select a muscle group" }
  ),
  equipment: z
    .string()
    .max(50, { message: "Equipment must be 50 characters or less" })
    .optional()
    .nullable(),
  default_sets: z
    .number()
    .int({ message: "Sets must be a whole number" })
    .positive({ message: "Sets must be positive" })
    .max(20, { message: "Sets must be 20 or less" })
    .optional()
    .nullable(),
  default_reps: z
    .number()
    .int({ message: "Reps must be a whole number" })
    .positive({ message: "Reps must be positive" })
    .max(100, { message: "Reps must be 100 or less" })
    .optional()
    .nullable(),
  default_duration_seconds: z
    .number()
    .int({ message: "Duration must be a whole number" })
    .positive({ message: "Duration must be positive" })
    .max(3600, { message: "Duration must be 3600 seconds or less" })
    .optional()
    .nullable(),
  rest_seconds: z
    .number()
    .int({ message: "Rest must be a whole number" })
    .nonnegative({ message: "Rest cannot be negative" })
    .max(600, { message: "Rest must be 600 seconds or less" })
    .optional()
    .nullable(),
  instructions: z
    .string()
    .max(1000, { message: "Instructions must be 1000 characters or less" })
    .optional()
    .nullable(),
  video_url: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .max(500, { message: "URL must be 500 characters or less" })
    .optional()
    .nullable()
    .or(z.literal("")),
  thumbnail_url: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .max(500, { message: "URL must be 500 characters or less" })
    .optional()
    .nullable()
    .or(z.literal("")),
  difficulty_level: z
    .number()
    .int({ message: "Difficulty must be a whole number" })
    .min(1, { message: "Difficulty must be between 1 and 5" })
    .max(5, { message: "Difficulty must be between 1 and 5" })
    .optional()
    .nullable(),
  is_active: z.boolean().optional().nullable(),
});

export type ExerciseFormData = z.infer<typeof exerciseSchema>;

/**
 * Lifestyle activity categories for the lifestyle activities library.
 */
export const LIFESTYLE_ACTIVITY_CATEGORIES = [
  { value: "movement", label: "Movement" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "sleep", label: "Sleep" },
  { value: "hydration", label: "Hydration" },
  { value: "sunlight", label: "Sunlight" },
  { value: "social", label: "Social" },
  { value: "recovery", label: "Recovery" },
  { value: "other", label: "Other" },
] as const;

export type LifestyleActivityCategoryValue =
  (typeof LIFESTYLE_ACTIVITY_CATEGORIES)[number]["value"];

/**
 * Available icons for lifestyle activity types.
 */
export const LIFESTYLE_ACTIVITY_ICONS = [
  { value: "footprints", label: "Footprints" },
  { value: "sun", label: "Sun" },
  { value: "book-open", label: "Book" },
  { value: "droplet", label: "Water Drop" },
  { value: "moon", label: "Moon" },
  { value: "users", label: "Users" },
  { value: "heart", label: "Heart" },
  { value: "zap", label: "Energy" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "leaf", label: "Leaf" },
  { value: "brain", label: "Brain" },
  { value: "clock", label: "Clock" },
] as const;

export type LifestyleActivityIconValue = (typeof LIFESTYLE_ACTIVITY_ICONS)[number]["value"];

/**
 * Lifestyle activity type validation schema.
 * Validates activity type data for the admin lifestyle activities library.
 */
export const lifestyleActivityTypeSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be 100 characters or less" }),
  category: z.enum(
    ["movement", "mindfulness", "sleep", "hydration", "sunlight", "social", "recovery", "other"],
    { message: "Please select a category" }
  ),
  default_target_value: z
    .number()
    .positive({ message: "Target must be positive" })
    .max(100000, { message: "Target must be 100000 or less" })
    .optional()
    .nullable(),
  target_unit: z
    .string()
    .max(30, { message: "Unit must be 30 characters or less" })
    .optional()
    .nullable(),
  description: z
    .string()
    .max(500, { message: "Description must be 500 characters or less" })
    .optional()
    .nullable(),
  rationale: z
    .string()
    .max(1000, { message: "Rationale must be 1000 characters or less" })
    .optional()
    .nullable(),
  icon: z.string().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
});

export type LifestyleActivityTypeFormData = z.infer<typeof lifestyleActivityTypeSchema>;
