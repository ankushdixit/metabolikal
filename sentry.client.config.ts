/**
 * Sentry Client Configuration
 * Captures client-side errors with stack traces
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring

  // Session Replay
  replaysSessionSampleRate: 0.1, // Record 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Record 100% of sessions with errors

  // Environment
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Debug mode for development
  debug: process.env.NODE_ENV === "development",

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Block all text and mask all inputs by default
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out certain errors
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV !== "production") {
      return null;
    }

    // Don't send ResizeObserver errors (common browser quirk)
    if (event.message?.includes("ResizeObserver")) {
      return null;
    }

    return event;
  },
});
