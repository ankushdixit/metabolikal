"use client";

import { useState, useEffect } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { ConditionForm, type ConditionFormData } from "@/components/admin/condition-form";
import type { MedicalConditionRow } from "@/lib/database.types";

const conditionSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be 100 characters or less" }),
  slug: z
    .string()
    .min(1, { message: "Slug is required" })
    .max(100, { message: "Slug must be 100 characters or less" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
  impact_percent: z
    .number({
      message: "Impact percentage is required and must be a number",
    })
    .int({ message: "Impact must be a whole number" })
    .min(0, { message: "Impact must be 0 or greater" })
    .max(100, { message: "Impact must be 100 or less" }),
  gender_restriction: z.enum(["male", "female"]).nullable(),
  description: z
    .string()
    .max(500, { message: "Description must be 500 characters or less" })
    .nullable(),
  is_active: z.boolean(),
  display_order: z
    .number({
      message: "Display order is required and must be a number",
    })
    .int({ message: "Display order must be a whole number" })
    .min(0, { message: "Display order must be 0 or greater" }),
});

/**
 * Edit Medical Condition Page
 * Form for editing existing medical conditions
 */
export default function EditConditionPage() {
  const router = useRouter();
  const params = useParams();
  const conditionId = params.id as string;

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFormReady, setIsFormReady] = useState(false);

  // Fetch existing condition
  const conditionQuery = useOne<MedicalConditionRow>({
    resource: "medical_conditions",
    id: conditionId,
    queryOptions: {
      enabled: !!conditionId,
    },
  });

  const condition = conditionQuery.query.data?.data;

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
  } = useForm<ConditionFormData>({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      name: "",
      slug: "",
      impact_percent: 0,
      gender_restriction: null,
      description: null,
      is_active: true,
      display_order: 0,
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (condition && !isFormReady) {
      reset({
        name: condition.name,
        slug: condition.slug,
        impact_percent: condition.impact_percent,
        gender_restriction: condition.gender_restriction,
        description: condition.description,
        is_active: condition.is_active,
        display_order: condition.display_order,
      });
      setIsFormReady(true);
    }
  }, [condition, reset, isFormReady]);

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    // Clean up data - convert empty description to null
    const cleanData = {
      ...data,
      description: data.description?.trim() || null,
    };

    updateMutation.mutate(
      {
        resource: "medical_conditions",
        id: conditionId,
        values: cleanData,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Medical condition updated successfully!");
          setTimeout(() => {
            router.push("/admin/config/conditions");
          }, 1500);
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/conditions");
  };

  // Loading state
  if (conditionQuery.query.isLoading) {
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
  if (!condition) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Medical condition not found</p>
          <Link
            href="/admin/config/conditions"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Conditions</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/conditions"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Conditions</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Edit <span className="gradient-athletic">Condition</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Update condition: {condition.name}
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="athletic-card p-4 pl-8 bg-neon-green/20 border-neon-green/50">
          <p className="text-neon-green font-bold">{successMessage}</p>
        </div>
      )}

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <ConditionForm
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
