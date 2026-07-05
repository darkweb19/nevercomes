import { expect, test } from "@playwright/test";

/**
 * Phase 10 — the public leaderboard.
 *
 * Requires the local Supabase stack (`npm run db:start`). The board is public
 * and anonymous-first: a fresh visitor gets the page with no gate; after one
 * real (fake) order through the UI, the visitor's YOU row appears with a rank.
 */

test("fresh visitor gets the leaderboard — no gate, empty or populated", async ({
  page,
}) => {
  await page.goto("/leaderboard");

  await expect(
    page.getByRole("heading", { level: 1, name: "Ranked by how little arrived." }),
  ).toBeVisible();

  // Anonymous-first: nothing asks the visitor to sign in.
  await expect(page.getByText(/sign in/i)).toHaveCount(0);

  // Either somebody is on the board (the global strip renders) or the empty
  // state invites the first non-delivery. Both are valid worlds for this test.
  const emptyLine = page.getByText(
    "Nobody has failed to receive anything here yet.",
  );
  const strip = page.getByText(/NEVER DELIVERED/);
  await expect(emptyLine.or(strip).first()).toBeVisible();
});

test("after an order, the visitor holds a rank on the board", async ({
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

  // ── The header link reaches /leaderboard ─────────────────────────────────
  await page.getByRole("link", { name: "Leaderboard" }).click();
  await expect(page).toHaveURL(/\/leaderboard$/);

  // ── The caller's own row is pinned with a rank label ─────────────────────
  const youRow = page.getByText("YOU", { exact: true });
  await expect(youRow).toBeVisible();

  // The board is no longer empty and the anchor stat holds the product's
  // one promise: nothing has ever been delivered.
  await expect(
    page.getByText("Nobody has failed to receive anything here yet."),
  ).toHaveCount(0);
  await expect(page.getByText("0 DELIVERED, EVER")).toBeVisible();
  await expect(page.getByText(/NEVER DELIVERED/)).toBeVisible();
});
