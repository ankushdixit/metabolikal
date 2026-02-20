"use client";

import dynamic from "next/dynamic";
import React from "react";

/**
 * Client-only Refine Provider Wrapper
 * Uses dynamic import with ssr: false to avoid SSR/SSG issues with Refine's useSearchParams
 */
const RefineProvider = dynamic(
  () =>
    import("@/providers/refine-provider").then((mod) => ({
      default: mod.RefineProvider,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-bold tracking-wide">Loading...</p>
        </div>
      </div>
    ),
  }
);

type Props = {
  children: React.ReactNode;
};

export default function ClientRefineWrapper({ children }: Props) {
  return <RefineProvider>{children}</RefineProvider>;
}
