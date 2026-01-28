import { NextResponse } from "next/server";
import { createServerSupabaseClient, isAdmin } from "@/lib/auth-server";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations";

// Validation schema for deactivation request
const deactivateClientSchema = z.object({
  userId: uuidSchema,
  reason: z.string().optional(),
});

/**
 * POST /api/admin/deactivate-client
 * Deactivates a client user account.
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
    const validationResult = deactivateClientSchema.safeParse(body);

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

    const { userId, reason } = validationResult.data;

    const supabase = await createServerSupabaseClient();

    // Verify the user exists and is a client
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_deactivated, full_name, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Don't allow deactivating admin users
    if (profile.role === "admin") {
      return NextResponse.json(
        { success: false, error: "Cannot deactivate admin users" },
        { status: 400 }
      );
    }

    // Check if already deactivated
    if (profile.is_deactivated) {
      return NextResponse.json(
        { success: false, error: "User is already deactivated" },
        { status: 400 }
      );
    }

    // Deactivate the user
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_deactivated: true,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason || null,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error deactivating user:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to deactivate user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deactivated ${profile.full_name || profile.email}`,
    });
  } catch (error) {
    console.error("Unexpected error in deactivate-client:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
