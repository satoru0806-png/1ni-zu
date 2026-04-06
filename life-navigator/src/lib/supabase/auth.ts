import { createClient } from "./server";
import { NextResponse } from "next/server";

/**
 * APIルートでユーザーを取得。未認証なら401を返す。
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, error: null };
}
