import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/goals - アクティブなゴール一覧
export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("archived") === "1";

  const admin = createAdminClient();
  let query = admin
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!includeArchived) {
    query = query.eq("archived", false);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goals: data || [] });
}

// POST /api/goals - 新規ゴール作成
export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "タイトルは200文字以内" }, { status: 400 });
  }

  const deadline = typeof body.deadline === "string" && body.deadline ? body.deadline : null;
  const missionConnection = typeof body.mission_connection === "string" ? body.mission_connection.trim() : null;
  const icon = typeof body.icon === "string" && body.icon ? body.icon.slice(0, 4) : "🎯";

  const admin = createAdminClient();

  // アクティブゴール数チェック（上限5つ）
  const { count } = await admin
    .from("goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("archived", false);
  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "アクティブなゴールは5つまでです。既存のゴールを達成・アーカイブしてください" },
      { status: 400 }
    );
  }

  const { data, error } = await admin
    .from("goals")
    .insert({
      user_id: user.id,
      title,
      deadline,
      mission_connection: missionConnection,
      icon,
      progress: 0,
      archived: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ goal: data });
}
