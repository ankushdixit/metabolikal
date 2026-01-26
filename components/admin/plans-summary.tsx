"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Utensils, Dumbbell, Edit, Calendar, Settings, Loader2, Check } from "lucide-react";
import { useOne, useUpdate } from "@refinedev/core";
import { toast } from "sonner";
import type {
  DietPlan,
  WorkoutPlan,
  MealCategory,
  WorkoutSection,
  Profile,
} from "@/lib/database.types";
import { parsePlanDate } from "@/lib/utils/plan-dates";
import { cn } from "@/lib/utils";
import { PlanLimitsManager } from "./plan-limits-manager";

interface DietPlanWithFood extends DietPlan {
  food_items?: { name: string; calories: number; protein: number } | null;
}

interface PlansSummaryProps {
  clientId: string;
  dietPlans: DietPlanWithFood[];
  workoutPlans: WorkoutPlan[];
}

const MEAL_ORDER: MealCategory[] = [
  "pre-workout",
  "breakfast",
  "lunch",
  "evening-snack",
  "post-workout",
  "dinner",
];

const WORKOUT_SECTION_ORDER: WorkoutSection[] = ["warmup", "main", "cooldown"];

const MEAL_LABELS: Record<MealCategory, string> = {
  "pre-workout": "Pre-Workout",
  breakfast: "Breakfast",
  lunch: "Lunch",
  "evening-snack": "Evening Snack",
  "post-workout": "Post-Workout",
  dinner: "Dinner",
};

const SECTION_LABELS: Record<WorkoutSection, string> = {
  warmup: "Warm-up",
  main: "Main Workout",
  cooldown: "Cool-down",
};

// Predefined duration options
const DURATION_OPTIONS = [7, 14, 21, 28, 30, 60, 90];

/**
 * Plans summary component
 * Displays diet and workout plan summaries with edit links
 */
