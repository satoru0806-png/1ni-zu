import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dreams")
    .select("*")
    .order("id", { ascending: true })
    .limit(3);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = await createClient();
  const body = await req.json();
  const { count } = await supabase.from("dreams").select("*", { count: "exact", head: true });
  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "Max 3 dreams" }, { status: 400 });
  }
  const { data, error } = await supabase.from("dreams").insert({ text: body.text }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  await supabase.from("dreams").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
