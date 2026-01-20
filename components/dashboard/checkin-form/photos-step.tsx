"use client";

import { Camera, Info } from "lucide-react";
import { PhotoUpload } from "@/components/dashboard/photo-upload";

interface PhotosStepProps {
  userId: string;
  photoFront: string | null;
  photoSide: string | null;
  photoBack: string | null;
  onPhotoChange: (view: "front" | "side" | "back", url: string | null) => void;
}

/**
 * Step 2: Progress Photos
 * Three upload slots for front, side, and back views
 */
export function PhotosStep({
  userId,
  photoFront,
  photoSide,
  photoBack,
  onPhotoChange,
}: PhotosStepProps) {
  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          Step 2 of 4: Progress Photos
        </h3>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-secondary/50 border border-border">
        <div className="p-2 bg-secondary flex-shrink-0">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-bold text-muted-foreground">
          Photos are optional but help track visual progress. For best results, use consistent
          lighting and positioning each week.
        </p>
      </div>

      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-secondary">
          <Camera className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
          Upload Progress Photos
        </span>
      </div>

      {/* Photo Upload Grid */}
      <div className="grid grid-cols-3 gap-4">
        <PhotoUpload
          label="Front View"
          view="front"
          userId={userId}
          value={photoFront}
          onChange={(url) => onPhotoChange("front", url)}
        />
        <PhotoUpload
          label="Side View"
          view="side"
          userId={userId}
          value={photoSide}
          onChange={(url) => onPhotoChange("side", url)}
        />
        <PhotoUpload
          label="Back View"
          view="back"
          userId={userId}
          value={photoBack}
          onChange={(url) => onPhotoChange("back", url)}
        />
      </div>

      {/* Tips */}
      <div className="p-4 bg-card border border-border">
        <h4 className="text-xs font-black tracking-[0.15em] uppercase text-primary mb-3">
          Photo Tips
        </h4>
        <ul className="space-y-2 text-sm font-bold text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">1.</span>
            <span>Wear fitted clothing or swimwear for consistent comparison</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">2.</span>
            <span>Use natural or bright even lighting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">3.</span>
            <span>Stand in the same spot each time if possible</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">4.</span>
            <span>Relax your posture naturally - no flexing</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
