"use client";

import { useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import Link from "next/link";
import { Users, ClipboardCheck, Calendar } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { StatsCards } from "@/components/admin/stats-cards";
import type { Profile, CheckIn } from "@/lib/database.types";

/**
 * Admin Dashboard Home Page
 * Displays overview stats and quick actions
 */
export default function AdminDashboardPage() {
  const [adminId, setAdminId] = useState<string | null>(null);

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Fetch all clients (profiles with role='client')
  const clientsQuery = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "role", operator: "eq", value: "client" }],
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Fetch all check-ins (we'll filter for pending in JS)
  const checkInsQuery = useList<CheckIn>({
    resource: "check_ins",
    sorters: [{ field: "submitted_at", order: "desc" }],
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Calculate stats
  const clients = clientsQuery.query.data?.data || [];
  const allCheckIns = checkInsQuery.query.data?.data || [];

  // Filter for pending check-ins (reviewed_at is null)
  const pendingCheckIns = allCheckIns.filter((checkIn) => !checkIn.reviewed_at);

  const totalClients = clients.length;
  const pendingReviews = pendingCheckIns.length;
  const flaggedClients = clients.filter((client) =>
    pendingCheckIns.some(
      (checkIn) => checkIn.client_id === client.id && checkIn.flagged_for_followup
    )
  ).length;

  const isLoading = clientsQuery.query.isLoading || checkInsQuery.query.isLoading;

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
