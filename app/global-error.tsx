"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Global Error Boundary
 * Catches unhandled errors in the app and reports them to Sentry
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-red-500/20 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
                Something Went Wrong
              </h1>
              <p className="text-muted-foreground font-bold text-sm mb-6">
                An unexpected error occurred. Our team has been notified and is working on a fix.
              </p>
            </div>
            <button
              onClick={reset}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
