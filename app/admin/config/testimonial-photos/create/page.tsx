"use client";

import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TestimonialPhotoForm } from "@/components/admin/testimonial-photo-form";
import { testimonialPhotoSchema, type TestimonialPhotoFormData } from "@/lib/validations";

/**
 * Create Testimonial Photo Page
 * Form for adding new before/after transformation photos
 */
export default function CreateTestimonialPhotoPage() {
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
  } = useForm<TestimonialPhotoFormData>({
    resolver: zodResolver(testimonialPhotoSchema),
    defaultValues: {
      client_name: "",
      profession: null,
      duration: "",
      result: "",
      before_image_url: "",
      after_image_url: "",
      display_order: null,
      is_active: true,
    },
  });

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    // Validate images are uploaded
    if (!data.before_image_url || !data.after_image_url) {
      toast.error("Please upload both before and after photos");
      return;
    }

    // Clean up data
    const cleanData = {
      client_name: data.client_name.trim(),
      profession: data.profession?.trim() || null,
      duration: data.duration.trim(),
      result: data.result.trim(),
      before_image_url: data.before_image_url,
      after_image_url: data.after_image_url,
      display_order: data.display_order || 0,
      is_active: data.is_active,
    };

    createMutation.mutate(
      {
        resource: "testimonial_photos",
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Photo entry added successfully!");
          router.push("/admin/config/testimonial-photos");
        },
        onError: () => {
          toast.error("Failed to add photo entry. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/testimonial-photos");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/testimonial-photos"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Photos</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Add <span className="gradient-athletic">Transformation</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Add a new before/after transformation photo to the landing page
        </p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <TestimonialPhotoForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={createMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Add Transformation"
          />
        </form>
      </div>
    </div>
  );
}
