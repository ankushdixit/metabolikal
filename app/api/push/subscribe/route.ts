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
    // Authenticate the user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: SubscribeRequest = await request.json();

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
      console.error("Error creating push subscription:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save subscription" },
        { status: 500 }
      );
    }

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
