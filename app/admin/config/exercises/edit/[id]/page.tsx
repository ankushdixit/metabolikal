"use client";

import { useEffect, useRef } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ExerciseForm } from "@/components/admin/exercise-form";
import { exerciseSchema, type ExerciseFormData } from "@/lib/validations";
import type { Exercise } from "@/lib/database.types";

/**
 * Edit Exercise Page
 * Form for editing existing exercises in the library
 */
export default function EditExercisePage() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = params.id as string;

  const isFormInitialized = useRef(false);

  // Fetch existing exercise
  const exerciseQuery = useOne<Exercise>({
    resource: "exercises",
    id: exerciseId,
    queryOptions: {
      enabled: !!exerciseId,
    },
  });

  const exercise = exerciseQuery.query.data?.data;

  // Update mutation
  const updateMutation = useUpdate();

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: "",
      category: undefined,
      muscle_group: undefined,
      equipment: null,
      default_sets: null,
      default_reps: null,
      default_duration_seconds: null,
      rest_seconds: 60,
      instructions: null,
      video_url: null,
      thumbnail_url: null,
      difficulty_level: 1,
      is_active: true,
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (exercise && !isFormInitialized.current) {
      reset({
        name: exercise.name,
        category: exercise.category,
        muscle_group: exercise.muscle_group,
        equipment: exercise.equipment || null,
        default_sets: exercise.default_sets || null,
        default_reps: exercise.default_reps || null,
        default_duration_seconds: exercise.default_duration_seconds || null,
        rest_seconds: exercise.rest_seconds || 60,
        instructions: exercise.instructions || null,
        video_url: exercise.video_url || null,
        thumbnail_url: exercise.thumbnail_url || null,
        difficulty_level: exercise.difficulty_level || 1,
        is_active: exercise.is_active,
      });
      isFormInitialized.current = true;
    }
  }, [exercise, reset]);

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    // Clean up data - convert empty strings to null for optional fields
    const cleanData = {
      name: data.name,
      category: data.category,
      muscle_group: data.muscle_group,
      equipment: data.equipment?.trim() || null,
      default_sets: data.default_sets || null,
      default_reps: data.default_reps || null,
      default_duration_seconds: data.default_duration_seconds || null,
      rest_seconds: data.rest_seconds || 60,
      instructions: data.instructions?.trim() || null,
      video_url: data.video_url?.trim() || null,
      thumbnail_url: data.thumbnail_url?.trim() || null,
      difficulty_level: data.difficulty_level || 1,
      is_active: data.is_active,
    };

    updateMutation.mutate(
      {
        resource: "exercises",
        id: exerciseId,
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Exercise updated successfully!");
          router.push("/admin/config/exercises");
        },
        onError: () => {
          toast.error("Failed to update exercise. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/exercises");
  };

  // Loading state
  if (exerciseQuery.query.isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-6 pl-8 animate-pulse">
          <div className="h-4 w-32 bg-secondary mb-4" />
          <div className="h-8 w-64 bg-secondary mb-4" />
          <div className="h-4 w-48 bg-secondary" />
        </div>
      </div>
    );
  }

  // Not found state
  if (!exercise) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Exercise not found</p>
          <Link
            href="/admin/config/exercises"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Exercises</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/exercises"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Exercises</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Edit <span className="gradient-athletic">Exercise</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">Update exercise: {exercise.name}</p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <ExerciseForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={updateMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Save Changes"
          />
        </form>
      </div>
    </div>
  );
}
