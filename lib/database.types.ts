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

// =============================================================================
// TIMELINE SCHEDULING TYPES
// =============================================================================

/**
 * How timeline item timing is specified
 */
export type TimeType = "fixed" | "relative" | "period" | "all_day";

/**
 * Time periods for period-based scheduling
 * Maps to approximate time ranges:
 * - early_morning: 5:00 - 7:00
 * - morning: 7:00 - 10:00
 * - midday: 10:00 - 14:00
 * - afternoon: 14:00 - 17:00
 * - evening: 17:00 - 20:00
 * - night: 20:00 - 22:00
 * - before_sleep: 22:00 - 23:59
 */
export type TimePeriod =
  | "early_morning"
  | "morning"
  | "midday"
  | "afternoon"
  | "evening"
  | "night"
  | "before_sleep";

/**
 * Anchor events for relative time scheduling
 */
export type RelativeAnchor =
  | "wake_up"
  | "pre_workout"
  | "post_workout"
  | "breakfast"
  | "lunch"
  | "evening_snack"
  | "dinner"
  | "sleep";

// =============================================================================
// CATEGORY TYPES
// =============================================================================

/**
 * Categories for supplement classification
 */
export type SupplementCategory =
  | "vitamin"
  | "mineral"
  | "protein"
  | "amino_acid"
  | "fatty_acid"
  | "herbal"
  | "probiotic"
  | "other";

/**
 * Categories for exercise classification
 */
export type ExerciseCategory =
  | "strength"
  | "cardio"
  | "flexibility"
  | "balance"
  | "hiit"
  | "warmup"
  | "cooldown"
  | "other";

/**
 * Muscle groups targeted by exercises
 */
export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "full_body"
  | "other";

/**
 * Categories for lifestyle activity classification
 */
export type LifestyleActivityCategory =
  | "movement"
  | "mindfulness"
  | "sleep"
  | "hydration"
  | "sunlight"
  | "social"
  | "recovery"
  | "other";

// =============================================================================
// SHARED SCHEDULING INTERFACE
// =============================================================================

/**
 * Timeline scheduling fields shared across all plan tables
 */
export interface TimelineScheduling {
  time_type: TimeType;
  time_start: string | null;
  time_end: string | null;
  time_period: TimePeriod | null;
  relative_anchor: RelativeAnchor | null;
  relative_offset_minutes: number;
}

export type Gender = "male" | "female";

// Extended gender type for profile information (includes additional options)
export type ProfileGender = "male" | "female" | "other" | "prefer_not_to_say";

export type Goal = "fat_loss" | "maintain" | "muscle_gain";

export type GenderRestriction = "male" | "female" | null;

