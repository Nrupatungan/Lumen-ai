import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "ingestion-router/handler": "src/ingestion-router/handler.ts",
    "usage-sync/handler": "src/usage-sync/handler.ts",
  },
  format: ["esm"],
  target: "es2022",
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
});
