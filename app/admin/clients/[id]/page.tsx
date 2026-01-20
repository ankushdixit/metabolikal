"use client";

import { useState, useEffect } from "react";
import { useOne, useList } from "@refinedev/core";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Scale,
  ClipboardList,
  LineChart,
  Image as ImageIcon,
  FileText,
  Flag,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { CheckInReview } from "@/components/admin/checkin-review";
import { ProgressCharts } from "@/components/admin/progress-charts";
import { PhotosGallery } from "@/components/admin/photos-gallery";
import { PlansSummary } from "@/components/admin/plans-summary";
import { cn } from "@/lib/utils";
import type { Profile, CheckIn, DietPlan, WorkoutPlan } from "@/lib/database.types";

type Tab = "checkins" | "progress" | "photos" | "plans";

/**
 * Client Review Page
 * Detailed view of a client with tabs for check-ins, progress, photos, and plans
 */
export default function ClientReviewPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [adminId, setAdminId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("checkins");

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Fetch client profile
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: clientId,
    queryOptions: {
      enabled: !!clientId,
    },
  });

  // Fetch client's check-ins
  const checkInsQuery = useList<CheckIn>({
    resource: "check_ins",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    sorters: [{ field: "submitted_at", order: "desc" }],
    queryOptions: {
      enabled: !!clientId,
    },
  });

  // Fetch client's diet plans
  const dietPlansQuery = useList<
    DietPlan & { food_items?: { name: string; calories: number; protein: number } }
  >({
    resource: "diet_plans",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    meta: {
      select: "*, food_items(name, calories, protein)",
    },
    queryOptions: {
      enabled: !!clientId,
    },
  });

  // Fetch client's workout plans
  const workoutPlansQuery = useList<WorkoutPlan>({
    resource: "workout_plans",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    sorters: [
      { field: "day_number", order: "asc" },
      { field: "display_order", order: "asc" },
    ],
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const profile = profileQuery.query.data?.data;
  const checkIns = checkInsQuery.query.data?.data || [];
  const dietPlans = dietPlansQuery.query.data?.data || [];
  const workoutPlans = workoutPlansQuery.query.data?.data || [];

  // Calculate stats
  const latestCheckIn = checkIns[0];
  const currentWeight = latestCheckIn?.weight;
  const programStartDate = profile?.created_at ? new Date(profile.created_at) : new Date();
  const daysInProgram = Math.floor(
    (new Date().getTime() - programStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isFlagged = checkIns.some((c) => c.flagged_for_followup);

  const isLoading = profileQuery.query.isLoading || checkInsQuery.query.isLoading;

  // Refetch check-ins when updated
  const handleCheckInUpdate = () => {
    checkInsQuery.query.refetch();
  };

  const tabs: { label: string; value: Tab; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "Check-ins", value: "checkins", icon: ClipboardList },
    { label: "Progress Charts", value: "progress", icon: LineChart },
    { label: "Photos", value: "photos", icon: ImageIcon },
    { label: "Plans", value: "plans", icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="athletic-card p-6 pl-8 animate-pulse">
          <div className="h-4 w-32 bg-secondary mb-4" />
          <div className="h-8 w-64 bg-secondary mb-4" />
          <div className="h-4 w-48 bg-secondary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Client not found</p>
          <Link
            href="/admin/clients"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Clients</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Clients</span>
      </Link>

      {/* Client Header */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-primary/20 flex items-center justify-center shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-black text-primary">
                {profile.full_name?.charAt(0) || "?"}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                    {profile.full_name}
                  </h1>
                  {isFlagged && (
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold uppercase flex items-center gap-1">
                      <Flag className="h-3 w-3" />
                      Flagged
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground font-bold">{profile.email}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">
                  Started{" "}
                  {programStartDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
                <User className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">{daysInProgram} days in program</span>
              </div>
              {currentWeight && (
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
                  <Scale className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">Current: {currentWeight}kg</span>
                </div>
              )}
              {latestCheckIn && (
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">
                    Last check-in:{" "}
                    {new Date(latestCheckIn.submitted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="athletic-card p-4 pl-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "btn-athletic flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                activeTab === tab.value
                  ? "gradient-electric text-black"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "checkins" && (
        <div className="space-y-4">
          <div className="athletic-card p-6 pl-8">
            <h2 className="text-lg font-black uppercase tracking-tight mb-4">
              Check-in <span className="gradient-athletic">History</span>
            </h2>
            {checkIns.length === 0 ? (
              <p className="text-muted-foreground font-bold">No check-ins yet</p>
            ) : (
              <div className="space-y-3">
                {checkIns.map((checkIn, index) => (
                  <CheckInReview
                    key={checkIn.id}
                    checkIn={checkIn}
                    previousCheckIn={checkIns[index + 1] || null}
                    adminId={adminId || ""}
                    onUpdate={handleCheckInUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "progress" && <ProgressCharts checkIns={checkIns} />}

      {activeTab === "photos" && <PhotosGallery checkIns={checkIns} />}

      {activeTab === "plans" && (
        <PlansSummary clientId={clientId} dietPlans={dietPlans} workoutPlans={workoutPlans} />
      )}
    </div>
  );
}
