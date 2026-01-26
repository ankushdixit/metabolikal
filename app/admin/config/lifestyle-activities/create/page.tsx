"use client";

import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { LifestyleActivityTypeForm } from "@/components/admin/lifestyle-activity-type-form";
import { lifestyleActivityTypeSchema, type LifestyleActivityTypeFormData } from "@/lib/validations";

/**
 * Create Lifestyle Activity Type Page
 * Form for adding new lifestyle activity types to the library
 */
export default function CreateLifestyleActivityTypePage() {
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
  } = useForm<LifestyleActivityTypeFormData>({
    resolver: zodResolver(lifestyleActivityTypeSchema),
    defaultValues: {
      name: "",
      category: undefined,
      default_target_value: null,
      target_unit: null,
      description: null,
      rationale: null,
      icon: null,
      is_active: true,
    },
  });

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    // Clean up data - convert empty strings to null for optional fields
    const cleanData = {
      name: data.name,
      category: data.category,
      default_target_value: data.default_target_value || null,
      target_unit: data.target_unit?.trim() || null,
      description: data.description?.trim() || null,
      rationale: data.rationale?.trim() || null,
      icon: data.icon || null,
      is_active: data.is_active ?? true,
    };

    createMutation.mutate(
      {
        resource: "lifestyle_activity_types",
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Activity type created successfully!");
          router.push("/admin/config/lifestyle-activities");
        },
        onError: () => {
          toast.error("Failed to create activity type. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/lifestyle-activities");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/lifestyle-activities"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Lifestyle Activities</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Add <span className="gradient-athletic">Activity Type</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Create a new lifestyle activity type for client plans
        </p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <LifestyleActivityTypeForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={createMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Create Activity Type"
          />
        </form>
      </div>
    </div>
  );
}
