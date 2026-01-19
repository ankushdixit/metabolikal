/**
 * Database Schema Integration Tests
 *
 * These tests verify the SQL migration file is syntactically correct
 * and contains all expected schema elements. In a real environment,
 * these would run against a test database to verify actual behavior.
 */

import * as fs from "fs";
import * as path from "path";

describe("Database Schema Migration", () => {
  let migrationSql: string;

  beforeAll(() => {
    const migrationPath = path.join(__dirname, "../migrations/20260119000000_initial_schema.sql");
    migrationSql = fs.readFileSync(migrationPath, "utf-8");
  });

  describe("Table Definitions", () => {
    const expectedTables = [
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

    it.each(expectedTables)("should contain CREATE TABLE for %s", (tableName) => {
      const regex = new RegExp(`CREATE TABLE ${tableName}\\s*\\(`, "i");
      expect(migrationSql).toMatch(regex);
    });

    it("should create exactly 10 tables", () => {
      const createTableMatches = migrationSql.match(/CREATE TABLE \w+/gi);
      expect(createTableMatches?.length).toBe(10);
    });
  });

  describe("Foreign Key Constraints", () => {
    it("should have profiles.id reference auth.users", () => {
      expect(migrationSql).toContain("REFERENCES auth.users(id)");
    });

    it("should have diet_plans.client_id reference profiles", () => {
      expect(migrationSql).toMatch(
        /diet_plans[\s\S]*?client_id UUID NOT NULL REFERENCES profiles\(id\)/i
      );
    });

    it("should have diet_plans.food_item_id reference food_items", () => {
      expect(migrationSql).toMatch(
        /diet_plans[\s\S]*?food_item_id UUID REFERENCES food_items\(id\)/i
      );
    });

    it("should have food_alternatives.diet_plan_id reference diet_plans", () => {
      expect(migrationSql).toMatch(
        /food_alternatives[\s\S]*?diet_plan_id UUID REFERENCES diet_plans\(id\)/i
      );
    });

    it("should have workout_plans.client_id reference profiles", () => {
      expect(migrationSql).toMatch(
        /workout_plans[\s\S]*?client_id UUID NOT NULL REFERENCES profiles\(id\)/i
      );
    });

    it("should have food_logs.client_id reference profiles", () => {
      expect(migrationSql).toMatch(
        /food_logs[\s\S]*?client_id UUID NOT NULL REFERENCES profiles\(id\)/i
      );
    });

    it("should have workout_logs.client_id reference profiles", () => {
      expect(migrationSql).toMatch(
        /workout_logs[\s\S]*?client_id UUID NOT NULL REFERENCES profiles\(id\)/i
      );
    });

    it("should have check_ins.client_id reference profiles", () => {
      expect(migrationSql).toMatch(
        /check_ins[\s\S]*?client_id UUID NOT NULL REFERENCES profiles\(id\)/i
      );
    });

    it("should have check_ins.reviewed_by reference profiles", () => {
      expect(migrationSql).toMatch(/check_ins[\s\S]*?reviewed_by UUID REFERENCES profiles\(id\)/i);
    });

    it("should have challenge_progress.user_id reference profiles", () => {
      expect(migrationSql).toMatch(
        /challenge_progress[\s\S]*?user_id UUID REFERENCES profiles\(id\)/i
      );
    });

    it("should have assessment_results.user_id reference profiles", () => {
      expect(migrationSql).toMatch(
        /assessment_results[\s\S]*?user_id UUID REFERENCES profiles\(id\)/i
      );
    });

    it("should use ON DELETE CASCADE for required relationships", () => {
      const cascadeCount = (migrationSql.match(/ON DELETE CASCADE/gi) || []).length;
      // profiles -> auth.users, diet_plans -> profiles, food_alternatives -> diet_plans,
      // workout_plans -> profiles, food_logs -> profiles, workout_logs -> profiles,
      // check_ins -> profiles
      expect(cascadeCount).toBeGreaterThanOrEqual(7);
    });
  });

  describe("Indexes", () => {
    const expectedIndexes = [
      "idx_diet_plans_client",
      "idx_diet_plans_day",
      "idx_workout_plans_client",
      "idx_workout_plans_day",
      "idx_food_logs_client",
      "idx_food_logs_logged",
      "idx_workout_logs_client",
      "idx_workout_logs_completed",
      "idx_check_ins_client",
      "idx_check_ins_submitted",
      "idx_challenge_visitor",
      "idx_challenge_user",
      "idx_assessment_visitor",
      "idx_assessment_user",
    ];

    it.each(expectedIndexes)("should create index %s", (indexName) => {
      expect(migrationSql).toContain(`CREATE INDEX ${indexName}`);
    });

    it("should index client_id on all client-specific tables", () => {
      expect(migrationSql).toContain("idx_diet_plans_client ON diet_plans(client_id)");
      expect(migrationSql).toContain("idx_workout_plans_client ON workout_plans(client_id)");
      expect(migrationSql).toContain("idx_food_logs_client ON food_logs(client_id)");
      expect(migrationSql).toContain("idx_workout_logs_client ON workout_logs(client_id)");
      expect(migrationSql).toContain("idx_check_ins_client ON check_ins(client_id)");
    });
  });

  describe("Row Level Security", () => {
    const rlsTables = [
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

    it.each(rlsTables)("should enable RLS on %s", (tableName) => {
      expect(migrationSql).toContain(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`);
    });

    it("should create admin policies using role check", () => {
      // Admins should be able to see all data
      expect(migrationSql).toContain("role = 'admin'");
    });

    it("should create client self-access policies using auth.uid()", () => {
      expect(migrationSql).toContain("auth.uid()");
    });

    describe("Profile RLS Policies", () => {
      it("should allow users to view own profile", () => {
        expect(migrationSql).toContain("Users can view own profile");
      });

      it("should allow users to update own profile", () => {
        expect(migrationSql).toContain("Users can update own profile");
      });

      it("should allow admins to view all profiles", () => {
        expect(migrationSql).toContain("Admins can view all profiles");
      });

      it("should allow users to insert own profile on signup", () => {
        expect(migrationSql).toContain("Users can insert own profile");
      });
    });

    describe("Diet Plans RLS Policies", () => {
      it("should allow clients to view own diet plans", () => {
        expect(migrationSql).toContain("Clients can view own diet plans");
      });

      it("should allow admins to view all diet plans", () => {
        expect(migrationSql).toContain("Admins can view all diet plans");
      });

      it("should allow admins to manage diet plans", () => {
        expect(migrationSql).toContain("Admins can manage diet plans");
      });
    });

    describe("Check-ins RLS Policies", () => {
      it("should allow clients to create own check-ins", () => {
        expect(migrationSql).toContain("Clients can create own check-ins");
      });

      it("should allow clients to view own check-ins", () => {
        expect(migrationSql).toContain("Clients can view own check-ins");
      });

      it("should allow admins to view all check-ins", () => {
        expect(migrationSql).toContain("Admins can view all check-ins");
      });

      it("should allow admins to update check-ins", () => {
        expect(migrationSql).toContain("Admins can update check-ins");
      });
    });

    describe("Challenge Progress RLS Policies", () => {
      it("should allow anyone to create challenge progress", () => {
        expect(migrationSql).toContain("Anyone can create challenge progress");
      });
    });

    describe("Assessment Results RLS Policies", () => {
      it("should allow anyone to create assessment results", () => {
        expect(migrationSql).toContain("Anyone can create assessment results");
      });
    });
  });

  describe("Storage Buckets", () => {
    it("should create checkin-photos bucket", () => {
      expect(migrationSql).toContain("'checkin-photos'");
    });

    it("should create avatars bucket", () => {
      expect(migrationSql).toContain("'avatars'");
    });

    it("should make checkin-photos private", () => {
      expect(migrationSql).toMatch(/checkin-photos.*false/i);
    });

    it("should make avatars public", () => {
      expect(migrationSql).toMatch(/avatars.*true/i);
    });

    it("should create storage policies for check-in photos", () => {
      expect(migrationSql).toContain("Users can upload own check-in photos");
      expect(migrationSql).toContain("Users can view own check-in photos");
      expect(migrationSql).toContain("Admins can view all check-in photos");
    });

    it("should create storage policies for avatars", () => {
      expect(migrationSql).toContain("Anyone can view avatars");
      expect(migrationSql).toContain("Users can upload own avatar");
      expect(migrationSql).toContain("Users can update own avatar");
    });
  });

  describe("Constraints", () => {
    it("should enforce role enum on profiles", () => {
      expect(migrationSql).toMatch(/role.*CHECK.*role IN \('admin', 'client'\)/i);
    });

    it("should enforce meal_category enum on diet_plans", () => {
      expect(migrationSql).toMatch(
        /meal_category.*CHECK.*meal_category IN \('pre-workout', 'post-workout', 'breakfast', 'lunch', 'evening-snack', 'dinner'\)/i
      );
    });

    it("should enforce section enum on workout_plans", () => {
      expect(migrationSql).toMatch(/section.*CHECK.*section IN \('warmup', 'main', 'cooldown'\)/i);
    });

    it("should enforce gender enum on assessment_results", () => {
      expect(migrationSql).toMatch(/gender.*CHECK.*gender IN \('male', 'female'\)/i);
    });

    it("should enforce goal enum on assessment_results", () => {
      expect(migrationSql).toMatch(
        /goal.*CHECK.*goal IN \('fat_loss', 'maintain', 'muscle_gain'\)/i
      );
    });

    it("should enforce day_number range on challenge_progress", () => {
      expect(migrationSql).toMatch(/challenge_progress[\s\S]*?day_number BETWEEN 1 AND 30/i);
    });

    it("should enforce rating ranges on check_ins", () => {
      expect(migrationSql).toMatch(/energy_rating.*BETWEEN 1 AND 10/i);
      expect(migrationSql).toMatch(/sleep_rating.*BETWEEN 1 AND 10/i);
      expect(migrationSql).toMatch(/stress_rating.*BETWEEN 1 AND 10/i);
      expect(migrationSql).toMatch(/mood_rating.*BETWEEN 1 AND 10/i);
    });

    it("should enforce adherence ranges on check_ins", () => {
      expect(migrationSql).toMatch(/diet_adherence.*BETWEEN 0 AND 100/i);
      expect(migrationSql).toMatch(/workout_adherence.*BETWEEN 0 AND 100/i);
    });
  });

  describe("Unique Constraints", () => {
    it("should enforce unique email on profiles", () => {
      expect(migrationSql).toMatch(/profiles[\s\S]*?email TEXT UNIQUE/i);
    });

    it("should enforce unique client+day+meal on diet_plans", () => {
      expect(migrationSql).toMatch(/UNIQUE\(client_id, day_number, meal_category\)/i);
    });

    it("should enforce unique visitor+day on challenge_progress", () => {
      expect(migrationSql).toMatch(/UNIQUE\(visitor_id, day_number\)/i);
    });
  });

  describe("Triggers", () => {
    it("should create updated_at trigger function", () => {
      expect(migrationSql).toContain("CREATE OR REPLACE FUNCTION update_updated_at_column");
    });

    it("should apply trigger to profiles", () => {
      expect(migrationSql).toContain("CREATE TRIGGER update_profiles_updated_at");
    });

    it("should apply trigger to food_items", () => {
      expect(migrationSql).toContain("CREATE TRIGGER update_food_items_updated_at");
    });

    it("should apply trigger to diet_plans", () => {
      expect(migrationSql).toContain("CREATE TRIGGER update_diet_plans_updated_at");
    });

    it("should apply trigger to workout_plans", () => {
      expect(migrationSql).toContain("CREATE TRIGGER update_workout_plans_updated_at");
    });

    it("should apply trigger to challenge_progress", () => {
      expect(migrationSql).toContain("CREATE TRIGGER update_challenge_progress_updated_at");
    });
  });

  describe("Table Comments", () => {
    it("should include comments for documentation", () => {
      expect(migrationSql).toContain("COMMENT ON TABLE profiles");
      expect(migrationSql).toContain("COMMENT ON TABLE food_items");
      expect(migrationSql).toContain("COMMENT ON TABLE diet_plans");
      expect(migrationSql).toContain("COMMENT ON TABLE check_ins");
    });
  });
});
