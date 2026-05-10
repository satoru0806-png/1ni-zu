import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { registerToAsmel } from "@/lib/asmel";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function generateKey(): string {
  // YUME-XXXX-XXXX-XXXX 形式（読み間違いやすい I, O, 0, 1 を除外）
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `YUME-${seg(4)}-${seg(4)}-${seg(4)}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = ((body.email as string) || "").trim().toLowerCase();
    const name = ((body.name as string) || "").trim().slice(0, 100);
    const lineId = ((body.line_id as string) || "").trim().slice(0, 100);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 同じメアドで既に発行済みのキーをチェック（直近 30 日）
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("trial_keys")
      .select("key, status, issued_at")
      .eq("issued_to_email", email)
      .gte("issued_at", thirtyDaysAgo)
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.status === "issued") {
      // 未使用のキーがある → 再送
      await sendKeyEmail(email, existing.key, name);
      return NextResponse.json({ ok: true, message: "既にお送りしたキーがあります。メールをご確認ください。" });
    }

    if (existing && existing.status === "activated") {
      return NextResponse.json({
        error: "このメールアドレスは既にトライアルを使用済みです。続けてご利用の場合は Pro へお申込みください。",
      }, { status: 400 });
    }

    // 新規キー発行
    let key = generateKey();
    // 重複チェック (極稀だが念のため)
    for (let i = 0; i < 5; i++) {
      const { data: dup } = await supabase
        .from("trial_keys")
        .select("id")
        .eq("key", key)
        .maybeSingle();
      if (!dup) break;
      key = generateKey();
    }

    const { error: insertErr } = await supabase
      .from("trial_keys")
      .insert({
        key,
        issued_to_email: email,
        issued_to_name: name || null,
        issued_to_line_id: lineId || null,
        status: "issued",
      });

    if (insertErr) {
      return NextResponse.json({ error: "キー発行失敗: " + insertErr.message }, { status: 500 });
    }

    const emailRes = await sendKeyEmail(email, key, name);
    if (!emailRes.ok) {
      // メール送信失敗してもキー自体は発行済みなのでユーザーに伝える
      return NextResponse.json({
        ok: true,
        key, // 開発時は画面にも返す（メール失敗の保険）
        warning: "メール送信に失敗しました。キーをコピーしてください: " + key,
        emailError: emailRes.error,
      });
    }

    // アスメルへステップメール登録（バックグラウンド・失敗してもユーザーには影響なし）
    registerToAsmel({ email, key, name, lineId })
      .then((r) => {
        if (r.ok) {
          console.log(`[trial/request-key] asmel ${r.status}:`, email);
        } else if (r.status === "skipped") {
          // 環境変数未設定 → 何もしない
        } else {
          console.error(`[trial/request-key] asmel ${r.status}:`, email, r.error);
        }
      })
      .catch((e) => console.error("[trial/request-key] asmel exception:", e));

    return NextResponse.json({ ok: true, message: "キーを送信しました。メールをご確認ください。" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[trial/request-key] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function sendKeyEmail(email: string, key: string, name: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://life-navigator-peach.vercel.app";
  const activateUrl = `${baseUrl}/activate?key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`;
  const greeting = name ? `${name} さん、` : "";

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>夢ナビ 21日無料キー</title></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🌟 夢ナビへようこそ</h1>
  </div>
  <p>${greeting}夢ナビの 21 日無料キーをお送りいたします。</p>
  <div style="background: #fef3c7; border: 2px dashed #fbbf24; padding: 16px; border-radius: 12px; text-align: center; margin: 24px 0;">
    <p style="font-size: 12px; color: #92400e; margin: 0 0 8px 0;">あなたの 21 日無料キー</p>
    <p style="font-size: 22px; font-weight: bold; color: #1f2937; margin: 0; letter-spacing: 2px; font-family: monospace;">${key}</p>
  </div>
  <p>下のボタンから今すぐ夢ナビをはじめられます:</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${activateUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">
      夢ナビをはじめる
    </a>
  </div>
  <h3 style="color: #92400e; margin-top: 32px;">21 日間で体験できること</h3>
  <ul style="line-height: 1.8;">
    <li>毎日の MIT (最重要事項 3 つ) で行動を整理</li>
    <li>4 大悩み (仕事・お金・人間関係・健康) のスコア追跡</li>
    <li><strong>週次振り返り</strong>: AI と対話して来週を計画</li>
    <li>SpeakNote 連携: 話すだけで AI が文章に</li>
    <li>21 日続いたら<strong>習慣化</strong>。続けたい時は Pro へ</li>
  </ul>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  <p style="font-size: 12px; color: #6b7280;">このメールに心当たりがない場合は、無視してください。<br>
  夢ナビ運営: ドリームズ (飯村悟) / satoru0806@gmail.com</p>
</body>
</html>`;

  const text = `${greeting}夢ナビの 21 日無料キーをお送りいたします。

キー: ${key}

下記のリンクから今すぐ夢ナビをはじめられます:
${activateUrl}

21 日間で体験できること:
- 毎日の MIT (最重要事項 3 つ) で行動を整理
- 4 大悩み (仕事・お金・人間関係・健康) のスコア追跡
- 週次振り返り: AI と対話して来週を計画
- SpeakNote 連携: 話すだけで AI が文章に
- 21 日続いたら習慣化。続けたい時は Pro へ

夢ナビ運営: ドリームズ (飯村悟) / satoru0806@gmail.com`;

  return await sendEmail({ to: email, subject: "🌟 夢ナビ 21 日無料キー", html, text });
}
