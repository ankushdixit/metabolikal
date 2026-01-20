/**
 * Sentry Edge Configuration
 * Captures errors in edge runtime (middleware, edge API routes)
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
});
