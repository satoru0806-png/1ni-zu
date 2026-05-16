import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET: 自分のマインドムービーを取得（なければ null）
export async function GET() {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mind_movies")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ movie: data });
}

// POST: 作成または更新
export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const supabase = createAdminClient();

  // 既存チェック
  const { data: existing } = await supabase
    .from("mind_movies")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") updates.title = body.title.slice(0, 100);
  if (typeof body.theme === "string") updates.theme = body.theme.slice(0, 500);
  if (Array.isArray(body.scenes)) {
    // バリデーション: 最大10シーン
    updates.scenes = body.scenes.slice(0, 10).map((s: { image_url?: string; text?: string; duration_sec?: number }) => ({
      image_url: typeof s.image_url === "string" ? s.image_url : "",
      text: typeof s.text === "string" ? s.text.slice(0, 200) : "",
      duration_sec: typeof s.duration_sec === "number" ? Math.max(1, Math.min(30, s.duration_sec)) : 5,
    }));
  }
  if (typeof body.bgm_id === "string") updates.bgm_id = body.bgm_id;
  if (typeof body.voiceover_text === "string") updates.voiceover_text = body.voiceover_text.slice(0, 1000);

  if (existing) {
    const { error } = await supabase.from("mind_movies").update(updates).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("mind_movies").insert({ user_id: user.id, ...updates });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: 削除
export async function DELETE() {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { error } = await supabase.from("mind_movies").delete().eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
