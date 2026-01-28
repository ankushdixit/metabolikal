"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { NotificationPreferences } from "@/lib/database.types";

interface NotificationSettingsProps {
  userId: string;
}

/**
 * Notification settings component for user preferences
 */
export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: subscriptionLoading,
    subscribe,
    unsubscribe,
    error: subscriptionError,
  } = usePushSubscription();

  const [preferences, setPreferences] = useState<Partial<NotificationPreferences>>({
    push_enabled: true,
    notify_checkin_review: true,
    notify_messages: true,
    notify_system: true,
    notify_plan_updates: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = row not found, which is fine for first-time users
          console.error("Error loading preferences:", error);
        }

        if (data) {
          setPreferences(data);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setIsLoadingPrefs(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Save preferences
  const savePreferences = useCallback(
    async (newPrefs: Partial<NotificationPreferences>) => {
      setIsSaving(true);
      try {
        const supabase = createBrowserSupabaseClient();

        // Upsert preferences
        const { error } = await supabase.from("notification_preferences").upsert(
          {
            user_id: userId,
            ...newPrefs,
          },
          { onConflict: "user_id" }
        );

        if (error) {
          throw error;
        }

        setPreferences((prev) => ({ ...prev, ...newPrefs }));
        toast.success("Settings saved");
      } catch (error) {
        console.error("Error saving preferences:", error);
        toast.error("Failed to save settings");
      } finally {
        setIsSaving(false);
      }
    },
    [userId]
  );

  // Toggle a boolean preference
  const togglePreference = (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];
    savePreferences({ [key]: newValue });
  };

  // Handle push subscription toggle
  const handlePushToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success("Push notifications disabled");
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success("Push notifications enabled");
      }
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Test notification sent");
      } else {
        toast.error(data.error || "Failed to send test notification");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    }
  };

  if (isLoadingPrefs) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notification Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Push Notifications</h3>

        {!isSupported && (
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Push notifications are not supported in this browser.
            </p>
          </div>
        )}

        {isSupported && permission === "denied" && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Notifications Blocked</p>
              <p className="text-muted-foreground mt-1">
                You have blocked notifications for this site. To enable them, please update your
                browser settings.
              </p>
            </div>
          </div>
        )}

        {isSupported && permission !== "denied" && (
          <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isSubscribed ? "Notifications Enabled" : "Notifications Disabled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isSubscribed
                    ? "You will receive push notifications on this device"
                    : "Enable to receive alerts on this device"}
                </p>
              </div>
            </div>
            <Button
              onClick={handlePushToggle}
              disabled={subscriptionLoading}
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
            >
              {subscriptionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSubscribed ? (
                "Disable"
              ) : (
                "Enable"
              )}
            </Button>
          </div>
        )}

        {subscriptionError && <p className="text-sm text-destructive">{subscriptionError}</p>}

        {isSubscribed && (
          <Button onClick={sendTestNotification} variant="outline" size="sm">
            Send Test Notification
          </Button>
        )}
      </div>

      {/* Notification Type Preferences */}
      {isSubscribed && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notification Types</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify_checkin_review" className="text-sm">
                Check-in Reviews
              </Label>
              <button
                id="notify_checkin_review"
                type="button"
                role="switch"
                aria-checked={preferences.notify_checkin_review}
                onClick={() => togglePreference("notify_checkin_review")}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_checkin_review ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    preferences.notify_checkin_review ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_messages" className="text-sm">
                Messages
              </Label>
              <button
                id="notify_messages"
                type="button"
                role="switch"
                aria-checked={preferences.notify_messages}
                onClick={() => togglePreference("notify_messages")}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_messages ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    preferences.notify_messages ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_plan_updates" className="text-sm">
                Plan Updates
              </Label>
              <button
                id="notify_plan_updates"
                type="button"
                role="switch"
                aria-checked={preferences.notify_plan_updates}
                onClick={() => togglePreference("notify_plan_updates")}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_plan_updates ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    preferences.notify_plan_updates ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify_system" className="text-sm">
                System Notifications
              </Label>
              <button
                id="notify_system"
                type="button"
                role="switch"
                aria-checked={preferences.notify_system}
                onClick={() => togglePreference("notify_system")}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_system ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    preferences.notify_system ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiet Hours */}
      {isSubscribed && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Quiet Hours</h3>
          <p className="text-xs text-muted-foreground">
            No notifications will be sent during these hours.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="quiet_start" className="text-xs text-muted-foreground">
                Start
              </Label>
              <input
                id="quiet_start"
                type="time"
                value={preferences.quiet_hours_start || ""}
                onChange={(e) =>
                  savePreferences({
                    quiet_hours_start: e.target.value || null,
                  })
                }
                className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="quiet_end" className="text-xs text-muted-foreground">
                End
              </Label>
              <input
                id="quiet_end"
                type="time"
                value={preferences.quiet_hours_end || ""}
                onChange={(e) =>
                  savePreferences({
                    quiet_hours_end: e.target.value || null,
                  })
                }
                className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
