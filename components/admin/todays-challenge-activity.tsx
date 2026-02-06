"use client";

import { useMemo } from "react";
import { useList } from "@refinedev/core";
import Link from "next/link";
import { Trophy, Flame, Check } from "lucide-react";
import {
  getDaysSinceStart,
  calculateStreak,
  buildDayProgressMap,
  DEFAULT_CHALLENGE_DAYS,
} from "@/lib/challenge-utils";
import type { Profile, ChallengeProgress } from "@/lib/database.types";

interface TodaysChallengeActivityProps {
  clients: Profile[];
  isLoading: boolean;
}

interface ClientChallengeStatus {
  client: Profile;
  currentDay: number;
  totalDays: number;
  loggedToday: boolean;
  todayPoints: number;
  streak: number;
}

export function TodaysChallengeActivity({ clients, isLoading }: TodaysChallengeActivityProps) {
  // Fetch all challenge progress (for all clients at once)
  const progressQuery = useList<ChallengeProgress>({
    resource: "challenge_progress",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: clients.length > 0 && !isLoading,
    },
  });

  const allProgressRows = progressQuery.query.data?.data || [];
  const progressLoading = progressQuery.query.isLoading;

  // Compute per-client status
  const clientStatuses = useMemo(() => {
    if (!allProgressRows.length && !progressLoading) {
      // No progress data at all — still show clients as "not logged"
      return clients.map((client): ClientChallengeStatus => {
        const totalDays = client.plan_duration_days || DEFAULT_CHALLENGE_DAYS;
        const startDate = client.plan_start_date || client.created_at?.split("T")[0] || "";
        const currentDay = getDaysSinceStart(startDate, totalDays);
        return {
          client,
          currentDay,
          totalDays,
          loggedToday: false,
          todayPoints: 0,
          streak: 0,
        };
      });
    }

    // Group progress rows by user_id
    const byUser: Record<string, ChallengeProgress[]> = {};
    allProgressRows.forEach((row) => {
      if (row.user_id) {
        if (!byUser[row.user_id]) byUser[row.user_id] = [];
        byUser[row.user_id].push(row);
      }
    });

    return clients.map((client): ClientChallengeStatus => {
      const totalDays = client.plan_duration_days || DEFAULT_CHALLENGE_DAYS;
      const startDate = client.plan_start_date || client.created_at?.split("T")[0] || "";
      const currentDay = getDaysSinceStart(startDate, totalDays);
      const clientPlanCycle = client.current_plan_cycle ?? 1;

      // Only include rows from the client's current plan cycle
      const rows = (byUser[client.id] || []).filter((r) => r.plan_cycle === clientPlanCycle);
      const progress = buildDayProgressMap(rows);

      const todayEntry = progress[currentDay];
      const loggedToday = todayEntry?.hasData ?? false;
      const todayPoints = todayEntry?.pointsEarned ?? 0;
      const streak = calculateStreak(progress, currentDay);

      return {
        client,
        currentDay,
        totalDays,
        loggedToday,
        todayPoints,
        streak,
      };
    });
  }, [clients, allProgressRows, progressLoading]);

  // Sort: not-logged first, then by points desc
  const sortedStatuses = useMemo(() => {
    return [...clientStatuses].sort((a, b) => {
      if (a.loggedToday !== b.loggedToday) return a.loggedToday ? 1 : -1;
      return b.todayPoints - a.todayPoints;
    });
  }, [clientStatuses]);

  const loggedCount = clientStatuses.filter((s) => s.loggedToday).length;
  const totalCount = clientStatuses.length;

  if (isLoading || progressLoading) {
    return (
      <div className="athletic-card p-6 pl-8 animate-pulse">
        <div className="h-5 w-56 bg-secondary mb-4" />
        <div className="h-4 w-40 bg-secondary mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-secondary/50" />
          ))}
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return null;
  }

  return (
    <div className="athletic-card p-6 pl-8">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-black uppercase tracking-tight">
          Today&apos;s Challenge <span className="gradient-athletic">Activity</span>
        </h2>
      </div>

      <p className="text-sm text-muted-foreground font-bold mb-4">
        {loggedCount} of {totalCount} clients logged today
      </p>

      <div className="space-y-2">
        {sortedStatuses.map(
          ({ client, currentDay, totalDays, loggedToday, todayPoints, streak }) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}?tab=challenge`}
              className="flex items-center justify-between p-3 bg-secondary/50 border border-border hover:bg-secondary/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar initial */}
                <div className="w-9 h-9 bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary font-black text-sm">
                    {client.full_name?.charAt(0) || "?"}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-sm text-foreground">{client.full_name}</p>
                  <p className="text-xs text-muted-foreground font-bold">
                    Day {currentDay} of {totalDays}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {streak > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-primary">
                    <Flame className="h-3.5 w-3.5" />
                    {streak}
                  </span>
                )}
                {loggedToday ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-neon-green/20 text-neon-green text-xs font-bold uppercase">
                    <Check className="h-3.5 w-3.5" />
                    {todayPoints} pts
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs font-bold uppercase">
                    Not logged
                  </span>
                )}
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
