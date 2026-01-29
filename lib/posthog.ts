import posthog from "posthog-js";

/**
 * Identify a user in PostHog for user-level analytics
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.identify(userId, properties);
  }
}

/**
 * Reset the user identity (call on logout)
 */
export function resetUser() {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.reset();
  }
}

/**
 * Track a custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
}

/**
 * Set user properties without identifying
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.setPersonProperties(properties);
  }
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (typeof window !== "undefined" && posthog.__loaded) {
    return posthog.isFeatureEnabled(flagKey) ?? false;
  }
  return false;
}

/**
 * Get feature flag value (for multivariate flags)
 */
export function getFeatureFlag(flagKey: string): string | boolean | undefined {
  if (typeof window !== "undefined" && posthog.__loaded) {
    return posthog.getFeatureFlag(flagKey);
  }
  return undefined;
}
