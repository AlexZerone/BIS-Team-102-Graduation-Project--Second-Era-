import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts"], // e2e/*.spec.ts are Playwright's
    env: { PGLITE_DIR: "memory://", DATABASE_URL: "" },
  },
});
