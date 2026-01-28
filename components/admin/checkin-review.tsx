"use client";

import { useState } from "react";
import { useUpdate, useCreate } from "@refinedev/core";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Flag,
  Scale,
  Activity,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckIn } from "@/lib/database.types";

/**
 * Send push notification to client about check-in review
 */
async function sendPushNotification(clientId: string, checkInId: string, message: string) {
  try {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds: [clientId],
        notification: {
          title: "Check-in Reviewed",
          body: message.length > 100 ? `${message.slice(0, 97)}...` : message,
          data: {
            url: "/dashboard/checkin/history",
            type: "checkin_review",
            relatedId: checkInId,
          },
        },
      }),
    });
  } catch (error) {
    console.error("Failed to send push notification:", error);
    // Don't throw - push notification failure shouldn't block the flow
  }
}

interface CheckInReviewProps {
  checkIn: CheckIn;
  previousCheckIn?: CheckIn | null;
  adminId: string;
  onUpdate?: () => void;
}

/**
 * Check-in review component with expandable details
 * Shows measurements, ratings, photos, and admin actions
 */
export function CheckInReview({ checkIn, previousCheckIn, adminId, onUpdate }: CheckInReviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [adminNotes, setAdminNotes] = useState(checkIn.admin_notes || "");
  const [isFlagged, setIsFlagged] = useState(checkIn.flagged_for_followup);
  const [notesSaved, setNotesSaved] = useState(false);

  const updateMutation = useUpdate();
  const createNotification = useCreate();

  const handleSaveNotes = () => {
    const trimmedNotes = adminNotes.trim();
    const previousNotes = checkIn.admin_notes?.trim() || "";

    // Only proceed if there are notes and they've changed
    if (!trimmedNotes || trimmedNotes === previousNotes) {
      return;
    }

    updateMutation.mutate(
      {
        resource: "check_ins",
        id: checkIn.id,
        values: {
          admin_notes: trimmedNotes,
        },
      },
      {
        onSuccess: () => {
          // Create a notification for the client
          createNotification.mutate(
            {
              resource: "notifications",
              values: {
                user_id: checkIn.client_id,
                sender_id: adminId,
                type: "checkin_review",
                title: "Check-in Feedback",
                message: trimmedNotes,
                related_checkin_id: checkIn.id,
              },
            },
            {
              onSuccess: () => {
                // Send push notification to client
                sendPushNotification(checkIn.client_id, checkIn.id, trimmedNotes);
                setNotesSaved(true);
                setTimeout(() => setNotesSaved(false), 2000);
                onUpdate?.();
              },
              onError: () => {
                // Notes saved but notification failed - still call onUpdate
                onUpdate?.();
              },
            }
          );
        },
      }
    );
  };

  const handleToggleFlag = () => {
    const newFlagValue = !isFlagged;
    setIsFlagged(newFlagValue);
    updateMutation.mutate(
      {
        resource: "check_ins",
        id: checkIn.id,
        values: {
          flagged_for_followup: newFlagValue,
        },
      },
      {
        onSuccess: () => {
          onUpdate?.();
        },
      }
    );
  };

  const handleMarkReviewed = () => {
    updateMutation.mutate(
      {
        resource: "check_ins",
        id: checkIn.id,
        values: {
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        },
      },
      {
        onSuccess: () => {
          onUpdate?.();
        },
      }
    );
  };

  // Calculate difference from previous check-in
  const getDiff = (current: number | null, previous: number | null | undefined) => {
    if (current === null || previous === null || previous === undefined) return null;
    const diff = current - previous;
    if (diff === 0) return null;
    return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const measurements = [
    { label: "Weight", value: checkIn.weight, prev: previousCheckIn?.weight, unit: "kg" },
    {
      label: "Body Fat",
      value: checkIn.body_fat_percent,
      prev: previousCheckIn?.body_fat_percent,
      unit: "%",
    },
    { label: "Chest", value: checkIn.chest_cm, prev: previousCheckIn?.chest_cm, unit: "cm" },
    { label: "Waist", value: checkIn.waist_cm, prev: previousCheckIn?.waist_cm, unit: "cm" },
    { label: "Hips", value: checkIn.hips_cm, prev: previousCheckIn?.hips_cm, unit: "cm" },
    { label: "Arms", value: checkIn.arms_cm, prev: previousCheckIn?.arms_cm, unit: "cm" },
    { label: "Thighs", value: checkIn.thighs_cm, prev: previousCheckIn?.thighs_cm, unit: "cm" },
  ];

  const ratings = [
    { label: "Energy", value: checkIn.energy_rating },
    { label: "Sleep", value: checkIn.sleep_rating },
    { label: "Stress", value: checkIn.stress_rating },
    { label: "Mood", value: checkIn.mood_rating },
  ];

  const compliance = [
    { label: "Diet Adherence", value: checkIn.diet_adherence },
    { label: "Workout Adherence", value: checkIn.workout_adherence },
  ];

  const hasPhotos = checkIn.photo_front || checkIn.photo_side || checkIn.photo_back;

  return (
    <div className="border border-border bg-card/50">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="font-bold text-foreground">{formatDate(checkIn.submitted_at)}</p>
            <p className="text-sm text-muted-foreground">
              Weight: {checkIn.weight}kg
              {getDiff(checkIn.weight, previousCheckIn?.weight) && (
                <span
                  className={cn(
                    "ml-2",
                    Number(getDiff(checkIn.weight, previousCheckIn?.weight)) < 0
                      ? "text-neon-green"
                      : "text-primary"
                  )}
                >
                  ({getDiff(checkIn.weight, previousCheckIn?.weight)}kg)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {checkIn.flagged_for_followup && (
            <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold uppercase">
              Flagged
            </span>
          )}
          {checkIn.reviewed_at ? (
            <span className="px-2 py-1 bg-neon-green/20 text-neon-green text-xs font-bold uppercase">
              Reviewed
            </span>
          ) : (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-bold uppercase">
              Pending
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border p-6 space-y-6">
          {/* Measurements */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-black uppercase tracking-wider">Measurements</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {measurements.map((m) =>
                m.value !== null ? (
                  <div key={m.label} className="bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-1">
                      {m.label}
                    </p>
                    <p className="text-lg font-black">
                      {m.value}
                      {m.unit}
                      {getDiff(m.value, m.prev) && (
                        <span
                          className={cn(
                            "text-sm ml-1",
                            m.label === "Weight" || m.label === "Waist" || m.label === "Body Fat"
                              ? Number(getDiff(m.value, m.prev)) < 0
                                ? "text-neon-green"
                                : "text-primary"
                              : Number(getDiff(m.value, m.prev)) > 0
                                ? "text-neon-green"
                                : "text-primary"
                          )}
                        >
                          ({getDiff(m.value, m.prev)})
                        </span>
                      )}
                    </p>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Photos */}
          {hasPhotos && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-black uppercase tracking-wider">Progress Photos</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {checkIn.photo_front && (
                  <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                    <img
                      src={checkIn.photo_front}
                      alt="Front view"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold uppercase">
                      Front
                    </span>
                  </div>
                )}
                {checkIn.photo_side && (
                  <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                    <img
                      src={checkIn.photo_side}
                      alt="Side view"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold uppercase">
                      Side
                    </span>
                  </div>
                )}
                {checkIn.photo_back && (
                  <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                    <img
                      src={checkIn.photo_back}
                      alt="Back view"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold uppercase">
                      Back
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ratings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-black uppercase tracking-wider">Ratings & Compliance</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ratings.map((r) =>
                r.value !== null ? (
                  <div key={r.label} className="bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-1">
                      {r.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary">
                        <div
                          className="h-full gradient-electric"
                          style={{ width: `${(r.value / 10) * 100}%` }}
                        />
                      </div>
                      <span className="font-black text-sm">{r.value}/10</span>
                    </div>
                  </div>
                ) : null
              )}
              {compliance.map((c) =>
                c.value !== null ? (
                  <div key={c.label} className="bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-1">
                      {c.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary">
                        <div className="h-full bg-neon-green" style={{ width: `${c.value}%` }} />
                      </div>
                      <span className="font-black text-sm">{c.value}%</span>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Client Notes */}
          {(checkIn.challenges || checkIn.progress_notes || checkIn.questions) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-black uppercase tracking-wider">Client Notes</h4>
              </div>
              <div className="space-y-3">
                {checkIn.challenges && (
                  <div className="bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-2">
                      Challenges
                    </p>
                    <p className="text-sm">{checkIn.challenges}</p>
                  </div>
                )}
                {checkIn.progress_notes && (
                  <div className="bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-2">
                      Progress Notes
                    </p>
                    <p className="text-sm">{checkIn.progress_notes}</p>
                  </div>
                )}
                {checkIn.questions && (
                  <div className="bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-2">
                      Questions
                    </p>
                    <p className="text-sm">{checkIn.questions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Section */}
          <div className="border-t border-border pt-6">
            <h4 className="text-sm font-black uppercase tracking-wider mb-4 gradient-athletic">
              Admin Actions
            </h4>

            {/* Admin Notes */}
            <div className="mb-4">
              <label className="block text-xs text-muted-foreground font-bold uppercase mb-2">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for this check-in..."
                className="w-full p-4 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
              />
              <button
                onClick={handleSaveNotes}
                disabled={
                  updateMutation.mutation.isPending || createNotification.mutation.isPending
                }
                className={cn(
                  "mt-2 btn-athletic px-4 py-2 text-sm disabled:opacity-50",
                  notesSaved ? "bg-neon-green/20 text-neon-green" : "bg-secondary text-foreground"
                )}
              >
                {notesSaved ? "Saved & Notified!" : "Save Notes"}
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleToggleFlag}
                disabled={updateMutation.mutation.isPending}
                className={cn(
                  "btn-athletic flex items-center gap-2 px-4 py-2 text-sm",
                  isFlagged
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <Flag className="h-4 w-4" />
                <span>{isFlagged ? "Remove Flag" : "Flag for Follow-up"}</span>
              </button>

              {!checkIn.reviewed_at && (
                <button
                  onClick={handleMarkReviewed}
                  disabled={updateMutation.mutation.isPending}
                  className="btn-athletic flex items-center gap-2 px-4 py-2 gradient-electric text-black text-sm glow-power"
                >
                  <Check className="h-4 w-4" />
                  <span>Mark as Reviewed</span>
                </button>
              )}
            </div>

            {/* Reviewed info */}
            {checkIn.reviewed_at && (
              <p className="mt-4 text-sm text-muted-foreground">
                Reviewed on{" "}
                {new Date(checkIn.reviewed_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
