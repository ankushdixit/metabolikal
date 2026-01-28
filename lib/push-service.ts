import webpush from "web-push";
import { createServerSupabaseClient } from "@/lib/auth-server";

// Configure web-push with VAPID details
if (
  process.env.VAPID_CONTACT_EMAIL &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    relatedId?: string;
  };
  requireInteraction?: boolean;
}

export interface PushResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationPreferencesRecord {
  push_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  notify_checkin_review: boolean;
  notify_messages: boolean;
  notify_system: boolean;
  notify_plan_updates: boolean;
}

/**
 * Check if current time is within quiet hours
 */
function isInQuietHours(quietStart: string | null, quietEnd: string | null): boolean {
  if (!quietStart || !quietEnd) return false;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Handle cases where quiet hours span midnight
  if (quietStart > quietEnd) {
    // e.g., 22:00 to 07:00
    return currentTime >= quietStart || currentTime <= quietEnd;
  } else {
    // e.g., 09:00 to 17:00
    return currentTime >= quietStart && currentTime <= quietEnd;
  }
}

/**
 * Check if notification type is enabled in user preferences
 */
function isNotificationTypeEnabled(
  prefs: NotificationPreferencesRecord | null,
  notificationType?: string
): boolean {
  if (!prefs) return true; // Default to enabled if no preferences

  switch (notificationType) {
    case "checkin_review":
    case "checkin_submitted":
      return prefs.notify_checkin_review;
    case "message":
      return prefs.notify_messages;
    case "system":
      return prefs.notify_system;
    case "plan_update":
      return prefs.notify_plan_updates;
    default:
      return true; // Unknown types are sent by default
  }
}

/**
 * Send push notification to a single subscription
 */
async function sendToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  notification: PushNotification
): Promise<void> {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  await webpush.sendNotification(pushSubscription, JSON.stringify(notification));
}

/**
 * Send push notification to a single user (all their devices)
 */
export async function sendPushToUser(
  userId: string,
  notification: PushNotification
): Promise<PushResult> {
  const supabase = await createServerSupabaseClient();

  console.log(`[Push] Sending to user: ${userId}`);

  // Check user preferences
  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (prefsError && prefsError.code !== "PGRST116") {
    console.log(`[Push] Error fetching preferences:`, prefsError);
  }

  // Respect push_enabled preference (default true if no prefs)
  if (prefs && !prefs.push_enabled) {
    console.log(`[Push] User ${userId} has push disabled`);
    return { success: true, sent: 0, failed: 0, errors: [] };
  }

  // Check notification type preference
  if (!isNotificationTypeEnabled(prefs, notification.data?.type)) {
    console.log(`[Push] Notification type ${notification.data?.type} disabled for user ${userId}`);
    return { success: true, sent: 0, failed: 0, errors: ["Notification type disabled by user"] };
  }

  // Check quiet hours
  if (prefs && isInQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end)) {
    console.log(`[Push] Quiet hours active for user ${userId}`);
    return { success: true, sent: 0, failed: 0, errors: ["Quiet hours active"] };
  }

  // Get all subscriptions for this user
  const { data: subscriptions, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  console.log(
    `[Push] Found ${subscriptions?.length || 0} subscriptions for user ${userId}`,
    subsError ? `Error: ${subsError.message}` : ""
  );

  if (!subscriptions || subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0, errors: [] };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub: PushSubscriptionRecord) => sendToSubscription(sub, notification))
  );

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const expiredEndpoints: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      sent++;
      // Update last_used_at
      supabase
        .from("push_subscriptions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", subscriptions[index].id)
        .then(() => {}); // Fire and forget
    } else {
      failed++;
      const error = result.reason as { statusCode?: number; message?: string };
      errors.push(error.message || "Unknown error");

      // If subscription expired or invalid, mark for cleanup
      if (error.statusCode === 410 || error.statusCode === 404) {
        expiredEndpoints.push(subscriptions[index].endpoint);
      }
    }
  });

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
  }

  return { success: true, sent, failed, errors };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  notification: PushNotification
): Promise<PushResult> {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, notification))
  );

  let totalSent = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      totalSent += result.value.sent;
      totalFailed += result.value.failed;
      allErrors.push(...result.value.errors);
    } else {
      totalFailed++;
      const error = result.reason as Error;
      allErrors.push(error.message || "Unknown error");
    }
  });

  return {
    success: true,
    sent: totalSent,
    failed: totalFailed,
    errors: allErrors,
  };
}

/**
 * Send push notification to all admins
 */
export async function sendPushToAdmins(notification: PushNotification): Promise<PushResult> {
  const supabase = await createServerSupabaseClient();

  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_deactivated", false);

  if (!admins || admins.length === 0) {
    return { success: true, sent: 0, failed: 0, errors: [] };
  }

  return sendPushToUsers(
    admins.map((a) => a.id),
    notification
  );
}
