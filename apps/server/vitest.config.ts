import { defineConfig } from "vitest/config";

export const baseConfig = defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "istanbul",
      enabled: true,
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});
