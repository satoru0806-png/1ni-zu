import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

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

  const supabase = await createClient();

  // 過去7日分のログを取得
  const today = new Date();
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const { data: logs } = await supabase
    .from("day_logs")
    .select("*")
    .in("date", days);

  const recordedDays = (logs ?? []).filter(l => l.mit1 || l.done_note).length;
  const totalDays = 7;

  // MIT達成数
  let mitCount = 0;
  (logs ?? []).forEach(l => {
    if (l.mit1) mitCount++;
    if (l.mit2) mitCount++;
    if (l.mit3) mitCount++;
  });

  // 夢を取得
  const { data: dreams } = await supabase
    .from("dreams")
    .select("text")
    .limit(1);
  const dream = dreams?.[0]?.text || "夢に向かって";

  const title = `📊 今週の振り返り`;
  const body = `記録: ${recordedDays}/${totalDays}日\nMIT: ${mitCount}個設定\n✨ ${dream}\n来週もがんばろう！`;

  // 通知送信
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url: "/history" })
      ).catch(async (err: { statusCode?: number }) => {
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
