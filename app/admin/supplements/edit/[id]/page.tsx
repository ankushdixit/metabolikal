"use client";

import { useEffect, useRef } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SupplementForm } from "@/components/admin/supplement-form";
import { supplementSchema, type SupplementFormData } from "@/lib/validations";
import type { Supplement } from "@/lib/database.types";

/**
 * Edit Supplement Page
 * Form for editing existing supplements in the database
 */
export default function EditSupplementPage() {
  const router = useRouter();
  const params = useParams();
  const supplementId = params.id as string;

  const isFormInitialized = useRef(false);

  // Fetch existing supplement
  const supplementQuery = useOne<Supplement>({
    resource: "supplements",
    id: supplementId,
    queryOptions: {
      enabled: !!supplementId,
    },
  });

  const supplement = supplementQuery.query.data?.data;

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
  } = useForm<SupplementFormData>({
    resolver: zodResolver(supplementSchema),
    defaultValues: {
      name: "",
      category: undefined,
      default_dosage: undefined,
      dosage_unit: "",
      instructions: null,
      notes: null,
      is_active: true,
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (supplement && !isFormInitialized.current) {
      reset({
        name: supplement.name,
        category: supplement.category,
        default_dosage: supplement.default_dosage,
        dosage_unit: supplement.dosage_unit,
        instructions: supplement.instructions || null,
        notes: supplement.notes || null,
        is_active: supplement.is_active,
      });
      isFormInitialized.current = true;
    }
  }, [supplement, reset]);

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    // Clean up data
    const cleanData = {
      name: data.name,
      category: data.category,
      default_dosage: data.default_dosage,
      dosage_unit: data.dosage_unit,
      instructions: data.instructions?.trim() || null,
      notes: data.notes?.trim() || null,
      is_active: data.is_active,
    };

    updateMutation.mutate(
      {
        resource: "supplements",
        id: supplementId,
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Supplement updated successfully!");
          router.push("/admin/supplements");
        },
        onError: () => {
          toast.error("Failed to update supplement. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/supplements");
  };

  // Loading state
  if (supplementQuery.query.isLoading) {
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
  if (!supplement) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Supplement not found</p>
          <Link
            href="/admin/supplements"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Supplements</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/supplements"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Supplements</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Edit <span className="gradient-athletic">Supplement</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Update supplement: {supplement.name}
        </p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <SupplementForm
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
