import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Top3Item = { date: string; action: string; reason: string };
type WeeklyAIResult = { score: number; top3: Top3Item[]; observation: string };

export async function GET() {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = await createClient();

  // ミッション取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("mission")
    .eq("user_id", user.id)
    .maybeSingle();

  const mission = (profile?.mission || "").trim();

  if (!mission) {
    return NextResponse.json({ hasMission: false });
  }

  // 過去7日のday_logsを取得
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const startStr = start.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const { data: logs } = await supabase
    .from("day_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .order("date", { ascending: true });

  const activeLogs = (logs || []).filter(
    (l) => l.mit1 || l.mit2 || l.mit3 || l.memo_raw || l.gratitude_note
  );

  if (activeLogs.length === 0) {
    return NextResponse.json({
      hasMission: true,
      mission,
      periodStart: startStr,
      periodEnd: todayStr,
      logCount: 0,
      score: 0,
      top3: [],
      observation: "今週はまだ記録がありません。まず今日のMITから始めてみましょう。",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI設定エラー" }, { status: 500 });
  }

  // 日次記録をAIに渡す形式に変換
  const logsText = activeLogs
    .map((l) => {
      const mits = [l.mit1, l.mit2, l.mit3].filter(Boolean);
      const aiDiary = l.ai_diary ? `\n日記: ${l.ai_diary}` : "";
      return `【${l.date}】\nMIT: ${mits.length ? mits.join(" / ") : "（なし）"}\nメモ: ${l.memo_raw || "（なし）"}${aiDiary}`;
    })
    .join("\n\n");

  const systemPrompt = `あなたはユーザーに寄り添う人生コーチAIです。
ユーザーの人生ミッションと過去7日の記録を読み、ミッション視点での週報を作成してください。

【ユーザーの人生ミッション】
${mission}

【出力ルール】
1. score: 今週の行動がミッションにどれだけ沿っていたかを0-100で評価
   - 記録ゼロの日が多くても過度に下げない（30-40が最低ライン）
   - 小さなMIT達成も加点する
2. top3: ミッションに特に沿っていた行動を最大3つ抽出
   - 実在の記録から選ぶ（捏造禁止）
   - date: YYYY-MM-DD, action: 行動内容（40字以内）, reason: なぜミッションに繋がるか（30字以内）
3. observation: 今週全体の温かい観察（2-3文、必ず前向きに）
   - ミッションの視点から「今週の輝き」を言語化
   - 記録が少なくても肯定的に（「土台作りの一週間」など）
   - 「〜でしたね」「〜している姿が見えました」のような優しいトーン

必ず以下のJSON形式のみで返答（マークダウン・前置き禁止）:

{
  "score": 72,
  "top3": [
    { "date": "2026-04-18", "action": "...", "reason": "..." }
  ],
  "observation": "..."
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: logsText },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Weekly mission error:", response.status, err);
      return NextResponse.json({ error: "週報生成失敗" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const result = JSON.parse(content) as WeeklyAIResult;

    return NextResponse.json({
      hasMission: true,
      mission,
      periodStart: startStr,
      periodEnd: todayStr,
      logCount: activeLogs.length,
      score: Math.max(0, Math.min(100, Math.round(result.score || 0))),
      top3: Array.isArray(result.top3) ? result.top3.slice(0, 3) : [],
      observation: result.observation || "",
    });
  } catch (e) {
    console.error("Weekly API error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
