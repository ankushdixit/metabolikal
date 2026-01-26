"use client";

import { useEffect, useRef } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { LifestyleActivityTypeForm } from "@/components/admin/lifestyle-activity-type-form";
import { lifestyleActivityTypeSchema, type LifestyleActivityTypeFormData } from "@/lib/validations";
import type { LifestyleActivityType } from "@/lib/database.types";

/**
 * Edit Lifestyle Activity Type Page
 * Form for editing existing lifestyle activity types in the library
 */
export default function EditLifestyleActivityTypePage() {
  const router = useRouter();
  const params = useParams();
  const activityTypeId = params.id as string;

  const isFormInitialized = useRef(false);

  // Fetch existing activity type
  const activityTypeQuery = useOne<LifestyleActivityType>({
    resource: "lifestyle_activity_types",
    id: activityTypeId,
    queryOptions: {
      enabled: !!activityTypeId,
    },
  });

  const activityType = activityTypeQuery.query.data?.data;

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

  // Populate form with existing data
  useEffect(() => {
    if (activityType && !isFormInitialized.current) {
      reset({
        name: activityType.name,
        category: activityType.category,
        default_target_value: activityType.default_target_value || null,
        target_unit: activityType.target_unit || null,
        description: activityType.description || null,
        rationale: activityType.rationale || null,
        icon: activityType.icon || null,
        is_active: activityType.is_active,
      });
      isFormInitialized.current = true;
    }
  }, [activityType, reset]);

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

    updateMutation.mutate(
      {
        resource: "lifestyle_activity_types",
        id: activityTypeId,
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Activity type updated successfully!");
          router.push("/admin/config/lifestyle-activities");
        },
        onError: () => {
          toast.error("Failed to update activity type. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/lifestyle-activities");
  };

  // Loading state
  if (activityTypeQuery.query.isLoading) {
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
  if (!activityType) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Activity type not found</p>
          <Link
            href="/admin/config/lifestyle-activities"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Lifestyle Activities</span>
          </Link>
        </div>
      </div>
    );
  }

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
          Edit <span className="gradient-athletic">Activity Type</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Update activity type: {activityType.name}
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
            isSubmitting={updateMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Save Changes"
          />
        </form>
      </div>
    </div>
  );
}
