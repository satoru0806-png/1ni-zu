import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "ファイルサイズは 5MB 以内" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "画像ファイルのみアップロード可能" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createAdminClient();
    const { error: uploadErr } = await supabase.storage
      .from("mindmovie-images")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json({ error: `Upload error: ${uploadErr.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("mindmovie-images").getPublicUrl(filename);

    return NextResponse.json({ imageUrl: urlData.publicUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mindmovie/upload-image] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
