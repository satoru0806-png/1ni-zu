import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("week_start_day, weekly_review_day, weekly_review_hour, weekly_review_remind, monthly_review_remind")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    weekStartDay: data?.week_start_day ?? 1,
    weeklyReviewDay: data?.weekly_review_day ?? 0,
    weeklyReviewHour: data?.weekly_review_hour ?? 21,
    weeklyReviewRemind: data?.weekly_review_remind ?? false,
    monthlyReviewRemind: data?.monthly_review_remind ?? false,
  });
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};

  if (typeof body.weekStartDay === "number" && body.weekStartDay >= 0 && body.weekStartDay <= 6) {
    updates.week_start_day = body.weekStartDay;
  }
  if (typeof body.weeklyReviewDay === "number" && body.weeklyReviewDay >= 0 && body.weeklyReviewDay <= 6) {
    updates.weekly_review_day = body.weeklyReviewDay;
  }
  if (typeof body.weeklyReviewHour === "number" && body.weeklyReviewHour >= 0 && body.weeklyReviewHour <= 23) {
    updates.weekly_review_hour = body.weeklyReviewHour;
  }
  if (typeof body.weeklyReviewRemind === "boolean") {
    updates.weekly_review_remind = body.weeklyReviewRemind;
  }
  if (typeof body.monthlyReviewRemind === "boolean") {
    updates.monthly_review_remind = body.monthlyReviewRemind;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
