import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-server";
import { sendPushToUsers, sendPushToAdmins, type PushNotification } from "@/lib/push-service";

interface SendRequest {
  userIds?: string[];
  notification: PushNotification;
}

/**
 * POST /api/push/send
 * Sends push notifications to specified users (admin only)
 * If userIds is empty or not provided, sends to all admins
 */
export async function POST(request: Request) {
  console.log("[API /api/push/send] Request received");
  try {
    // Check admin authentication
    const adminCheck = await isAdmin();
    console.log("[API /api/push/send] Admin check:", adminCheck);
    if (!adminCheck) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SendRequest = await request.json();

    // Validate required fields
    if (!body.notification?.title || !body.notification?.body) {
      return NextResponse.json(
        { success: false, error: "Notification title and body are required" },
        { status: 400 }
      );
    }

    let result;

    if (!body.userIds || body.userIds.length === 0) {
      // Send to all admins
      result = await sendPushToAdmins(body.notification);
    } else {
      // Send to specified users
      result = await sendPushToUsers(body.userIds, body.notification);
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Unexpected error in push send:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
