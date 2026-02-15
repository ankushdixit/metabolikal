import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin, getUser } from "@/lib/auth-server";
import { createClientSchema } from "@/lib/validations";
import { z } from "zod";
import type { ProfileGender } from "@/lib/database.types";

// Extend the base schema with challenger_id
const upgradeSchema = createClientSchema.extend({
  challenger_id: z.string().min(1, "Challenger ID is required"),
});

/**
 * POST /api/admin/upgrade-challenger
 * Upgrades a challenger to a full client, preserving their challenge progress.
 * Sets challenge_start_date to their original plan_start_date so the
 * gamification hook can extend totalDays to cover the gap.
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
    const validationResult = upgradeSchema.safeParse(body);

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

    const {
      challenger_id,
      full_name,
      phone,
      date_of_birth,
      gender,
      address,
      plan_start_date,
      plan_duration_days,
      condition_ids,
    } = validationResult.data;

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

    // Fetch existing profile and verify it's a challenger
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, plan_start_date, created_at")
      .eq("id", challenger_id)
      .single();

    if (fetchError || !existingProfile) {
      return NextResponse.json({ success: false, error: "Challenger not found" }, { status: 404 });
    }

    if (existingProfile.role !== "challenger") {
      return NextResponse.json(
        { success: false, error: `User is already a ${existingProfile.role}, not a challenger` },
        { status: 400 }
      );
    }

    // Preserve the original challenge start date (their plan_start_date or created_at)
    const originalChallengeStart =
      existingProfile.plan_start_date ||
      existingProfile.created_at?.split("T")[0] ||
      new Date().toISOString().split("T")[0];

    const effectiveStartDate = plan_start_date || new Date().toISOString().split("T")[0];
    const effectiveDuration = plan_duration_days ?? 7;

    // Build profile update
    const profileUpdateData: Record<string, unknown> = {
      role: "client",
      full_name,
      plan_start_date: effectiveStartDate,
      plan_duration_days: effectiveDuration,
      current_plan_cycle: 1,
      challenge_start_date: originalChallengeStart,
    };

    if (phone) profileUpdateData.phone = phone;
    if (date_of_birth) profileUpdateData.date_of_birth = date_of_birth;
    if (gender) profileUpdateData.gender = gender as ProfileGender;
    if (address) profileUpdateData.address = address;

    // Update the profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdateData)
      .eq("id", challenger_id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { success: false, error: `Failed to upgrade challenger: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Create initial plan cycle (cycle 1)
    const { error: cycleError } = await supabaseAdmin.from("plan_cycles").insert({
      client_id: challenger_id,
      cycle_number: 1,
      start_date: effectiveStartDate,
      duration_days: effectiveDuration,
      status: "active",
    });

    if (cycleError) {
      console.error("Error creating plan cycle:", cycleError);
      // Non-fatal — the upgrade already happened
    }

    // Insert client conditions if any were provided
    if (condition_ids && condition_ids.length > 0) {
      const adminUser = await getUser();
      const conditionRecords = condition_ids.map((condition_id) => ({
        client_id: challenger_id,
        condition_id,
        created_by: adminUser?.id ?? null,
      }));

      const { error: conditionsError } = await supabaseAdmin
        .from("client_conditions")
        .insert(conditionRecords);

      if (conditionsError) {
        console.error("Error inserting client conditions:", conditionsError);
        // Non-fatal
      }
    }

    // Create in-app notification for the upgraded user
    const adminUser = await getUser();
    const { error: notifError } = await supabaseAdmin.from("notifications").insert({
      user_id: challenger_id,
      sender_id: adminUser?.id ?? null,
      type: "system" as const,
      title: "Welcome to your personalized plan!",
      message: `You've been upgraded to a full client with a ${effectiveDuration}-day plan starting ${effectiveStartDate}. Your challenge progress has been preserved.`,
    });

    if (notifError) {
      console.error("Error creating notification:", notifError);
      // Non-fatal
    }

    return NextResponse.json(
      {
        success: true,
        message: `${full_name} upgraded to client successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in upgrade-challenger:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upgrade challenger" },
      { status: 500 }
    );
  }
}
