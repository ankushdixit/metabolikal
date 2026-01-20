/**
 * Database types for METABOLI-K-AL
 *
 * These types mirror the Supabase database schema defined in
 * supabase/migrations/20260119000000_initial_schema.sql
 *
 * In production, these would typically be auto-generated using:
 * npx supabase gen types typescript --project-id <your-project-id> > lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "client" | "challenger";

export type MealCategory =
  | "pre-workout"
  | "post-workout"
  | "breakfast"
  | "lunch"
  | "evening-snack"
  | "dinner";

export type WorkoutSection = "warmup" | "main" | "cooldown";

export type Gender = "male" | "female";

export type Goal = "fat_loss" | "maintain" | "muscle_gain";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      food_items: {
        Row: {
          id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number | null;
          fats: number | null;
          serving_size: string;
          is_vegetarian: boolean;
          meal_types: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          calories: number;
          protein: number;
          carbs?: number | null;
          fats?: number | null;
          serving_size: string;
          is_vegetarian?: boolean;
          meal_types?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          calories?: number;
          protein?: number;
          carbs?: number | null;
          fats?: number | null;
          serving_size?: string;
          is_vegetarian?: boolean;
          meal_types?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      diet_plans: {
        Row: {
          id: string;
          client_id: string;
          day_number: number | null;
          meal_category: MealCategory | null;
          food_item_id: string | null;
          serving_multiplier: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          day_number?: number | null;
          meal_category?: MealCategory | null;
          food_item_id?: string | null;
          serving_multiplier?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          day_number?: number | null;
          meal_category?: MealCategory | null;
          food_item_id?: string | null;
          serving_multiplier?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diet_plans_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diet_plans_food_item_id_fkey";
            columns: ["food_item_id"];
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
        ];
      };
      food_alternatives: {
        Row: {
          id: string;
          diet_plan_id: string | null;
          food_item_id: string | null;
          is_optimal: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          diet_plan_id?: string | null;
          food_item_id?: string | null;
          is_optimal?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          diet_plan_id?: string | null;
          food_item_id?: string | null;
          is_optimal?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_alternatives_diet_plan_id_fkey";
            columns: ["diet_plan_id"];
            referencedRelation: "diet_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_alternatives_food_item_id_fkey";
            columns: ["food_item_id"];
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_plans: {
        Row: {
          id: string;
          client_id: string;
          day_number: number | null;
          exercise_name: string;
          sets: number | null;
          reps: number | null;
          duration_minutes: number | null;
          rest_seconds: number;
          instructions: string | null;
          video_url: string | null;
          section: WorkoutSection | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          day_number?: number | null;
          exercise_name: string;
          sets?: number | null;
          reps?: number | null;
          duration_minutes?: number | null;
          rest_seconds?: number;
          instructions?: string | null;
          video_url?: string | null;
          section?: WorkoutSection | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          day_number?: number | null;
          exercise_name?: string;
          sets?: number | null;
          reps?: number | null;
          duration_minutes?: number | null;
          rest_seconds?: number;
          instructions?: string | null;
          video_url?: string | null;
          section?: WorkoutSection | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_plans_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      food_logs: {
        Row: {
          id: string;
          client_id: string;
          logged_at: string;
          food_item_id: string | null;
          food_name: string | null;
          calories: number;
          protein: number;
          serving_multiplier: number;
          meal_category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          logged_at?: string;
          food_item_id?: string | null;
          food_name?: string | null;
          calories: number;
          protein: number;
          serving_multiplier?: number;
          meal_category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          logged_at?: string;
          food_item_id?: string | null;
          food_name?: string | null;
          calories?: number;
          protein?: number;
          serving_multiplier?: number;
          meal_category?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_logs_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_logs_food_item_id_fkey";
            columns: ["food_item_id"];
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_logs: {
        Row: {
          id: string;
          client_id: string;
          workout_plan_id: string | null;
          completed_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          workout_plan_id?: string | null;
          completed_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          workout_plan_id?: string | null;
          completed_at?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_logs_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_logs_workout_plan_id_fkey";
            columns: ["workout_plan_id"];
            referencedRelation: "workout_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      check_ins: {
        Row: {
          id: string;
          client_id: string;
          submitted_at: string;
          weight: number;
          body_fat_percent: number | null;
          chest_cm: number | null;
          waist_cm: number | null;
          hips_cm: number | null;
          arms_cm: number | null;
          thighs_cm: number | null;
          photo_front: string | null;
          photo_side: string | null;
          photo_back: string | null;
          energy_rating: number | null;
          sleep_rating: number | null;
          stress_rating: number | null;
          mood_rating: number | null;
          diet_adherence: number | null;
          workout_adherence: number | null;
          challenges: string | null;
          progress_notes: string | null;
          questions: string | null;
          admin_notes: string | null;
          flagged_for_followup: boolean;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          submitted_at?: string;
          weight: number;
          body_fat_percent?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          hips_cm?: number | null;
          arms_cm?: number | null;
          thighs_cm?: number | null;
          photo_front?: string | null;
          photo_side?: string | null;
          photo_back?: string | null;
          energy_rating?: number | null;
          sleep_rating?: number | null;
          stress_rating?: number | null;
          mood_rating?: number | null;
          diet_adherence?: number | null;
          workout_adherence?: number | null;
          challenges?: string | null;
          progress_notes?: string | null;
          questions?: string | null;
          admin_notes?: string | null;
          flagged_for_followup?: boolean;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          submitted_at?: string;
          weight?: number;
          body_fat_percent?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          hips_cm?: number | null;
          arms_cm?: number | null;
          thighs_cm?: number | null;
          photo_front?: string | null;
          photo_side?: string | null;
          photo_back?: string | null;
          energy_rating?: number | null;
          sleep_rating?: number | null;
          stress_rating?: number | null;
          mood_rating?: number | null;
          diet_adherence?: number | null;
          workout_adherence?: number | null;
          challenges?: string | null;
          progress_notes?: string | null;
          questions?: string | null;
          admin_notes?: string | null;
          flagged_for_followup?: boolean;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "check_ins_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_ins_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_progress: {
        Row: {
          id: string;
          visitor_id: string;
          user_id: string | null;
          day_number: number | null;
          logged_date: string;
          steps: number;
          water_liters: number;
          floors_climbed: number;
          protein_grams: number;
          sleep_hours: number;
          feeling: string | null;
          tomorrow_focus: string | null;
          points_earned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          user_id?: string | null;
          day_number?: number | null;
          logged_date?: string;
          steps?: number;
          water_liters?: number;
          floors_climbed?: number;
          protein_grams?: number;
          sleep_hours?: number;
          feeling?: string | null;
          tomorrow_focus?: string | null;
          points_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          user_id?: string | null;
          day_number?: number | null;
          logged_date?: string;
          steps?: number;
          water_liters?: number;
          floors_climbed?: number;
          protein_grams?: number;
          sleep_hours?: number;
          feeling?: string | null;
          tomorrow_focus?: string | null;
          points_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_progress_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_results: {
        Row: {
          id: string;
          visitor_id: string;
          user_id: string | null;
          assessed_at: string;
          sleep_score: number | null;
          body_score: number | null;
          nutrition_score: number | null;
          mental_score: number | null;
          stress_score: number | null;
          support_score: number | null;
          hydration_score: number | null;
          gender: Gender | null;
          age: number | null;
          weight_kg: number | null;
          height_cm: number | null;
          body_fat_percent: number | null;
          activity_level: string | null;
          medical_conditions: string[] | null;
          metabolic_impact_percent: number | null;
          goal: Goal | null;
          goal_weight_kg: number | null;
          bmr: number | null;
          tdee: number | null;
          target_calories: number | null;
          health_score: number | null;
          lifestyle_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          user_id?: string | null;
          assessed_at?: string;
          sleep_score?: number | null;
          body_score?: number | null;
          nutrition_score?: number | null;
          mental_score?: number | null;
          stress_score?: number | null;
          support_score?: number | null;
          hydration_score?: number | null;
          gender?: Gender | null;
          age?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          body_fat_percent?: number | null;
          activity_level?: string | null;
          medical_conditions?: string[] | null;
          metabolic_impact_percent?: number | null;
          goal?: Goal | null;
          goal_weight_kg?: number | null;
          bmr?: number | null;
          tdee?: number | null;
          target_calories?: number | null;
          health_score?: number | null;
          lifestyle_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          user_id?: string | null;
          assessed_at?: string;
          sleep_score?: number | null;
          body_score?: number | null;
          nutrition_score?: number | null;
          mental_score?: number | null;
          stress_score?: number | null;
          support_score?: number | null;
          hydration_score?: number | null;
          gender?: Gender | null;
          age?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          body_fat_percent?: number | null;
          activity_level?: string | null;
          medical_conditions?: string[] | null;
          metabolic_impact_percent?: number | null;
          goal?: Goal | null;
          goal_weight_kg?: number | null;
          bmr?: number | null;
          tdee?: number | null;
          target_calories?: number | null;
          health_score?: number | null;
          lifestyle_score?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_results_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      calculator_results: {
        Row: {
          id: string;
          user_id: string;
          gender: Gender;
          age: number;
          weight_kg: number;
          height_cm: number;
          body_fat_percent: number | null;
          activity_level: string;
          goal: Goal;
          goal_weight_kg: number | null;
          medical_conditions: string[] | null;
          bmr: number;
          tdee: number;
          target_calories: number;
          protein_grams: number;
          carbs_grams: number;
          fats_grams: number;
          metabolic_impact_percent: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          gender: Gender;
          age: number;
          weight_kg: number;
          height_cm: number;
          body_fat_percent?: number | null;
          activity_level: string;
          goal: Goal;
          goal_weight_kg?: number | null;
          medical_conditions?: string[] | null;
          bmr: number;
          tdee: number;
          target_calories: number;
          protein_grams: number;
          carbs_grams: number;
          fats_grams: number;
          metabolic_impact_percent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          gender?: Gender;
          age?: number;
          weight_kg?: number;
          height_cm?: number;
          body_fat_percent?: number | null;
          activity_level?: string;
          goal?: Goal;
          goal_weight_kg?: number | null;
          medical_conditions?: string[] | null;
          bmr?: number;
          tdee?: number;
          target_calories?: number;
          protein_grams?: number;
          carbs_grams?: number;
          fats_grams?: number;
          metabolic_impact_percent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calculator_results_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type aliases for common use cases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Table-specific type exports for easier imports
export type Profile = Tables<"profiles">;
export type ProfileInsert = InsertTables<"profiles">;
export type ProfileUpdate = UpdateTables<"profiles">;

export type FoodItem = Tables<"food_items">;
export type FoodItemInsert = InsertTables<"food_items">;
export type FoodItemUpdate = UpdateTables<"food_items">;

export type DietPlan = Tables<"diet_plans">;
export type DietPlanInsert = InsertTables<"diet_plans">;
export type DietPlanUpdate = UpdateTables<"diet_plans">;

export type FoodAlternative = Tables<"food_alternatives">;
export type FoodAlternativeInsert = InsertTables<"food_alternatives">;
export type FoodAlternativeUpdate = UpdateTables<"food_alternatives">;

export type WorkoutPlan = Tables<"workout_plans">;
export type WorkoutPlanInsert = InsertTables<"workout_plans">;
export type WorkoutPlanUpdate = UpdateTables<"workout_plans">;

export type FoodLog = Tables<"food_logs">;
export type FoodLogInsert = InsertTables<"food_logs">;
export type FoodLogUpdate = UpdateTables<"food_logs">;

export type WorkoutLog = Tables<"workout_logs">;
export type WorkoutLogInsert = InsertTables<"workout_logs">;
export type WorkoutLogUpdate = UpdateTables<"workout_logs">;

export type CheckIn = Tables<"check_ins">;
export type CheckInInsert = InsertTables<"check_ins">;
export type CheckInUpdate = UpdateTables<"check_ins">;

export type ChallengeProgress = Tables<"challenge_progress">;
export type ChallengeProgressInsert = InsertTables<"challenge_progress">;
export type ChallengeProgressUpdate = UpdateTables<"challenge_progress">;

export type AssessmentResult = Tables<"assessment_results">;
export type AssessmentResultInsert = InsertTables<"assessment_results">;
export type AssessmentResultUpdate = UpdateTables<"assessment_results">;

export type CalculatorResult = Tables<"calculator_results">;
export type CalculatorResultInsert = InsertTables<"calculator_results">;
export type CalculatorResultUpdate = UpdateTables<"calculator_results">;
