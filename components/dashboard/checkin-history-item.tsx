"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Scale,
  Ruler,
  Camera,
  Battery,
  Moon,
  Brain,
  Smile,
  Utensils,
  Dumbbell,
  MessageSquare,
  Check,
  X,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { CheckIn } from "@/lib/database.types";

interface CheckInHistoryItemProps {
  checkIn: CheckIn;
}

/**
 * Expandable check-in history item
 * Shows summary collapsed, full details expanded
 */
export function CheckInHistoryItem({ checkIn }: CheckInHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<{
    front?: string;
    side?: string;
    back?: string;
  }>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Format date
  const submittedDate = new Date(checkIn.submitted_at);
  const formattedDate = submittedDate.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Fetch signed URLs for photos when expanded
  const fetchPhotoUrls = useCallback(async () => {
    if (!checkIn.photo_front && !checkIn.photo_side && !checkIn.photo_back) return;

    const supabase = createBrowserSupabaseClient();
    const urls: { front?: string; side?: string; back?: string } = {};

    if (checkIn.photo_front) {
      const { data } = await supabase.storage
        .from("checkin-photos")
        .createSignedUrl(checkIn.photo_front, 3600);
      if (data?.signedUrl) urls.front = data.signedUrl;
    }

    if (checkIn.photo_side) {
      const { data } = await supabase.storage
        .from("checkin-photos")
        .createSignedUrl(checkIn.photo_side, 3600);
      if (data?.signedUrl) urls.side = data.signedUrl;
    }

    if (checkIn.photo_back) {
      const { data } = await supabase.storage
        .from("checkin-photos")
        .createSignedUrl(checkIn.photo_back, 3600);
      if (data?.signedUrl) urls.back = data.signedUrl;
    }

    setPhotoUrls(urls);
  }, [checkIn.photo_front, checkIn.photo_side, checkIn.photo_back]);

  useEffect(() => {
    if (isExpanded) {
      fetchPhotoUrls();
    }
  }, [isExpanded, fetchPhotoUrls]);

  // Check if all key data is present for completion badge
  const isComplete =
    checkIn.weight != null && checkIn.energy_rating != null && checkIn.diet_adherence != null;

  return (
    <>
      <div className="athletic-card overflow-hidden">
        {/* Collapsed Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 pl-8 flex items-center justify-between hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="text-left">
              <div className="text-lg font-black uppercase tracking-tight">{formattedDate}</div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground font-bold mt-1">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <span>{checkIn.weight} kg</span>
                </div>
                {isComplete && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-neon-green/20 text-neon-green text-xs font-black uppercase">
                    <Check className="h-3 w-3" />
                    <span>Complete</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-2 bg-secondary">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-primary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-border p-6 pl-8 space-y-6">
            {/* Measurements */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-secondary">
                  <Ruler className="h-4 w-4 text-primary" />
                </div>
                <h4 className="text-xs font-black tracking-[0.15em] uppercase text-primary">
                  Measurements
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-secondary">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                    Weight
                  </span>
                  <span className="text-xl font-black">{checkIn.weight} kg</span>
                </div>
                {checkIn.body_fat_percent && (
                  <div className="p-3 bg-secondary">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                      Body Fat
                    </span>
                    <span className="text-xl font-black">{checkIn.body_fat_percent}%</span>
                  </div>
                )}
                {checkIn.chest_cm && (
                  <div className="p-3 bg-secondary">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                      Chest
                    </span>
                    <span className="text-xl font-black">{checkIn.chest_cm} cm</span>
                  </div>
                )}
                {checkIn.waist_cm && (
                  <div className="p-3 bg-secondary">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                      Waist
                    </span>
                    <span className="text-xl font-black">{checkIn.waist_cm} cm</span>
                  </div>
                )}
                {checkIn.hips_cm && (
                  <div className="p-3 bg-secondary">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                      Hips
                    </span>
                    <span className="text-xl font-black">{checkIn.hips_cm} cm</span>
                  </div>
                )}
                {checkIn.arms_cm && (
                  <div className="p-3 bg-secondary">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                      Arms
                    </span>
                    <span className="text-xl font-black">{checkIn.arms_cm} cm</span>
                  </div>
                )}
                {checkIn.thighs_cm && (
                  <div className="p-3 bg-secondary">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                      Thighs
                    </span>
                    <span className="text-xl font-black">{checkIn.thighs_cm} cm</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Photos */}
            {(photoUrls.front || photoUrls.side || photoUrls.back) && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-secondary">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-xs font-black tracking-[0.15em] uppercase text-primary">
                    Progress Photos
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {photoUrls.front && (
                    <button
                      onClick={() => setLightboxImage(photoUrls.front || null)}
                      className="aspect-[3/4] bg-secondary overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={photoUrls.front}
                        alt="Front view"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                  {photoUrls.side && (
                    <button
                      onClick={() => setLightboxImage(photoUrls.side || null)}
                      className="aspect-[3/4] bg-secondary overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={photoUrls.side}
                        alt="Side view"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                  {photoUrls.back && (
                    <button
                      onClick={() => setLightboxImage(photoUrls.back || null)}
                      className="aspect-[3/4] bg-secondary overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={photoUrls.back}
                        alt="Back view"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Subjective Ratings */}
            {(checkIn.energy_rating ||
              checkIn.sleep_rating ||
              checkIn.stress_rating ||
              checkIn.mood_rating) && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-secondary">
                    <Smile className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-xs font-black tracking-[0.15em] uppercase text-primary">
                    Subjective Ratings
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {checkIn.energy_rating && (
                    <RatingDisplay icon={Battery} label="Energy" value={checkIn.energy_rating} />
                  )}
                  {checkIn.sleep_rating && (
                    <RatingDisplay icon={Moon} label="Sleep" value={checkIn.sleep_rating} />
                  )}
                  {checkIn.stress_rating && (
                    <RatingDisplay icon={Brain} label="Stress" value={checkIn.stress_rating} />
                  )}
                  {checkIn.mood_rating && (
                    <RatingDisplay icon={Smile} label="Mood" value={checkIn.mood_rating} />
                  )}
                </div>
              </div>
            )}

            {/* Compliance */}
            {(checkIn.diet_adherence != null || checkIn.workout_adherence != null) && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-secondary">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-xs font-black tracking-[0.15em] uppercase text-primary">
                    Compliance
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {checkIn.diet_adherence != null && (
                    <div className="p-4 bg-secondary">
                      <div className="flex items-center gap-2 mb-2">
                        <Utensils className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Diet
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black gradient-athletic">
                          {checkIn.diet_adherence}%
                        </span>
                        <div className="flex-1 h-2 bg-card overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              checkIn.diet_adherence >= 80
                                ? "bg-neon-green"
                                : checkIn.diet_adherence >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            )}
                            style={{ width: `${checkIn.diet_adherence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {checkIn.workout_adherence != null && (
                    <div className="p-4 bg-secondary">
                      <div className="flex items-center gap-2 mb-2">
                        <Dumbbell className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Workout
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black gradient-athletic">
                          {checkIn.workout_adherence}%
                        </span>
                        <div className="flex-1 h-2 bg-card overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              checkIn.workout_adherence >= 80
                                ? "bg-neon-green"
                                : checkIn.workout_adherence >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            )}
                            style={{ width: `${checkIn.workout_adherence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {(checkIn.challenges || checkIn.progress_notes || checkIn.questions) && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-secondary">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-xs font-black tracking-[0.15em] uppercase text-primary">
                    Notes
                  </h4>
                </div>
                <div className="space-y-3">
                  {checkIn.challenges && (
                    <div className="p-4 bg-secondary">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                        Challenges
                      </span>
                      <p className="text-sm font-bold text-foreground">{checkIn.challenges}</p>
                    </div>
                  )}
                  {checkIn.progress_notes && (
                    <div className="p-4 bg-secondary">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                        Progress
                      </span>
                      <p className="text-sm font-bold text-foreground">{checkIn.progress_notes}</p>
                    </div>
                  )}
                  {checkIn.questions && (
                    <div className="p-4 bg-secondary">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                        Questions
                      </span>
                      <p className="text-sm font-bold text-foreground">{checkIn.questions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-3 bg-secondary hover:bg-secondary/80 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size progress photo"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}

interface RatingDisplayProps {
  icon: React.ElementType;
  label: string;
  value: number;
}

function RatingDisplay({ icon: Icon, label, value }: RatingDisplayProps) {
  const getColor = (val: number) => {
    if (val >= 7) return "text-neon-green";
    if (val >= 4) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="p-4 bg-secondary">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <span className={cn("text-2xl font-black", getColor(value))}>{value}/10</span>
    </div>
  );
}
