import { expect, test } from "@playwright/test";

// Trivial e2e gate — no server needed yet. The real anonymous-loop e2e arrives in Phase 8.
test("e2e harness runs", async () => {
  expect(true).toBe(true);
});
