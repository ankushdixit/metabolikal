"use client";

import { useState, useEffect } from "react";

const VISITOR_ID_KEY = "metabolikal_visitor_id";

/**
 * Hook to manage visitor ID in localStorage.
 * Creates a new UUID on first visit and persists it for future sessions.
 * This enables tracking assessment results before user authentication.
 */
export function useVisitorId() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have an existing visitor ID
    let id = localStorage.getItem(VISITOR_ID_KEY);

    if (!id) {
      // Generate new UUID for first-time visitors
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }

    setVisitorId(id);
    setIsLoading(false);
  }, []);

  return { visitorId, isLoading };
}
