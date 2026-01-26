"use client";

import { FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import {
  AlertCircle,
  Dumbbell,
  FileText,
  Video,
  Settings2,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EXERCISE_CATEGORIES, MUSCLE_GROUPS, type ExerciseFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface ExerciseFormProps {
  register: UseFormRegister<ExerciseFormData>;
  errors: FieldErrors<ExerciseFormData>;
  watch: UseFormWatch<ExerciseFormData>;
  setValue: UseFormSetValue<ExerciseFormData>;
  isSubmitting?: boolean;
  onCancel: () => void;
  submitLabel: string;
}

/**
 * Exercise Form Component
 * Reusable form for creating and editing exercises
 */
export function ExerciseForm({
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
  onCancel,
  submitLabel,
}: ExerciseFormProps) {
  const isActive = watch("is_active");
  const selectedCategory = watch("category");
  const selectedMuscleGroup = watch("muscle_group");
  const difficultyLevel = watch("difficulty_level") ?? 1;

  return (
    <div className="space-y-6">
      {/* Name - Required */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Exercise Name <span className="text-primary">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g., Bench Press, Squats, Push-ups"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("name")}
        />
        {errors.name && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.name.message as string}</span>
          </div>
        )}
      </div>

      {/* Category - Required */}
      <div>
        <label
          htmlFor="category"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Category <span className="text-primary">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {EXERCISE_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => setValue("category", category.value)}
                className={cn(
                  "btn-athletic px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                  isSelected
                    ? "gradient-electric text-black"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>
        {errors.category && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.category.message as string}</span>
          </div>
        )}
      </div>

      {/* Muscle Group - Required */}
      <div>
        <label
          htmlFor="muscle_group"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Muscle Group <span className="text-primary">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((muscleGroup) => {
            const isSelected = selectedMuscleGroup === muscleGroup.value;
            return (
              <button
                key={muscleGroup.value}
                type="button"
                onClick={() => setValue("muscle_group", muscleGroup.value)}
                className={cn(
                  "btn-athletic px-3 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                  isSelected
                    ? "gradient-electric text-black"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {muscleGroup.label}
              </button>
            );
          })}
        </div>
        {errors.muscle_group && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.muscle_group.message as string}</span>
          </div>
        )}
      </div>

      {/* Equipment - Optional */}
      <div>
        <label
          htmlFor="equipment"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Equipment
        </label>
        <input
          id="equipment"
          type="text"
          placeholder="e.g., barbell, dumbbell, bodyweight, machine"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("equipment")}
        />
        {errors.equipment && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.equipment.message as string}</span>
          </div>
        )}
      </div>

      {/* Default Values Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Settings2 className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Default Values
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Default Sets */}
          <div>
            <label
              htmlFor="default_sets"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Sets
            </label>
            <input
              id="default_sets"
              type="number"
              min="1"
              max="20"
              placeholder="3"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("default_sets", { valueAsNumber: true })}
            />
            {errors.default_sets && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.default_sets.message as string}</span>
              </div>
            )}
          </div>

          {/* Default Reps */}
          <div>
            <label
              htmlFor="default_reps"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Reps
            </label>
            <input
              id="default_reps"
              type="number"
              min="1"
              max="100"
              placeholder="10"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("default_reps", { valueAsNumber: true })}
            />
            {errors.default_reps && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.default_reps.message as string}</span>
              </div>
            )}
          </div>

          {/* Default Duration (seconds) */}
          <div>
            <label
              htmlFor="default_duration_seconds"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Duration (sec)
            </label>
            <input
              id="default_duration_seconds"
              type="number"
              min="1"
              max="3600"
              placeholder="60"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("default_duration_seconds", { valueAsNumber: true })}
            />
            {errors.default_duration_seconds && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.default_duration_seconds.message as string}</span>
              </div>
            )}
          </div>

          {/* Rest Seconds */}
          <div>
            <label
              htmlFor="rest_seconds"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Rest (sec)
            </label>
            <input
              id="rest_seconds"
              type="number"
              min="0"
              max="600"
              placeholder="60"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("rest_seconds", { valueAsNumber: true })}
            />
            {errors.rest_seconds && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.rest_seconds.message as string}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Difficulty Level */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Difficulty Level
          </span>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setValue("difficulty_level", level)}
              className={cn(
                "p-2 transition-all",
                level <= difficultyLevel
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary/50"
              )}
              aria-label={`Difficulty level ${level}`}
            >
              <Star className={cn("h-6 w-6", level <= difficultyLevel && "fill-primary")} />
            </button>
          ))}
          <span className="ml-2 text-sm font-bold text-muted-foreground">
            {difficultyLevel} / 5
          </span>
        </div>
        {errors.difficulty_level && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.difficulty_level.message as string}</span>
          </div>
        )}
      </div>

      {/* Instructions - Optional */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Instructions
          </span>
        </div>
        <textarea
          id="instructions"
          rows={4}
          placeholder="e.g., Lie flat on bench. Grip barbell slightly wider than shoulders. Lower to chest, then push up..."
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          {...register("instructions")}
        />
        {errors.instructions && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.instructions.message as string}</span>
          </div>
        )}
      </div>

      {/* Video & Thumbnail URLs */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Video className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Media
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Video URL */}
          <div>
            <label
              htmlFor="video_url"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Video URL
            </label>
            <input
              id="video_url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("video_url")}
            />
            {errors.video_url && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.video_url.message as string}</span>
              </div>
            )}
          </div>

          {/* Thumbnail URL */}
          <div>
            <label
              htmlFor="thumbnail_url"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Thumbnail URL
            </label>
            <input
              id="thumbnail_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("thumbnail_url")}
            />
            {errors.thumbnail_url && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.thumbnail_url.message as string}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Checkbox */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="is_active"
          checked={isActive ?? true}
          onCheckedChange={(checked) => setValue("is_active", checked === true)}
          className="h-5 w-5"
        />
        <label
          htmlFor="is_active"
          className="flex items-center gap-2 text-sm font-bold cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4 text-neon-green" />
          <span>Active</span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn-athletic px-6 py-3 bg-secondary text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-athletic flex-1 px-6 py-3 gradient-electric text-black glow-power disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
