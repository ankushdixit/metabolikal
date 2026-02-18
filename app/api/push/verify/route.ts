import { NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/auth-server";

/**
 * POST /api/push/verify
 * Checks if a push subscription endpoint exists in the DB for the current user
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ exists: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.endpoint) {
      return NextResponse.json({ exists: false, error: "Endpoint is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("endpoint", body.endpoint)
      .single();

    return NextResponse.json({ exists: !!data });
  } catch {
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
