import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { "cli/index": "src/cli/index.ts" },
    format: ["esm"],
    outDir: "dist",
    clean: true,
    external: ["chalk", "commander", "fs-extra", "zod", "ora"],
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    outDir: "dist",
    dts: true,
    external: ["chalk", "commander", "fs-extra", "zod", "ora"],
  },
]);
