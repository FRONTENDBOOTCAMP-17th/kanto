import { defineConfig, devices } from "@playwright/test";

// 리뷰 전용 E2E 설정. 개발 서버는 별도로 띄워 둔 상태(기본 포트 3101)를 사용한다.
const PORT = process.env.PORT ?? "3101";
const BASE = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "report", open: "never" }]],
  use: {
    baseURL: BASE,
    headless: true,
    viewport: { width: 1280, height: 900 },
    screenshot: "only-on-failure",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `PORT=${PORT} npm run dev`,
    url: BASE,
    cwd: "../../",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
