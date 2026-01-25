import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient, isAdmin } from "@/lib/auth-server";
import { createClientSchema } from "@/lib/validations";
import type { ProfileGender } from "@/lib/database.types";

/**
 * POST /api/admin/invite-client
 * Creates a new client user and sends a password setup email.
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
    const validationResult = createClientSchema.safeParse(body);

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

    const { full_name, email, date_of_birth, gender, address } = validationResult.data;

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

    // Invite the user via email - this creates the user AND sends an invite email
    // Note: inviteUserByEmail() handles duplicate detection natively and returns
    // an error if the email already exists, so we don't need a separate listUsers() check
    // The user will receive an email with a link to set their password
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name,
        },
        redirectTo: `${siteUrl}/auth/callback`,
      }
    );

    if (inviteError) {
      console.error("Error inviting user:", inviteError);
      if (inviteError.message.includes("already")) {
        return NextResponse.json(
          { success: false, error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Failed to invite client: ${inviteError.message}` },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "Failed to create client" },
        { status: 500 }
      );
    }

    // Update the profile with additional fields
    // Note: A trigger automatically creates a basic profile when the auth user is created,
    // so we need to update it with the additional fields instead of inserting
    const profileUpdateData: Record<string, unknown> = {
      full_name, // Update in case it differs from what the trigger set
      invited_at: new Date().toISOString(), // Track when admin invited this user
    };

    // Add optional fields if they have values
    if (date_of_birth) profileUpdateData.date_of_birth = date_of_birth;
    if (gender) profileUpdateData.gender = gender as ProfileGender;
    if (address) profileUpdateData.address = address;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdateData)
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Try to clean up the auth user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      // Check if the error is related to missing columns (migration not run)
      if (
        profileError.message?.includes("column") &&
        (profileError.message?.includes("date_of_birth") ||
          profileError.message?.includes("gender") ||
          profileError.message?.includes("address"))
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Database migration required. Please run the migration 20260126300000_add_profile_invite_fields.sql to add the new profile fields.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Failed to update client profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Fetch the created profile to return
    const serverSupabase = await createServerSupabaseClient();
    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        client: profile,
        message: "Client created successfully. Password setup email sent.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in invite-client:", error);
    return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 });
  }
}
