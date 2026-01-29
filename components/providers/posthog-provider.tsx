"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, type ReactNode } from "react";

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY && !posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        // Use reverse proxy to avoid ad blockers
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        person_profiles: "identified_only",
        // Event tracking
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        // Scroll depth tracking
        scroll_root_selector: ["#main-content", "body"],
        // Web vitals / Performance monitoring
        capture_performance: true,
        // Session recording (disabled by default, enable in PostHog dashboard)
        disable_session_recording: true,
        // Persistence
        persistence: "localStorage+cookie",
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            posthog.debug();
          }
        },
      });
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