export function PlansSummary({ clientId, dietPlans, workoutPlans }: PlansSummaryProps) {
  // Plan settings state
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editDuration, setEditDuration] = useState<number>(7);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch client profile for plan settings
  // Note: Fetching full profile to avoid React Query caching issues with partial selects
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: clientId,
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const { mutateAsync: updateProfile } = useUpdate();

  const profile = profileQuery.query.data?.data;
  const planStartDate = parsePlanDate(profile?.plan_start_date);
  const planDuration = profile?.plan_duration_days ?? 7;

  // Initialize edit state when entering edit mode
  const handleStartEditing = () => {
    setEditStartDate(profile?.plan_start_date || "");
    setEditDuration(profile?.plan_duration_days ?? 7);
    setIsEditingSettings(true);
  };

  // Save plan settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        resource: "profiles",
        id: clientId,
        values: {
          plan_start_date: editStartDate || null,
          plan_duration_days: editDuration,
        },
      });
      toast.success("Plan settings updated");
      profileQuery.query.refetch();
      setIsEditingSettings(false);
    } catch (error) {
      console.error("Failed to update plan settings:", error);
      toast.error("Failed to update plan settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setIsEditingSettings(false);
  };
  // Calculate diet totals by day
  const dietByDay = useMemo(() => {
    const grouped: Record<number, DietPlanWithFood[]> = {};

    dietPlans.forEach((plan) => {
      const day = plan.day_number || 1;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(plan);
    });

    return Object.entries(grouped)
      .map(([day, plans]) => ({
        day: Number(day),
        plans,
        totalCalories: plans.reduce((sum, p) => {
          const cal = p.food_items?.calories || 0;
          const mult = p.serving_multiplier || 1;
          return sum + cal * mult;
        }, 0),
        totalProtein: plans.reduce((sum, p) => {
          const prot = p.food_items?.protein || 0;
          const mult = p.serving_multiplier || 1;
          return sum + prot * mult;
        }, 0),
      }))
      .sort((a, b) => a.day - b.day);
  }, [dietPlans]);

  // Calculate workout exercises by day
  const workoutByDay = useMemo(() => {
    const grouped: Record<number, WorkoutPlan[]> = {};

    workoutPlans.forEach((plan) => {
      const day = plan.day_number || 1;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(plan);
    });

    return Object.entries(grouped)
      .map(([day, exercises]) => ({
        day: Number(day),
        exercises,
        totalExercises: exercises.length,
      }))
      .sort((a, b) => a.day - b.day);
  }, [workoutPlans]);

  // Get sample day diet plan (day 1)
  const sampleDietDay = dietByDay.find((d) => d.day === 1) || dietByDay[0];

  // Get sample workout day (day 1)
  const sampleWorkoutDay = workoutByDay.find((d) => d.day === 1) || workoutByDay[0];

  // Group sample diet by meal category
  const sampleDietByMeal = useMemo(() => {
    if (!sampleDietDay) return [];

    const grouped: Partial<Record<MealCategory, DietPlanWithFood[]>> = {};

    sampleDietDay.plans.forEach((plan) => {
      const meal = plan.meal_category || "lunch";
      if (!grouped[meal]) grouped[meal] = [];
      grouped[meal]!.push(plan);
    });

    return MEAL_ORDER.filter((meal) => grouped[meal]?.length).map((meal) => ({
      meal,
      label: MEAL_LABELS[meal],
      items: grouped[meal] || [],
    }));
  }, [sampleDietDay]);

  // Group sample workout by section
  const sampleWorkoutBySection = useMemo(() => {
    if (!sampleWorkoutDay) return [];

    const grouped: Partial<Record<WorkoutSection, WorkoutPlan[]>> = {};

    sampleWorkoutDay.exercises.forEach((exercise) => {
      const section = exercise.section || "main";
      if (!grouped[section]) grouped[section] = [];
      grouped[section]!.push(exercise);
    });

    return WORKOUT_SECTION_ORDER.filter((section) => grouped[section]?.length).map((section) => ({
      section,
      label: SECTION_LABELS[section],
      exercises: grouped[section] || [],
    }));
  }, [sampleWorkoutDay]);

  return (
    <div className="space-y-6">
      {/* Plan Settings */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">
              Plan <span className="gradient-athletic">Settings</span>
            </h2>
          </div>
          {!isEditingSettings && (
            <button
              onClick={handleStartEditing}
              className="btn-athletic flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Settings</span>
            </button>
          )}
        </div>

        {profileQuery.query.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-bold">Loading...</span>
          </div>
        ) : isEditingSettings ? (
          <div className="space-y-4">
            {/* Plan Start Date */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Plan Start Date (Day 1)
              </label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full max-w-xs px-4 py-2 bg-secondary border border-border rounded font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional. When set, days will show calendar dates.
              </p>
            </div>

            {/* Plan Duration */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Plan Duration (Days)
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setEditDuration(days)}
                    className={cn(
                      "px-4 py-2 rounded border text-sm font-bold transition-all",
                      editDuration === days
                        ? "bg-primary border-primary text-black"
                        : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {days}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={editDuration}
                  onChange={(e) =>
                    setEditDuration(Math.max(1, Math.min(365, parseInt(e.target.value) || 7)))
                  }
                  className="w-20 px-3 py-2 bg-secondary border border-border rounded font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Custom"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="btn-athletic flex items-center gap-2 px-4 py-2 gradient-electric text-black font-bold disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEditing}
                disabled={isSaving}
                className="btn-athletic px-4 py-2 bg-secondary text-foreground font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Start Date</p>
              <p className="text-lg font-black">
                {planStartDate
                  ? planStartDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not set"}
              </p>
            </div>
            <div className="bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Duration</p>
              <p className="text-lg font-black">{planDuration} days</p>
            </div>
            {planStartDate && (
              <div className="bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">End Date</p>
                <p className="text-lg font-black">
                  {(() => {
                    const endDate = new Date(planStartDate);
                    endDate.setDate(endDate.getDate() + planDuration - 1);
                    return endDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  })()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Plan Limits Manager */}
        <PlanLimitsManager clientId={clientId} />
      </div>

      {/* Diet Plan Summary */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">
              Diet <span className="gradient-athletic">Plan</span>
            </h2>
          </div>
          <Link
            href={`/admin/clients/${clientId}/plans`}
            className="btn-athletic flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Diet Plan</span>
          </Link>
        </div>

        {dietPlans.length === 0 ? (
          <p className="text-muted-foreground font-bold">No diet plan configured</p>
        ) : (
          <>
            {/* Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Total Days</p>
                <p className="text-2xl font-black">{dietByDay.length}</p>
              </div>
              <div className="bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">
                  Avg Calories
                </p>
                <p className="text-2xl font-black">
                  {Math.round(
                    dietByDay.reduce((sum, d) => sum + d.totalCalories, 0) / dietByDay.length || 0
                  )}
                </p>
              </div>
              <div className="bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">
                  Avg Protein
                </p>
                <p className="text-2xl font-black">
                  {Math.round(
                    dietByDay.reduce((sum, d) => sum + d.totalProtein, 0) / dietByDay.length || 0
                  )}
                  g
                </p>
              </div>
              <div className="bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Meals/Day</p>
                <p className="text-2xl font-black">{sampleDietByMeal.length || 0}</p>
              </div>
            </div>

            {/* Sample Day */}
            {sampleDietDay && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Sample Day (Day {sampleDietDay.day})
                  </p>
                </div>
                <div className="space-y-3">
                  {sampleDietByMeal.map(({ meal, label, items }) => (
                    <div key={meal} className="bg-secondary/30 p-4">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                        {label}
                      </p>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span>
                              {item.food_items?.name || "Unknown Food"}
                              {item.serving_multiplier !== 1 && (
                                <span className="text-muted-foreground ml-1">
                                  x{item.serving_multiplier}
                                </span>
                              )}
                            </span>
                            <span className="text-muted-foreground">
                              {Math.round(
                                (item.food_items?.calories || 0) * (item.serving_multiplier || 1)
                              )}{" "}
                              cal
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm font-bold text-foreground">
                  Total: {sampleDietDay.totalCalories} calories, {sampleDietDay.totalProtein}g
                  protein
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Workout Plan Summary */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">
              Workout <span className="gradient-athletic">Plan</span>
            </h2>
          </div>
          <Link
            href={`/admin/clients/${clientId}/plans`}
            className="btn-athletic flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Workout Plan</span>
          </Link>
        </div>

        {workoutPlans.length === 0 ? (
          <p className="text-muted-foreground font-bold">No workout plan configured</p>
        ) : (
          <>
            {/* Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">
                  Workout Days
                </p>
                <p className="text-2xl font-black">{workoutByDay.length}</p>
              </div>
              <div className="bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">
                  Total Exercises
                </p>
                <p className="text-2xl font-black">{workoutPlans.length}</p>
              </div>
              <div className="bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Avg/Day</p>
                <p className="text-2xl font-black">
                  {Math.round(workoutPlans.length / workoutByDay.length || 0)}
                </p>
              </div>
            </div>

            {/* Sample Day */}
            {sampleWorkoutDay && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Sample Day (Day {sampleWorkoutDay.day})
                  </p>
                </div>
                <div className="space-y-3">
                  {sampleWorkoutBySection.map(({ section, label, exercises }) => (
                    <div key={section} className="bg-secondary/30 p-4">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                        {label}
                      </p>
                      <div className="space-y-2">
                        {exercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{exercise.exercise_name}</span>
                            <span className="text-muted-foreground">
                              {exercise.sets && exercise.reps
                                ? `${exercise.sets}x${exercise.reps}`
                                : exercise.duration_minutes
                                  ? `${exercise.duration_minutes} min`
                                  : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm font-bold text-foreground">
                  Total: {sampleWorkoutDay.totalExercises} exercises
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
