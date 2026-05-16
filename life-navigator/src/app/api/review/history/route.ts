import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = createAdminClient();

  const [weeklyRes, monthlyRes] = await Promise.all([
    supabase
      .from("weekly_reflections")
      .select("week_start, ai_summary, user_text, ai_feedback, next_week_mits, applied")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(20),
    supabase
      .from("monthly_reflections")
      .select("month_start, ai_summary, user_text, ai_feedback, next_month_theme, next_month_goals")
      .eq("user_id", user.id)
      .order("month_start", { ascending: false })
      .limit(20),
  ]);

  if (weeklyRes.error) return NextResponse.json({ error: weeklyRes.error.message }, { status: 500 });
  if (monthlyRes.error) return NextResponse.json({ error: monthlyRes.error.message }, { status: 500 });

  return NextResponse.json({
    weekly: weeklyRes.data || [],
    monthly: monthlyRes.data || [],
  });
}
