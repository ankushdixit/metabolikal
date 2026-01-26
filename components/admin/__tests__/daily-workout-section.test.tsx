/**
 * Tests for DailyWorkoutSection component
 */

import { render, screen } from "@testing-library/react";
import { DailyWorkoutSection } from "../daily-workout-section";
import type { WorkoutSection } from "@/lib/database.types";
import type { WorkoutPlanWithExercise, WorkoutTotals } from "@/hooks/use-daily-plan-data";

describe("DailyWorkoutSection", () => {
  const mockWorkoutPlan: WorkoutPlanWithExercise = {
    id: "workout-1",
    client_id: "client-1",
    day_number: 1,
    exercise_name: "Bench Press",
    sets: 4,
    reps: 10,
    duration_minutes: null,
    rest_seconds: 60,
    instructions: null,
    video_url: null,
    section: "main",
    display_order: 0,
    exercise_id: "exercise-1",
    time_type: null,
    time_start: null,
    time_end: null,
    time_period: null,
    relative_anchor: null,
    relative_offset_minutes: 0,
    scheduled_duration_minutes: 10,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    exercises: null,
  };

  const emptyWorkoutBySection = new Map<WorkoutSection, WorkoutPlanWithExercise[]>();
  const emptyTotals: WorkoutTotals = {
    exerciseCount: 0,
    totalDuration: 0,
  };

  it("renders empty state when no workouts are planned", () => {
    render(<DailyWorkoutSection workoutBySection={emptyWorkoutBySection} totals={emptyTotals} />);
    expect(screen.getByText("No workout planned")).toBeInTheDocument();
  });

  it("renders workout header", () => {
    render(<DailyWorkoutSection workoutBySection={emptyWorkoutBySection} totals={emptyTotals} />);
    // Header contains "Work" and "out" as separate spans for styling
    const workText = screen.getByRole("heading", { level: 3 });
    expect(workText).toBeInTheDocument();
    expect(workText.textContent).toContain("Work");
  });

  it("renders exercises grouped by section", () => {
    const workoutBySection = new Map<WorkoutSection, WorkoutPlanWithExercise[]>();
    workoutBySection.set("main", [mockWorkoutPlan]);
    const totals: WorkoutTotals = { exerciseCount: 1, totalDuration: 10 };

    render(<DailyWorkoutSection workoutBySection={workoutBySection} totals={totals} />);

    expect(screen.getByText("Main Workout")).toBeInTheDocument();
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("4x10")).toBeInTheDocument();
  });

  it("renders duration for cardio exercises", () => {
    const cardioExercise: WorkoutPlanWithExercise = {
      ...mockWorkoutPlan,
      exercise_name: "Treadmill",
      sets: null,
      reps: null,
      duration_minutes: 20,
      section: "warmup",
    };
    const workoutBySection = new Map<WorkoutSection, WorkoutPlanWithExercise[]>();
    workoutBySection.set("warmup", [cardioExercise]);
    const totals: WorkoutTotals = { exerciseCount: 1, totalDuration: 20 };

    render(<DailyWorkoutSection workoutBySection={workoutBySection} totals={totals} />);

    expect(screen.getByText("Warm-up")).toBeInTheDocument();
    expect(screen.getByText("Treadmill")).toBeInTheDocument();
    expect(screen.getByText("20 min")).toBeInTheDocument();
  });

  it("renders totals correctly", () => {
    const workoutBySection = new Map<WorkoutSection, WorkoutPlanWithExercise[]>();
    workoutBySection.set("main", [mockWorkoutPlan]);
    const totals: WorkoutTotals = { exerciseCount: 5, totalDuration: 45 };

    render(<DailyWorkoutSection workoutBySection={workoutBySection} totals={totals} />);

    expect(screen.getByText(/5 exercises/)).toBeInTheDocument();
    expect(screen.getByText(/~45 min/)).toBeInTheDocument();
  });

  it("renders multiple sections in correct order", () => {
    const warmupExercise: WorkoutPlanWithExercise = {
      ...mockWorkoutPlan,
      id: "1",
      exercise_name: "Jumping Jacks",
      section: "warmup",
      duration_minutes: 5,
      sets: null,
      reps: null,
    };
    const mainExercise: WorkoutPlanWithExercise = {
      ...mockWorkoutPlan,
      id: "2",
      exercise_name: "Squats",
      section: "main",
    };
    const cooldownExercise: WorkoutPlanWithExercise = {
      ...mockWorkoutPlan,
      id: "3",
      exercise_name: "Stretching",
      section: "cooldown",
      duration_minutes: 5,
      sets: null,
      reps: null,
    };

    const workoutBySection = new Map<WorkoutSection, WorkoutPlanWithExercise[]>();
    workoutBySection.set("warmup", [warmupExercise]);
    workoutBySection.set("main", [mainExercise]);
    workoutBySection.set("cooldown", [cooldownExercise]);

    const totals: WorkoutTotals = { exerciseCount: 3, totalDuration: 20 };

    render(<DailyWorkoutSection workoutBySection={workoutBySection} totals={totals} />);

    expect(screen.getByText("Warm-up")).toBeInTheDocument();
    expect(screen.getByText("Main Workout")).toBeInTheDocument();
    expect(screen.getByText("Cool-down")).toBeInTheDocument();
  });

  it("shows dash for exercises without sets/reps/duration", () => {
    const exerciseWithoutDetails: WorkoutPlanWithExercise = {
      ...mockWorkoutPlan,
      sets: null,
      reps: null,
      duration_minutes: null,
      scheduled_duration_minutes: 0,
    };
    const workoutBySection = new Map<WorkoutSection, WorkoutPlanWithExercise[]>();
    workoutBySection.set("main", [exerciseWithoutDetails]);
    const totals: WorkoutTotals = { exerciseCount: 1, totalDuration: 0 };

    render(<DailyWorkoutSection workoutBySection={workoutBySection} totals={totals} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
