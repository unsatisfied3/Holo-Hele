import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "line",
  use: {
    baseURL: "http://localhost:1420",
    ...devices["Desktop Chrome"],
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 21.3047, longitude: -157.8567 },
    permissions: ["geolocation"],
  },
  webServer: {
    command: "bun run dev",
    url: "http://localhost:1420",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
