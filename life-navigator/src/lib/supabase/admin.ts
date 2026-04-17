import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service role Supabase client — bypasses RLS.
 * Use ONLY in server-only routes that don't have a user session
 * (cron jobs, watch API with its own auth key).
 * Never expose to the client.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/** 時計API等で使うオーナーユーザーID（env経由） */
export const OWNER_USER_ID = process.env.OWNER_USER_ID || "";
