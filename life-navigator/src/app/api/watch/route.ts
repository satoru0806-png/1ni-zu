import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayString } from "@/lib/utils";
import { getTodayTheme } from "@/lib/daily-themes";

// 時計からデータを送信（MIT・日記・感謝・気分など）
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== process.env.WATCH_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const body = await req.json();
  const date = body.date || todayString();

  // upsert用データ構築
  const data: Record<string, unknown> = { date };
  if (body.mit1 !== undefined) data.mit1 = body.mit1;
  if (body.mit2 !== undefined) data.mit2 = body.mit2;
  if (body.mit3 !== undefined) data.mit3 = body.mit3;
  if (body.doneNote !== undefined) data.done_note = body.doneNote;
  if (body.gratitudeNote !== undefined) data.gratitude_note = body.gratitudeNote;
  if (body.tomorrowPlan !== undefined) data.tomorrow_plan = body.tomorrowPlan;
  if (body.mood !== undefined) data.memo_raw = (data.memo_raw as string || "") ? data.memo_raw : body.mood; // moodはmemo_rawの末尾に追加せず別管理

  // スコアも受け付ける
  if (body.relationshipScore !== undefined) data.relationship_score = body.relationshipScore;
  if (body.moneyScore !== undefined) data.money_score = body.moneyScore;
  if (body.workScore !== undefined) data.work_score = body.workScore;
  if (body.healthScore !== undefined) data.health_score = body.healthScore;

  const { error } = await supabase
    .from("day_logs")
    .upsert(data, { onConflict: "date" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 時計から呼ばれるAPI（認証不要、シンプル）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  // 簡易認証
  if (key !== process.env.WATCH_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const date = todayString();
  const theme = getTodayTheme();

  // 夢を取得
  const { data: dreams } = await supabase
    .from("dreams")
    .select("text")
    .order("id", { ascending: true })
    .limit(3);

  // 今日のログを取得
  const { data: dayLog } = await supabase
    .from("day_logs")
    .select("*")
    .eq("date", date)
    .single();

  // 前日のスコア（今日のログがない場合）
  let scores = {
    relationship: 50, money: 50, work: 50, health: 50
  };
  if (dayLog) {
    scores = {
      relationship: dayLog.relationship_score,
      money: dayLog.money_score,
      work: dayLog.work_score,
      health: dayLog.health_score,
    };
  } else {
    const { data: prev } = await supabase
      .from("day_logs")
      .select("relationship_score, money_score, work_score, health_score")
      .lt("date", date)
      .order("date", { ascending: false })
      .limit(1)
      .single();
    if (prev) {
      scores = {
        relationship: prev.relationship_score,
        money: prev.money_score,
        work: prev.work_score,
        health: prev.health_score,
      };
    }
  }

  return NextResponse.json({
    dreams: (dreams ?? []).map((d) => d.text),
    scores,
    totalScore: Math.round((scores.relationship + scores.money + scores.work + scores.health) / 4),
    quote: theme.prompt,
    quoteTitle: theme.title,
    quoteEmoji: theme.emoji,
    date,
    mit1: dayLog?.mit1 ?? null,
    mit2: dayLog?.mit2 ?? null,
    mit3: dayLog?.mit3 ?? null,
  });
}
