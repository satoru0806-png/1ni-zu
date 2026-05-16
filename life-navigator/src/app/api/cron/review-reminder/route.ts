import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  // JST 現在時刻
  const now = new Date();
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const dayOfWeek = jstNow.getDay(); // 0=日曜
  const hour = jstNow.getHours();
  const dayOfMonth = jstNow.getDate();

  const supabase = createAdminClient();
  let weeklySent = 0;
  let monthlySent = 0;

  // === 週次リマインド: 該当曜日・時刻のユーザーを抽出 ===
  const { data: weeklyTargets } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("weekly_review_remind", true)
    .eq("weekly_review_day", dayOfWeek)
    .eq("weekly_review_hour", hour);

  if (weeklyTargets && weeklyTargets.length > 0) {
    const userIds = weeklyTargets.map((p) => p.user_id);
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (subs && subs.length > 0) {
      const results = await Promise.allSettled(
        subs.map((sub) =>
          webpush
            .sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: "🌟 1週間の振り返りの時間です",
                body: "今週を振り返って、来週の一歩を一緒に決めましょう",
                url: "/review/weekly",
              })
            )
            .catch(async (err: { statusCode?: number }) => {
              if (err.statusCode === 410) {
                await supabase.from("push_subscriptions").delete().eq("id", sub.id);
              }
              throw err;
            })
        )
      );
      weeklySent = results.filter((r) => r.status === "fulfilled").length;
    }
  }

  // === 月次リマインド: 毎月 1 日 9 時に固定 ===
  if (dayOfMonth === 1 && hour === 9) {
    const { data: monthlyTargets } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("monthly_review_remind", true);

    if (monthlyTargets && monthlyTargets.length > 0) {
      const userIds = monthlyTargets.map((p) => p.user_id);
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

      if (subs && subs.length > 0) {
        const results = await Promise.allSettled(
          subs.map((sub) =>
            webpush
              .sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                JSON.stringify({
                  title: "🌙 1ヶ月の振り返りの時間です",
                  body: "先月を振り返って、今月のテーマを決めましょう",
                  url: "/review/monthly",
                })
              )
              .catch(async (err: { statusCode?: number }) => {
                if (err.statusCode === 410) {
                  await supabase.from("push_subscriptions").delete().eq("id", sub.id);
                }
                throw err;
              })
          )
        );
        monthlySent = results.filter((r) => r.status === "fulfilled").length;
      }
    }
  }

  return NextResponse.json({
    dayOfWeek,
    hour,
    dayOfMonth,
    weeklySent,
    monthlySent,
  });
}
