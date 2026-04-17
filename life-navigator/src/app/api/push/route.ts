import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const supabase = await createClient();
  const { endpoint, keys } = await req.json();

  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("push_subscriptions")
      .update({ p256dh: keys.p256dh, auth: keys.auth })
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);
  } else {
    await supabase
      .from("push_subscriptions")
      .insert({ endpoint, p256dh: keys.p256dh, auth: keys.auth, user_id: user.id });
  }
  return NextResponse.json({ ok: true });
}
