import { NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/auth-server";
import { sendPushToUser } from "@/lib/push-service";

/**
 * POST /api/push/test
 * Sends a test push notification to the current user's devices
 */
export async function POST() {
  try {
    // Authenticate the user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Check how many subscriptions the user has
    const { count } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!count || count === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No push subscriptions found. Please enable notifications first.",
        },
        { status: 400 }
      );
    }

    // Send test notification
    const result = await sendPushToUser(user.id, {
      title: "Test Notification",
      body: "This is a test push notification from Metabolikal!",
      data: {
        url: "/dashboard",
        type: "test",
      },
    });

    return NextResponse.json({
      success: true,
      deviceCount: count,
      sent: result.sent,
      failed: result.failed,
      message: `Test notification sent to ${result.sent} device(s)`,
    });
  } catch (error) {
    console.error("Unexpected error in push test:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
