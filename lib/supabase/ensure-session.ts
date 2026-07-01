"use client";

/**
 * Ensures an active Supabase session exists before an order is placed.
 * Creates an anonymous session when none is found. No-ops if already signed in.
 * Anonymous sign-ins are enabled in the project and the DB trigger auto-creates
 * the corresponding `profiles` row.
 */

import { createClient } from "@/lib/supabase/client";

/**
 * Guarantee a session (anonymous or otherwise) for the current browser context.
 * Throws with a deadpan message if anonymous sign-in fails.
 */
export async function ensureAnonSession(): Promise<void> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return;

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error("Couldn't start a session.");
  }
}
