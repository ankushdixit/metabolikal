"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  label: string;
  view: "front" | "side" | "back";
  userId: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Photo upload component for check-in progress photos
 * Uploads directly to Supabase Storage
 */
export function PhotoUpload({
  label,
  view,
  userId,
  value,
  onChange,
  disabled = false,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const supabase = createBrowserSupabaseClient();
        const date = new Date().toISOString().split("T")[0];
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `${userId}/${date}/${view}.${fileExt}`;

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        const { data, error: uploadError } = await supabase.storage
          .from("checkin-photos")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true,
          });

        clearInterval(progressInterval);

        if (uploadError) {
          throw uploadError;
        }

        // Get signed URL for display
        const { data: signedUrlData } = await supabase.storage
          .from("checkin-photos")
          .createSignedUrl(data.path, 3600); // 1 hour expiry

        setUploadProgress(100);

        if (signedUrlData?.signedUrl) {
          // Store the path, not the signed URL (for database storage)
          onChange(data.path);
        }
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
    [userId, view, onChange]
  );

  const handleRemove = useCallback(async () => {
    if (!value) return;

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.storage.from("checkin-photos").remove([value]);
      onChange(null);
    } catch (err) {
      console.error("Remove error:", err);
      setError("Failed to remove photo.");
    }
  }, [value, onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  // Get preview URL if we have a value
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch signed URL for preview when value changes
  const fetchPreviewUrl = useCallback(async () => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.storage.from("checkin-photos").createSignedUrl(value, 3600);

      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
      }
    } catch {
      console.error("Failed to get preview URL");
    }
  }, [value]);

  // Fetch preview URL on mount and when value changes
  useState(() => {
    fetchPreviewUrl();
  });

  return (
    <div className="space-y-2">
      <label className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
        {label}
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
            <span className="text-[10px] text-muted-foreground mt-1">
              JPG, PNG, WebP (max 10MB)
            </span>
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
        <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
