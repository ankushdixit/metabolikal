"use client";

import { useState, useEffect } from "react";
import { X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * iOS PWA installation prompt component
 * Shows a guide for iOS users to install the app for push notification support
 */
export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if iOS Safari and not already installed as PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("ios-install-prompt-dismissed");

    // Check if dismissed within the last week
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < oneWeek) {
        return;
      }
    }

    if (isIOS && !isStandalone) {
      // Delay showing prompt
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("ios-install-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-50 animate-in slide-in-from-bottom">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>

      <h3 className="font-bold text-base mb-2">Install Metabolikal</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Install our app to receive push notifications and get the full experience.
      </p>

      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            1
          </div>
          <p>
            Tap the <Share className="h-4 w-4 inline-block mx-1" /> Share button below
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            2
          </div>
          <p>
            Scroll down and tap <Plus className="h-4 w-4 inline-block mx-1" />{" "}
            <span className="font-medium">Add to Home Screen</span>
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            3
          </div>
          <p>
            Tap <span className="font-medium">Add</span> in the top right
          </p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={dismiss} className="mt-4">
        Maybe Later
      </Button>
    </div>
  );
}
