"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/use-push-subscription";

interface PushPermissionPromptProps {
  delay?: number; // Delay in ms before showing the prompt
}

/**
 * Push notification permission prompt component
 * Shows a banner asking users to enable push notifications
 */
export function PushPermissionPrompt({ delay = 5000 }: PushPermissionPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isSupported, permission, isSubscribed, isLoading, subscribe, error } =
    usePushSubscription();

  useEffect(() => {
    // Don't show if not supported, already subscribed, or permission already decided
    if (!isSupported || isSubscribed || permission === "denied" || isLoading) {
      return;
    }

    // Check if user has dismissed the prompt recently
    const dismissed = localStorage.getItem("push-prompt-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < oneWeek) {
        return;
      }
    }

    // Show prompt after delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission, isLoading, delay]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("push-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-background border rounded-lg shadow-lg p-4 z-50">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Stay Updated</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Get notified when your coach reviews your check-in or sends you a message.
          </p>

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}

          <div className="flex gap-2 mt-3">
            <Button onClick={handleEnable} disabled={isLoading} size="sm" className="flex-1">
              {isLoading ? "Enabling..." : "Enable Notifications"}
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
