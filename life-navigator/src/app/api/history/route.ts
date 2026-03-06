import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getLast7Days } from "@/lib/utils";

export async function GET() {
  const days = getLast7Days();
  const logs = await prisma.dayLog.findMany({
    where: { date: { in: days } },
    orderBy: { date: "desc" },
  });

  const history = days.map((date) => {
    const log = logs.find((l) => l.date === date);
    return log || { date, empty: true };
  });

  return NextResponse.json(history);
}
