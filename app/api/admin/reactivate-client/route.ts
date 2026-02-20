import { NextResponse } from "next/server";
import { createServerSupabaseClient, isAdmin } from "@/lib/auth-server";
import { z } from "zod";
import { uuidSchema } from "@/lib/validations";

// Validation schema for reactivation request
const reactivateClientSchema = z.object({
  userId: uuidSchema,
  plan_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plan_duration_days: z.number().int().min(1).max(365),
});

/**
 * POST /api/admin/reactivate-client
 * Reactivates a previously deactivated client user account.
 * Creates a new plan cycle with the provided plan details.
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

    const { userId, plan_start_date, plan_duration_days } = validationResult.data;

    const supabase = await createServerSupabaseClient();

    // Verify the user exists and fetch current plan cycle
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_deactivated, full_name, email, current_plan_cycle")
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

    const oldCycle = profile.current_plan_cycle || 1;
    const newCycle = oldCycle + 1;

    // Check for overlapping plan cycles before creating a new one
    const newStart = new Date(plan_start_date);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + plan_duration_days - 1);
    const newEndStr = newEnd.toISOString().split("T")[0];

    const { data: overlapping } = await supabase
      .from("plan_cycles")
      .select("cycle_number, start_date, end_date")
      .eq("client_id", userId)
      .lte("start_date", newEndStr)
      .gte("end_date", plan_start_date)
      .limit(1)
      .single();

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error: `New plan (${plan_start_date} to ${newEndStr}) overlaps with cycle ${overlapping.cycle_number} (${overlapping.start_date} to ${overlapping.end_date}). Choose a start date after ${overlapping.end_date}.`,
        },
        { status: 400 }
      );
    }

    // Mark old cycle as completed
    await supabase
      .from("plan_cycles")
      .update({ status: "completed" })
      .eq("client_id", userId)
      .eq("cycle_number", oldCycle);

    // Create new plan cycle
    const { error: cycleError } = await supabase.from("plan_cycles").insert({
      client_id: userId,
      cycle_number: newCycle,
      start_date: plan_start_date,
      duration_days: plan_duration_days,
      status: "active",
    });

    if (cycleError) {
      console.error("Error creating plan cycle:", cycleError);
      const isOverlap = cycleError.message?.includes("overlaps");
      return NextResponse.json(
        {
          success: false,
          error: isOverlap ? cycleError.message : "Failed to create new plan cycle",
        },
        { status: isOverlap ? 400 : 500 }
      );
    }

    // Reactivate the user and update plan fields
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_deactivated: false,
        deactivated_at: null,
        deactivation_reason: null,
        current_plan_cycle: newCycle,
        plan_start_date,
        plan_duration_days,
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
      newCycle,
    });
  } catch (error) {
    console.error("Unexpected error in reactivate-client:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
