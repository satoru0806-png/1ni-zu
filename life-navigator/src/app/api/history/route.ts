import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";
import { getLast7Days } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM形式

  if (month) {
    // 月別表示
    const { data: logs } = await supabase
      .from("day_logs")
      .select("*")
      .gte("date", `${month}-01`)
      .lte("date", `${month}-31`)
      .order("date", { ascending: false });
    return NextResponse.json(logs ?? []);
  }

  // デフォルト: 過去7日間
  const days = getLast7Days();
  const { data: logs } = await supabase
    .from("day_logs")
    .select("*")
    .in("date", days)
    .order("date", { ascending: false });

  const history = days.map((date) => {
    const log = (logs ?? []).find((l) => l.date === date);
    return log || { date, empty: true };
  });

  return NextResponse.json(history);
}
