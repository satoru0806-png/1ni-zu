import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/goals/[id] - 更新（タイトル/期限/進捗/紐付け/アイコン/アーカイブ）
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
    if (t.length > 200) return NextResponse.json({ error: "タイトルは200文字以内" }, { status: 400 });
    update.title = t;
  }
  if ("deadline" in body) {
    update.deadline = typeof body.deadline === "string" && body.deadline ? body.deadline : null;
  }
  if (typeof body.progress === "number") {
    update.progress = Math.max(0, Math.min(100, Math.round(body.progress)));
  }
  if ("mission_connection" in body) {
    const mc = typeof body.mission_connection === "string" ? body.mission_connection.trim() : "";
    update.mission_connection = mc || null;
  }
  if (typeof body.icon === "string" && body.icon) {
    update.icon = body.icon.slice(0, 4);
  }
  if (typeof body.archived === "boolean") {
    update.archived = body.archived;
    if (body.archived) {
      update.completed_at = new Date().toISOString();
    } else {
      update.completed_at = null;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("goals")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "ゴールが見つかりません" }, { status: 404 });

  return NextResponse.json({ goal: data });
}

// DELETE /api/goals/[id] - 削除
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("goals").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
