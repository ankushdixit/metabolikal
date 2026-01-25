import { NextResponse } from "next/server";
import { createServerSupabaseClient, isAdmin } from "@/lib/auth-server";
import { z } from "zod";

// Validation schema for reactivation request
const reactivateClientSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

/**
 * POST /api/admin/reactivate-client
 * Reactivates a previously deactivated client user account.
 * Requires admin authentication.
 */
export async function POST(request: Request) {
  try {
    // Check admin authentication
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = reactivateClientSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const { userId } = validationResult.data;

    const supabase = await createServerSupabaseClient();

    // Verify the user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_deactivated, full_name, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check if already active
    if (!profile.is_deactivated) {
      return NextResponse.json(
        { success: false, error: "User is already active" },
        { status: 400 }
      );
    }

    // Reactivate the user
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_deactivated: false,
        deactivated_at: null,
        deactivation_reason: null,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error reactivating user:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to reactivate user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reactivated ${profile.full_name || profile.email}`,
    });
  } catch (error) {
    console.error("Unexpected error in reactivate-client:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
