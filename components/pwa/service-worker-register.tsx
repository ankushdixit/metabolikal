"use client";

import { useEffect } from "react";

async function registerSW(attempt = 1): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service Worker registered with scope:", registration.scope);

    // Check for updates periodically (every 60 minutes)
    setInterval(
      () => {
        registration.update();
      },
      60 * 60 * 1000
    );
  } catch (error) {
    console.error(`Service Worker registration failed (attempt ${attempt}):`, error);
    // Retry up to 3 times with exponential backoff
    if (attempt < 3) {
      const delay = Math.pow(2, attempt) * 1000;
      setTimeout(() => registerSW(attempt + 1), delay);
    }
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      registerSW();
    }
  }, []);

  return null;
}
