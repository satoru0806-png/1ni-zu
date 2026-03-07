import { prisma } from "@/lib/prisma";
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

  const hour = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: false });
  const h = parseInt(hour, 10);

  let title: string;
  let body: string;
  let url: string;

  if (h >= 6 && h < 10) {
    title = "おはよう！";
    body = "今日のMITを設定しよう";
    url = "/today";
  } else if (h >= 20 && h < 23) {
    title = "おつかれさま！";
    body = "今日の振り返りをしよう";
    url = "/review";
  } else {
    return NextResponse.json({ skipped: true, hour: h });
  }

  const subs = await prisma.pushSubscription.findMany();
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url })
        )
        .catch(async (err: { statusCode?: number }) => {
          if (err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          throw err;
        })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, total: subs.length });
}
