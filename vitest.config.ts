import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      // `all` defaults to true, so every included source file is reported even
      // when it has no tests — keeping the coverage picture honest.
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Test files and type-only declarations carry no runtime behaviour.
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        // React Server Component pages and layouts are exercised through
        // integration/runtime rather than unit tests.
        "src/app/**/*.tsx",
        // Prisma client singleton is thin infrastructure wiring.
        "src/lib/db.ts",
        // Thin wrapper around external OCR binaries (Tesseract/poppler) that only
        // exist in the Docker runtime image, not the CI runner, so its
        // happy-path OCR cannot be exercised in unit tests.
        "src/lib/document-read.ts"
      ],
      reporter: ["text", "html", "lcov"],
      // Ratcheting floor: keep these at or just below current coverage so the
      // suite can only get healthier over time. Raise them as coverage grows.
      thresholds: {
        statements: 85,
        branches: 71,
        functions: 82,
        lines: 86
      }
    }
  },
  resolve: {
    alias: {
      "@": srcPath,
      // The real "server-only" guard throws outside an RSC bundler; alias it to
      // a no-op so server modules can be unit tested directly.
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url))
    }
  }
});
