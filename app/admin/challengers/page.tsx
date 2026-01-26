"use client";

import { useState, useEffect, useMemo } from "react";
import { useList, useUpdate } from "@refinedev/core";
import { Search, Trophy, UserPlus, Calendar, Target, Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import type {
  Profile,
  ChallengeProgress,
  AssessmentResult,
  CalculatorResult,
} from "@/lib/database.types";

interface ChallengerWithStats extends Profile {
  daysCompleted: number;
  totalPoints: number;
  hasAssessment: boolean;
  hasCalculator: boolean;
  lastActive: string | null;
}

/**
 * Challengers Management Page
 * View and manage challenger users (30-day challenge participants)
 */
export default function ChallengersPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // Get current admin user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, [supabase]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch all challengers
  const challengersQuery = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "role", operator: "eq", value: "challenger" }],
    sorters: [{ field: "created_at", order: "desc" }],
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Fetch challenge progress for all users (disable pagination to get all records)
  const progressQuery = useList<ChallengeProgress>({
    resource: "challenge_progress",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Fetch assessment results (disable pagination to get all records)
  const assessmentQuery = useList<AssessmentResult>({
    resource: "assessment_results",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Fetch calculator results (disable pagination to get all records)
  const calculatorQuery = useList<CalculatorResult>({
    resource: "calculator_results",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Update mutation for upgrading to client
  const { mutate: updateProfile } = useUpdate<Profile>();

  // Process data
  const challengers = challengersQuery.query.data?.data || [];
  const progress = progressQuery.query.data?.data || [];
  const assessments = assessmentQuery.query.data?.data || [];
  const calculators = calculatorQuery.query.data?.data || [];

  // Map challengers with their stats
  const challengersWithStats: ChallengerWithStats[] = useMemo(() => {
    return challengers.map((challenger) => {
      const userProgress = progress.filter((p) => p.user_id === challenger.id);
      const daysCompleted = userProgress.length;
      const totalPoints = userProgress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
      const hasAssessment = assessments.some((a) => a.user_id === challenger.id);
      const hasCalculator = calculators.some((c) => c.user_id === challenger.id);
      const lastActiveEntry = userProgress.sort(
        (a, b) => new Date(b.logged_date).getTime() - new Date(a.logged_date).getTime()
      )[0];
      const lastActive = lastActiveEntry?.logged_date || null;

      return {
        ...challenger,
        daysCompleted,
        totalPoints,
        hasAssessment,
        hasCalculator,
        lastActive,
      };
    });
  }, [challengers, progress, assessments, calculators]);

  // Filter challengers based on search
  const filteredChallengers = useMemo(() => {
    if (!searchQuery) return challengersWithStats;

    const query = searchQuery.toLowerCase();
    return challengersWithStats.filter(
      (challenger) =>
        challenger.full_name?.toLowerCase().includes(query) ||
        challenger.email?.toLowerCase().includes(query)
    );
  }, [challengersWithStats, searchQuery]);

  // Paginate
  const totalPages = Math.ceil(filteredChallengers.length / ADMIN_PAGE_SIZE);
  const paginatedChallengers = filteredChallengers.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  const isLoading =
    challengersQuery.query.isLoading ||
    progressQuery.query.isLoading ||
    assessmentQuery.query.isLoading ||
    calculatorQuery.query.isLoading;

  // Handle upgrade to client
  const handleUpgradeToClient = async (challengerId: string) => {
    setUpgradingId(challengerId);
    try {
      await updateProfile({
        resource: "profiles",
        id: challengerId,
        values: { role: "client" },
      });
      // Refresh the list
      challengersQuery.query.refetch();
    } catch (error) {
      console.error("Error upgrading challenger:", error);
    } finally {
      setUpgradingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Challenge <span className="gradient-athletic">Participants</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Manage 30-day challenge participants and upgrade them to full clients
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-bold uppercase tracking-wider text-sm">
              {filteredChallengers.length} Challenger{filteredChallengers.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="athletic-card p-6 pl-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Challengers Table */}
      <div className="athletic-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paginatedChallengers.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-bold">No challengers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-6 py-4 text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Challenger
                  </th>
                  <th className="text-center px-4 py-4 text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Profile
                  </th>
                  <th className="text-center px-4 py-4 text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Progress
                  </th>
                  <th className="text-center px-4 py-4 text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Points
                  </th>
                  <th className="text-center px-4 py-4 text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Last Active
                  </th>
                  <th className="text-center px-4 py-4 text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Joined
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedChallengers.map((challenger) => (
                  <tr
                    key={challenger.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-foreground">{challenger.full_name}</div>
                        <div className="text-xs text-muted-foreground">{challenger.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={cn(
                            "p-1",
                            challenger.hasAssessment ? "bg-primary" : "bg-secondary"
                          )}
                          title={
                            challenger.hasAssessment ? "Assessment completed" : "Assessment pending"
                          }
                        >
                          <Target
                            className={cn(
                              "h-3 w-3",
                              challenger.hasAssessment ? "text-black" : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            "p-1",
                            challenger.hasCalculator ? "bg-primary" : "bg-secondary"
                          )}
                          title={
                            challenger.hasCalculator ? "Calculator completed" : "Calculator pending"
                          }
                        >
                          <Calendar
                            className={cn(
                              "h-3 w-3",
                              challenger.hasCalculator ? "text-black" : "text-muted-foreground"
                            )}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-foreground">{challenger.daysCompleted}</span>
                      <span className="text-muted-foreground text-xs"> / 30 days</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-primary">
                        {challenger.totalPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-muted-foreground">
                      {formatDate(challenger.lastActive)}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-muted-foreground">
                      {formatDate(challenger.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleUpgradeToClient(challenger.id)}
                        disabled={upgradingId === challenger.id}
                        className="btn-athletic px-3 py-2 text-xs font-bold uppercase tracking-wider gradient-electric text-black hover:opacity-90 disabled:opacity-50 flex items-center gap-2 ml-auto"
                      >
                        {upgradingId === challenger.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        Upgrade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-athletic px-4 py-2 text-sm font-bold uppercase tracking-wider bg-secondary text-foreground disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-athletic px-4 py-2 text-sm font-bold uppercase tracking-wider bg-secondary text-foreground disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
