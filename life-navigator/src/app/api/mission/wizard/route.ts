import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

type WizardBody = {
  wakuwaku?: string;  // Step1: ワクワクする瞬間
  origin?: string;    // Step2: 原点になる経験
  person?: string;    // Step3: 頭に浮かぶ人
};

type CandidateResult = {
  common_thread: string;    // 3回答から読み取れる共通の軸
  candidates: {
    style: "simple" | "self_first" | "cycle" | "poetic" | "action";
    label: string;          // 候補A〜Eの表示名
    mission: string;        // ミッション文（1文）
    why: string;            // なぜこの候補をおすすめするか（30文字以内）
  }[];
};

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const body = (await req.json().catch(() => ({}))) as WizardBody;
  const wakuwaku = (body.wakuwaku || "").trim();
  const origin = (body.origin || "").trim();
  const person = (body.person || "").trim();

  if (!wakuwaku && !origin && !person) {
    return NextResponse.json({ error: "最低1つ以上の回答が必要です" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI設定エラー" }, { status: 500 });
  }

  const systemPrompt = `あなたは人の人生ミッション（魂の使命）を言語化するプロのコーチです。
ユーザーの3つの答えから「その人の人生を貫く一本の糸」を見つけ、1文のミッション文を5パターン作ってください。

【絶対のルール】
1. ミッション文は「〜する」「〜し続ける」などの動詞で終わる一文
2. 一般論ではなく、その人の言葉・体験に基づいた固有のもの
3. 押しつけがましくなく、本人が「うん、これだ」と納得できる温度感
4. 5つの候補は異なるスタイルで作る（同じ内容の言い換えにしない）

【候補スタイル】
A. simple: シンプルで覚えやすい（日常の口癖にできる短さ）
B. self_first: 自分の喜びから始まる型（「まず自分が〜し、〜に届ける」）
C. cycle: 循環・変換型（「自分の〜を、誰かの〜に変える」）
D. poetic: 詩的・余韻のある型（感情に残る表現）
E. action: 行動的・具体的な型（目の前の人に向かう意志）

【共通の糸 (common_thread)】
回答の裏にある共通の価値観・感情を1文で（30文字以内）
例: 「人の『ありがとう』を生む瞬間を作ること」

必ず以下のJSON形式のみで返答してください（マークダウン・前置き・後書き禁止）：

{
  "common_thread": "...",
  "candidates": [
    { "style": "simple", "label": "候補A: シンプル型", "mission": "...", "why": "..." },
    { "style": "self_first", "label": "候補B: 自分ファースト型", "mission": "...", "why": "..." },
    { "style": "cycle", "label": "候補C: 循環型", "mission": "...", "why": "..." },
    { "style": "poetic", "label": "候補D: 詩的型", "mission": "...", "why": "..." },
    { "style": "action", "label": "候補E: 行動型", "mission": "...", "why": "..." }
  ]
}`;

  const userContent = `
【ワクワクする瞬間】
${wakuwaku || "（未記入）"}

【原点になる経験】
${origin || "（未記入）"}

【頭に浮かぶ人】
${person || "（未記入）"}
`.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_tokens: 1200,
        temperature: 0.7,  // 少し創造的に
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI mission wizard error:", response.status, err);
      return NextResponse.json({ error: "AI候補生成に失敗しました" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const result = JSON.parse(content) as CandidateResult;

    if (!Array.isArray(result.candidates) || result.candidates.length === 0) {
      return NextResponse.json({ error: "候補生成の結果が不正です" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("Mission wizard API error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
