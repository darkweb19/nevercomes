import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import { sanitizeSearch, type CatalogSort } from "@/lib/catalog/filter";
import type { CatalogRegionScope } from "@/lib/catalog/region";

export type Product = Tables<"products">;
export type Vendor = Tables<"vendors">;
export type Category = Tables<"categories">;
export type Review = Tables<"reviews">;

/** A catalog row joined with just enough of its vendor + category for cards. */
export type CatalogProduct = Product & {
  vendor: Pick<Vendor, "name" | "kind"> | null;
  category: Pick<Category, "slug" | "name"> | null;
};

/** A product joined with its full vendor + category, for the detail page. */
export type ProductDetail = Product & {
  vendor: Vendor | null;
  category: Category | null;
};

export interface CatalogQuery {
  limit?: number;
  offset?: number;
  categoryId?: string | null;
  search?: string | null;
  sort?: CatalogSort;
  /**
   * Region scoping. Omit for the legacy region-blind query.
   *   { mode: "global" }            → global floor only (region_id IS NULL)
   *   { mode: "region", regionId }  → global floor + that region's local rows
   */
  regionScope?: CatalogRegionScope;
}

/** A region's vendor with its product count — powers the "nearby vendors" cards. */
export type RegionVendor = Pick<Vendor, "id" | "name" | "kind" | "rating"> & {
  itemCount: number;
};

export interface CatalogPage {
  items: CatalogProduct[];
  /** Total rows matching the filter (not just this page) — drives "X of Y". */
  count: number;
}

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

/** All categories, alphabetized — powers the browse category chips. */
export async function getCategories(supabase: Client): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * One page of the catalog with optional category / search / sort, joined with
 * vendor + category. Powers the ISR first page AND client infinite scroll.
 * Returns the page items plus the total matching count.
 */
export async function getCatalogPage(
  supabase: Client,
  query: CatalogQuery = {},
): Promise<CatalogPage> {
  const {
    limit = 12,
    offset = 0,
    categoryId = null,
    search = null,
    sort = "anticipation",
  } = query;

  let q = supabase
    .from("products")
    .select("*, vendor:vendors(name,kind), category:categories(slug,name)", {
      count: "exact",
    });

  if (categoryId) q = q.eq("category_id", categoryId);

  // Region scope: the global floor is always visible; a warm region layers its
  // local rows on top. Cold/unknown regions see the floor alone.
  const { regionScope } = query;
  if (regionScope?.mode === "global") {
    q = q.is("region_id", null);
  } else if (regionScope?.mode === "region") {
    q = q.or(`region_id.is.null,region_id.eq.${regionScope.regionId}`);
  }

  const term = sanitizeSearch(search);
  if (term) q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%`);

  switch (sort) {
    case "rating":
      q = q.order("rating", { ascending: false });
      break;
    case "price":
      q = q.order("price_cents", { ascending: true });
      break;
    default:
      // "anticipation" — oldest first, the longest-awaited.
      q = q.order("created_at", { ascending: true });
  }

  // Stable tiebreaker: seeded rows share a created_at, so without a unique
  // secondary key range-pagination could drop or duplicate rows across pages.
  const { data, error, count } = await q
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1)
    .returns<CatalogProduct[]>();

  if (error) throw error;
  return { items: data ?? [], count: count ?? 0 };
}

/** A single product with full vendor + category, for the detail page. */
export async function getProductDetail(
  supabase: Client,
  id: string,
): Promise<ProductDetail | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, vendor:vendors(*), category:categories(*)")
    .eq("id", id)
    .maybeSingle()
    .returns<ProductDetail>();

  if (error) throw error;
  return data;
}

/**
 * Look up a region by its FSA (postal prefix) to decide the browse phase.
 * A miss is expected (cold region) and returns null — never throws on absence.
 * Mirrors the resolution in app/api/orders/route.ts.
 */
export async function getRegionByPrefix(
  supabase: Client,
  prefix: string,
): Promise<Pick<Tables<"regions">, "id" | "catalog_generated"> | null> {
  const { data, error } = await supabase
    .from("regions")
    .select("id, catalog_generated")
    .eq("postal_prefix", prefix)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * The local vendors for a warm region, each with its product count. Powers the
 * "nearby vendors" cards once the region's catalog has been generated.
 */
export async function getRegionVendors(
  supabase: Client,
  regionId: string,
): Promise<RegionVendor[]> {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, kind, rating, products(count)")
    .eq("region_id", regionId)
    .order("rating", { ascending: false })
    .returns<
      (Pick<Vendor, "id" | "name" | "kind" | "rating"> & {
        products: { count: number }[];
      })[]
    >();

  if (error) throw error;
  return (data ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    kind: v.kind,
    rating: v.rating,
    itemCount: v.products[0]?.count ?? 0,
  }));
}

/** Fake reviews for a product, newest first. */
export async function getReviewsByProduct(
  supabase: Client,
  productId: string,
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
