"use client";

import { useDeactivationGuard } from "@/hooks/use-deactivation-guard";

/**
 * Client component that polls for account deactivation.
 * Renders nothing — exists solely to run the hook in the dashboard layout.
 */
export function DeactivationGuard() {
  useDeactivationGuard();
  return null;
}
