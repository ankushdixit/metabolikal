import { NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/auth-server";

interface UnsubscribeRequest {
  endpoint: string;
}

/**
 * POST /api/push/unsubscribe
 * Removes a push subscription for the current user
 */
export async function POST(request: Request) {
  try {
    // Authenticate the user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: UnsubscribeRequest = await request.json();

    // Validate required fields
    if (!body.endpoint) {
      return NextResponse.json({ success: false, error: "Endpoint is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Delete the subscription
    const { error: deleteError, count } = await supabase
      .from("push_subscriptions")
      .delete({ count: "exact" })
      .eq("user_id", user.id)
      .eq("endpoint", body.endpoint);

    if (deleteError) {
      console.error("Error deleting push subscription:", deleteError);
      return NextResponse.json({ success: false, error: "Failed to unsubscribe" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      removed: count || 0,
      message: count && count > 0 ? "Subscription removed" : "No subscription found",
    });
  } catch (error) {
    console.error("Unexpected error in push unsubscribe:", error);
    return NextResponse.json({ success: false, error: "Failed to unsubscribe" }, { status: 500 });
  }
}
