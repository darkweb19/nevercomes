import { expect, test } from "@playwright/test";

/**
 * Phase 9 — the /me ledger and the claim-your-history upgrade.
 *
 * Requires the local Supabase stack (`npm run db:start`): the loop creates a
 * real (fake) order via anon sign-in + create_order, and the claim flow hits
 * real GoTrue (locally, email confirmations are off, so a claim upgrades the
 * session instantly — the strip stamps CLAIMED).
 */

test("fresh visitor sees the empty ledger — no sign-in wall", async ({ page }) => {
  await page.goto("/me");

  await expect(page.getByRole("heading", { level: 1, name: "/me" })).toBeVisible();
  await expect(page.getByText("You haven’t ordered anything yet.")).toBeVisible();
  await expect(page.getByText("Which, historically, checks out.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a fake order" })).toBeVisible();

  // Anonymous-first: nothing on this page asks the visitor to sign in.
  await expect(page.getByText(/sign in/i)).toHaveCount(0);
});

test("after an order, /me shows the ledger and the claim flow upgrades the session", async ({
  page,
}) => {
  // ── Place one order through the real UI (mints the anon session) ─────────
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
  const orderId = page.url().match(/\/track\/([0-9a-f-]{36})/)![1];

  // ── The header account chip reaches /me ─────────────────────────────────
  await page.getByRole("link", { name: "Your account" }).click();
  await expect(page).toHaveURL(/\/me$/);

  // ── Stats: 1 placed, 0 delivered (the product), money saved > $0 struck ──
  await expect(page.getByText("Money saved").first()).toBeVisible();
  await expect(page.getByText("Orders placed").first()).toBeVisible();
  await expect(page.getByText("Orders delivered").first()).toBeVisible();
  await expect(
    page.getByText("days in a row of buying nothing").first(),
  ).toBeVisible();
  // The subline pins the resolution: whatever was "charged" → $0.00 CAD.
  await expect(page.getByText("$0.00 CAD").first()).toBeVisible();

  // ── History: the fresh order, IN TRANSIT, linking back to its tracker ────
  const row = page.locator(`a[href="/track/${orderId}"]`);
  await expect(row).toBeVisible();
  // The row renders mobile + desktop layouts; assert on the visible instance.
  await expect(row.locator("text=IN TRANSIT >> visible=true")).toBeVisible();
  await expect(row.locator("text=JUST NOW >> visible=true")).toBeVisible();

  // Milestone baseline appears after the first order.
  await expect(page.getByText("Zero deliveries, zero regrets")).toBeVisible();

  // ── Claim the history (anonymous → permanent) ────────────────────────────
  await page.getByRole("button", { name: "Claim your history" }).click();
  const email = `e2e-claim-${Date.now()}@nevercomes.test`;
  const emailInput = page.getByLabel("Email");
  await expect(emailInput).toBeFocused();
  await emailInput.fill(email);
  await page.getByRole("button", { name: "Save my history" }).click();

  // Locally confirmations are off → instant upgrade: the strip stamps
  // CLAIMED and the claim card leaves (nothing left to claim).
  await expect(page.getByText("CLAIMED")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("just now", { exact: true })).toBeVisible();
  await expect(page.getByText("Don’t lose the receipt.")).toHaveCount(0);

  // The ledger survives the upgrade — same order, same history.
  await page.reload();
  await expect(page.locator(`a[href="/track/${orderId}"]`)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});
