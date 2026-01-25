"use client";

import { useEffect, useState } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { MealTypeForm, type MealTypeFormData } from "@/components/admin/meal-type-form";
import type { MealTypeRow } from "@/lib/database.types";

const mealTypeSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(50, { message: "Name must be 50 characters or less" }),
  slug: z
    .string()
    .min(1, { message: "Slug is required" })
    .max(50, { message: "Slug must be 50 characters or less" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
  display_order: z
    .number({
      message: "Display order is required and must be a number",
    })
    .int({ message: "Display order must be a whole number" })
    .min(0, { message: "Display order must be 0 or greater" }),
  is_active: z.boolean(),
});

/**
 * Edit Meal Type Page
 * Form for editing existing meal types
 */
export default function EditMealTypePage() {
  const router = useRouter();
  const params = useParams();
  const mealTypeId = params.id as string;

  const [isFormReady, setIsFormReady] = useState(false);

  // Fetch existing meal type
  const mealTypeQuery = useOne<MealTypeRow>({
    resource: "meal_types",
    id: mealTypeId,
    queryOptions: {
      enabled: !!mealTypeId,
    },
  });

  const mealType = mealTypeQuery.query.data?.data;

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
  } = useForm<MealTypeFormData>({
    resolver: zodResolver(mealTypeSchema),
    defaultValues: {
      name: "",
      slug: "",
      display_order: 0,
      is_active: true,
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (mealType && !isFormReady) {
      reset({
        name: mealType.name,
        slug: mealType.slug,
        display_order: mealType.display_order,
        is_active: mealType.is_active,
      });
      setIsFormReady(true);
    }
  }, [mealType, reset, isFormReady]);

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    updateMutation.mutate(
      {
        resource: "meal_types",
        id: mealTypeId,
        values: data,
      },
      {
        onSuccess: () => {
          toast.success("Meal type updated successfully!");
          router.push("/admin/config/meal-types");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update meal type");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/meal-types");
  };

  // Loading state
  if (mealTypeQuery.query.isLoading) {
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
  if (!mealType) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Meal type not found</p>
          <Link
            href="/admin/config/meal-types"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Meal Types</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/meal-types"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Meal Types</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Edit <span className="gradient-athletic">Meal Type</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">Update meal type: {mealType.name}</p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <MealTypeForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={updateMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Save Changes"
            isEdit={true}
          />
        </form>
      </div>
    </div>
  );
}
