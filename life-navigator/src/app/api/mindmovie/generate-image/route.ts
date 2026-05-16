import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // DALL-E 3 画像生成は時間がかかる

const MONTHLY_LIMIT = 5; // 全員月5枚まで

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const body = await req.json().catch(() => ({}));
    const prompt = (body.prompt as string || "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "プロンプトを入力してください" }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: "プロンプトは500字以内" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 月次使用量チェック
    const { data: movie } = await supabase
      .from("mind_movies")
      .select("id, ai_images_used_this_month, ai_images_reset_date")
      .eq("user_id", user.id)
      .maybeSingle();

    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    let used = movie?.ai_images_used_this_month ?? 0;
    const resetDate = movie?.ai_images_reset_date ?? null;
    if (!resetDate || resetDate < thisMonthStart) {
      used = 0; // 月が変わったらリセット
    }

    if (used >= MONTHLY_LIMIT) {
      return NextResponse.json({
        error: `今月の AI 画像生成は ${MONTHLY_LIMIT} 枚使い切りました。来月リセットされます。`,
        used,
        limit: MONTHLY_LIMIT,
      }, { status: 429 });
    }

    // OpenAI DALL-E 3 で生成
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    // プロンプトを夢ナビ用に最適化
    const enhancedPrompt = `Inspirational, dreamy, cinematic image: ${prompt}. High quality, beautiful lighting, hopeful atmosphere.`;

    const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      }),
    });

    if (!dalleRes.ok) {
      const detail = await dalleRes.text().catch(() => "");
      return NextResponse.json({ error: `DALL-E error: ${dalleRes.status} ${detail.slice(0, 200)}` }, { status: 502 });
    }

    const dalleData = await dalleRes.json();
    const b64 = dalleData.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "DALL-E response no image" }, { status: 502 });
    }

    // Supabase Storage にアップロード
    const buffer = Buffer.from(b64, "base64");
    const filename = `${user.id}/${Date.now()}.png`;
    const { error: uploadErr } = await supabase.storage
      .from("mindmovie-images")
      .upload(filename, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json({ error: `Storage upload error: ${uploadErr.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("mindmovie-images").getPublicUrl(filename);
    const imageUrl = urlData.publicUrl;

    // 使用量更新
    if (movie) {
      await supabase
        .from("mind_movies")
        .update({
          ai_images_used_this_month: used + 1,
          ai_images_reset_date: thisMonthStart,
        })
        .eq("id", movie.id);
    } else {
      await supabase.from("mind_movies").insert({
        user_id: user.id,
        ai_images_used_this_month: 1,
        ai_images_reset_date: thisMonthStart,
      });
    }

    return NextResponse.json({
      imageUrl,
      used: used + 1,
      limit: MONTHLY_LIMIT,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mindmovie/generate-image] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
