"use client";

import { useState, useEffect, useCallback } from "react";
import { useList, useUpdate, useCreate, useDelete } from "@refinedev/core";
import { Calendar, Flame, Plus, AlertCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { MealCard } from "@/components/dashboard/meal-card";
import { FoodAlternativesDrawer } from "@/components/dashboard/food-alternatives-drawer";
import { FoodLogForm } from "@/components/dashboard/food-log-form";
import { FoodSearch } from "@/components/dashboard/food-search";
import { TodaysLogs } from "@/components/dashboard/todays-logs";
import type { MealCategory } from "@/lib/database.types";

/**
 * Meal category order as specified
 */
const MEAL_ORDER: MealCategory[] = [
  "pre-workout",
  "post-workout",
  "breakfast",
  "lunch",
  "evening-snack",
  "dinner",
];

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  serving_size: string;
  is_vegetarian: boolean;
}

interface DietPlanEntry {
  id: string;
  client_id: string;
  day_number: number;
  meal_category: MealCategory;
  food_item_id: string;
  serving_multiplier: number;
  food_items: FoodItem;
}

interface FoodAlternative {
  id: string;
  diet_plan_id: string;
  food_item_id: string;
  is_optimal: boolean;
  display_order: number;
  food_items: FoodItem;
}

interface FoodLog {
  id: string;
  food_name: string | null;
  food_item_id: string | null;
  calories: number;
  protein: number;
  logged_at: string;
  meal_category: string;
  food_items?: {
    name: string;
  } | null;
}

interface Profile {
  full_name?: string;
  created_at?: string;
}

/**
 * Diet Plan Page
 * Displays daily diet plan with meal cards, alternatives, and food logging
 */
