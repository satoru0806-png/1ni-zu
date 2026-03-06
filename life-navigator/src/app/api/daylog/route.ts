import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { todayString } from "@/lib/utils";
import { processMemo } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || todayString();
  let log = await prisma.dayLog.findUnique({ where: { date } });
  if (!log) {
    // Return default with previous scores carried over
    const prev = await prisma.dayLog.findFirst({
      where: { date: { lt: date } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({
      date,
      mit1: null, mit2: null, mit3: null,
      doneNote: null, gratitudeNote: null, tomorrowPlan: null,
      relationshipScore: prev?.relationshipScore ?? 50,
      moneyScore: prev?.moneyScore ?? 50,
      workScore: prev?.workScore ?? 50,
      healthScore: prev?.healthScore ?? 50,
      memoRaw: null, memoSummary: null, memoTasksJson: null,
    });
  }
  return NextResponse.json(log);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const date = body.date || todayString();

  // Process memo if provided
  let memoSummary = body.memoSummary ?? undefined;
  let memoTasksJson = body.memoTasksJson ?? undefined;
  if (body.memoRaw && !memoSummary) {
    const result = await processMemo(body.memoRaw);
    memoSummary = result.summary;
    memoTasksJson = JSON.stringify(result.tasks);
  }

  const data = {
    mit1: body.mit1 ?? undefined,
    mit2: body.mit2 ?? undefined,
    mit3: body.mit3 ?? undefined,
    doneNote: body.doneNote ?? undefined,
    gratitudeNote: body.gratitudeNote ?? undefined,
    tomorrowPlan: body.tomorrowPlan ?? undefined,
    relationshipScore: body.relationshipScore ?? undefined,
    moneyScore: body.moneyScore ?? undefined,
    workScore: body.workScore ?? undefined,
    healthScore: body.healthScore ?? undefined,
    memoRaw: body.memoRaw ?? undefined,
    memoSummary,
    memoTasksJson,
  };

  const log = await prisma.dayLog.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
  });
  return NextResponse.json(log);
}
