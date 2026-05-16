import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// 週開始日 (YYYY-MM-DD) と該当週の day_logs を取得
async function fetchWeekData(supabase: ReturnType<typeof createAdminClient>, userId: string, weekStart: string) {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endStr = end.toISOString().slice(0, 10);

  const { data: logs } = await supabase
    .from("day_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", endStr)
    .order("date");

  const { data: profile } = await supabase
    .from("profiles")
    .select("mission, display_name, full_name, plan")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: goals } = await supabase
    .from("goals")
    .select("title, deadline, progress")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("created_at");

  return { logs: logs || [], profile, goals: goals || [], weekStart, weekEnd: endStr };
}

// OpenAI GPT を呼ぶ（OPENAI_API_KEY を使う、Vercelに設定済み）
async function callClaude(system: string, messages: { role: string; content: string }[], maxTokens = 1024) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const openaiMessages = [
    { role: "system" as const, content: system },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      max_tokens: maxTokens,
      messages: openaiMessages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI API error: ${res.status} ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

export async function POST(req: NextRequest) {
  try {
    return await handlePost(req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[weekly-review] uncaught error:", msg);
    return NextResponse.json({ error: msg || "internal error" }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const weekStart = body.weekStart as string; // 'YYYY-MM-DD'

  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: "weekStart (YYYY-MM-DD) is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 既存レコード取得 or 作成
  let { data: existing } = await supabase
    .from("weekly_reflections")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (!existing) {
    const { data: created } = await supabase
      .from("weekly_reflections")
      .insert({ user_id: user.id, week_start: weekStart })
      .select()
      .single();
    existing = created;
  }

  // === Action 1: summary（Step 1） ===
  if (action === "summary") {
    const { logs, profile, goals } = await fetchWeekData(supabase, user.id, weekStart);
    const userName = profile?.display_name || profile?.full_name || "あなた";

    // データを整形
    const totalDays = logs.length;
    const recordedDays = logs.filter((l) => l.mit1 || l.mit2 || l.mit3 || l.memo_raw || l.gratitude_note).length;
    const allMits = logs.flatMap((l) => [l.mit1, l.mit2, l.mit3].filter(Boolean));
    const gratitudeCount = logs.filter((l) => l.gratitude_note).length;
    const avgScore = logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + (((l.relationship_score || 50) + (l.money_score || 50) + (l.work_score || 50) + (l.health_score || 50)) / 4), 0) / logs.length)
      : 50;

    const dataBlock = logs.map((l) => `[${l.date}] MIT: ${[l.mit1, l.mit2, l.mit3].filter(Boolean).join(" / ") || "(なし)"} | 感謝: ${l.gratitude_note || "(なし)"} | メモ: ${(l.memo_raw || "(なし)").slice(0, 80)} | スコア平均: ${Math.round(((l.relationship_score || 50) + (l.money_score || 50) + (l.work_score || 50) + (l.health_score || 50)) / 4)}`).join("\n");

    const goalsBlock = goals.map((g) => `・${g.title}（進捗 ${g.progress}%${g.deadline ? `, 期限 ${g.deadline}` : ""}）`).join("\n") || "（未設定）";

    const system = `あなたは温かく寄り添うパーソナルメンターです。${userName}さんの 1 週間の振り返りを支援します。
口調: 敬語、優しく丁寧に、「${userName}さん」と呼びかける。
役割: 1 週間の客観的なサマリーを提供する。数字と観察を織り交ぜる。
重要: 評価したり説教したりしない。ただ "今週どんな1週間だったか" を映す鏡になる。
分量: 200〜300 文字程度。読みやすく改行を入れる。`;

    const userMsg = `${userName}さんのミッション: ${profile?.mission || "（未設定）"}
進行中のゴール:
${goalsBlock}

今週（${weekStart}〜）の記録:
${dataBlock}

【サマリー指標】
記録した日: ${recordedDays}/${totalDays}日
設定された MIT 総数: ${allMits.length}個
感謝の記録: ${gratitudeCount}回
スコア平均: ${avgScore}/100

これを踏まえ、${userName}さんの今週を温かく振り返るサマリーを書いてください。`;

    const summary = await callClaude(system, [{ role: "user", content: userMsg }], 600);

    await supabase.from("weekly_reflections")
      .update({ ai_summary: summary, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    return NextResponse.json({ summary, stats: { recordedDays, totalDays, allMitsCount: allMits.length, gratitudeCount, avgScore } });
  }

  // === Action 2: feedback（Step 3） ===
  if (action === "feedback") {
    const userText = (body.userText as string || "").trim();
    if (!userText) {
      return NextResponse.json({ error: "userText is required" }, { status: 400 });
    }

    const { profile } = await fetchWeekData(supabase, user.id, weekStart);
    const userName = profile?.display_name || profile?.full_name || "あなた";

    const system = `あなたは温かく寄り添うパーソナルメンターです。${userName}さんが書いた1週間の振り返りに対してフィードバックを返します。
口調: 敬語、優しく丁寧に、「${userName}さん」と呼びかける。
役割: ${userName}さん自身では気づきにくい視点をそっと提示する。

重要な原則:
1. ${userName}さんを評価したり説教したりしない
2. 表面的な「素晴らしい」「頑張ってます」では終わらせず、文章の奥にある気持ちや傾向を読み取る
3. ${userName}さんの言葉の中に出てきたキーワード（人間関係、健康、特定の人物名など）を引用しながら、新しい視点を提供
4. ネガティブに聞こえる表現の裏にある前向きな意図を見出す
5. 「気づき1」「気づき2」のように 2〜3 個の視点を箇条書きで示す
6. 最後に「来週の一歩を一緒に考えませんか?」と次のステップへ誘う

分量: 300〜500 文字。読みやすく改行を入れる。`;

    const summary = existing?.ai_summary || "";
    const userMsg = `${userName}さんのミッション: ${profile?.mission || "（未設定）"}

【AIが生成した今週のサマリー】
${summary}

【${userName}さん自身の言葉での振り返り】
${userText}

これを踏まえ、${userName}さんが気づいていない視点を温かく、敬語でフィードバックしてください。`;

    const feedback = await callClaude(system, [{ role: "user", content: userMsg }], 800);

    await supabase.from("weekly_reflections")
      .update({ user_text: userText, ai_feedback: feedback, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    return NextResponse.json({ feedback });
  }

  // === Action 3: next-week dialogue（Step 4） ===
  if (action === "next-week") {
    const userMessage = (body.userMessage as string || "").trim();
    const dialogue = (existing?.next_week_dialogue as { role: string; content: string }[] | null) || [];
    const finalize = body.finalize === true;

    const { profile, goals } = await fetchWeekData(supabase, user.id, weekStart);
    const userName = profile?.display_name || profile?.full_name || "あなた";

    if (finalize) {
      // 最終的に MIT 3つ + 重点テーマを JSON で確定
      const system = `あなたは温かく寄り添うパーソナルメンターです。${userName}さんと来週について話し合った結果から、来週の MIT を確定します。
出力は厳密な JSON 形式のみ。説明文は不要。

{
  "mit1": "（来週の MIT 1）",
  "mit2": "（来週の MIT 2）",
  "mit3": "（来週の MIT 3）",
  "theme": "（重点テーマを1行で）"
}

各 MIT は具体的・行動可能。テーマは「健康に集中する週」のような感情と方向性が伝わる短文。`;

      const dialogueText = dialogue.map((m) => `${m.role === "user" ? userName + "さん" : "AI"}: ${m.content}`).join("\n\n");
      const userMsg = `これまでの${userName}さんとの対話:\n\n${dialogueText}\n\nこれをもとに、来週の MIT3つ＋重点テーマを JSON 形式で出力してください。`;

      const raw = await callClaude(system, [{ role: "user", content: userMsg }], 400);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: "AI failed to produce JSON", raw }, { status: 500 });
      }
      let mits;
      try { mits = JSON.parse(match[0]); } catch {
        return NextResponse.json({ error: "AI JSON parse error", raw }, { status: 500 });
      }

      await supabase.from("weekly_reflections")
        .update({ next_week_mits: mits, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      return NextResponse.json({ mits, dialogue });
    }

    // 通常の対話ターン
    const goalsBlock = goals.map((g) => `・${g.title}`).join("\n") || "（未設定）";

    const system = `あなたは温かく寄り添うパーソナルメンターです。${userName}さんと「来週どんな1週間にしたいか」を一緒に考えます。
口調: 敬語、優しく丁寧に、「${userName}さん」と呼びかける。

役割:
1. ${userName}さんの言葉を受けて、共感しつつ深める質問を 1 つする
2. ミッション・ゴールと結びつけて整理する
3. 「来週やりたいこと」が 3 つくらいに絞れてきたら、「これを MIT として固めましょうか？」と確認
4. 強要せず、${userName}さんが「これだ」と思える形に寄り添う

分量: 1 ターン 100〜200 文字。簡潔に。`;

    const newDialogue: { role: string; content: string }[] = [...dialogue];
    if (userMessage) newDialogue.push({ role: "user", content: userMessage });

    const messages = newDialogue.length === 0
      ? [{ role: "user" as const, content: `（最初のターン）${userName}さんのミッション: ${profile?.mission || "（未設定）"}\nゴール:\n${goalsBlock}\n\n今週の振り返り:\n${existing?.user_text || "(なし)"}\n\nAIフィードバック:\n${existing?.ai_feedback || "(なし)"}\n\nこれを踏まえて、${userName}さんに「来週どう過ごしたいですか?」と最初の問いかけをしてください。` }]
      : newDialogue.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const aiMsg = await callClaude(system, messages, 400);
    newDialogue.push({ role: "assistant", content: aiMsg });

    await supabase.from("weekly_reflections")
      .update({ next_week_dialogue: newDialogue, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    return NextResponse.json({ aiMessage: aiMsg, dialogue: newDialogue });
  }

  // === Action 4: apply（来週 MIT を /today に反映） ===
  if (action === "apply") {
    const reflection = existing;
    if (!reflection?.next_week_mits) {
      return NextResponse.json({ error: "next_week_mits is not set yet" }, { status: 400 });
    }

    const mits = reflection.next_week_mits as { mit1: string; mit2: string; mit3: string; theme: string };

    // 来週の月曜日（または week_start_day に従う）から開始日を計算
    const weekStartDate = new Date(weekStart + "T00:00:00");
    const nextWeekStart = new Date(weekStartDate);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekStartStr = nextWeekStart.toISOString().slice(0, 10);

    // 来週の day_logs に MIT を upsert（既存があれば update、なければ insert）
    const { data: existingLog } = await supabase
      .from("day_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", nextWeekStartStr)
      .maybeSingle();

    if (existingLog) {
      await supabase
        .from("day_logs")
        .update({ mit1: mits.mit1, mit2: mits.mit2, mit3: mits.mit3 })
        .eq("id", existingLog.id);
    } else {
      await supabase
        .from("day_logs")
        .insert({ user_id: user.id, date: nextWeekStartStr, mit1: mits.mit1, mit2: mits.mit2, mit3: mits.mit3 });
    }

    await supabase
      .from("weekly_reflections")
      .update({ applied: true, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    return NextResponse.json({ ok: true, appliedDate: nextWeekStartStr });
  }

  // === Action 5: get（既存の振り返り取得）===
  if (action === "get") {
    return NextResponse.json({ reflection: existing });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