export default function DietPlanPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState(1);

  // Modal states
  const [selectedMealForAlternatives, setSelectedMealForAlternatives] =
    useState<DietPlanEntry | null>(null);
  const [selectedMealForLogging, setSelectedMealForLogging] = useState<DietPlanEntry | null>(null);
  const [isCustomFoodOpen, setIsCustomFoodOpen] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");

  // Get current user ID and calculate day number
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch profile to calculate day number
  const profileQuery = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "id", operator: "eq", value: userId || "" }],
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Calculate day number from profile creation date (cycles through 7-day plan)
  useEffect(() => {
    const profile = profileQuery.query.data?.data?.[0];
    if (profile?.created_at) {
      const today = new Date();
      const startDate = new Date(profile.created_at);
      const totalDays =
        Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      // Cycle through 7-day plan: day 8 becomes day 1, day 15 becomes day 1, etc.
      const cyclicDay = ((totalDays - 1) % 7) + 1;
      setDayNumber(cyclicDay);
    }
  }, [profileQuery.query.data]);

  // Fetch diet plan for current day
  const dietPlanQuery = useList<DietPlanEntry>({
    resource: "diet_plans",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "day_number", operator: "eq", value: dayNumber },
    ],
    meta: {
      select: "*, food_items(id, name, calories, protein, serving_size, is_vegetarian)",
    },
    sorters: [{ field: "meal_category", order: "asc" }],
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Fetch food alternatives for selected diet plan entry
  const alternativesQuery = useList<FoodAlternative>({
    resource: "food_alternatives",
    filters: [
      { field: "diet_plan_id", operator: "eq", value: selectedMealForAlternatives?.id || "" },
    ],
    meta: {
      select: "*, food_items(id, name, calories, protein, serving_size, is_vegetarian)",
    },
    sorters: [{ field: "display_order", order: "asc" }],
    queryOptions: {
      enabled: !!selectedMealForAlternatives?.id,
    },
  });

  // Calculate date range for today's food logs
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // Fetch today's food logs
  const foodLogsQuery = useList<FoodLog>({
    resource: "food_logs",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "logged_at", operator: "gte", value: startOfToday.toISOString() },
      { field: "logged_at", operator: "lt", value: startOfTomorrow.toISOString() },
    ],
    meta: {
      select: "*, food_items(name)",
    },
    sorters: [{ field: "logged_at", order: "desc" }],
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Search food items
  const searchFoodQuery = useList<FoodItem>({
    resource: "food_items",
    filters: [{ field: "name", operator: "contains", value: foodSearchQuery }],
    queryOptions: {
      enabled: foodSearchQuery.length >= 2,
    },
    pagination: {
      pageSize: 20,
    },
  });

  // Mutations
  const updateMutation = useUpdate();
  const createMutation = useCreate();
  const deleteMutation = useDelete();

  // Handlers
  const handleSelectAlternative = useCallback(
    (foodItemId: string) => {
      if (!selectedMealForAlternatives) return;

      updateMutation.mutate(
        {
          resource: "diet_plans",
          id: selectedMealForAlternatives.id,
          values: { food_item_id: foodItemId },
        },
        {
          onSuccess: () => {
            dietPlanQuery.query.refetch();
          },
        }
      );
    },
    [selectedMealForAlternatives, updateMutation, dietPlanQuery.query]
  );

  const handleLogFood = useCallback(
    (data: {
      food_item_id: string;
      calories: number;
      protein: number;
      serving_multiplier: number;
      meal_category: string;
    }) => {
      if (!userId) return;

      createMutation.mutate(
        {
          resource: "food_logs",
          values: {
            client_id: userId,
            food_item_id: data.food_item_id,
            calories: data.calories,
            protein: data.protein,
            serving_multiplier: data.serving_multiplier,
            meal_category: data.meal_category,
          },
        },
        {
          onSuccess: () => {
            setSelectedMealForLogging(null);
            foodLogsQuery.query.refetch();
          },
        }
      );
    },
    [userId, createMutation, foodLogsQuery.query]
  );

  const handleLogCustomFood = useCallback(
    (data: { food_name: string; calories: number; protein: number; meal_category: string }) => {
      if (!userId) return;

      createMutation.mutate(
        {
          resource: "food_logs",
          values: {
            client_id: userId,
            food_item_id: null,
            food_name: data.food_name,
            calories: data.calories,
            protein: data.protein,
            serving_multiplier: 1,
            meal_category: data.meal_category,
          },
        },
        {
          onSuccess: () => {
            setIsCustomFoodOpen(false);
            setFoodSearchQuery("");
            foodLogsQuery.query.refetch();
          },
        }
      );
    },
    [userId, createMutation, foodLogsQuery.query]
  );

  const handleSelectSearchedFood = useCallback(
    (foodItem: FoodItem, mealCategory: MealCategory) => {
      if (!userId) return;

      createMutation.mutate(
        {
          resource: "food_logs",
          values: {
            client_id: userId,
            food_item_id: foodItem.id,
            calories: foodItem.calories,
            protein: foodItem.protein,
            serving_multiplier: 1,
            meal_category: mealCategory,
          },
        },
        {
          onSuccess: () => {
            setIsCustomFoodOpen(false);
            setFoodSearchQuery("");
            foodLogsQuery.query.refetch();
          },
        }
      );
    },
    [userId, createMutation, foodLogsQuery.query]
  );

  const handleDeleteLog = useCallback(
    (logId: string) => {
      deleteMutation.mutate(
        {
          resource: "food_logs",
          id: logId,
        },
        {
          onSuccess: () => {
            foodLogsQuery.query.refetch();
          },
        }
      );
    },
    [deleteMutation, foodLogsQuery.query]
  );

  // Get diet plan entries organized by meal category
  const dietPlanEntries = dietPlanQuery.query.data?.data || [];
  const dietPlanByCategory = MEAL_ORDER.reduce(
    (acc, category) => {
      acc[category] =
        dietPlanEntries.find((entry: DietPlanEntry) => entry.meal_category === category) || null;
      return acc;
    },
    {} as Record<MealCategory, DietPlanEntry | null>
  );

  // Calculate totals
  const foodLogs = foodLogsQuery.query.data?.data || [];
  const consumedCalories = foodLogs.reduce((sum: number, log: FoodLog) => sum + log.calories, 0);
  const consumedProtein = foodLogs.reduce((sum: number, log: FoodLog) => sum + log.protein, 0);

  // Calculate target from diet plan
  const targetCalories = dietPlanEntries.reduce(
    (sum: number, entry: DietPlanEntry) =>
      sum + (entry.food_items?.calories || 0) * entry.serving_multiplier,
    0
  );
  const targetProtein = dietPlanEntries.reduce(
    (sum: number, entry: DietPlanEntry) =>
      sum + (entry.food_items?.protein || 0) * entry.serving_multiplier,
    0
  );

  // Format date
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isLoading = dietPlanQuery.query.isLoading || profileQuery.query.isLoading;
  const isUpdating = updateMutation.mutation.isPending;
  const isLogging = createMutation.mutation.isPending;
  const isDeleting = deleteMutation.mutation.isPending;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Today&apos;s <span className="gradient-athletic">Diet Plan</span>
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

          {/* Log Custom Food Button */}
          <button
            onClick={() => setIsCustomFoodOpen(true)}
            className="btn-athletic flex items-center justify-center gap-2 px-5 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-4 w-4" />
            <span>Log Custom Food</span>
          </button>
        </div>
      </div>

      {/* Daily Totals Summary */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-1 gradient-electric" />
          <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
            Daily Progress
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Calories */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black gradient-athletic">{consumedCalories}</span>
              <span className="text-lg font-bold text-muted-foreground">
                / {targetCalories || "—"} kcal
              </span>
            </div>
            <div className="h-2 bg-secondary overflow-hidden">
              <div
                className="h-full bg-neon-green transition-all duration-500"
                style={{
                  width: `${targetCalories > 0 ? Math.min((consumedCalories / targetCalories) * 100, 100) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Protein */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black">{consumedProtein}</span>
              <span className="text-lg font-bold text-muted-foreground">
                / {targetProtein || "—"}g protein
              </span>
            </div>
            <div className="h-2 bg-secondary overflow-hidden">
              <div
                className="h-full gradient-electric transition-all duration-500"
                style={{
                  width: `${targetProtein > 0 ? Math.min((consumedProtein / targetProtein) * 100, 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MEAL_ORDER.map((category) => (
            <div key={category} className="athletic-card p-6 pl-8 animate-pulse">
              <div className="h-4 w-32 bg-secondary mb-4" />
              <div className="h-6 w-48 bg-secondary mb-2" />
              <div className="h-4 w-24 bg-secondary mb-4" />
              <div className="flex gap-3">
                <div className="h-10 flex-1 bg-secondary" />
                <div className="h-10 flex-1 bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && dietPlanEntries.length === 0 && (
        <div className="athletic-card p-8 pl-10 text-center">
          <div className="p-4 bg-secondary inline-block mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">
            No Diet Plan Available
          </h3>
          <p className="text-muted-foreground font-bold">
            No diet plan available for today. Contact your coach.
          </p>
        </div>
      )}

      {/* Meal Cards Grid */}
      {!isLoading && dietPlanEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MEAL_ORDER.map((category) => {
            const entry = dietPlanByCategory[category];
            return (
              <MealCard
                key={category}
                mealCategory={category}
                foodItem={entry?.food_items || null}
                servingMultiplier={entry?.serving_multiplier || 1}
                onSeeAlternatives={() => entry && setSelectedMealForAlternatives(entry)}
                onLogFood={() => entry && setSelectedMealForLogging(entry)}
              />
            );
          })}
        </div>
      )}

      {/* Today's Logged Items */}
      <TodaysLogs logs={foodLogs} onDeleteLog={handleDeleteLog} isDeleting={isDeleting} />

      {/* Food Alternatives Drawer */}
      <FoodAlternativesDrawer
        isOpen={!!selectedMealForAlternatives}
        onClose={() => setSelectedMealForAlternatives(null)}
        mealCategory={selectedMealForAlternatives?.meal_category || "breakfast"}
        currentFoodItem={selectedMealForAlternatives?.food_items || null}
        alternatives={alternativesQuery.query.data?.data || []}
        targetCalories={
          selectedMealForAlternatives?.food_items?.calories ||
          targetCalories / dietPlanEntries.length ||
          400
        }
        onSelectAlternative={handleSelectAlternative}
        isUpdating={isUpdating}
      />

      {/* Food Log Form */}
      <FoodLogForm
        isOpen={!!selectedMealForLogging}
        onClose={() => setSelectedMealForLogging(null)}
        foodItem={selectedMealForLogging?.food_items || null}
        mealCategory={selectedMealForLogging?.meal_category || "breakfast"}
        onLogFood={handleLogFood}
        isLogging={isLogging}
      />

      {/* Custom Food Search */}
      <FoodSearch
        isOpen={isCustomFoodOpen}
        onClose={() => {
          setIsCustomFoodOpen(false);
          setFoodSearchQuery("");
        }}
        searchQuery={foodSearchQuery}
        onSearchChange={setFoodSearchQuery}
        searchResults={searchFoodQuery.query.data?.data || []}
        isSearching={searchFoodQuery.query.isLoading}
        onSelectFood={handleSelectSearchedFood}
        onLogCustomFood={handleLogCustomFood}
        isLogging={isLogging}
      />
    </div>
  );
}
