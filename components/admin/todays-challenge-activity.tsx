"use client";

import { useMemo, useRef } from "react";
import { useList } from "@refinedev/core";
import Link from "next/link";
import { Trophy, Flame, Check } from "lucide-react";
import {
  getDaysSinceStart,
  daysUntilStart,
  buildDayProgressMap,
  DEFAULT_CHALLENGE_DAYS,
} from "@/lib/challenge-utils";
import type { DayProgress } from "@/lib/challenge-utils";
import type { Profile, ChallengeProgress } from "@/lib/database.types";

interface TodaysChallengeActivityProps {
  clients: Profile[];
  isLoading: boolean;
}

interface ClientChallengeStatus {
  client: Profile;
  currentDay: number;
  totalDays: number;
  isBeforeStart: boolean;
  daysUntil: number;
  loggedToday: boolean;
  todayPoints: number;
  progress: Record<number, DayProgress>;
}

function getFlameClass(points: number, hasData: boolean): string {
  if (!hasData) return "text-muted-foreground/30";
  if (points <= 45) return "text-primary/30";
  if (points <= 100) return "text-primary/60";
  return "text-primary";
}

function DayStrip({
  progress,
  currentDay,
}: {
  progress: Record<number, DayProgress>;
  currentDay: number;
}) {
  const startDay = Math.max(1, currentDay - 9);
  const days = Array.from({ length: currentDay - startDay + 1 }, (_, i) => startDay + i);

  return (
    <div className="flex items-center gap-0.5">
      {days.map((day) => {
        const entry = progress[day];
        const hasData = entry?.hasData ?? false;
        const points = entry?.pointsEarned ?? 0;
        return (
          <span key={day} title={hasData ? `Day ${day} — ${points} pts` : `Day ${day} — No data`}>
            <Flame className={`h-6 w-6 ${getFlameClass(points, hasData)}`} />
          </span>
        );
      })}
    </div>
  );
}

export function TodaysChallengeActivity({ clients, isLoading }: TodaysChallengeActivityProps) {
  // Stable client IDs reference — only recalculate when client list actually changes
  const clientIds = useMemo(() => clients.map((c) => c.id), [clients]);
  const prevIdsRef = useRef<string[]>([]);
  const stableClientIds = useMemo(() => {
    const prev = prevIdsRef.current;
    if (prev.length === clientIds.length && prev.every((id, i) => id === clientIds[i])) {
      return prev;
    }
    prevIdsRef.current = clientIds;
    return clientIds;
  }, [clientIds]);

  // Fetch challenge progress only for the displayed clients
  // Safety limit: even with 50 clients × 90-day plans, 5000 rows covers all realistic scenarios
  // A date filter is impractical here because streak calculation needs full historical data
  const progressQuery = useList<ChallengeProgress>({
    resource: "challenge_progress",
    filters: [{ field: "user_id", operator: "in", value: stableClientIds }],
    pagination: { pageSize: 5000 },
    meta: {
      select:
        "user_id, plan_cycle, day_number, logged_date, steps, water_liters, floors_climbed, protein_grams, sleep_hours, points_earned",
    },
    queryOptions: {
      enabled: stableClientIds.length > 0 && !isLoading,
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
          isBeforeStart: currentDay === 0,
          daysUntil: daysUntilStart(startDate),
          loggedToday: false,
          todayPoints: 0,
          progress: {},
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
      const isNotStarted = currentDay === 0;
      const clientPlanCycle = client.current_plan_cycle ?? 1;

      // Only include rows from the client's current plan cycle
      const rows = (byUser[client.id] || []).filter((r) => r.plan_cycle === clientPlanCycle);
      const progress = buildDayProgressMap(rows);

      const todayEntry = isNotStarted ? undefined : progress[currentDay];
      const loggedToday = todayEntry?.hasData ?? false;
      const todayPoints = todayEntry?.pointsEarned ?? 0;
      return {
        client,
        currentDay,
        totalDays,
        isBeforeStart: isNotStarted,
        daysUntil: daysUntilStart(startDate),
        loggedToday,
        todayPoints,
        progress,
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
          ({
            client,
            currentDay,
            totalDays,
            isBeforeStart: notStarted,
            daysUntil,
            loggedToday,
            todayPoints,
            progress,
          }) => (
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
                    {notStarted
                      ? `Starts in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`
                      : `Day ${currentDay} of ${totalDays}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!notStarted && currentDay > 0 && (
                  <DayStrip progress={progress} currentDay={currentDay} />
                )}
                {notStarted ? (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-500 text-xs font-bold uppercase">
                    Not started
                  </span>
                ) : loggedToday ? (
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
