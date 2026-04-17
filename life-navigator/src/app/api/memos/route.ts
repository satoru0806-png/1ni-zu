import { createAdminClient, OWNER_USER_ID } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// 時計からメモを保存（認証不要、APIキーで保護 / service_roleでRLSバイパス）
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== process.env.WATCH_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, date } = await req.json();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (!OWNER_USER_ID) return NextResponse.json({ error: "OWNER_USER_ID not configured" }, { status: 500 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("memos")
    .insert({
      text,
      date: date || new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
      user_id: OWNER_USER_ID,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, memo: data });
}

// メモ一覧取得
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key !== process.env.WATCH_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!OWNER_USER_ID) return NextResponse.json({ error: "OWNER_USER_ID not configured" }, { status: 500 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("memos")
    .select("*")
    .eq("user_id", OWNER_USER_ID)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json(data ?? []);
}

// メモ削除（Keepに移動後）
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const id = searchParams.get("id");
  if (key !== process.env.WATCH_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!OWNER_USER_ID) return NextResponse.json({ error: "OWNER_USER_ID not configured" }, { status: 500 });

  const supabase = createAdminClient();
  await supabase.from("memos").delete().eq("id", Number(id)).eq("user_id", OWNER_USER_ID);
  return NextResponse.json({ ok: true });
}
