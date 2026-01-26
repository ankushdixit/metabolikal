/**
 * Tests for database types
 *
 * These tests verify that the TypeScript types correctly represent
 * the database schema and can be used properly in application code.
 */

import type {
  Database,
  Tables,
  InsertTables,
  UpdateTables,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  FoodItem,
  FoodItemInsert,
  DietPlan,
  DietPlanInsert,
  FoodAlternative,
  WorkoutPlan,
  WorkoutPlanInsert,
  FoodLog,
  FoodLogInsert,
  WorkoutLog,
  WorkoutLogInsert,
  CheckIn,
  CheckInInsert,
  ChallengeProgress,
  ChallengeProgressInsert,
  AssessmentResult,
  AssessmentResultInsert,
  UserRole,
  MealCategory,
  WorkoutSection,
  Gender,
  Goal,
} from "../database.types";

describe("Database Types", () => {
  describe("Type Aliases", () => {
    it("should export Tables type helper", () => {
      // Type-level test - if this compiles, the type works
      const profile: Tables<"profiles"> = {
        id: "123",
        email: "test@example.com",
        full_name: "Test User",
        phone: null,
        role: "client",
        avatar_url: null,
        date_of_birth: null,
        gender: null,
        address: null,
        invited_at: null,
        invitation_accepted_at: null,
        is_deactivated: false,
        deactivated_at: null,
        deactivation_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(profile.id).toBe("123");
    });

    it("should export InsertTables type helper", () => {
      const profileInsert: InsertTables<"profiles"> = {
        id: "123",
        email: "test@example.com",
        full_name: "Test User",
        // Optional fields can be omitted
      };
      expect(profileInsert.email).toBe("test@example.com");
    });

    it("should export UpdateTables type helper", () => {
      const profileUpdate: UpdateTables<"profiles"> = {
        full_name: "Updated Name",
        // All fields are optional for updates
      };
      expect(profileUpdate.full_name).toBe("Updated Name");
    });
  });

  describe("Profile Types", () => {
    it("should correctly type Profile row", () => {
      const profile: Profile = {
        id: "user-123",
        email: "user@example.com",
        full_name: "John Doe",
        phone: "+1234567890",
        role: "client",
        avatar_url: "https://example.com/avatar.jpg",
        date_of_birth: "1990-05-15",
        gender: "male",
        address: "123 Main St",
        invited_at: "2026-01-19T00:00:00Z",
        invitation_accepted_at: null,
        is_deactivated: false,
        deactivated_at: null,
        deactivation_reason: null,
        created_at: "2026-01-19T00:00:00Z",
        updated_at: "2026-01-19T00:00:00Z",
      };
      expect(profile.role).toBe("client");
    });

    it("should correctly type ProfileInsert with required fields", () => {
      const insert: ProfileInsert = {
        id: "user-123",
        email: "user@example.com",
        full_name: "John Doe",
      };
      expect(insert.id).toBeDefined();
      expect(insert.email).toBeDefined();
      expect(insert.full_name).toBeDefined();
    });

    it("should correctly type ProfileUpdate with optional fields", () => {
      const update: ProfileUpdate = {
        phone: "+1234567890",
      };
      expect(update.phone).toBe("+1234567890");
    });

    it("should enforce UserRole enum", () => {
      const role: UserRole = "admin";
      expect(["admin", "client"]).toContain(role);
    });
  });

  describe("FoodItem Types", () => {
    it("should correctly type FoodItem row", () => {
      const foodItem: FoodItem = {
        id: "food-123",
        name: "Grilled Chicken Breast",
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        serving_size: "100g",
        is_vegetarian: false,
        meal_types: ["lunch", "dinner"],
        raw_quantity: "100g raw",
        cooked_quantity: "75g cooked",
        created_at: "2026-01-19T00:00:00Z",
        updated_at: "2026-01-19T00:00:00Z",
      };
      expect(foodItem.calories).toBe(165);
    });

    it("should correctly type FoodItemInsert with required fields", () => {
      const insert: FoodItemInsert = {
        name: "Brown Rice",
        calories: 216,
        protein: 5,
        serving_size: "1 cup cooked",
      };
      expect(insert.name).toBeDefined();
      expect(insert.calories).toBeDefined();
      expect(insert.protein).toBeDefined();
      expect(insert.serving_size).toBeDefined();
    });
  });

  describe("DietPlan Types", () => {
    it("should correctly type DietPlan row", () => {
      const dietPlan: DietPlan = {
        id: "plan-123",
        client_id: "user-123",
        day_number: 1,
        meal_category: "breakfast",
        food_item_id: "food-123",
        serving_multiplier: 1.5,
        notes: "Add extra protein",
        // Timeline scheduling fields
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "morning",
        relative_anchor: null,
        relative_offset_minutes: 0,
        created_at: "2026-01-19T00:00:00Z",
        updated_at: "2026-01-19T00:00:00Z",
      };
      expect(dietPlan.meal_category).toBe("breakfast");
    });

    it("should enforce MealCategory enum", () => {
      const category: MealCategory = "pre-workout";
      const validCategories = [
        "pre-workout",
        "post-workout",
        "breakfast",
        "lunch",
        "evening-snack",
        "dinner",
      ];
      expect(validCategories).toContain(category);
    });

    it("should correctly type DietPlanInsert with required fields", () => {
      const insert: DietPlanInsert = {
        client_id: "user-123",
      };
      expect(insert.client_id).toBeDefined();
    });
  });

  describe("FoodAlternative Types", () => {
    it("should correctly type FoodAlternative row", () => {
      const alternative: FoodAlternative = {
        id: "alt-123",
        diet_plan_id: "plan-123",
        food_item_id: "food-456",
        is_optimal: true,
        display_order: 1,
        created_at: "2026-01-19T00:00:00Z",
      };
      expect(alternative.is_optimal).toBe(true);
    });
  });

  describe("WorkoutPlan Types", () => {
    it("should correctly type WorkoutPlan row", () => {
      const workoutPlan: WorkoutPlan = {
        id: "workout-123",
        client_id: "user-123",
        day_number: 1,
        exercise_name: "Squats",
        sets: 4,
        reps: 12,
        duration_minutes: null,
        rest_seconds: 90,
        instructions: "Keep back straight",
        video_url: "https://example.com/video.mp4",
        section: "main",
        display_order: 1,
        // Timeline scheduling fields
        exercise_id: null,
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "morning",
        relative_anchor: null,
        relative_offset_minutes: 0,
        scheduled_duration_minutes: 60,
        created_at: "2026-01-19T00:00:00Z",
        updated_at: "2026-01-19T00:00:00Z",
      };
      expect(workoutPlan.exercise_name).toBe("Squats");
    });

    it("should enforce WorkoutSection enum", () => {
      const section: WorkoutSection = "warmup";
      expect(["warmup", "main", "cooldown"]).toContain(section);
    });

    it("should correctly type WorkoutPlanInsert with required fields", () => {
      const insert: WorkoutPlanInsert = {
        client_id: "user-123",
        exercise_name: "Push-ups",
      };
      expect(insert.client_id).toBeDefined();
      expect(insert.exercise_name).toBeDefined();
    });
  });

  describe("FoodLog Types", () => {
    it("should correctly type FoodLog row", () => {
      const foodLog: FoodLog = {
        id: "log-123",
        client_id: "user-123",
        logged_at: "2026-01-19T12:00:00Z",
        food_item_id: "food-123",
        food_name: "Grilled Chicken",
        calories: 165,
        protein: 31,
        serving_multiplier: 1.0,
        meal_category: "lunch",
        created_at: "2026-01-19T12:00:00Z",
      };
      expect(foodLog.calories).toBe(165);
    });

    it("should correctly type FoodLogInsert with required fields", () => {
      const insert: FoodLogInsert = {
        client_id: "user-123",
        calories: 200,
        protein: 25,
        meal_category: "dinner",
      };
      expect(insert.client_id).toBeDefined();
      expect(insert.calories).toBeDefined();
      expect(insert.protein).toBeDefined();
      expect(insert.meal_category).toBeDefined();
    });
  });

  describe("WorkoutLog Types", () => {
    it("should correctly type WorkoutLog row", () => {
      const workoutLog: WorkoutLog = {
        id: "log-123",
        client_id: "user-123",
        workout_plan_id: "workout-123",
        completed_at: "2026-01-19T08:00:00Z",
        notes: "Felt strong today",
      };
      expect(workoutLog.notes).toBe("Felt strong today");
    });

    it("should correctly type WorkoutLogInsert with required fields", () => {
      const insert: WorkoutLogInsert = {
        client_id: "user-123",
      };
      expect(insert.client_id).toBeDefined();
    });
  });

  describe("CheckIn Types", () => {
    it("should correctly type CheckIn row", () => {
      const checkIn: CheckIn = {
        id: "checkin-123",
        client_id: "user-123",
        submitted_at: "2026-01-19T00:00:00Z",
        weight: 75.5,
        body_fat_percent: 18.5,
        chest_cm: 100,
        waist_cm: 80,
        hips_cm: 95,
        arms_cm: 35,
        thighs_cm: 55,
        photo_front: "front.jpg",
        photo_side: "side.jpg",
        photo_back: "back.jpg",
        energy_rating: 8,
        sleep_rating: 7,
        stress_rating: 4,
        mood_rating: 8,
        diet_adherence: 90,
        workout_adherence: 85,
        challenges: "Late night cravings",
        progress_notes: "Seeing good progress",
        questions: "Should I increase protein?",
        admin_notes: "Good progress, keep it up",
        flagged_for_followup: false,
        reviewed_at: "2026-01-19T12:00:00Z",
        reviewed_by: "admin-123",
        created_at: "2026-01-19T00:00:00Z",
      };
      expect(checkIn.weight).toBe(75.5);
    });

    it("should correctly type CheckInInsert with required fields", () => {
      const insert: CheckInInsert = {
        client_id: "user-123",
        weight: 75.5,
      };
      expect(insert.client_id).toBeDefined();
      expect(insert.weight).toBeDefined();
    });
  });

  describe("ChallengeProgress Types", () => {
    it("should correctly type ChallengeProgress row", () => {
      const progress: ChallengeProgress = {
        id: "progress-123",
        visitor_id: "visitor-abc",
        user_id: null,
        day_number: 5,
        logged_date: "2026-01-19",
        steps: 10000,
        water_liters: 2.5,
        floors_climbed: 10,
        protein_grams: 150,
        sleep_hours: 7.5,
        feeling: "energized",
        tomorrow_focus: "Hit 12k steps",
        points_earned: 50,
        created_at: "2026-01-19T00:00:00Z",
        updated_at: "2026-01-19T00:00:00Z",
      };
      expect(progress.day_number).toBe(5);
    });

    it("should correctly type ChallengeProgressInsert with required fields", () => {
      const insert: ChallengeProgressInsert = {
        visitor_id: "visitor-abc",
      };
      expect(insert.visitor_id).toBeDefined();
    });
  });

  describe("AssessmentResult Types", () => {
    it("should correctly type AssessmentResult row", () => {
      const result: AssessmentResult = {
        id: "result-123",
        visitor_id: "visitor-abc",
        user_id: null,
        assessed_at: "2026-01-19T00:00:00Z",
        sleep_score: 7,
        body_score: 6,
        nutrition_score: 5,
        mental_score: 8,
        stress_score: 4,
        support_score: 7,
        hydration_score: 6,
        gender: "male",
        age: 35,
        weight_kg: 80,
        height_cm: 180,
        body_fat_percent: 20,
        activity_level: "moderate",
        medical_conditions: ["none"],
        metabolic_impact_percent: -15,
        goal: "fat_loss",
        goal_weight_kg: 75,
        bmr: 1800,
        tdee: 2500,
        target_calories: 2000,
        health_score: 65,
        lifestyle_score: 70,
        created_at: "2026-01-19T00:00:00Z",
      };
      expect(result.goal).toBe("fat_loss");
    });

    it("should enforce Gender enum", () => {
      const gender: Gender = "male";
      expect(["male", "female"]).toContain(gender);
    });

    it("should enforce Goal enum", () => {
      const goal: Goal = "muscle_gain";
      expect(["fat_loss", "maintain", "muscle_gain"]).toContain(goal);
    });

    it("should correctly type AssessmentResultInsert with required fields", () => {
      const insert: AssessmentResultInsert = {
        visitor_id: "visitor-abc",
      };
      expect(insert.visitor_id).toBeDefined();
    });
  });

  describe("Database Interface", () => {
    it("should have public schema with Tables", () => {
      // Type-level test - verifies Database interface structure
      type TableNames = keyof Database["public"]["Tables"];
      const expectedTables: TableNames[] = [
        "profiles",
        "food_items",
        "diet_plans",
        "food_alternatives",
        "workout_plans",
        "food_logs",
        "workout_logs",
        "check_ins",
        "challenge_progress",
        "assessment_results",
      ];

      // This test verifies the type structure at compile time
      expect(expectedTables.length).toBe(10);
    });
  });
});
