import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "lib/**/*.test.ts"],
    // Playwright specs live in tests/e2e and are run by `pnpm test:e2e`, not Vitest.
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
  },
});
