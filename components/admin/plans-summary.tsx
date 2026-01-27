"use client";

import { useState } from "react";
import { Settings, Edit, Loader2, Check } from "lucide-react";
import { useOne, useUpdate } from "@refinedev/core";
import { toast } from "sonner";
import type { Profile } from "@/lib/database.types";
import { parsePlanDate } from "@/lib/utils/plan-dates";
import { cn } from "@/lib/utils";
import { PlanLimitsManager } from "./plan-limits-manager";
import { DailyPlanView } from "./daily-plan-view";

interface PlansSummaryProps {
  clientId: string;
  // Legacy props - kept for backward compatibility but no longer used
  dietPlans?: unknown[];
  workoutPlans?: unknown[];
}

// Predefined duration options
const DURATION_OPTIONS = [7, 14, 21, 28, 30, 60, 90];

/**
 * Plans summary component
 *
 * Displays plan settings, macro limits, and the daily plan view.
 * Shows all 4 plan types (Diet, Supplements, Workout, Lifestyle) in a 2x2 grid.
 */
export function PlansSummary({ clientId }: PlansSummaryProps) {
  // Plan settings state
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editDuration, setEditDuration] = useState<number>(7);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch client profile for plan settings
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: clientId,
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const { mutateAsync: updateProfile } = useUpdate();

  const profile = profileQuery.query.data?.data;
  const planStartDate = parsePlanDate(profile?.plan_start_date);
  const planDuration = profile?.plan_duration_days ?? 7;

  // Initialize edit state when entering edit mode
  const handleStartEditing = () => {
    setEditStartDate(profile?.plan_start_date || "");
    setEditDuration(profile?.plan_duration_days ?? 7);
    setIsEditingSettings(true);
  };

  // Save plan settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        resource: "profiles",
        id: clientId,
        values: {
          plan_start_date: editStartDate || null,
          plan_duration_days: editDuration,
        },
      });
      toast.success("Plan settings updated");
      profileQuery.query.refetch();
      setIsEditingSettings(false);
    } catch (error) {
      console.error("Failed to update plan settings:", error);
      toast.error("Failed to update plan settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setIsEditingSettings(false);
  };

  return (
    <div className="space-y-6">
      {/* Plan Settings */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">
              Plan <span className="gradient-athletic">Settings</span>
            </h2>
          </div>
          {!isEditingSettings && (
            <button
              onClick={handleStartEditing}
              className="btn-athletic flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Settings</span>
            </button>
          )}
        </div>

        {profileQuery.query.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-bold">Loading...</span>
          </div>
        ) : isEditingSettings ? (
          <div className="space-y-4">
            {/* Plan Start Date */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Plan Start Date (Day 1)
              </label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full max-w-xs px-4 py-2 bg-secondary border border-border rounded font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for the daily plan view. When set, days show calendar dates.
              </p>
            </div>

            {/* Plan Duration */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Plan Duration (Days)
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setEditDuration(days)}
                    className={cn(
                      "px-4 py-2 rounded border text-sm font-bold transition-all",
                      editDuration === days
                        ? "bg-primary border-primary text-black"
                        : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {days}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={editDuration}
                  onChange={(e) =>
                    setEditDuration(Math.max(1, Math.min(365, parseInt(e.target.value) || 7)))
                  }
                  className="w-20 px-3 py-2 bg-secondary border border-border rounded font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Custom"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="btn-athletic flex items-center gap-2 px-4 py-2 gradient-electric text-black font-bold disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEditing}
                disabled={isSaving}
                className="btn-athletic px-4 py-2 bg-secondary text-foreground font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Start Date</p>
              <p className="text-lg font-black">
                {planStartDate
                  ? planStartDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not set"}
              </p>
            </div>
            <div className="bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Duration</p>
              <p className="text-lg font-black">{planDuration} days</p>
            </div>
            {planStartDate && (
              <div className="bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">End Date</p>
                <p className="text-lg font-black">
                  {(() => {
                    const endDate = new Date(planStartDate);
                    endDate.setDate(endDate.getDate() + planDuration - 1);
                    return endDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  })()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Plan Limits Manager */}
        <PlanLimitsManager clientId={clientId} />
      </div>

      {/* Daily Plan View */}
      <DailyPlanView clientId={clientId} onEditSettings={handleStartEditing} />
    </div>
  );
}
