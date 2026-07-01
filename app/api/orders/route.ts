/**
 * POST /api/orders — create a new (fake, never-arriving) order.
 *
 * Request body:
 *   {
 *     postalCode: string;
 *     items: {
 *       productId: string | null;
 *       qty: number;
 *       priceCents: number;
 *       options: Record<string, string | string[]>;
 *     }[];
 *   }
 *
 * Responses:
 *   200  { orderId: string }
 *   400  { error: string }   — malformed JSON or invalid shape
 *   401  { error: string }   — no active session
 *   500  { error: string }   — RPC failure
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import {
  buildCreateOrderArgs,
  resolvePostalPrefix,
} from "@/lib/orders/payload";

type RpcArgs = Database["public"]["Functions"]["create_order"]["Args"];

/** Shape the client sends when placing an order. */
interface OrderRequest {
  postalCode: string;
  items: {
    productId: string | null;
    qty: number;
    priceCents: number;
    options: Record<string, string | string[]>;
  }[];
}

export async function POST(request: Request) {
  // 1. Parse JSON body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  // 2. Validate required fields.
  const b = body as Partial<OrderRequest>;
  if (
    typeof b?.postalCode !== "string" ||
    !b.postalCode ||
    !Array.isArray(b.items) ||
    b.items.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "postalCode (non-empty string) and items (non-empty array) are required.",
      },
      { status: 400 },
    );
  }

  const { postalCode, items } = b as OrderRequest;

  // 3. Require an active session — anonymous is fine; the RPC reads auth.uid().
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No session." }, { status: 401 });
  }

  // 4. Resolve region from the postal prefix — a miss is acceptable; never
  //    block the order on a geo lookup failure.
  const { data: regionRow } = await supabase
    .from("regions")
    .select("id, centroid_lat, centroid_lng")
    .eq("postal_prefix", resolvePostalPrefix(postalCode))
    .limit(1)
    .maybeSingle();

  const region = regionRow ?? null;

  // 5. Build the RPC arg bag via the pure payload helpers.
  const args = buildCreateOrderArgs({ postalCode, lines: items, region });

  // 6. Call create_order.
  //    The generated types mark dest/region as non-nullable, but the DB function
  //    accepts NULL on a geo miss. Cast to satisfy the type checker while
  //    preserving the null values that the function correctly handles.
  const rpcArgs: RpcArgs = {
    p_postal: args.p_postal,
    p_region_id: args.p_region_id as string,
    p_dest_lat: args.p_dest_lat as number,
    p_dest_lng: args.p_dest_lng as number,
    p_fake_total_cents: args.p_fake_total_cents,
    p_items: args.p_items as unknown as Json,
  };

  const { data: orderId, error } = await supabase.rpc("create_order", rpcArgs);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 7. Return the new order ID.
  return NextResponse.json({ orderId });
}
