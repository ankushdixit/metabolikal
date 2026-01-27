"use client";

import { ClientTimelineView } from "@/components/dashboard";

/**
 * Dashboard Home Page
 *
 * Displays the client's daily plan timeline with:
 * - All scheduled activities (meals, supplements, workouts, lifestyle)
 * - Macro targets from coach-set limits
 * - Completion tracking
 * - Current time indicator
 */
export default function DashboardPage() {
  return <ClientTimelineView />;
}
