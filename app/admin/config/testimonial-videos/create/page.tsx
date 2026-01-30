"use client";

import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TestimonialVideoForm } from "@/components/admin/testimonial-video-form";
import { testimonialVideoSchema, type TestimonialVideoFormData } from "@/lib/validations";
import { extractYouTubeId } from "@/lib/utils/youtube";

/**
 * Create Testimonial Video Page
 * Form for adding new YouTube video testimonials
 */
export default function CreateTestimonialVideoPage() {
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
  } = useForm<TestimonialVideoFormData>({
    resolver: zodResolver(testimonialVideoSchema),
    defaultValues: {
      youtube_video_id: "",
      title: "",
      client_name: null,
      video_type: "short",
      display_order: null,
      is_active: true,
    },
  });

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    // Extract YouTube ID if URL was pasted
    const youtubeId = extractYouTubeId(data.youtube_video_id);
    if (!youtubeId) {
      toast.error("Invalid YouTube URL or video ID");
      return;
    }

    // Clean up data
    const cleanData = {
      youtube_video_id: youtubeId,
      title: data.title.trim(),
      client_name: data.client_name?.trim() || null,
      video_type: data.video_type,
      display_order: data.display_order || 0,
      is_active: data.is_active,
    };

    createMutation.mutate(
      {
        resource: "testimonial_videos",
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Video added successfully!");
          router.push("/admin/config/testimonial-videos");
        },
        onError: () => {
          toast.error("Failed to add video. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/testimonial-videos");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/testimonial-videos"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Videos</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Add <span className="gradient-athletic">Video</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Add a new YouTube testimonial video to the landing page
        </p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <TestimonialVideoForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={createMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Add Video"
          />
        </form>
      </div>
    </div>
  );
}
