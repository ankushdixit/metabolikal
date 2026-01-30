"use client";

import { FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AlertCircle, Video, User, CheckCircle2, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TESTIMONIAL_VIDEO_TYPES, type TestimonialVideoFormData } from "@/lib/validations";
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeWatchUrl } from "@/lib/utils/youtube";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface TestimonialVideoFormProps {
  register: UseFormRegister<TestimonialVideoFormData>;
  errors: FieldErrors<TestimonialVideoFormData>;
  watch: UseFormWatch<TestimonialVideoFormData>;
  setValue: UseFormSetValue<TestimonialVideoFormData>;
  isSubmitting?: boolean;
  onCancel: () => void;
  submitLabel: string;
}

/**
 * Testimonial Video Form Component
 * Reusable form for creating and editing YouTube video testimonials
 */
export function TestimonialVideoForm({
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
  onCancel,
  submitLabel,
}: TestimonialVideoFormProps) {
  const isActive = watch("is_active");
  const selectedVideoType = watch("video_type");
  const youtubeVideoId = watch("youtube_video_id");

  // Extract and validate YouTube ID
  const extractedId = useMemo(() => {
    if (!youtubeVideoId) return null;
    return extractYouTubeId(youtubeVideoId);
  }, [youtubeVideoId]);

  // Handle YouTube URL/ID input - extract the ID if a URL is pasted
  const handleYouTubeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const extracted = extractYouTubeId(input);
    if (extracted) {
      setValue("youtube_video_id", extracted);
    } else {
      // Keep the raw input if we can't extract an ID yet (user might still be typing)
      setValue("youtube_video_id", input);
    }
  };

  return (
    <div className="space-y-6">
      {/* YouTube Video ID/URL - Required */}
      <div>
        <label
          htmlFor="youtube_video_id"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          YouTube Video URL or ID <span className="text-primary">*</span>
        </label>
        <div className="relative">
          <input
            id="youtube_video_id"
            type="text"
            placeholder="e.g., https://youtube.com/watch?v=abc123 or abc123"
            className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            value={youtubeVideoId || ""}
            onChange={handleYouTubeInputChange}
          />
          <input type="hidden" {...register("youtube_video_id")} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Paste a YouTube URL or enter the video ID directly
        </p>
        {errors.youtube_video_id && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.youtube_video_id.message as string}</span>
          </div>
        )}
      </div>

      {/* Video Preview */}
      {extractedId && (
        <div className="p-4 bg-secondary border border-border">
          <div className="flex items-center gap-2 mb-3 text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            <Video className="h-4 w-4" />
            <span>Video Preview</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="relative w-40 h-24 bg-card overflow-hidden flex-shrink-0">
              <img
                src={getYouTubeThumbnail(extractedId, "mqdefault")}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm mb-2">Video ID: {extractedId}</p>
              <a
                href={getYouTubeWatchUrl(extractedId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open on YouTube
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Title - Required */}
      <div>
        <label
          htmlFor="title"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Title <span className="text-primary">*</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="e.g., Client Transformation Story"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("title")}
        />
        {errors.title && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.title.message as string}</span>
          </div>
        )}
      </div>

      {/* Client Name - Optional */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <User className="h-5 w-5 text-primary" />
          <label
            htmlFor="client_name"
            className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground"
          >
            Client Name
          </label>
        </div>
        <input
          id="client_name"
          type="text"
          placeholder="e.g., John D."
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("client_name")}
        />
        {errors.client_name && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.client_name.message as string}</span>
          </div>
        )}
      </div>

      {/* Video Type - Required */}
      <div>
        <label className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2">
          Video Type <span className="text-primary">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TESTIMONIAL_VIDEO_TYPES.map((type) => {
            const isSelected = selectedVideoType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setValue("video_type", type.value)}
                className={cn(
                  "btn-athletic px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                  isSelected
                    ? "gradient-electric text-black"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {type.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Shorts are vertical (9:16), Landscape is horizontal (16:9)
        </p>
        {errors.video_type && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.video_type.message as string}</span>
          </div>
        )}
      </div>

      {/* Display Order - Optional */}
      <div>
        <label
          htmlFor="display_order"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Display Order
        </label>
        <input
          id="display_order"
          type="number"
          min="0"
          placeholder="e.g., 1, 2, 3..."
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("display_order", { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Lower numbers appear first. Leave empty for automatic ordering.
        </p>
        {errors.display_order && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.display_order.message as string}</span>
          </div>
        )}
      </div>

      {/* Active Checkbox */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="is_active"
          checked={isActive ?? true}
          onCheckedChange={(checked) => setValue("is_active", checked === true)}
          className="h-5 w-5"
        />
        <label
          htmlFor="is_active"
          className="flex items-center gap-2 text-sm font-bold cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4 text-neon-green" />
          <span>Active (visible on landing page)</span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn-athletic px-6 py-3 bg-secondary text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-athletic flex-1 px-6 py-3 gradient-electric text-black glow-power disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
