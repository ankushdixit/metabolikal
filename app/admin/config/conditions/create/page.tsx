"use client";

import { useState } from "react";
import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { ConditionForm, type ConditionFormData } from "@/components/admin/condition-form";

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
 * Create Medical Condition Page
 * Form for adding new medical conditions
 */
export default function CreateConditionPage() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create mutation
  const createMutation = useCreate();

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    setErrorMessage(null);

    // Clean up data - convert empty description to null
    const cleanData = {
      ...data,
      description: data.description?.trim() || null,
    };

    createMutation.mutate(
      {
        resource: "medical_conditions",
        values: cleanData,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Medical condition created successfully!");
          setTimeout(() => {
            router.push("/admin/config/conditions");
          }, 1500);
        },
        onError: (error) => {
          console.error("Create error:", error);
          setErrorMessage(error.message || "Failed to create condition. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/conditions");
  };

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
          Add <span className="gradient-athletic">Condition</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Create a new medical condition for metabolic calculations
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="athletic-card p-4 pl-8 bg-neon-green/20 border-neon-green/50">
          <p className="text-neon-green font-bold">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="athletic-card p-4 pl-8 bg-destructive/20 border-destructive/50">
          <p className="text-red-500 font-bold">{errorMessage}</p>
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
            isSubmitting={createMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Create Condition"
            isEdit={false}
          />
        </form>
      </div>
    </div>
  );
}
