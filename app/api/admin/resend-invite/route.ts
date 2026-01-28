import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/auth-server";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations";

const resendInviteSchema = z.object({
  userId: uuidSchema,
});

/**
 * POST /api/admin/resend-invite
 * Resends an invitation email to a pending client.
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
    const validationResult = resendInviteSchema.safeParse(body);

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

    // Check for required environment variable
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the user to verify they exist and get their email
    const { data: userData, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !userData.user) {
      console.error("Error getting user:", getUserError);
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "User does not have an email address" },
        { status: 400 }
      );
    }

    // Check if the user has already accepted the invitation
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("invited_at, invitation_accepted_at")
      .eq("id", userId)
      .single();

    if (profile?.invitation_accepted_at) {
      return NextResponse.json(
        { success: false, error: "User has already accepted their invitation" },
        { status: 400 }
      );
    }

    // Generate a new invite link and send it
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(userEmail, {
      redirectTo: `${siteUrl}/auth/callback`,
    });

    if (inviteError) {
      // If the error is because user already exists, try sending a password reset instead
      if (inviteError.message.includes("already")) {
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(userEmail, {
          redirectTo: `${siteUrl}/auth/callback?type=recovery`,
        });

        if (resetError) {
          console.error("Error sending password reset:", resetError);
          return NextResponse.json(
            { success: false, error: `Failed to resend invite: ${resetError.message}` },
            { status: 500 }
          );
        }
      } else {
        console.error("Error resending invite:", inviteError);
        return NextResponse.json(
          { success: false, error: `Failed to resend invite: ${inviteError.message}` },
          { status: 500 }
        );
      }
    }

    // Update invited_at timestamp
    await supabaseAdmin
      .from("profiles")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", userId);

    return NextResponse.json(
      {
        success: true,
        message: "Invitation email resent successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in resend-invite:", error);
    return NextResponse.json({ success: false, error: "Failed to resend invite" }, { status: 500 });
  }
}
