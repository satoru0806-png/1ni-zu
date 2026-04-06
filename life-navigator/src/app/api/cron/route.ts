import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getTodayTheme } from "@/lib/daily-themes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    "mailto:satoru0806@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const hour = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: false });
  const h = parseInt(hour, 10);
  const theme = getTodayTheme();

  let title: string;
  let body: string;
  let url: string;

  if (h >= 6 && h < 10) {
    title = `${theme.emoji} おはよう！今日のテーマ: ${theme.title}`;
    body = `${theme.prompt}\n夢を確認して、今日やることを決めよう！`;
    url = "/today";
  } else if (h >= 11 && h < 14) {
    title = "🌤️ 進捗どうかな？";
    body = `今日のテーマ「${theme.title}」を意識して、午後も頑張ろう！`;
    url = "/today";
  } else if (h >= 20 && h < 23) {
    title = "🌙 おつかれさま！";
    body = "今日の振り返りと明日の予定を立てよう";
    url = "/review";
  } else {
    return NextResponse.json({ skipped: true, hour: h });
  }

  const supabase = await createClient();
  const { data: subs } = await supabase.from("push_subscriptions").select("*");

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, total: 0 });
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url })
        )
        .catch(async (err: { statusCode?: number }) => {
          if (err.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          throw err;
        })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, total: subs.length });
}
