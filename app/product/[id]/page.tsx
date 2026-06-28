import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import {
  getProductDetail,
  getReviewsByProduct,
  type Review,
} from "@/lib/supabase/queries";
import { parseOptions } from "@/lib/catalog/options";
import { formatCents } from "@/lib/utils/money";
import { SiteHeader } from "@/components/catalog/SiteHeader";
import { ProductIcon } from "@/components/catalog/ProductIcon";
import { AddToCart } from "@/components/catalog/AddToCart";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";

export const revalidate = 300;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Carbon-texture tile background (large), matching the catalog placeholder.
const TILE_BG = [
  "radial-gradient(110% 80% at 80% 14%, rgba(200,70,58,0.18), rgba(200,70,58,0) 58%)",
  "repeating-linear-gradient(0deg, transparent 0 28px, rgba(255,255,255,0.035) 28px 29px)",
  "repeating-linear-gradient(90deg, transparent 0 28px, rgba(255,255,255,0.035) 28px 29px)",
  "var(--carbon-800)",
].join(", ");

function initials(author: string): string {
  const words = author.trim().split(/\s+/);
  const raw =
    words.length > 1
      ? words[0][0] + words[1][0]
      : author.replace(/[^a-z0-9]/gi, "").slice(0, 2);
  return raw.toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="tracking-[2px]" aria-label={`${filled} out of 5`}>
      <span className="text-accent">{"⋆".repeat(filled)}</span>
      <span className="text-fg-faint">{"⋆".repeat(5 - filled)}</span>
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const when = new Date(review.created_at).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <Card padded>
      <div className="flex items-center gap-3">
        <span
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-pill border border-hairline bg-sunken font-mono font-bold text-xs text-fg-strong"
          aria-hidden="true"
        >
          {initials(review.author)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-base text-fg-strong">
            {review.author}
          </div>
          <div className="font-mono text-2xs text-fg-faint">{when}</div>
        </div>
        <Stars rating={review.rating} />
      </div>
      {review.body && (
        <p className="mt-3 text-sm leading-normal text-fg">{review.body}</p>
      )}
    </Card>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Bad ids would make the uuid `.eq` throw a 500 — 404 them instead.
  if (!UUID_RE.test(id)) notFound();

  const supabase = createPublicClient();
  const product = await getProductDetail(supabase, id);
  if (!product) notFound();

  const reviews = await getReviewsByProduct(supabase, id);
  const options = parseOptions(product.options);
  const slug = product.category?.slug ?? null;
  const reviewCount = reviews.length;

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-[1100px]">
        {/* ── Breadcrumb ────────────────────────────────────────────────── */}
        <div className="px-12 pb-1.5 pt-6 font-mono text-xs text-fg-muted">
          Browse <span className="text-fg-faint">/</span>{" "}
          {product.category?.name ?? "Catalog"}{" "}
          <span className="text-fg-faint">/</span>{" "}
          {product.vendor?.name ?? "Unknown Vendor"}
        </div>

        {/* ── Gallery + info ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 items-start gap-12 px-12 pb-11 pt-3.5 lg:grid-cols-[1.05fr_1fr]">
          {/* Gallery */}
          <div>
            <div
              className="relative flex h-[480px] items-center justify-center overflow-hidden rounded border border-hairline"
              style={{ background: TILE_BG }}
              aria-hidden="true"
            >
              <ProductIcon
                categorySlug={slug}
                className="[&>svg]:h-[132px] [&>svg]:w-[132px]"
              />
              <span className="absolute left-3.5 top-3.5 rounded-sm bg-sunken px-2.5 py-1.5 font-mono text-2xs uppercase tracking-label text-fg-muted">
                Low toner
              </span>
              <span className="absolute bottom-3 left-4 font-mono text-2xs text-fg-faint">
                NC-IMG-{id.slice(0, 4).toUpperCase()}
              </span>
              <span className="absolute bottom-3 right-4 font-mono text-2xs text-fg-faint">
                IMG 1 / 4
              </span>
            </div>

            <div className="mt-3.5 flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={
                    "flex h-[78px] flex-1 items-center justify-center rounded border " +
                    (i === 0 ? "border-accent" : "border-hairline")
                  }
                  style={{ background: TILE_BG }}
                  aria-hidden="true"
                >
                  <ProductIcon
                    categorySlug={slug}
                    className="[&>svg]:h-[38px] [&>svg]:w-[38px]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <Eyebrow>
              {product.vendor?.name ?? "Unknown Vendor"}
              {product.vendor ? ` · ⋆ ${product.vendor.rating.toFixed(1)}` : ""}
              {product.category ? ` · ${product.category.name}` : ""}
            </Eyebrow>

            <h1 className="mt-3 font-display font-extrabold text-4xl tracking-tight text-fg-strong">
              {product.name}
            </h1>

            <div className="mt-2.5 flex items-center gap-2.5 font-mono text-xs text-fg-muted">
              <Stars rating={product.rating} />
              <span>
                {reviewCount > 0
                  ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""} · 0 delivered`
                  : "No reviews yet · 0 delivered"}
              </span>
            </div>

            <div className="mt-[18px] flex items-baseline gap-3">
              <span className="font-mono text-md text-fg-faint line-through">
                {formatCents(product.price_cents, product.currency)}
              </span>
              <span className="font-mono font-bold text-2xl text-fg-strong">
                $0.00
              </span>
              <span className="font-mono text-xs text-fg-faint">CAD</span>
            </div>

            <p className="mt-4 max-w-[52ch] text-base leading-normal text-fg-muted">
              {product.description ??
                "A quiet promise that will spend the rest of its life two streets from your door."}
            </p>

            <div className="perforation mt-6" aria-hidden="true" />

            <AddToCart
              productId={product.id}
              name={product.name}
              priceCents={product.price_cents}
              note={product.vendor?.name ?? undefined}
              options={options}
            />
          </div>
        </div>

        {/* ── Reviews ───────────────────────────────────────────────────── */}
        <div className="px-12 pb-12 pt-1.5">
          <div className="perforation" aria-hidden="true" />
          <div className="mb-[18px] mt-7 flex items-baseline justify-between gap-4">
            <h2 className="font-display font-extrabold text-xl tracking-tight text-fg-strong">
              What people are still waiting for
            </h2>
            <span className="font-mono text-2xs text-fg-faint">
              {reviewCount} REVIEW{reviewCount !== 1 ? "S" : ""} &middot; 0 DELIVERED
            </span>
          </div>

          {reviewCount > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <Card padded>
              <p className="text-sm text-fg-muted">
                No reviews yet. Everyone&rsquo;s still waiting.
              </p>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
