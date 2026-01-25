"use client";

import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { MealTypeForm, type MealTypeFormData } from "@/components/admin/meal-type-form";

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
 * Create Meal Type Page
 * Form for adding new meal types
 */
export default function CreateMealTypePage() {
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
  } = useForm<MealTypeFormData>({
    resolver: zodResolver(mealTypeSchema),
    defaultValues: {
      name: "",
      slug: "",
      display_order: 0,
      is_active: true,
    },
  });

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    createMutation.mutate(
      {
        resource: "meal_types",
        values: data,
      },
      {
        onSuccess: () => {
          toast.success("Meal type created successfully!");
          router.push("/admin/config/meal-types");
        },
        onError: (error) => {
          console.error("Create error:", error);
          toast.error(
            error.message ||
              "Failed to create meal type. Make sure the database migration has been applied."
          );
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/meal-types");
  };

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
          Add <span className="gradient-athletic">Meal Type</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">Create a new meal category</p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <MealTypeForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={createMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Create Meal Type"
            isEdit={false}
          />
        </form>
      </div>
    </div>
  );
}
