"use client";

import { useState } from "react";
import { useList } from "@refinedev/core";
import {
  LineChart,
  Image as ImageIcon,
  AlertCircle,
  ClipboardList,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ProgressCharts } from "@/components/admin/progress-charts";
import { PhotosGallery } from "@/components/admin/photos-gallery";
import { HistoricalCycleBanner } from "@/components/shared/historical-cycle-banner";
import { usePlanCycle } from "@/contexts/plan-cycle-context";
import { cn } from "@/lib/utils";
import type { CheckIn } from "@/lib/database.types";

type Tab = "charts" | "photos";

/**
 * Client Progress Page
 * Displays progress charts and photos for the logged-in client
 */
export default function ProgressPage() {
  const { userId, selectedCycle } = usePlanCycle();
  const [activeTab, setActiveTab] = useState<Tab>("charts");

  // Fetch check-ins for the logged-in client (scoped to selected plan cycle)
  const checkInsQuery = useList<CheckIn>({
    resource: "check_ins",
    filters: [
      { field: "client_id", operator: "eq", value: userId || "" },
      { field: "plan_cycle", operator: "eq", value: selectedCycle },
    ],
    sorters: [{ field: "submitted_at", order: "desc" }],
    queryOptions: {
      enabled: !!userId,
    },
    pagination: {
      pageSize: 100,
    },
  });

  const checkIns = checkInsQuery.query.data?.data || [];
  const isLoading = checkInsQuery.query.isLoading;
  const isError = checkInsQuery.query.isError;
  const isEmpty = !isLoading && !isError && checkIns.length === 0;

  const tabs: { label: string; value: Tab; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "Progress Charts", value: "charts", icon: LineChart },
    { label: "Photos", value: "photos", icon: ImageIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              My <span className="gradient-athletic">Progress</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Track your transformation journey with charts and photos
            </p>
          </div>

          {/* Check-In Count */}
          {checkIns.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm">{checkIns.length} check-ins recorded</span>
            </div>
          )}
        </div>
      </div>

      {/* Plan Cycle Selector + Historical Banner */}
      <HistoricalCycleBanner />

      {/* Error State */}
      {isError && (
        <div className="athletic-card p-8 pl-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground font-bold mb-4">
            Failed to load progress data. Please try again.
          </p>
          <button
            onClick={() => checkInsQuery.query.refetch()}
            className="btn-athletic inline-flex items-center gap-2 px-5 py-3 bg-secondary text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {!isError && isLoading && (
        <div className="space-y-6">
          <div className="athletic-card p-4 pl-8 animate-pulse">
            <div className="flex gap-2">
              <div className="h-10 w-40 bg-secondary" />
              <div className="h-10 w-28 bg-secondary" />
            </div>
          </div>
          <div className="athletic-card p-6 pl-8 animate-pulse">
            <div className="h-80 bg-secondary" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="athletic-card p-8 pl-10 text-center">
          <div className="p-4 bg-secondary inline-block mb-4">
            <LineChart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">No Progress Data Yet</h3>
          <p className="text-muted-foreground font-bold mb-6">
            Submit your first check-in to start tracking your progress!
          </p>
          <Link
            href="/dashboard/checkin"
            className="btn-athletic inline-flex items-center gap-2 px-6 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-4 w-4" />
            <span>Submit First Check-In</span>
          </Link>
        </div>
      )}

      {/* Content with Tabs */}
      {!isLoading && !isEmpty && (
        <>
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
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "charts" && <ProgressCharts checkIns={checkIns} />}
          {activeTab === "photos" && <PhotosGallery checkIns={checkIns} />}
        </>
      )}
    </div>
  );
}
