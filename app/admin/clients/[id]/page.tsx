"use client";

import { useState, useEffect } from "react";
import { useOne, useList, useInvalidate } from "@refinedev/core";
import { useParams, useSearchParams } from "next/navigation";
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
  Trophy,
  Flag,
  Pencil,
  Cake,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/auth-context";
import { CheckInReview } from "@/components/admin/checkin-review";
import { PhotosGallery } from "@/components/admin/photos-gallery";

const ProgressCharts = dynamic(
  () =>
    import("@/components/admin/progress-charts").then((mod) => ({ default: mod.ProgressCharts })),
  {
    loading: () => (
      <div className="athletic-card p-6 pl-8 animate-pulse">
        <div className="h-80 bg-secondary" />
      </div>
    ),
  }
);
import { PlansSummary } from "@/components/admin/plans-summary";
import { ChallengeProgressTab } from "@/components/admin/challenge-progress-tab";
import { EditClientModal } from "@/components/admin/edit-client-modal";
import { PlanCycleSelector } from "@/components/shared/plan-cycle-selector";
import { cn } from "@/lib/utils";
import type {
  Profile,
  CheckIn,
  DietPlan,
  WorkoutPlan,
  ClientCondition,
  MedicalConditionRow,
} from "@/lib/database.types";

type Tab = "checkins" | "progress" | "photos" | "plans" | "challenge";

// Extended type for client conditions with joined medical condition data
type ClientConditionWithDetails = ClientCondition & {
  medical_conditions?: MedicalConditionRow;
};

/**
 * Calculate age from date of birth string
 */
function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Gender display mapping with icons
 */
const GENDER_DISPLAY: Record<string, { label: string; icon: string }> = {
  male: { label: "Male", icon: "♂" },
  female: { label: "Female", icon: "♀" },
  other: { label: "Other", icon: "⚧" },
  prefer_not_to_say: { label: "—", icon: "👤" },
};

/**
 * Client Review Page
 * Detailed view of a client with tabs for check-ins, progress, photos, and plans
 */
