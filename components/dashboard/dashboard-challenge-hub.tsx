"use client";

import { useState } from "react";
import { MobileChallengeTray } from "@/components/landing/floating-trays/mobile-challenge-tray";
import { DayCounterTray } from "@/components/landing/floating-trays/day-counter-tray";
import { ChallengeHubModal } from "@/components/landing/modals/challenge-hub-modal";
import { useGamification } from "@/hooks/use-gamification";

/**
 * Renders the floating challenge tray + challenge hub modal on the dashboard.
 * Reuses the same components from the landing page so PWA users
 * can access the challenge hub without navigating to the landing page.
 */
export function DashboardChallengeHub() {
  const gamification = useGamification();
  const [challengeHubOpen, setChallengeHubOpen] = useState(false);

  if (gamification.isLoading) return null;

  return (
    <>
      {/* Desktop: fixed bottom-right tray */}
      <DayCounterTray
        currentDay={gamification.currentDay}
        totalDays={gamification.totalDays}
        onOpenChallengeHub={() => setChallengeHubOpen(true)}
      />
      {/* Mobile: floating bottom bar */}
      <MobileChallengeTray
        currentDay={gamification.currentDay}
        totalDays={gamification.totalDays}
        totalPoints={gamification.totalPoints}
        dayStreak={gamification.dayStreak}
        onOpenChallengeHub={() => setChallengeHubOpen(true)}
      />
      <ChallengeHubModal
        open={challengeHubOpen}
        onOpenChange={setChallengeHubOpen}
        gamification={gamification}
      />
    </>
  );
}
