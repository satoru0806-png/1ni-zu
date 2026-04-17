import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";
import { todayString } from "@/lib/utils";
import { processMemo } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || todayString();

  const { data: log } = await supabase.from("day_logs").select("*").eq("user_id", user.id).eq("date", date).maybeSingle();

  if (!log) {
    const { data: prev } = await supabase
      .from("day_logs")
      .select("*")
      .eq("user_id", user.id)
      .lt("date", date)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      date,
      mit1: null, mit2: null, mit3: null,
      done_note: null, gratitude_note: null, tomorrow_plan: null,
      relationship_score: prev?.relationship_score ?? 50,
      money_score: prev?.money_score ?? 50,
      work_score: prev?.work_score ?? 50,
      health_score: prev?.health_score ?? 50,
      memo_raw: null, memo_summary: null, memo_tasks_json: null,
    });
  }
  return NextResponse.json(log);
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;
  const supabase = await createClient();
  const body = await req.json();
  const date = body.date || todayString();

  let memoSummary = body.memoSummary ?? undefined;
  let memoTasksJson = body.memoTasksJson ?? undefined;
  if (body.memoRaw && !memoSummary) {
    const result = await processMemo(body.memoRaw);
    memoSummary = result.summary;
    memoTasksJson = JSON.stringify(result.tasks);
  }

  const data: Record<string, unknown> = {};
  if (body.mit1 !== undefined) data.mit1 = body.mit1;
  if (body.mit2 !== undefined) data.mit2 = body.mit2;
  if (body.mit3 !== undefined) data.mit3 = body.mit3;
  if (body.doneNote !== undefined) data.done_note = body.doneNote;
  if (body.gratitudeNote !== undefined) data.gratitude_note = body.gratitudeNote;
  if (body.tomorrowPlan !== undefined) data.tomorrow_plan = body.tomorrowPlan;
  if (body.relationshipScore !== undefined) data.relationship_score = body.relationshipScore;
  if (body.moneyScore !== undefined) data.money_score = body.moneyScore;
  if (body.workScore !== undefined) data.work_score = body.workScore;
  if (body.healthScore !== undefined) data.health_score = body.healthScore;
  if (body.memoRaw !== undefined) data.memo_raw = body.memoRaw;
  if (memoSummary !== undefined) data.memo_summary = memoSummary;
  if (memoTasksJson !== undefined) data.memo_tasks_json = memoTasksJson;

  // Upsert (user_idスコープ)
  const { data: existing } = await supabase.from("day_logs").select("id").eq("user_id", user.id).eq("date", date).maybeSingle();

  let log;
  if (existing) {
    const { data: updated, error } = await supabase
      .from("day_logs").update(data).eq("user_id", user.id).eq("date", date).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    log = updated;
  } else {
    const { data: created, error } = await supabase
      .from("day_logs").insert({ date, user_id: user.id, ...data }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    log = created;
  }
  return NextResponse.json(log);
}
