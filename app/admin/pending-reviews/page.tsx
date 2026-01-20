"use client";

import { useState, useEffect, useMemo } from "react";
import { useList } from "@refinedev/core";
import Link from "next/link";
import { ClipboardCheck, Eye, Flag, Calendar } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Profile, CheckIn } from "@/lib/database.types";

/**
 * Pending Reviews Page
 * Lists all check-ins that haven't been reviewed yet
 */
export default function PendingReviewsPage() {
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

  // Fetch all clients
  const clientsQuery = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "role", operator: "eq", value: "client" }],
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Fetch all check-ins
  const checkInsQuery = useList<CheckIn>({
    resource: "check_ins",
    sorters: [{ field: "submitted_at", order: "desc" }],
    queryOptions: {
      enabled: !!adminId,
    },
  });

  const clients = clientsQuery.query.data?.data || [];
  const allCheckIns = checkInsQuery.query.data?.data || [];

  // Filter for pending check-ins (reviewed_at is null)
  const pendingCheckIns = allCheckIns.filter((checkIn) => !checkIn.reviewed_at);

  // Map check-ins with client info
  const checkInsWithClients = useMemo(() => {
    return pendingCheckIns.map((checkIn) => {
      const client = clients.find((c) => c.id === checkIn.client_id);
      return { ...checkIn, client };
    });
  }, [pendingCheckIns, clients]);

  const isLoading = clientsQuery.query.isLoading || checkInsQuery.query.isLoading;

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Pending <span className="gradient-athletic">Reviews</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Check-ins awaiting your review
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <span className="font-bold uppercase tracking-wider text-sm">
              {pendingCheckIns.length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Check-ins Table */}
      {isLoading ? (
        <div className="athletic-card overflow-hidden">
          <div className="p-4 animate-pulse">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-secondary/50">
                  <div className="w-10 h-10 bg-secondary" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-secondary mb-2" />
                    <div className="h-3 w-48 bg-secondary" />
                  </div>
                  <div className="h-8 w-20 bg-secondary" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : pendingCheckIns.length === 0 ? (
        <div className="athletic-card p-8 pl-10 text-center">
          <div className="p-4 bg-neon-green/20 inline-block mb-4">
            <ClipboardCheck className="h-8 w-8 text-neon-green" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-neon-green">
            All Caught Up!
          </h3>
          <p className="text-muted-foreground font-bold">
            No pending check-ins to review at the moment.
          </p>
        </div>
      ) : (
        <div className="athletic-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                    Client
                  </TableHead>
                  <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                    Submitted
                  </TableHead>
                  <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                    Weight
                  </TableHead>
                  <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkInsWithClients.map((checkIn) => (
                  <TableRow key={checkIn.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-black">
                            {checkIn.client?.full_name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold block">
                            {checkIn.client?.full_name || "Unknown"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {checkIn.client?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(checkIn.submitted_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{checkIn.weight}kg</TableCell>
                    <TableCell>
                      {checkIn.flagged_for_followup ? (
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4 text-primary" />
                          <span className="text-primary font-bold text-xs uppercase">Flagged</span>
                        </div>
                      ) : (
                        <span className="text-yellow-500 font-bold text-xs uppercase">Pending</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/clients/${checkIn.client_id}`}
                        className="btn-athletic inline-flex items-center gap-2 px-4 py-2 gradient-electric text-black text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Review</span>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
