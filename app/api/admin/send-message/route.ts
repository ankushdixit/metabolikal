import { NextResponse } from "next/server";
import { createServerSupabaseClient, isAdmin, getUser } from "@/lib/auth-server";

/**
 * POST /api/admin/send-message
 * Creates a notification for a client. Admin only.
 */
export async function POST(request: Request) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const user = await getUser();
    const body = await request.json();

    const { clientId, title, message } = body;
    if (!clientId || !title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "clientId, title, and message are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from("notifications").insert({
      user_id: clientId,
      sender_id: user?.id,
      type: "message",
      title: title.trim(),
      message: message.trim(),
    });

    if (error) {
      console.error("[API /api/admin/send-message] Insert error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /api/admin/send-message] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
