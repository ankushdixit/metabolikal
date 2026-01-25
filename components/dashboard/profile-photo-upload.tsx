"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, Upload, Trash2, User, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface ProfilePhotoUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onPhotoUpdated: () => void;
}

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type UploadStatus = "idle" | "previewing" | "uploading" | "success" | "error";

/**
 * Profile Photo Upload Component
 * Handles photo preview, upload to Supabase Storage, and removal
 */
export function ProfilePhotoUpload({
  userId,
  currentAvatarUrl,
  onPhotoUpdated,
}: ProfilePhotoUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setErrorMessage("Please select a JPG, PNG, or WebP image.");
      setStatus("error");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("Image must be less than 5MB.");
      setStatus("error");
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setStatus("previewing");

    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setErrorMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();

      // Determine file extension
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/profile.${fileExtension}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update profile with new avatar URL (add timestamp to bust cache)
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Success
      setStatus("success");
      setSuccessMessage("Photo uploaded successfully!");
      setSelectedFile(null);
      setPreviewUrl(null);
      onPhotoUpdated();

      // Reset status after a delay
      setTimeout(() => {
        setStatus("idle");
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload photo.");
    }
  }, [selectedFile, userId, onPhotoUpdated]);

  const handleCancelPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setStatus("idle");
    setErrorMessage(null);
  }, [previewUrl]);

  const handleRemovePhoto = useCallback(async () => {
    setStatus("uploading");
    setErrorMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();

      // Try to remove from storage (might fail if file doesn't exist, which is OK)
      await supabase.storage
        .from("avatars")
        .remove([`${userId}/profile.jpg`, `${userId}/profile.png`, `${userId}/profile.webp`]);

      // Clear avatar_url in profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Success
      setStatus("success");
      setSuccessMessage("Photo removed successfully!");
      onPhotoUpdated();

      // Reset status after a delay
      setTimeout(() => {
        setStatus("idle");
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to remove photo.");
    }
  }, [userId, onPhotoUpdated]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Determine which image to display
  const displayUrl = previewUrl || currentAvatarUrl;
  const isUploading = status === "uploading";

  return (
    <div className="athletic-card p-6 pl-8 flex flex-col items-center gap-4">
      {/* Photo Display */}
      <div className="relative">
        <div
          className={cn(
            "w-32 h-32 rounded-full overflow-hidden bg-secondary flex items-center justify-center",
            "border-4 border-primary/20 transition-all",
            status === "previewing" && "border-primary"
          )}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Profile photo"
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <User className="w-16 h-16 text-muted-foreground" />
          )}

          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Camera icon button */}
        <button
          onClick={triggerFileInput}
          disabled={isUploading}
          className={cn(
            "absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full",
            "hover:bg-primary/90 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Upload photo"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Select profile photo"
      />

      {/* Status Messages */}
      {errorMessage && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-sm w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-sm w-full">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      {status === "previewing" && (
        <div className="flex gap-2 w-full">
          <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
            <Upload className="w-4 h-4 mr-2" />
            Save Photo
          </Button>
          <Button variant="outline" onClick={handleCancelPreview} disabled={isUploading}>
            Cancel
          </Button>
        </div>
      )}

      {status === "idle" && (
        <div className="flex flex-col gap-2 w-full">
          <Button variant="outline" onClick={triggerFileInput} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Upload Photo
          </Button>

          {currentAvatarUrl && (
            <Button
              variant="ghost"
              onClick={handleRemovePhoto}
              className="w-full text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Photo
            </Button>
          )}
        </div>
      )}

      {/* File requirements hint */}
      <p className="text-xs text-muted-foreground text-center">JPG, PNG, or WebP. Max 5MB.</p>
    </div>
  );
}