export interface Database {
  public: {
    Tables: {
      meal_types: {
        Row: {
          id: string;
          name: string;
          slug: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      medical_conditions: {
        Row: {
          id: string;
          name: string;
          slug: string;
          impact_percent: number;
          gender_restriction: GenderRestriction;
          description: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          impact_percent?: number;
          gender_restriction?: GenderRestriction;
          description?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          impact_percent?: number;
          gender_restriction?: GenderRestriction;
          description?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          date_of_birth: string | null;
          gender: ProfileGender | null;
          address: string | null;
          invited_at: string | null;
          invitation_accepted_at: string | null;
          is_deactivated: boolean;
          deactivated_at: string | null;
          deactivation_reason: string | null;
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
          date_of_birth?: string | null;
          gender?: ProfileGender | null;
          address?: string | null;
          invited_at?: string | null;
          invitation_accepted_at?: string | null;
          is_deactivated?: boolean;
          deactivated_at?: string | null;
          deactivation_reason?: string | null;
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
          date_of_birth?: string | null;
          gender?: ProfileGender | null;
          address?: string | null;
          invited_at?: string | null;
          invitation_accepted_at?: string | null;
          is_deactivated?: boolean;
          deactivated_at?: string | null;
          deactivation_reason?: string | null;
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
          raw_quantity: string | null;
          cooked_quantity: string | null;
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
          raw_quantity?: string | null;
          cooked_quantity?: string | null;
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
          raw_quantity?: string | null;
          cooked_quantity?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      food_item_conditions: {
        Row: {
          id: string;
          food_item_id: string;
          condition_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          food_item_id: string;
          condition_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          food_item_id?: string;
          condition_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_item_conditions_food_item_id_fkey";
            columns: ["food_item_id"];
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_item_conditions_condition_id_fkey";
            columns: ["condition_id"];
            referencedRelation: "medical_conditions";
            referencedColumns: ["id"];
          },
        ];
      };
      food_item_alternatives: {
        Row: {
          id: string;
          food_item_id: string;
          alternative_food_id: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          food_item_id: string;
          alternative_food_id: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          food_item_id?: string;
          alternative_food_id?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_item_alternatives_food_item_id_fkey";
            columns: ["food_item_id"];
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_item_alternatives_alternative_food_id_fkey";
            columns: ["alternative_food_id"];
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
        ];
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
          // Timeline fields
          time_type: TimeType | null;
          time_start: string | null;
          time_end: string | null;
          time_period: TimePeriod | null;
          relative_anchor: RelativeAnchor | null;
          relative_offset_minutes: number;
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
          // Timeline fields
          time_type?: TimeType | null;
          time_start?: string | null;
          time_end?: string | null;
          time_period?: TimePeriod | null;
          relative_anchor?: RelativeAnchor | null;
          relative_offset_minutes?: number;
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
          // Timeline fields
          time_type?: TimeType | null;
          time_start?: string | null;
          time_end?: string | null;
          time_period?: TimePeriod | null;
          relative_anchor?: RelativeAnchor | null;
          relative_offset_minutes?: number;
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
          // Timeline fields
          exercise_id: string | null;
          time_type: TimeType | null;
          time_start: string | null;
          time_end: string | null;
          time_period: TimePeriod | null;
          relative_anchor: RelativeAnchor | null;
          relative_offset_minutes: number;
          scheduled_duration_minutes: number;
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
          // Timeline fields
          exercise_id?: string | null;
          time_type?: TimeType | null;
          time_start?: string | null;
          time_end?: string | null;
          time_period?: TimePeriod | null;
          relative_anchor?: RelativeAnchor | null;
          relative_offset_minutes?: number;
          scheduled_duration_minutes?: number;
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
          // Timeline fields
          exercise_id?: string | null;
          time_type?: TimeType | null;
          time_start?: string | null;
          time_end?: string | null;
          time_period?: TimePeriod | null;
          relative_anchor?: RelativeAnchor | null;
          relative_offset_minutes?: number;
          scheduled_duration_minutes?: number;
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
          {
            foreignKeyName: "workout_plans_exercise_id_fkey";
            columns: ["exercise_id"];
            referencedRelation: "exercises";
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
      notifications: {
        Row: {
          id: string;
          user_id: string;
          sender_id: string | null;
          type: "message" | "checkin_review" | "system";
          title: string;
          message: string;
          read_at: string | null;
          related_checkin_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sender_id?: string | null;
          type: "message" | "checkin_review" | "system";
          title: string;
          message: string;
          read_at?: string | null;
          related_checkin_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sender_id?: string | null;
          type?: "message" | "checkin_review" | "system";
          title?: string;
          message?: string;
          read_at?: string | null;
          related_checkin_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_related_checkin_id_fkey";
            columns: ["related_checkin_id"];
            referencedRelation: "check_ins";
            referencedColumns: ["id"];
          },
        ];
      };
      // =========================================================================
      // TIMELINE MASTER LIBRARY TABLES
      // =========================================================================
      supplements: {
        Row: {
          id: string;
          name: string;
          category: SupplementCategory;
          default_dosage: number;
          dosage_unit: string;
          instructions: string | null;
          notes: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: SupplementCategory;
          default_dosage?: number;
          dosage_unit?: string;
          instructions?: string | null;
          notes?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: SupplementCategory;
          default_dosage?: number;
          dosage_unit?: string;
          instructions?: string | null;
          notes?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          category: ExerciseCategory;
          muscle_group: MuscleGroup;
          equipment: string | null;
          default_sets: number | null;
          default_reps: number | null;
          default_duration_seconds: number | null;
          rest_seconds: number;
          instructions: string | null;
          video_url: string | null;
          thumbnail_url: string | null;
          difficulty_level: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: ExerciseCategory;
          muscle_group?: MuscleGroup;
          equipment?: string | null;
          default_sets?: number | null;
          default_reps?: number | null;
          default_duration_seconds?: number | null;
          rest_seconds?: number;
          instructions?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          difficulty_level?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: ExerciseCategory;
          muscle_group?: MuscleGroup;
          equipment?: string | null;
          default_sets?: number | null;
          default_reps?: number | null;
          default_duration_seconds?: number | null;
          rest_seconds?: number;
          instructions?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          difficulty_level?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lifestyle_activity_types: {
        Row: {
          id: string;
          name: string;
          category: LifestyleActivityCategory;
          default_target_value: number | null;
          target_unit: string | null;
          description: string | null;
          rationale: string | null;
          icon: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: LifestyleActivityCategory;
          default_target_value?: number | null;
          target_unit?: string | null;
          description?: string | null;
          rationale?: string | null;
          icon?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: LifestyleActivityCategory;
          default_target_value?: number | null;
          target_unit?: string | null;
          description?: string | null;
          rationale?: string | null;
          icon?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // =========================================================================
      // TIMELINE PLAN TABLES
      // =========================================================================
      supplement_plans: {
        Row: {
          id: string;
          client_id: string;
          supplement_id: string;
          day_number: number | null;
          dosage: number;
          time_type: TimeType;
          time_start: string | null;
          time_end: string | null;
          time_period: TimePeriod | null;
          relative_anchor: RelativeAnchor | null;
          relative_offset_minutes: number;
          notes: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          supplement_id: string;
          day_number?: number | null;
          dosage?: number;
          time_type?: TimeType;
          time_start?: string | null;
          time_end?: string | null;
          time_period?: TimePeriod | null;
          relative_anchor?: RelativeAnchor | null;
          relative_offset_minutes?: number;
          notes?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          supplement_id?: string;
          day_number?: number | null;
          dosage?: number;
          time_type?: TimeType;
          time_start?: string | null;
          time_end?: string | null;
          time_period?: TimePeriod | null;
          relative_anchor?: RelativeAnchor | null;
          relative_offset_minutes?: number;
          notes?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supplement_plans_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "supplement_plans_supplement_id_fkey";
            columns: ["supplement_id"];
            referencedRelation: "supplements";
            referencedColumns: ["id"];
          },
        ];
      };
      lifestyle_activity_plans: {
        Row: {
          id: string;
          client_id: string;
          activity_type_id: string;
          day_number: number | null;
          target_value: number | null;
          custom_rationale: string | null;
          time_type: TimeType;
          time_start: string | null;
          time_end: string | null;
          time_period: TimePeriod | null;
          relative_anchor: RelativeAnchor | null;
          relative_offset_minutes: number;
          notes: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          activity_type_id: string;
          day_number?: number | null;
          target_value?: number | null;
          custom_rationale?: string | null;
          time_type?: TimeType;
          time_start?: string | null;
          time_end?: string | null;
          time_period?: TimePeriod | null;
          relative_anchor?: RelativeAnchor | null;
          relative_offset_minutes?: number;
          notes?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          activity_type_id?: string;
          day_number?: number | null;
          target_value?: number | null;
          custom_rationale?: string | null;
          time_type?: TimeType;
          time_start?: string | null;
          time_end?: string | null;
          time_period?: TimePeriod | null;
          relative_anchor?: RelativeAnchor | null;
          relative_offset_minutes?: number;
          notes?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lifestyle_activity_plans_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lifestyle_activity_plans_activity_type_id_fkey";
            columns: ["activity_type_id"];
            referencedRelation: "lifestyle_activity_types";
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

export type Notification = Tables<"notifications">;
export type NotificationInsert = InsertTables<"notifications">;
export type NotificationUpdate = UpdateTables<"notifications">;

export type NotificationType = "message" | "checkin_review" | "system";

export type MealTypeRow = Tables<"meal_types">;
export type MealTypeInsert = InsertTables<"meal_types">;
export type MealTypeUpdate = UpdateTables<"meal_types">;

export type MedicalConditionRow = Tables<"medical_conditions">;
export type MedicalConditionInsert = InsertTables<"medical_conditions">;
export type MedicalConditionUpdate = UpdateTables<"medical_conditions">;

export type FoodItemCondition = Tables<"food_item_conditions">;
export type FoodItemConditionInsert = InsertTables<"food_item_conditions">;
export type FoodItemConditionUpdate = UpdateTables<"food_item_conditions">;

export type FoodItemAlternativeRow = Tables<"food_item_alternatives">;
export type FoodItemAlternativeInsert = InsertTables<"food_item_alternatives">;
export type FoodItemAlternativeUpdate = UpdateTables<"food_item_alternatives">;

// =============================================================================
// TIMELINE MASTER LIBRARY TYPE EXPORTS
// =============================================================================

export type Supplement = Tables<"supplements">;
export type SupplementInsert = InsertTables<"supplements">;
export type SupplementUpdate = UpdateTables<"supplements">;

export type Exercise = Tables<"exercises">;
export type ExerciseInsert = InsertTables<"exercises">;
export type ExerciseUpdate = UpdateTables<"exercises">;

export type LifestyleActivityType = Tables<"lifestyle_activity_types">;
export type LifestyleActivityTypeInsert = InsertTables<"lifestyle_activity_types">;
export type LifestyleActivityTypeUpdate = UpdateTables<"lifestyle_activity_types">;

// =============================================================================
// TIMELINE PLAN TYPE EXPORTS
// =============================================================================

export type SupplementPlan = Tables<"supplement_plans">;
export type SupplementPlanInsert = InsertTables<"supplement_plans">;
export type SupplementPlanUpdate = UpdateTables<"supplement_plans">;

export type LifestyleActivityPlan = Tables<"lifestyle_activity_plans">;
export type LifestyleActivityPlanInsert = InsertTables<"lifestyle_activity_plans">;
export type LifestyleActivityPlanUpdate = UpdateTables<"lifestyle_activity_plans">;

// =============================================================================
// TIMELINE CONVENIENCE TYPES
// =============================================================================

/**
 * Types of items that can appear on a timeline
 */
export type TimelineItemType = "meal" | "supplement" | "workout" | "lifestyle";

/**
 * Generic timeline item for unified rendering
 * Used to combine different plan types into a single timeline view
 */
export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  subtitle?: string;
  scheduling: TimelineScheduling;
  metadata?: {
    // Meal-specific
    calories?: number;
    protein?: number;
    // Supplement-specific
    dosage?: number;
    dosageUnit?: string;
    // Workout-specific
    sets?: number;
    reps?: number;
    duration?: number;
    // Lifestyle-specific
    targetValue?: number;
    targetUnit?: string;
  };
}

/**
 * Time range for a period (start and end times)
 */
export interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

/**
 * Client anchor times for relative scheduling calculations
 */
export interface ClientAnchorTimes {
  wake_up: string; // HH:MM
  breakfast: string;
  lunch: string;
  evening_snack: string;
  dinner: string;
  sleep: string;
  pre_workout?: string;
  post_workout?: string;
}
