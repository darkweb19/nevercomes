import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cookieless anon client for PUBLIC, user-independent reads (the catalog).
 *
 * The cookie-based server client (`./server`) calls `cookies()`, which opts a
 * route into dynamic rendering. For public-read data (vendors/categories/
 * products/reviews) we don't need the user's session, so this cookieless client
 * lets pages stay statically generated + ISR-revalidated. Never use it for
 * user-scoped/owner data — that must go through the cookie client so RLS applies.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
