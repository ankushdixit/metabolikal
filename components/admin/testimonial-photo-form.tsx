"use client";

import { FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AlertCircle, User, Briefcase, Clock, Trophy, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TestimonialPhotoUpload } from "./testimonial-photo-upload";
import { type TestimonialPhotoFormData } from "@/lib/validations";

interface TestimonialPhotoFormProps {
  register: UseFormRegister<TestimonialPhotoFormData>;
  errors: FieldErrors<TestimonialPhotoFormData>;
  watch: UseFormWatch<TestimonialPhotoFormData>;
  setValue: UseFormSetValue<TestimonialPhotoFormData>;
  isSubmitting?: boolean;
  onCancel: () => void;
  submitLabel: string;
}

/**
 * Testimonial Photo Form Component
 * Reusable form for creating and editing before/after transformation photos
 */
export function TestimonialPhotoForm({
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
  onCancel,
  submitLabel,
}: TestimonialPhotoFormProps) {
  const isActive = watch("is_active");
  const beforeImageUrl = watch("before_image_url");
  const afterImageUrl = watch("after_image_url");

  return (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <div>
        <div className="flex items-center gap-2 mb-4 text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
          <span>Transformation Photos</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Upload before and after photos. Images must be exactly 600x800 pixels (3:4 portrait aspect
          ratio).
        </p>
        <div className="grid grid-cols-2 gap-4">
          <TestimonialPhotoUpload
            label="Before Photo"
            imageType="before"
            value={beforeImageUrl}
            onChange={(url) => setValue("before_image_url", url || "")}
            disabled={isSubmitting}
          />
          <TestimonialPhotoUpload
            label="After Photo"
            imageType="after"
            value={afterImageUrl}
            onChange={(url) => setValue("after_image_url", url || "")}
            disabled={isSubmitting}
          />
        </div>
        {/* Hidden inputs for form validation */}
        <input type="hidden" {...register("before_image_url")} />
        <input type="hidden" {...register("after_image_url")} />
        {errors.before_image_url && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.before_image_url.message as string}</span>
          </div>
        )}
        {errors.after_image_url && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.after_image_url.message as string}</span>
          </div>
        )}
      </div>

      {/* Client Name - Required */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <User className="h-5 w-5 text-primary" />
          <label
            htmlFor="client_name"
            className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground"
          >
            Client Name <span className="text-primary">*</span>
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

      {/* Profession - Optional */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <label
            htmlFor="profession"
            className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground"
          >
            Profession
          </label>
        </div>
        <input
          id="profession"
          type="text"
          placeholder="e.g., Software Engineer, Doctor"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("profession")}
        />
        {errors.profession && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.profession.message as string}</span>
          </div>
        )}
      </div>

      {/* Duration - Required */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Clock className="h-5 w-5 text-primary" />
          <label
            htmlFor="duration"
            className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground"
          >
            Duration <span className="text-primary">*</span>
          </label>
        </div>
        <input
          id="duration"
          type="text"
          placeholder="e.g., 3 months, 16 weeks"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("duration")}
        />
        {errors.duration && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.duration.message as string}</span>
          </div>
        )}
      </div>

      {/* Result - Required */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-5 w-5 text-primary" />
          <label
            htmlFor="result"
            className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground"
          >
            Result <span className="text-primary">*</span>
          </label>
        </div>
        <input
          id="result"
          type="text"
          placeholder="e.g., Lost 10kg, Gained 5kg muscle"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("result")}
        />
        {errors.result && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.result.message as string}</span>
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
