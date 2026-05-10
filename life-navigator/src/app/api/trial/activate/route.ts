import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/trial/activate — ログイン済みユーザーがキーを使ってトライアル開始
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const body = await req.json().catch(() => ({}));
    const key = ((body.key as string) || "").trim().toUpperCase();
    if (!key) {
      return NextResponse.json({ error: "キーを入力してください" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // キー検索
    const { data: trialKey } = await supabase
      .from("trial_keys")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (!trialKey) {
      return NextResponse.json({ error: "キーが見つかりません" }, { status: 404 });
    }

    if (trialKey.status === "activated") {
      return NextResponse.json({ error: "このキーは既に使用されています" }, { status: 400 });
    }

    if (trialKey.status === "expired" || trialKey.status === "cancelled") {
      return NextResponse.json({ error: "このキーは利用できません" }, { status: 400 });
    }

    // 21 日トライアル設定
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 21);
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    // profiles に反映（既存があれば update、なければ insert）
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          trial_start_date: startStr,
          trial_end_date: endStr,
        })
        .eq("user_id", user.id);
      if (updateErr) {
        return NextResponse.json({ error: "プロファイル更新失敗: " + updateErr.message }, { status: 500 });
      }
    } else {
      const { error: insertErr } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          trial_start_date: startStr,
          trial_end_date: endStr,
        });
      if (insertErr) {
        return NextResponse.json({ error: "プロファイル作成失敗: " + insertErr.message }, { status: 500 });
      }
    }

    // trial_keys を activated に
    const { error: keyUpdateErr } = await supabase
      .from("trial_keys")
      .update({
        status: "activated",
        activated_at: new Date().toISOString(),
        activated_user_id: user.id,
        trial_end_date: endStr,
      })
      .eq("id", trialKey.id);
    if (keyUpdateErr) {
      return NextResponse.json({ error: "キー更新失敗: " + keyUpdateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      trialEndDate: endStr,
      message: `21 日間の無料トライアルを開始しました（${endStr} まで）`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[trial/activate] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
