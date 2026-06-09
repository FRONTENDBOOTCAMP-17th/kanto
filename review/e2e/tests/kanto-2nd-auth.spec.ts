import { test, expect } from "@playwright/test";

// 2차 리뷰 — 로그인 후 새 화면(구인 글쓰기 폼) 캡처.
// 비밀번호는 커밋하지 않고 환경변수로 주입(review/e2e/test-account.md 참고).

const SHOT = "../images";
const TEST_EMAIL = process.env.REVIEW_TEST_EMAIL ?? "kanto-review@example.com";
const TEST_PASSWORD = process.env.REVIEW_TEST_PASSWORD ?? "";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await page.locator("#email").fill(TEST_EMAIL);
  await page.locator("#password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/", { timeout: 10_000 }).catch(() => {});
}

test("로그인 후 구인 글쓰기 폼 렌더링", async ({ page }) => {
  await login(page);
  await page.goto("/job/create");
  await expect(page.getByRole("heading", { name: "구인구직 글쓰기" })).toBeVisible({
    timeout: 8000,
  });
  await page.screenshot({ path: `${SHOT}/2nd-02-job-create.png`, fullPage: true });
});