export default function ClientReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.id as string;

  const tabParam = searchParams.get("tab") as Tab | null;
  const validTabs: Tab[] = ["checkins", "progress", "photos", "plans", "challenge"];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : "checkins";

  const { userId: adminId } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const invalidate = useInvalidate();

  // Fetch client profile
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: clientId,
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const clientPlanCycle = profileQuery.query.data?.data?.current_plan_cycle ?? 1;
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);

  // Initialize selectedCycle when profile loads
  useEffect(() => {
    if (profileQuery.query.data?.data && selectedCycle === null) {
      setSelectedCycle(clientPlanCycle);
    }
  }, [profileQuery.query.data, clientPlanCycle, selectedCycle]);

  const effectiveCycle = selectedCycle ?? clientPlanCycle;
  const isViewingHistory = effectiveCycle !== clientPlanCycle;

  // Fetch client's check-ins (scoped to selected plan cycle)
  const checkInsQuery = useList<CheckIn>({
    resource: "check_ins",
    filters: [
      { field: "client_id", operator: "eq", value: clientId },
      { field: "plan_cycle", operator: "eq", value: effectiveCycle },
    ],
    sorters: [{ field: "submitted_at", order: "desc" }],
    pagination: { mode: "off" },
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
    pagination: { mode: "off" },
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
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!clientId,
    },
  });

  // Fetch client's conditions with medical condition details for display
  const clientConditionsQuery = useList<ClientConditionWithDetails>({
    resource: "client_conditions",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    pagination: { mode: "off" },
    meta: {
      select: "*, medical_conditions(id, name, slug)",
    },
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const profile = profileQuery.query.data?.data;
  const checkIns = checkInsQuery.query.data?.data || [];
  const dietPlans = dietPlansQuery.query.data?.data || [];
  const workoutPlans = workoutPlansQuery.query.data?.data || [];
  const clientConditions = clientConditionsQuery.query.data?.data || [];

  // Calculate stats
  const latestCheckIn = checkIns[0];
  const currentWeight = latestCheckIn?.weight;
  const programStartDate = profile?.created_at ? new Date(profile.created_at) : new Date();
  const daysInProgram = Math.floor(
    (new Date().getTime() - programStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isFlagged = checkIns.some((c) => c.flagged_for_followup);

  // Calculate client age from DOB
  const clientAge = calculateAge(profile?.date_of_birth ?? null);

  // Get gender display info
  const genderInfo = profile?.gender ? GENDER_DISPLAY[profile.gender] : null;

  const isLoading = profileQuery.query.isLoading || checkInsQuery.query.isLoading;

  // Refetch check-ins when updated
  const handleCheckInUpdate = () => {
    checkInsQuery.query.refetch();
  };

  // Handle profile edit success
  const handleEditSuccess = () => {
    // Refetch profile and conditions data
    invalidate({
      resource: "profiles",
      id: clientId,
      invalidates: ["detail"],
    });
    invalidate({
      resource: "client_conditions",
      invalidates: ["list"],
    });
    profileQuery.query.refetch();
    clientConditionsQuery.query.refetch();
  };

  const tabs: { label: string; value: Tab; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "Check-ins", value: "checkins", icon: ClipboardList },
    { label: "Progress Charts", value: "progress", icon: LineChart },
    { label: "Photos", value: "photos", icon: ImageIcon },
    { label: "Plans", value: "plans", icon: FileText },
    { label: "Challenge", value: "challenge", icon: Trophy },
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
              {/* Edit Button */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-athletic flex items-center gap-2 px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 transition-colors shrink-0"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline font-bold text-sm uppercase tracking-wider">
                  Edit Profile
                </span>
              </button>
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
              {genderInfo && (
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
                  <span className="text-primary text-lg leading-none">{genderInfo.icon}</span>
                  <span className="font-bold text-sm">{genderInfo.label}</span>
                </div>
              )}
              {clientAge !== null && (
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
                  <Cake className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">Age {clientAge}</span>
                </div>
              )}
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

            {/* Medical Conditions */}
            {clientConditions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Conditions:</span>
                </div>
                {clientConditions.map((cc) => (
                  <span
                    key={cc.id}
                    className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold"
                  >
                    {cc.medical_conditions?.name ?? cc.condition_id}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Cycle Selector */}
      <div className="space-y-2">
        <PlanCycleSelector
          clientId={clientId}
          currentCycle={clientPlanCycle}
          selectedCycle={effectiveCycle}
          onCycleChange={(cycle) => setSelectedCycle(cycle)}
          currentCycleProfile={
            profile?.plan_start_date
              ? {
                  startDate: profile.plan_start_date,
                  durationDays: profile.plan_duration_days || 30,
                }
              : undefined
          }
        />
        {isViewingHistory && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm font-bold text-amber-500">
              Viewing historical data — Plan {effectiveCycle}
            </p>
            <button
              onClick={() => setSelectedCycle(clientPlanCycle)}
              className="ml-auto text-sm font-bold text-primary hover:underline shrink-0"
            >
              Return to Current
            </button>
          </div>
        )}
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
        <PlansSummary
          clientId={clientId}
          dietPlans={dietPlans}
          workoutPlans={workoutPlans}
          selectedCycle={effectiveCycle}
          currentCycle={clientPlanCycle}
        />
      )}

      {activeTab === "challenge" && profile && (
        <ChallengeProgressTab
          clientId={clientId}
          profile={profile}
          selectedCycle={effectiveCycle}
          onCycleChange={(cycle) => setSelectedCycle(cycle)}
        />
      )}

      {/* Edit Client Modal */}
      {profile && (
        <EditClientModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          client={profile}
          clientConditions={clientConditions}
        />
      )}
    </div>
  );
}
