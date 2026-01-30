"use client";

import { useEffect, useRef } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TestimonialPhotoForm } from "@/components/admin/testimonial-photo-form";
import { testimonialPhotoSchema, type TestimonialPhotoFormData } from "@/lib/validations";
import type { TestimonialPhoto } from "@/lib/database.types";

/**
 * Edit Testimonial Photo Page
 * Form for editing existing before/after transformation photos
 */
export default function EditTestimonialPhotoPage() {
  const router = useRouter();
  const params = useParams();
  const photoId = params.id as string;

  const isFormInitialized = useRef(false);

  // Fetch existing photo
  const photoQuery = useOne<TestimonialPhoto>({
    resource: "testimonial_photos",
    id: photoId,
    queryOptions: {
      enabled: !!photoId,
    },
  });

  const photo = photoQuery.query.data?.data;

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

  // Populate form with existing data
  useEffect(() => {
    if (photo && !isFormInitialized.current) {
      reset({
        client_name: photo.client_name,
        profession: photo.profession || null,
        duration: photo.duration,
        result: photo.result,
        before_image_url: photo.before_image_url,
        after_image_url: photo.after_image_url,
        display_order: photo.display_order,
        is_active: photo.is_active,
      });
      isFormInitialized.current = true;
    }
  }, [photo, reset]);

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    // Validate images are present
    if (!data.before_image_url || !data.after_image_url) {
      toast.error("Please ensure both before and after photos are uploaded");
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

    updateMutation.mutate(
      {
        resource: "testimonial_photos",
        id: photoId,
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Photo entry updated successfully!");
          router.push("/admin/config/testimonial-photos");
        },
        onError: () => {
          toast.error("Failed to update photo entry. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/testimonial-photos");
  };

  // Loading state
  if (photoQuery.query.isLoading) {
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
  if (!photo) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Photo entry not found</p>
          <Link
            href="/admin/config/testimonial-photos"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Photos</span>
          </Link>
        </div>
      </div>
    );
  }

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
          Edit <span className="gradient-athletic">Transformation</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Update transformation: {photo.client_name}
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
            isSubmitting={updateMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Save Changes"
          />
        </form>
      </div>
    </div>
  );
}
