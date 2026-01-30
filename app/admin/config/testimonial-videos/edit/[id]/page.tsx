"use client";

import { useEffect, useRef } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TestimonialVideoForm } from "@/components/admin/testimonial-video-form";
import { testimonialVideoSchema, type TestimonialVideoFormData } from "@/lib/validations";
import { extractYouTubeId } from "@/lib/utils/youtube";
import type { TestimonialVideo } from "@/lib/database.types";

/**
 * Edit Testimonial Video Page
 * Form for editing existing YouTube video testimonials
 */
export default function EditTestimonialVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;

  const isFormInitialized = useRef(false);

  // Fetch existing video
  const videoQuery = useOne<TestimonialVideo>({
    resource: "testimonial_videos",
    id: videoId,
    queryOptions: {
      enabled: !!videoId,
    },
  });

  const video = videoQuery.query.data?.data;

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

  // Populate form with existing data
  useEffect(() => {
    if (video && !isFormInitialized.current) {
      reset({
        youtube_video_id: video.youtube_video_id,
        title: video.title,
        client_name: video.client_name || null,
        video_type: video.video_type,
        display_order: video.display_order,
        is_active: video.is_active,
      });
      isFormInitialized.current = true;
    }
  }, [video, reset]);

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

    updateMutation.mutate(
      {
        resource: "testimonial_videos",
        id: videoId,
        values: cleanData,
      },
      {
        onSuccess: () => {
          toast.success("Video updated successfully!");
          router.push("/admin/config/testimonial-videos");
        },
        onError: () => {
          toast.error("Failed to update video. Please try again.");
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/testimonial-videos");
  };

  // Loading state
  if (videoQuery.query.isLoading) {
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
  if (!video) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Video not found</p>
          <Link
            href="/admin/config/testimonial-videos"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Videos</span>
          </Link>
        </div>
      </div>
    );
  }

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
          Edit <span className="gradient-athletic">Video</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">Update video: {video.title}</p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <TestimonialVideoForm
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
