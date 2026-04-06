import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { endpoint, keys } = await req.json();

  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", endpoint)
    .single();

  if (existing) {
    await supabase
      .from("push_subscriptions")
      .update({ p256dh: keys.p256dh, auth: keys.auth })
      .eq("endpoint", endpoint);
  } else {
    await supabase
      .from("push_subscriptions")
      .insert({ endpoint, p256dh: keys.p256dh, auth: keys.auth });
  }
  return NextResponse.json({ ok: true });
}
