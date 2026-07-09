import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Phase 10 — "Share your wait" viral surfaces (slice G).
 *
 * Requires the local Supabase stack (`npm run db:start`).
 * Requires the /w public share page to be built (parallel agent).
 *
 * Test 1 — Core: places a real (fake) order, lands on the tracker, clicks
 * "Share your wait", verifies the clipboard copy + the public /w page + OG image.
 *
 * Test 2 — Guards: bad /w params → 404; bad /api/og params → 400.
 */

// Reusable helper: run the anonymous order-placement flow and land on /track/:id.
// Pattern mirrors anonymous-loop.spec.ts and leaderboard.spec.ts.
async function placeOrderAndGoToTracker(page: Page) {
  await page.goto("/browse");
  await page.locator('a[href^="/product/"]').first().click();
  await page.getByRole("button", { name: /Add to cart/ }).click();
  await page.getByRole("button", { name: /^Cart, 1 item/ }).click();
  await page
    .getByRole("dialog", { name: "Your cart" })
    .getByRole("button", { name: /Checkout/ })
    .click();
  await page.getByPlaceholder("A1A 1A1").fill("M5V 2T6");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Place order/ }).click();
  await page
    .getByRole("button", { name: "View tracking" })
    .click({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/track\/[0-9a-f-]{36}/);
}

test("share button copies link and public card renders", async ({
  browser,
}) => {
  // ── Grant clipboard permissions (Chromium) ────────────────────────────────
  const context = await browser.newContext();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const page = await context.newPage();

  // ── Place a real order and land on the tracker ────────────────────────────
  await placeOrderAndGoToTracker(page);

  // ── Wait for the ShareWait card to appear (it's client-rendered on mount) ─
  // Use a role/text locator scoped to the visible share button.
  const shareButton = page.getByRole("button", { name: /Share your wait/i });
  await expect(shareButton).toBeVisible();

  // ── Click share ────────────────────────────────────────────────────────────
  await shareButton.click();

  // ── Confirm the copied state appears ──────────────────────────────────────
  // aria-live region updates — text appears inside the card.
  await expect(
    page.getByText(/Link copied\. As predicted\./i),
  ).toBeVisible();

  // ── Read the URL from clipboard and validate it ───────────────────────────
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/\/w\?v=order&c=NC-/);

  // ── Derive the matching OG URL ────────────────────────────────────────────
  // /w?... → /api/og?...  (same query string, different path prefix)
  const wUrl = new URL(copied);
  const ogUrl = `${wUrl.origin}/api/og${wUrl.search}`;

  // ── OG endpoint returns a PNG ─────────────────────────────────────────────
  const ogRes = await page.request.get(ogUrl);
  expect(ogRes.status()).toBe(200);
  expect(ogRes.headers()["content-type"]).toMatch(/image\/png/);

  // ── Open the share URL in a new (logged-out stranger) context ────────────
  // NOTE: If /w is not yet built by the parallel agent, the next assertions
  // will fail and that will be reported. The copy-button assertions above are
  // independent and should still pass.
  const strangerCtx = await browser.newContext();
  const strangerPage = await strangerCtx.newPage();
  await strangerPage.goto(copied);

  // Expect the public share card — not a 404.
  await expect(strangerPage).not.toHaveURL(/\/404/);

  // The /w page renders "It never comes." heading and the NEVER ARRIVED stamp.
  await expect(
    strangerPage.getByText(/It never comes\./i),
  ).toBeVisible();
  await expect(
    strangerPage.getByText(/NEVER ARRIVED/i),
  ).toBeVisible();

  await strangerCtx.close();
  await context.close();
});

test("share guard — bad params return expected error status", async ({
  request,
}) => {
  // /w?v=order&c=bogus should 404 (the /w page treats malformed params as not found).
  // We test via the OG endpoint which is deterministic (no HTML rendering needed).
  // /api/og with only v=order (missing c and t) → 400
  const res400 = await request.get("/api/og?v=order");
  expect(res400.status()).toBe(400);

  // /api/og with bogus code → 400 (CODE_RE fails)
  const resBogus = await request.get("/api/og?v=order&c=bogus&t=1700000000000");
  expect(resBogus.status()).toBe(400);
});
