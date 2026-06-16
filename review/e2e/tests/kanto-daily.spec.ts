import { test, expect, Page } from "@playwright/test";

/**
 * Kanto 매일 E2E — 실제 사용자 흐름을 따라가며 메인부터 핵심 기능까지 확인하고
 * 그날 날짜 폴더에 화면을 남긴다. 시나리오는 review/e2e/scenarios.md 와 함께 관리한다.
 * 캡처: review/images/<오늘날짜>/  (아래 DAY 를 매일 갱신)
 *
 * 참고: 루트 "/"는 개발용 라우트 인덱스라, 실제 사용자 메인은 "/main".
 * 로그인은 api/login 이 Upstash Redis 환경변수를 요구해, 그 키가 없는 환경에선 검증 불가.
 * 비밀번호는 커밋하지 않고 환경변수로 주입: REVIEW_TEST_PASSWORD.
 */
const DAY = "2026-06-16";
const SHOT = `../images/${DAY}`;
const EMAIL = process.env.REVIEW_TEST_EMAIL ?? "kanto-review@example.com";
const PASSWORD = process.env.REVIEW_TEST_PASSWORD ?? "";

async function settle(page: Page, ms = 2000) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(ms);
}

test("K1 메인(/main) — 데스크톱", async ({ page }) => {
  const res = await page.goto("/main");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K1-main-desktop.png`, fullPage: true });
  expect(res?.status()).toBeLessThan(500);
});

test("K1 메인(/main) — 모바일 390", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/main");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K1-main-mobile.png`, fullPage: true });
});

test("K2 중고거래 목록 → 상세", async ({ page }) => {
  await page.goto("/usedgoods");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K2a-usedgoods-list.png`, fullPage: true });
  const firstLink = page.locator('a[href*="/usedgoods/"]').first();
  if (await firstLink.count()) {
    await firstLink.click();
    await settle(page);
    await page.screenshot({ path: `${SHOT}/kanto-K2b-usedgoods-detail.png`, fullPage: true });
  }
});

test("K3 방렌트 목록", async ({ page }) => {
  await page.goto("/rental");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K3-rental-list.png`, fullPage: true });
});

test("K4 구인구직 목록", async ({ page }) => {
  await page.goto("/job");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K4-job-list.png`, fullPage: true });
});

async function login(page: Page) {
  await page.goto("/login");
  await settle(page, 1000);
  await page.getByRole("button", { name: "이메일로 로그인" }).click().catch(() => {});
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await settle(page);
}

test("K5 로그인 폼 렌더(이메일)", async ({ page }) => {
  await page.goto("/login");
  await settle(page, 1000);
  await page.getByRole("button", { name: "이메일로 로그인" }).click().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOT}/kanto-K5-login-form.png`, fullPage: true });
});

// 로그인 1회 후 같은 세션에서 이어서 둘러보기(실제 사용자처럼). 각 화면 상태코드는 콘솔에 기록.
test("K6 로그인 후 둘러보기(메인·프로필·구인글쓰기·채팅위젯)", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);

  const main = await page.goto("/main");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K6a-after-login-main.png`, fullPage: true });
  console.log("after-login /main status:", main?.status());

  const prof = await page.goto("/profile");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K6b-profile.png`, fullPage: true });
  console.log("/profile status:", prof?.status());

  const job = await page.goto("/job/create");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K6c-job-create.png`, fullPage: true });
  console.log("/job/create status:", job?.status());

  await page.goto("/main");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K6d-chat-widget.png`, fullPage: true });
});
