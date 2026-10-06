import { defineConfig } from "vitest/config";

// separate from vite.config so tests don't boot the Workers runtime
export default defineConfig({
  test: {
    environment: "happy-dom",
    clearMocks: true,
    include: [
      "utils/**/*.test.{js,ts,tsx}",
      "worker/**/*.test.ts",
      "routes/**/*.test.tsx",
    ],
  },
});
