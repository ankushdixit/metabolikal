import { NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/auth-server";
import type { DeviceType } from "@/lib/database.types";

interface SubscribeRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  deviceType?: DeviceType;
  browser?: string;
}

/**
 * POST /api/push/subscribe
 * Subscribes the current user's device to push notifications
 */
export async function POST(request: Request) {
  try {
    console.log("[API /api/push/subscribe] Request received");

    // Authenticate the user
    const user = await getUser();
    if (!user) {
      console.warn("[API /api/push/subscribe] Unauthorized — no user session");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[API /api/push/subscribe] User: ${user.id}`);
    console.log(
      `[API /api/push/subscribe] Client VAPID public key starts with: ${(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "NOT SET").slice(0, 12)}...`
    );

    // Parse request body
    const body: SubscribeRequest = await request.json();
    console.log(
      `[API /api/push/subscribe] Endpoint: ${body.subscription?.endpoint?.slice(0, 60)}...`
    );

    // Validate required fields
    if (
      !body.subscription?.endpoint ||
      !body.subscription?.keys?.p256dh ||
      !body.subscription?.keys?.auth
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check if this subscription already exists for this user
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("endpoint", body.subscription.endpoint)
      .single();

    if (existing) {
      console.log(`[API /api/push/subscribe] Updating existing subscription: ${existing.id}`);
      // Update the existing subscription (keys might have changed)
      const { error: updateError } = await supabase
        .from("push_subscriptions")
        .update({
          p256dh: body.subscription.keys.p256dh,
          auth: body.subscription.keys.auth,
          device_type: body.deviceType || null,
          browser: body.browser || null,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Error updating push subscription:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to update subscription" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscriptionId: existing.id,
        message: "Subscription updated",
      });
    }

    // Create new subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from("push_subscriptions")
      .insert({
        user_id: user.id,
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        device_type: body.deviceType || null,
        browser: body.browser || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[API /api/push/subscribe] Insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save subscription" },
        { status: 500 }
      );
    }

    console.log(
      `[API /api/push/subscribe] Created subscription: ${newSubscription.id} for user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      subscriptionId: newSubscription.id,
      message: "Subscription created",
    });
  } catch (error) {
    console.error("Unexpected error in push subscribe:", error);
    return NextResponse.json({ success: false, error: "Failed to subscribe" }, { status: 500 });
  }
}
