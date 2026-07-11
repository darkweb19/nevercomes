import { createPublicClient } from "@/lib/supabase/public";
import { getCategories, getCatalogPage } from "@/lib/supabase/queries";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";

// ISR: revalidate the first-page data every 5 minutes.
export const revalidate = 300;

export const metadata = {
  title: "Browse — NeverComes",
  description:
    "Shop freely. Add freely. Track endlessly. It all ends in the same place.",
};

/**
 * /browse — Catalog page.
 *
 * Server Component: fetches the first page of products + all categories, then
 * hands them to the client CatalogBrowser which owns all interactive state
 * (search, filter, sort, infinite scroll).
 */
export default async function BrowsePage() {
  // Cookieless public client → no cookies() call → the route stays static + ISR.
  const supabase = createPublicClient();

  // Run in parallel — both are public-read, no auth needed.
  // The ISR shell is region-independent: it renders the GLOBAL floor so the
  // cached HTML is identical for every visitor. The client CatalogBrowser layers
  // the visitor's region-specific catalog on top.
  const [categories, { items: initialItems, count: initialCount }] =
    await Promise.all([
      getCategories(supabase),
      getCatalogPage(supabase, { limit: 12, regionScope: { mode: "global" } }),
    ]);

  return (
    <CatalogBrowser
      initialItems={initialItems}
      initialCount={initialCount}
      categories={categories}
    />
  );
}
