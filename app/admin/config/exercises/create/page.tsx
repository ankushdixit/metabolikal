"use client";

import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ExerciseForm } from "@/components/admin/exercise-form";
import { exerciseSchema, type ExerciseFormData } from "@/lib/validations";

/**
 * Create Exercise Page
 * Form for adding new exercises to the library
 */
export default function CreateExercisePage() {
  const router = useRouter();

  // Create mutation
  const createMutation = useCreate();

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

    createMutation.mutate(
      {
        resource: "exercises",
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Exercise created successfully!");
          router.push("/admin/config/exercises");
        },
        onError: () => {
          toast.error("Failed to create exercise. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/exercises");
  };

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
          Add <span className="gradient-athletic">Exercise</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Create a new exercise for workout plans
        </p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <ExerciseForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={createMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Create Exercise"
          />
        </form>
      </div>
    </div>
  );
}
