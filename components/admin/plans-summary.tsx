"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Utensils, Dumbbell, Edit, Calendar } from "lucide-react";
import type { DietPlan, WorkoutPlan, MealCategory, WorkoutSection } from "@/lib/database.types";

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

/**
 * Plans summary component
 * Displays diet and workout plan summaries with edit links
 */
export function PlansSummary({ clientId, dietPlans, workoutPlans }: PlansSummaryProps) {
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
            href={`/admin/plans/${clientId}/diet`}
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
            href={`/admin/plans/${clientId}/workout`}
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
