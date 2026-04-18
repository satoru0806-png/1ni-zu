import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = profile?.plan || "free";

  // 今月の診断回数をカウント
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { count } = await supabase
    .from("day_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("date", monthStart)
    .not("ai_diary", "is", null);

  return NextResponse.json({
    plan,
    isPro: plan === "pro",
    usageThisMonth: count ?? 0,
    limit: plan === "pro" ? -1 : 3,
  });
}
