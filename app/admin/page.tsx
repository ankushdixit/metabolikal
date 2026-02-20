"use client";

import { useList } from "@refinedev/core";
import Link from "next/link";
import { Users, ClipboardCheck, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { StatsCards } from "@/components/admin/stats-cards";
import { TodaysChallengeActivity } from "@/components/admin/todays-challenge-activity";
import type { Profile, CheckIn } from "@/lib/database.types";

/**
 * Admin Dashboard Home Page
 * Displays overview stats and quick actions
 */
export default function AdminDashboardPage() {
  const { userId: adminId } = useAuth();

  // Fetch all clients (profiles with role='client')
  const clientsQuery = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "role", operator: "eq", value: "client" }],
    pagination: { mode: "off" },
    meta: {
      select:
        "id, full_name, avatar_url, role, plan_start_date, plan_duration_days, is_deactivated, invited_at, invitation_accepted_at, created_at, current_plan_cycle",
    },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Fetch only pending (unreviewed) check-ins — server-side filter replaces JS filtering
  const checkInsQuery = useList<CheckIn>({
    resource: "check_ins",
    filters: [{ field: "reviewed_at", operator: "null", value: true }],
    sorters: [{ field: "submitted_at", order: "desc" }],
    pagination: { pageSize: 500 },
    meta: {
      select: "id, client_id, submitted_at, reviewed_at, flagged_for_followup",
    },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Calculate stats
  const clients = clientsQuery.query.data?.data || [];
  // All check-ins returned are already pending (reviewed_at IS NULL) via server filter
  const pendingCheckIns = checkInsQuery.query.data?.data || [];

  // Count only active clients (not invited pending, not deactivated)
  const activeClients = clients.filter(
    (client) => !client.is_deactivated && !(client.invited_at && !client.invitation_accepted_at)
  );
  const totalClients = activeClients.length;
  const pendingReviews = pendingCheckIns.length;
  const flaggedClients = clients.filter((client) =>
    pendingCheckIns.some(
      (checkIn) => checkIn.client_id === client.id && checkIn.flagged_for_followup
    )
  ).length;

  const isLoading = clientsQuery.query.isLoading || checkInsQuery.query.isLoading;
  const isError = clientsQuery.query.isError || checkInsQuery.query.isError;

  const handleRetry = () => {
    clientsQuery.query.refetch();
    checkInsQuery.query.refetch();
  };

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="athletic-card p-8 pl-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground font-bold mb-4">
            Failed to load dashboard data. Please try again.
          </p>
          <button
            onClick={handleRetry}
            className="btn-athletic inline-flex items-center gap-2 px-5 py-3 bg-secondary text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Admin <span className="gradient-athletic">Dashboard</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-bold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalClients={totalClients}
        pendingReviews={pendingReviews}
        flaggedClients={flaggedClients}
        isLoading={isLoading}
      />

      {/* Quick Actions */}
      <div className="athletic-card p-6 pl-8">
        <h2 className="text-lg font-black uppercase tracking-tight mb-4">
          Quick <span className="gradient-athletic">Actions</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/clients"
            className="btn-athletic flex items-center justify-center gap-3 px-6 py-4 bg-secondary text-foreground"
          >
            <Users className="h-5 w-5" />
            <span>View All Clients</span>
          </Link>
          <Link
            href="/admin/pending-reviews"
            className="btn-athletic flex items-center justify-center gap-3 px-6 py-4 gradient-electric text-black glow-power"
          >
            <ClipboardCheck className="h-5 w-5" />
            <span>Review Pending Check-ins</span>
          </Link>
        </div>
      </div>

      {/* Today's Challenge Activity */}
      <TodaysChallengeActivity clients={activeClients} isLoading={isLoading} />

      {/* Recent Activity Preview */}
      {pendingReviews > 0 && (
        <div className="athletic-card p-6 pl-8">
          <h2 className="text-lg font-black uppercase tracking-tight mb-4">
            Recent <span className="gradient-athletic">Check-ins</span>
          </h2>
          <div className="space-y-3">
            {pendingCheckIns.slice(0, 3).map((checkIn) => {
              const client = clients.find((c) => c.id === checkIn.client_id);
              return (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-black">
                        {client?.full_name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {client?.full_name || "Unknown Client"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(checkIn.submitted_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {checkIn.flagged_for_followup && (
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold uppercase">
                        Flagged
                      </span>
                    )}
                    <Link
                      href={`/admin/clients/${checkIn.client_id}`}
                      className="btn-athletic px-4 py-2 bg-secondary text-foreground text-sm"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          {pendingReviews > 3 && (
            <Link
              href="/admin/pending-reviews"
              className="block mt-4 text-center text-primary font-bold text-sm hover:underline"
            >
              View all {pendingReviews} pending check-ins
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
