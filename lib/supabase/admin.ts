import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client — BYPASSES RLS. Server-only (HARD RULE 6).
 *
 * The `server-only` import makes any client-bundle import a build error. Use
 * sparingly for trusted server work (e.g. append-only order writes in Phase 5).
 * The key must never be exposed as NEXT_PUBLIC_ and never reaches the browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
