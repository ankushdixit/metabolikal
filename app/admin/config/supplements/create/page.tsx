"use client";

import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SupplementForm } from "@/components/admin/supplement-form";
import { supplementSchema, type SupplementFormData } from "@/lib/validations";

/**
 * Create Supplement Page
 * Form for adding new supplements to the database
 */
export default function CreateSupplementPage() {
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

    createMutation.mutate(
      {
        resource: "supplements",
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Supplement created successfully!");
          router.push("/admin/config/supplements");
        },
        onError: () => {
          toast.error("Failed to create supplement. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/supplements");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/supplements"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Supplements</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Add <span className="gradient-athletic">Supplement</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Create a new supplement for client plans
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
            isSubmitting={createMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Create Supplement"
          />
        </form>
      </div>
    </div>
  );
}
