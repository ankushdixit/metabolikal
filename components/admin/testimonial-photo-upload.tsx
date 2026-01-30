"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface TestimonialPhotoUploadProps {
  label: string;
  imageType: "before" | "after";
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const REQUIRED_WIDTH = 600;
const REQUIRED_HEIGHT = 800;

/**
 * Validate image dimensions (600x800px required)
 */
function validateImageDimensions(
  file: File
): Promise<{ valid: boolean; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const result = {
        valid: img.width === REQUIRED_WIDTH && img.height === REQUIRED_HEIGHT,
        width: img.width,
        height: img.height,
      };
      URL.revokeObjectURL(img.src);
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false, width: 0, height: 0 });
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Photo upload component for testimonial before/after photos
 * Uploads directly to Supabase Storage with dimension validation
 */
export function TestimonialPhotoUpload({
  label,
  imageType,
  value,
  onChange,
  disabled = false,
}: TestimonialPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if value is a storage path or a static image URL
  const isStoragePath = value && !value.startsWith("/images/") && !value.startsWith("http");

  // Fetch preview URL for storage paths
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    // If it's a static path (e.g., /images/transformations/...), use it directly
    if (value.startsWith("/images/") || value.startsWith("http")) {
      setPreviewUrl(value);
      return;
    }

    // For storage paths, get a signed URL
    const fetchPreviewUrl = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.storage.from("testimonials").createSignedUrl(value, 3600);
        if (data?.signedUrl) {
          setPreviewUrl(data.signedUrl);
        }
      } catch {
        console.error("Failed to get preview URL");
        setPreviewUrl(null);
      }
    };

    fetchPreviewUrl();
  }, [value]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);

      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Invalid file type. Please use JPG, PNG, or WebP.");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError("File too large (max 10MB)");
        return;
      }

      // Validate dimensions
      const dimensions = await validateImageDimensions(file);
      if (!dimensions.valid) {
        setError(
          `Image must be exactly ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT} pixels (3:4 aspect ratio). ` +
            `Your image is ${dimensions.width}x${dimensions.height}.`
        );
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const supabase = createBrowserSupabaseClient();
        const timestamp = Date.now();
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `photos/${timestamp}-${imageType}.${fileExt}`;

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        const { data, error: uploadError } = await supabase.storage
          .from("testimonials")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        clearInterval(progressInterval);

        if (uploadError) {
          throw uploadError;
        }

        setUploadProgress(100);

        // Store the path (for database storage)
        onChange(data.path);
      } catch (err) {
        console.error("Upload error:", err);
        setError("Failed to upload photo. Please try again.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [imageType, onChange]
  );

  const handleRemove = useCallback(async () => {
    if (!value) return;

    try {
      // Only try to delete from storage if it's a storage path
      if (isStoragePath) {
        const supabase = createBrowserSupabaseClient();
        await supabase.storage.from("testimonials").remove([value]);
      }
      onChange(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Remove error:", err);
      setError("Failed to remove photo.");
    }
  }, [value, isStoragePath, onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
        {label} <span className="text-primary">*</span>
      </label>

      <div
        onClick={handleClick}
        className={cn(
          "relative aspect-[3/4] bg-secondary border-2 border-dashed border-border transition-all cursor-pointer",
          !disabled && !isUploading && "hover:border-primary hover:bg-secondary/80",
          disabled && "opacity-50 cursor-not-allowed",
          value && "border-solid border-primary"
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {/* Upload placeholder */}
        {!value && !isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="p-3 bg-card mb-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Click to upload
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">600x800px required</span>
            <span className="text-[10px] text-muted-foreground">JPG, PNG, WebP (max 10MB)</span>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-card/80">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <div className="w-full max-w-[120px] h-2 bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-muted-foreground mt-2">
              Uploading... {uploadProgress}%
            </span>
          </div>
        )}

        {/* Preview */}
        {value && !isUploading && (
          <>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`${label} preview`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-red-500 text-xs font-bold">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
