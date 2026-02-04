import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "ingestion-router/handler": "src/ingestion-router/handler.ts",
    "usage-sync/handler": "src/usage-sync/handler.ts",
  },
  format: ["cjs"], // 👈 IMPORTANT
  target: "es2022",
  platform: "node",
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  noExternal: [/^@repo\//],
});
