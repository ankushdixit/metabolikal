"use client";

import { useState, useEffect, useCallback } from "react";

type PermissionState = globalThis.NotificationPermission | "unsupported";

interface UsePushSubscriptionReturn {
  isSupported: boolean;
  permission: PermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  error: string | null;
}

/**
 * Convert VAPID public key from URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Detect device type from user agent
 */
function getDeviceType(): "desktop" | "mobile" | "tablet" {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Detect browser name from user agent
 */
function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Edg")) return "edge";
  if (ua.includes("SamsungBrowser")) return "samsung";
  if (ua.includes("Chrome") || ua.includes("CriOS")) return "chrome";
  if (ua.includes("Safari")) return "safari";
  return "unknown";
}

/**
 * Check if the current browser/OS supports push notifications in PWA context
 */
function checkPushSupport(): { supported: boolean; reason?: string } {
  if (!("serviceWorker" in navigator)) {
    return { supported: false, reason: "Service workers are not supported" };
  }
  if (!("PushManager" in window)) {
    return { supported: false, reason: "Push notifications are not supported" };
  }
  if (!("Notification" in window)) {
    return { supported: false, reason: "Notifications API is not available" };
  }
  return { supported: true };
}

/**
 * Hook for managing push notification subscription state
 */
export function usePushSubscription(): UsePushSubscriptionReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("unsupported");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check support and current state on mount
  useEffect(() => {
    const checkSupportAndSubscription = async () => {
      const { supported, reason } = checkPushSupport();
      if (!supported) {
        setIsSupported(false);
        setPermission("unsupported");
        setError(reason || null);
        setIsLoading(false);
        return;
      }

      setIsSupported(true);
      setPermission(Notification.permission);

      // Wait for service worker with timeout
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Service worker activation timed out")), 10000)
          ),
        ]);
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Verify the subscription is backed by a DB record
          try {
            const res = await fetch("/api/push/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ endpoint: subscription.endpoint }),
            });
            const data = await res.json();
            if (data.exists) {
              setIsSubscribed(true);
            } else {
              // Browser has a subscription but DB doesn't — clean up the orphan
              console.warn("Orphan push subscription found, cleaning up");
              await subscription.unsubscribe().catch(() => {});
              setIsSubscribed(false);
            }
          } catch {
            // If verify fails (e.g. not logged in), trust browser state
            setIsSubscribed(true);
          }
        } else {
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
      }

      setIsLoading(false);
    };

    checkSupportAndSubscription();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported on this device");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        setError("Notification permission denied");
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as globalThis.BufferSource,
      });

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceType: getDeviceType(),
          browser: getBrowserName(),
        }),
      });

      if (!response.ok) {
        // Roll back browser subscription since DB save failed
        await subscription.unsubscribe().catch(() => {});
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      console.error("Push subscribe error:", message);
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    error,
  };
}
