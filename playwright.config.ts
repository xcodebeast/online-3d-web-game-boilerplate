import { defineConfig } from "@playwright/test";

// biome-ignore lint/style/noDefaultExport: Playwright loads its configuration from the default export.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    viewport: { width: 1280, height: 720 },
    // biome-ignore lint/style/useNamingConvention: Playwright requires this option name.
    baseURL: "http://127.0.0.1:8080",
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  webServer: [
    {
      command: "bun run start",
      url: "http://localhost:3000/__healthcheck",
      reuseExistingServer: false,
    },
    {
      command:
        "bun --bun vite preview --config apps/client/vite.config.ts --host 127.0.0.1 --port 8080",
      url: "http://127.0.0.1:8080",
      reuseExistingServer: false,
    },
  ],
});
