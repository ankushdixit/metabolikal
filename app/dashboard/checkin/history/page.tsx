"use client";

import { useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import { ClipboardList, Plus, History, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { CheckInHistoryItem } from "@/components/dashboard/checkin-history-item";
import type { CheckIn } from "@/lib/database.types";

/**
 * Check-In History Page
 * Lists all past check-ins with expandable details
 */
export default function CheckInHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch check-in history
  const checkInsQuery = useList<CheckIn>({
    resource: "check_ins",
    filters: [{ field: "client_id", operator: "eq", value: userId || "" }],
    sorters: [{ field: "submitted_at", order: "desc" }],
    queryOptions: {
      enabled: !!userId,
    },
    pagination: {
      pageSize: 50,
    },
  });

  const checkIns = checkInsQuery.query.data?.data || [];
  const isLoading = checkInsQuery.query.isLoading;
  const isEmpty = !isLoading && checkIns.length === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Check-In <span className="gradient-athletic">History</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
              <History className="h-4 w-4 text-primary" />
              <span>{checkIns.length} check-ins recorded</span>
            </div>
          </div>

          {/* New Check-In Button */}
          <Link
            href="/dashboard/checkin"
            className="btn-athletic flex items-center justify-center gap-2 px-5 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-4 w-4" />
            <span>New Check-In</span>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="athletic-card p-6 pl-8 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-5 w-32 bg-secondary mb-2" />
                  <div className="h-4 w-24 bg-secondary" />
                </div>
                <div className="h-10 w-10 bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="athletic-card p-8 pl-10 text-center">
          <div className="p-4 bg-secondary inline-block mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">No Check-Ins Yet</h3>
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

      {/* Check-In List */}
      {!isLoading && !isEmpty && (
        <div className="space-y-4">
          {checkIns.map((checkIn) => (
            <CheckInHistoryItem key={checkIn.id} checkIn={checkIn} />
          ))}
        </div>
      )}

      {/* Error State */}
      {checkInsQuery.query.isError && (
        <div className="athletic-card p-6 pl-8">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span className="font-bold">Failed to load check-in history. Please try again.</span>
          </div>
        </div>
      )}
    </div>
  );
}
