import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const dreams = await prisma.dream.findMany({
    orderBy: { id: "asc" },
    take: 3,
  });
  return NextResponse.json(dreams);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const count = await prisma.dream.count();
  if (count >= 3) {
    return NextResponse.json({ error: "Max 3 dreams" }, { status: 400 });
  }
  const dream = await prisma.dream.create({
    data: { text: body.text },
  });
  return NextResponse.json(dream);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  await prisma.dream.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
