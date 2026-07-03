import { expect, test } from "@playwright/test";

/**
 * The full anonymous core loop — the product's one promise, end to end:
 * landing → browse → product → cart drawer → checkout → a tracker that
 * NEVER completes. No signup, no payment, $0.00 throughout.
 *
 * Requires the local Supabase stack (`npm run db:start`) — checkout creates a
 * real (fake) order via the anon sign-in + create_order RPC.
 */

test("anonymous loop ends on a tracker that never completes", async ({ page }) => {
  // ── Landing ──────────────────────────────────────────────────────────────
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /Order anything/ }),
  ).toBeVisible();

  // Hero CTA (scope to main — the header carries the same label).
  await page
    .getByRole("main")
    .getByRole("link", { name: "Start a fake order" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/browse/);

  // ── Browse → product ─────────────────────────────────────────────────────
  await page.locator('a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);

  // ── Add to cart → drawer → checkout ──────────────────────────────────────
  await page.getByRole("button", { name: /Add to cart/ }).click();
  await expect(page.getByRole("button", { name: "Added · It begins" })).toBeVisible();

  // Adding doesn't auto-open the drawer; the header cart button does.
  await page.getByRole("button", { name: /^Cart, 1 item/ }).click();
  const drawer = page.getByRole("dialog", { name: "Your cart" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: /Checkout/ }).click();
  await expect(page).toHaveURL(/\/checkout/);

  // ── Checkout: location → payment ($0.00) → place order ───────────────────
  await page.getByPlaceholder("A1A 1A1").fill("M5V 2T6");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Place order/ }).click();

  // Done step (order created against local Supabase) → tracking.
  await page
    .getByRole("button", { name: "View tracking" })
    .click({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/track\/[0-9a-f-]{36}/);

  // ── The tracker never completes ──────────────────────────────────────────
  // The Delivered row exists but is eternally dashed ("—"): no delivered
  // state, no arrival. This is the product; pin it.
  await expect(page.getByText("Delivered")).toBeVisible();
  await expect(page.getByText(/arrived at your door|delivered at/i)).toHaveCount(0);
});

test("landing anchors and reduced-motion degrade", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");

  // Reduced motion: the teaser courier is parked — no SMIL animation nodes.
  await expect(page.getByText("ORDER #NC-4471")).toBeVisible();
  await expect(page.locator("animateMotion")).toHaveCount(0);

  // Anchor nav reaches the design's sections.
  await page.getByRole("link", { name: /How it \(doesn/ }).first().click();
  await expect(page.locator("#how")).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: /How it \(doesn/ }),
  ).toBeVisible();

  await context.close();
});
