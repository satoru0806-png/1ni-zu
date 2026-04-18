import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";
import { todayString } from "@/lib/utils";

type ScoreResult = {
  diary: string;
  advice: string;
  self_insight: string;
  relationship_score: number;
  money_score: number;
  work_score: number;
  health_score: number;
  reason_rel: string;
  reason_money: string;
  reason_work: string;
  reason_health: string;
};

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = await createClient();
  const body = await req.json().catch(() => ({}));
  const date = body.date || todayString();

  // 今日のdaylog取得（なければ空ログとして扱う）
  const { data: log } = await supabase.from("day_logs").select("*").eq("user_id", user.id).eq("date", date).maybeSingle();
  const safeLog = log || { mit1: null, mit2: null, mit3: null, done_note: null, memo_raw: null, gratitude_note: null, tomorrow_plan: null };

  // 記録がほぼ空の場合は診断をスキップ（AIに意味のある材料がない）
  const hasContent = !!(safeLog.mit1 || safeLog.mit2 || safeLog.mit3 || safeLog.memo_raw || safeLog.gratitude_note || safeLog.tomorrow_plan);
  if (!hasContent) {
    return NextResponse.json({
      error: "まず今日のMITやメモを入力してから診断してください。小さな記録でもAIが拾い上げて前向きな言葉をお届けします。"
    }, { status: 400 });
  }

  // Pro/無料プラン制限チェック
  const { data: profile } = await supabase.from("profiles").select("plan").eq("user_id", user.id).maybeSingle();
  const plan = profile?.plan || "free";
  const isPro = plan === "pro";

  if (!isPro) {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { count } = await supabase
      .from("day_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("date", monthStart)
      .not("ai_diary", "is", null);
    if ((count ?? 0) >= 3) {
      return NextResponse.json({
        error: "今月の無料AI診断（3回）を使い切りました。Proプランにアップグレードすると無制限で使えます。",
        upgrade: true,
      }, { status: 403 });
    }
  }

  // MIT達成状況をパース
  let checks: boolean[] = [false, false, false];
  try {
    const parsed = JSON.parse(safeLog.done_note || "[]");
    if (Array.isArray(parsed)) checks = parsed;
  } catch {}

  const mits = [safeLog.mit1, safeLog.mit2, safeLog.mit3].filter(Boolean);
  const mitStatus = mits.map((m, i) => `${checks[i] ? "✅" : "⬜"} ${m}`).join("\n");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI設定エラー" }, { status: 500 });
  }

  const userContent = `
【日付】${date}

【今日の大切なこと（MIT）】
${mitStatus || "（未設定）"}

【メモ】
${safeLog.memo_raw || "（なし）"}

【振り返り】
${typeof safeLog.done_note === "string" && safeLog.done_note.startsWith("[") ? "（チェック情報のみ）" : safeLog.done_note || "（なし）"}

【感謝】
${safeLog.gratitude_note || "（なし）"}

【明日の予定】
${safeLog.tomorrow_plan || "（なし）"}
`.trim();

  const systemPrompt = `あなたはユーザーに寄り添う、温かく前向きな人生コーチAIです。
【最重要ルール】必ず前向き・肯定的な言葉で締めくくり、ユーザーが「明日もう一歩進めそう」と感じるメッセージにしてください。

ユーザーの1日の記録を読み、以下を生成してください：

1. **diary**: 今日の出来事を自然な文章で2-3文に要約した日記（ユーザー視点で「〜しました」調）。
   - 小さな進歩も見逃さず、必ず良かった点を含める
2. **advice**: 明日への前向きな一言アドバイス（必ず励まし・応援で終わる、2-3文）
   - どんな内容でも最後は「〜できる」「〜していきましょう」「〜する価値があります」等の前向きな表現で締める
   - ネガティブな記録でも、そこから学べる視点・明日への希望を必ず提示する
   - ユーザーが「一歩でも前に進みたい」と思える言葉を選ぶ
3. **self_insight**: ユーザーが自分では気づいていない視点からの温かい「気づき」を伝える（2-3文）
   - 自分自身を振り返る習慣をサポートする言葉。厳しく反省させるのではなく、未来に活かせるヒントを優しく伝える
   - 行動や言葉の裏に潜む頑張り・成長・小さな変化・パターンを拾い上げて言葉にする
   - 「〜している姿に気づきました」「〜な視点があるのが素敵です」「〜を続けている自分を大切にしてください」のような温かいトーン
   - ユーザー自身では「ここはよく頑張ったな」と言いにくい部分を、AIが代わりに認める役割
   - 過度な褒めではなく、事実を優しく鏡のように返す
4. **4領域スコア**: 人間関係・お金・仕事・健康を0-100で客観評価
   - 関係・お金・仕事・健康それぞれについて記録に基づいて評価
   - 記録に全く情報がない領域は50（変化なし）
   - 明確にポジティブな記録があれば60-85
   - とても充実していれば85-95
   - ネガティブな記録でも40以下にはしない（客観性は保ちつつ過度に低評価しない）
5. **各領域の判定理由**: なぜそのスコアにしたかの短い理由（各領域20文字以内、肯定的表現）

必ず以下のJSON形式のみで返答してください（マークダウン・前置き・後書き禁止）：

{
  "diary": "...",
  "advice": "...",
  "self_insight": "...",
  "relationship_score": 75,
  "money_score": 50,
  "work_score": 70,
  "health_score": 65,
  "reason_rel": "...",
  "reason_money": "...",
  "reason_work": "...",
  "reason_health": "..."
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
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI score error:", response.status, err);
      return NextResponse.json({ error: "AI診断失敗" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const result = JSON.parse(content) as ScoreResult;

    // スコアをclamp
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const rel = clamp(result.relationship_score);
    const money = clamp(result.money_score);
    const work = clamp(result.work_score);
    const health = clamp(result.health_score);

    // day_logsに保存（なければinsert、あればupdate）
    const updateData = {
      relationship_score: rel,
      money_score: money,
      work_score: work,
      health_score: health,
      ai_diary: result.diary,
      ai_advice: result.advice,
      ai_insight: result.self_insight,
    };
    if (log) {
      await supabase.from("day_logs").update(updateData).eq("user_id", user.id).eq("date", date);
    } else {
      await supabase.from("day_logs").insert({ date, user_id: user.id, ...updateData });
    }

    return NextResponse.json({
      diary: result.diary,
      advice: result.advice,
      self_insight: isPro ? result.self_insight : "",
      isPro,
      scores: { rel, money, work, health },
      reasons: {
        rel: result.reason_rel,
        money: result.reason_money,
        work: result.reason_work,
        health: result.reason_health,
      },
    });
  } catch (e) {
    console.error("Score API error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
