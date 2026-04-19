import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("mission")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mission: profile?.mission || "" });
}

export async function POST(req: Request) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const mission = typeof body.mission === "string" ? body.mission.trim() : "";

  if (mission.length > 500) {
    return NextResponse.json({ error: "ミッションは500文字以内で入力してください" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 既存プロファイル確認
  const { data: existing } = await admin
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("profiles")
      .update({ mission: mission || null })
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin
      .from("profiles")
      .insert({ user_id: user.id, mission: mission || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mission });
}
