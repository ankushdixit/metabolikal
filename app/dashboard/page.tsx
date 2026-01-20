"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useList, useOne, useCreate } from "@refinedev/core";
import { Calendar, Flame } from "lucide-react";
import {
  CalorieSummary,
  ProteinProgress,
  QuickActions,
  FoodSearch,
  FoodLogForm,
} from "@/components/dashboard";
import { createBrowserSupabaseClient } from "@/lib/auth";
import type { MealCategory } from "@/lib/database.types";

interface Profile {
  full_name?: string;
  created_at?: string;
}

interface FoodLog {
  calories?: number;
  protein?: number;
}

interface DietPlanEntry {
  food_items?: { calories: number; protein: number } | null;
  serving_multiplier?: number;
}

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  serving_size: string;
  is_vegetarian: boolean;
}

/**
 * Dashboard Home Page
 * Displays daily overview metrics and quick actions
 * Athletic-styled to match landing page design
 */
export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isFoodSearchOpen, setIsFoodSearchOpen] = useState(false);
  const [isFoodLogFormOpen, setIsFoodLogFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedMealCategory, setSelectedMealCategory] = useState<MealCategory>("breakfast");

  // Get current user ID from Supabase auth
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch user profile for welcome message and program start date
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: userId || "",
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Calculate date values
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // Calculate day number from profile creation date (cycles through 7-day plan)
  const profile = profileQuery.query.data?.data as Profile | undefined;
  const programStartDate = profile?.created_at ? new Date(profile.created_at) : today;
  const totalDays =
    Math.floor((today.getTime() - programStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  // Cycle through 7-day plan: day 8 becomes day 1, day 15 becomes day 1, etc.
  const dayNumber = ((totalDays - 1) % 7) + 1;

  // Fetch today's food logs for calorie/protein totals
  const foodLogsQuery = useList<FoodLog>({
    resource: "food_logs",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "logged_at", operator: "gte", value: startOfToday.toISOString() },
      { field: "logged_at", operator: "lt", value: startOfTomorrow.toISOString() },
    ],
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Fetch diet plan for current day to get targets
  const dietPlanQuery = useList<DietPlanEntry>({
    resource: "diet_plans",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "day_number", operator: "eq", value: dayNumber },
    ],
    meta: {
      select: "*, food_items(calories, protein)",
    },
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Search for food items in the database
  const debouncedSearchQuery = useMemo(() => searchQuery, [searchQuery]);
  const foodSearchQuery = useList<FoodItem>({
    resource: "food_items",
    filters:
      debouncedSearchQuery.length >= 2
        ? [{ field: "name", operator: "contains", value: debouncedSearchQuery }]
        : [],
    pagination: { pageSize: 20 },
    queryOptions: {
      enabled: debouncedSearchQuery.length >= 2,
    },
  });

  // Create mutation for logging food
  const createFoodLogMutation = useCreate();
  const createFoodLog = createFoodLogMutation.mutate;
  const isLoggingFood = createFoodLogMutation.mutation.isPending;

  // Handle selecting a food from search results
  const handleSelectFood = useCallback((foodItem: FoodItem, mealCategory: MealCategory) => {
    setSelectedFood(foodItem);
    setSelectedMealCategory(mealCategory);
    setIsFoodSearchOpen(false);
    setIsFoodLogFormOpen(true);
  }, []);

  // Handle logging food with serving multiplier
  const handleLogFood = useCallback(
    (data: {
      food_item_id: string;
      calories: number;
      protein: number;
      serving_multiplier: number;
      meal_category: string;
    }) => {
      if (!userId) return;

      createFoodLog(
        {
          resource: "food_logs",
          values: {
            client_id: userId,
            food_item_id: data.food_item_id,
            calories: data.calories,
            protein: data.protein,
            serving_multiplier: data.serving_multiplier,
            meal_category: data.meal_category,
            logged_at: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            setIsFoodLogFormOpen(false);
            setSelectedFood(null);
            // Refetch food logs to update totals
            foodLogsQuery.query.refetch();
          },
        }
      );
    },
    [userId, createFoodLog, foodLogsQuery.query]
  );

  // Handle logging custom food (without food_item_id)
  const handleLogCustomFood = useCallback(
    (data: { food_name: string; calories: number; protein: number; meal_category: string }) => {
      if (!userId) return;

      createFoodLog(
        {
          resource: "food_logs",
          values: {
            client_id: userId,
            food_name: data.food_name,
            calories: data.calories,
            protein: data.protein,
            serving_multiplier: 1,
            meal_category: data.meal_category,
            logged_at: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            setIsFoodSearchOpen(false);
            // Refetch food logs to update totals
            foodLogsQuery.query.refetch();
          },
        }
      );
    },
    [userId, createFoodLog, foodLogsQuery.query]
  );

  // Calculate consumed calories and protein from food logs
  const foodLogs = foodLogsQuery.query.data?.data || [];
  const consumedCalories = foodLogs.reduce(
    (sum: number, log: FoodLog) => sum + (log.calories || 0),
    0
  );
  const consumedProtein = foodLogs.reduce(
    (sum: number, log: FoodLog) => sum + (log.protein || 0),
    0
  );

  // Calculate target calories and protein from diet plan entries
  const dietPlanEntries = (dietPlanQuery.query.data?.data || []) as DietPlanEntry[];

  // Sum up calories and protein from all meal entries for the day
  const targetCalories =
    dietPlanEntries.reduce((sum: number, entry: DietPlanEntry) => {
      const calories = entry.food_items?.calories || 0;
      const multiplier = entry.serving_multiplier || 1;
      return sum + calories * multiplier;
    }, 0) || 2000;
  const targetProtein =
    dietPlanEntries.reduce((sum: number, entry: DietPlanEntry) => {
      const protein = entry.food_items?.protein || 0;
      const multiplier = entry.serving_multiplier || 1;
      return sum + protein * multiplier;
    }, 0) || 150;

  // Format date
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get first name for welcome message
  const fullName = profile?.full_name || "Champion";
  const firstName = fullName.split(" ")[0];

  const isLoading =
    profileQuery.query.isLoading || foodLogsQuery.query.isLoading || dietPlanQuery.query.isLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Welcome back, <span className="gradient-athletic">{firstName}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-bold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
                <Flame className="h-4 w-4 text-primary" />
                <span className="uppercase tracking-wider">Day {dayNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calorie Summary */}
        {isLoading ? (
          <div className="athletic-card p-6 pl-8 animate-pulse">
            <div className="h-4 w-24 bg-secondary mb-4" />
            <div className="h-8 w-32 bg-secondary mb-4" />
            <div className="h-3 w-full bg-secondary" />
          </div>
        ) : (
          <CalorieSummary consumed={consumedCalories} target={targetCalories} />
        )}

        {/* Protein Progress */}
        {isLoading ? (
          <div className="athletic-card p-6 pl-8 animate-pulse">
            <div className="h-4 w-24 bg-secondary mb-4" />
            <div className="h-8 w-32 bg-secondary mb-4" />
            <div className="h-3 w-full bg-secondary" />
          </div>
        ) : (
          <ProteinProgress consumed={consumedProtein} target={targetProtein} />
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions onLogFood={() => setIsFoodSearchOpen(true)} />

      {/* Food Search Modal */}
      <FoodSearch
        isOpen={isFoodSearchOpen}
        onClose={() => setIsFoodSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={(foodSearchQuery.query.data?.data as FoodItem[]) || []}
        isSearching={foodSearchQuery.query.isLoading}
        onSelectFood={handleSelectFood}
        onLogCustomFood={handleLogCustomFood}
        isLogging={isLoggingFood}
      />

      {/* Food Log Form Modal */}
      <FoodLogForm
        isOpen={isFoodLogFormOpen}
        onClose={() => {
          setIsFoodLogFormOpen(false);
          setSelectedFood(null);
        }}
        foodItem={selectedFood}
        mealCategory={selectedMealCategory}
        onLogFood={handleLogFood}
        isLogging={isLoggingFood}
      />
    </div>
  );
}
