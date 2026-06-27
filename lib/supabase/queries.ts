import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type Product = Tables<"products">;
export type Vendor = Tables<"vendors">;

type Client = SupabaseClient<Database>;

/**
 * Typed sample queries against the public catalog. Reused by the browse/product
 * phases. Pass a client from `lib/supabase/{client,server}`.
 */
export async function getProducts(
  supabase: Client,
  limit = 30,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getProductById(
  supabase: Client,
  id: string,
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
