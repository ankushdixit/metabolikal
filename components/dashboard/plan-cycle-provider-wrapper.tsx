"use client";

import { PlanCycleProvider } from "@/contexts/plan-cycle-context";

/**
 * Thin client wrapper for the dashboard layout.
 * The layout itself is a server component, so this bridges to the client context.
 */
export function PlanCycleProviderWrapper({ children }: { children: React.ReactNode }) {
  return <PlanCycleProvider>{children}</PlanCycleProvider>;
}
