import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    dedupe: [
      "@angular/core",
      "@angular/common",
      "@angular/compiler",
      "@openuidev/lang-core",
      "rxjs",
      "zod",
    ],
    alias: {
      "@openuidev/angular-lang": fileURLToPath(
        new URL("../../dist/angular-lang/fesm2022/openuidev-angular-lang.mjs", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
  },
});
