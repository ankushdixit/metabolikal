"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function ClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <h2 className="text-xl font-black uppercase tracking-tight">Something went wrong</h2>
      <p className="text-muted-foreground font-bold text-center max-w-md">
        {error.message || "An unexpected error occurred loading clients."}
      </p>
      <button
        onClick={reset}
        className="btn-athletic inline-flex items-center gap-2 px-5 py-3 bg-secondary text-foreground"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
