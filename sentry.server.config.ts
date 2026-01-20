/**
 * Sentry Server Configuration
 * Captures server-side errors with stack traces
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring

  // Environment
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Debug mode for development
  debug: process.env.NODE_ENV === "development",

  // Filter out certain errors
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV !== "production") {
      return null;
    }

    // Redact sensitive data from request bodies
    if (event.request?.data && typeof event.request.data === "object") {
      const data = event.request.data as Record<string, unknown>;
      const sensitiveFields = ["password", "token", "secret", "authorization"];
      for (const field of sensitiveFields) {
        if (data[field]) {
          data[field] = "[REDACTED]";
        }
      }
    }

    return event;
  },
});
