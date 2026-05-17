import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function fetchMonthData(supabase: ReturnType<typeof createAdminClient>, userId: string, monthStart: string) {
  const start = new Date(monthStart + "T00:00:00");
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // 月末
  const endStr = end.toISOString().slice(0, 10);

  const { data: logs } = await supabase
    .from("day_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", monthStart)
    .lte("date", endStr)
    .order("date");

  const { data: profile } = await supabase
    .from("profiles")
    .select("mission, plan")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: goals } = await supabase
    .from("goals")
    .select("title, deadline, progress")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("created_at");

  // 該当月内の週次振り返りも取得
  const { data: weeklies } = await supabase
    .from("weekly_reflections")
    .select("week_start, ai_summary, user_text, next_week_mits")
    .eq("user_id", userId)
    .gte("week_start", monthStart)
    .lte("week_start", endStr)
    .order("week_start");

  return { logs: logs || [], profile, goals: goals || [], weeklies: weeklies || [], monthStart, monthEnd: endStr };
}

async function callAI(system: string, messages: { role: string; content: string }[], maxTokens = 1024) {
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
    console.error("[monthly-review] uncaught error:", msg);
    return NextResponse.json({ error: msg || "internal error" }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const monthStart = body.monthStart as string;

  if (!monthStart || !/^\d{4}-\d{2}-01$/.test(monthStart)) {
    return NextResponse.json({ error: "monthStart (YYYY-MM-01) is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // お名前は auth のユーザーメタデータから取得。未設定なら「あなた」
  const displayName = ((user.user_metadata?.display_name as string) || "").trim();
  const callName = displayName ? `${displayName}さん` : "あなた";

  let { data: existing } = await supabase
    .from("monthly_reflections")
    .select("*")
    .eq("user_id", user.id)
    .eq("month_start", monthStart)
    .maybeSingle();

  if (!existing) {
    const { data: created } = await supabase
      .from("monthly_reflections")
      .insert({ user_id: user.id, month_start: monthStart })
      .select()
      .single();
    existing = created;
  }

  // === Action 1: summary ===
  if (action === "summary") {
    const { logs, profile, goals, weeklies } = await fetchMonthData(supabase, user.id, monthStart);

    const totalDays = logs.length;
    const recordedDays = logs.filter((l) => l.mit1 || l.mit2 || l.mit3 || l.memo_raw || l.gratitude_note).length;
    const allMits = logs.flatMap((l) => [l.mit1, l.mit2, l.mit3].filter(Boolean));
    const gratitudeCount = logs.filter((l) => l.gratitude_note).length;
    const avgScore = logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + (((l.relationship_score || 50) + (l.money_score || 50) + (l.work_score || 50) + (l.health_score || 50)) / 4), 0) / logs.length)
      : 50;

    const weekliesBlock = weeklies.length > 0
      ? weeklies.map((w) => `[${w.week_start}〜] ${(w.ai_summary || "").slice(0, 200)}`).join("\n\n")
      : "（週次振り返りの記録なし）";

    const goalsBlock = goals.map((g) => `・${g.title}（進捗 ${g.progress}%${g.deadline ? `, 期限 ${g.deadline}` : ""}）`).join("\n") || "（未設定）";

    const system = `あなたは温かく寄り添うパーソナルメンターです。${callName}の 1 ヶ月の振り返りを支援します。
口調: 敬語、優しく丁寧に、「${callName}」と呼びかける。
役割: 1ヶ月の客観的なサマリーを提供する。週次の振り返りデータも参照しながら、月全体の流れと変化を映す。
重要: 評価しない。月という大きな単位での「あなたの航海記録」を提示するイメージ。

分量: 300〜500 文字程度。読みやすく改行を入れる。`;

    const userMsg = `${callName}のミッション: ${profile?.mission || "（未設定）"}
進行中のゴール:
${goalsBlock}

【今月（${monthStart}〜）の主な数値】
記録した日: ${recordedDays}/${totalDays}日
設定された MIT 総数: ${allMits.length}個
感謝の記録: ${gratitudeCount}回
スコア平均: ${avgScore}/100

【今月の各週の振り返り】
${weekliesBlock}

これを踏まえ、${callName}の今月を温かく振り返るサマリーを書いてください。`;

    const summary = await callAI(system, [{ role: "user", content: userMsg }], 800);

    await supabase.from("monthly_reflections")
      .update({ ai_summary: summary, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    return NextResponse.json({ summary, stats: { recordedDays, totalDays, allMitsCount: allMits.length, gratitudeCount, avgScore, weekliesCount: weeklies.length } });
  }

  // === Action 2: feedback ===
  if (action === "feedback") {
    const userText = (body.userText as string || "").trim();
    if (!userText) return NextResponse.json({ error: "userText is required" }, { status: 400 });

    const { profile } = await fetchMonthData(supabase, user.id, monthStart);

    const system = `あなたは温かく寄り添うパーソナルメンターです。${callName}が書いた1ヶ月の振り返りに対してフィードバックを返します。
口調: 敬語、優しく丁寧に、「${callName}」と呼びかける。
役割: ${callName}自身では気づきにくい、月単位での大きな変化や流れ・本質的な傾向を提示する。

重要な原則:
1. 評価したり説教したりしない
2. 月という長いスパンならではの「変化の軌跡」を見出す
3. ${callName}の言葉から繰り返し出てくるテーマを引用しながら新しい視点を提供
4. 「気づき1」「気づき2」のように 2〜3 個の視点を箇条書きで示す
5. 最後に「来月の方向性を一緒に考えませんか?」と次のステップへ誘う

分量: 400〜700 文字。`;

    const summary = existing?.ai_summary || "";
    const userMsg = `${callName}のミッション: ${profile?.mission || "（未設定）"}

【AIが生成した今月のサマリー】
${summary}

【${callName}自身の言葉での振り返り】
${userText}

これを踏まえ、${callName}が気づいていない月単位の視点を温かく、敬語でフィードバックしてください。`;

    const feedback = await callAI(system, [{ role: "user", content: userMsg }], 1000);

    await supabase.from("monthly_reflections")
      .update({ user_text: userText, ai_feedback: feedback, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    return NextResponse.json({ feedback });
  }

  // === Action 3: next-month dialogue ===
  if (action === "next-month") {
    const userMessage = (body.userMessage as string || "").trim();
    const dialogue = (existing?.next_month_dialogue as { role: string; content: string }[] | null) || [];
    const finalize = body.finalize === true;

    const { profile, goals } = await fetchMonthData(supabase, user.id, monthStart);

    if (finalize) {
      const system = `あなたは温かく寄り添うパーソナルメンターです。${callName}と来月について話し合った結果から、来月の方向性を確定します。
出力は厳密な JSON 形式のみ。

{
  "theme": "（来月の重点テーマを1行で。月の大方針）",
  "goals": [
    "（具体的な目標1）",
    "（具体的な目標2）",
    "（具体的な目標3）"
  ]
}

重点テーマは「健康に向き合う月」「人間関係を整える月」のような感情と方向性が伝わる短文。
目標は具体的・行動可能、3つ以内。`;

      const dialogueText = dialogue.map((m) => `${m.role === "user" ? callName : "AI"}: ${m.content}`).join("\n\n");
      const userMsg = `これまでの${callName}との対話:\n\n${dialogueText}\n\nこれをもとに、来月のテーマと目標を JSON 形式で出力してください。`;

      const raw = await callAI(system, [{ role: "user", content: userMsg }], 500);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: "AI failed to produce JSON", raw }, { status: 500 });
      }
      let result;
      try { result = JSON.parse(match[0]); } catch {
        return NextResponse.json({ error: "AI JSON parse error", raw }, { status: 500 });
      }

      await supabase.from("monthly_reflections")
        .update({
          next_month_theme: result.theme,
          next_month_goals: result.goals || [],
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);

      return NextResponse.json({ theme: result.theme, goals: result.goals || [], dialogue });
    }

    const goalsBlock = goals.map((g) => `・${g.title}`).join("\n") || "（未設定）";

    const system = `あなたは温かく寄り添うパーソナルメンターです。${callName}と「来月どう過ごしたいか」を一緒に考えます。
口調: 敬語、優しく丁寧に、「${callName}」と呼びかける。

役割:
1. ${callName}の言葉を受けて、共感しつつ深める
2. 月という長いスパンならではのテーマや方向性を一緒に探す
3. 具体的な目標が3つ程度に絞れてきたら「これでまとめましょうか?」と確認
4. 強要せず、${callName}が「これだ」と思える形に寄り添う

分量: 1ターン100〜200文字。`;

    const newDialogue: { role: string; content: string }[] = [...dialogue];
    if (userMessage) newDialogue.push({ role: "user", content: userMessage });

    const messages = newDialogue.length === 0
      ? [{ role: "user" as const, content: `（最初のターン）${callName}のミッション: ${profile?.mission || "（未設定）"}\nゴール:\n${goalsBlock}\n\n今月の振り返り:\n${existing?.user_text || "(なし)"}\n\nAIフィードバック:\n${existing?.ai_feedback || "(なし)"}\n\nこれを踏まえて、${callName}に「来月どんな1ヶ月にしたいですか?」と最初の問いかけをしてください。` }]
      : newDialogue.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const aiMsg = await callAI(system, messages, 500);
    newDialogue.push({ role: "assistant", content: aiMsg });

    await supabase.from("monthly_reflections")
      .update({ next_month_dialogue: newDialogue, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    return NextResponse.json({ aiMessage: aiMsg, dialogue: newDialogue });
  }

  // === Action 4: get ===
  if (action === "get") {
    return NextResponse.json({ reflection: existing });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
