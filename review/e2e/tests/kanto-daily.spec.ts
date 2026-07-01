import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";

// 리뷰 전용 일일 E2E (2026-07-01, 16차) — 15차 [필수] 회귀 확인 중심
// 사용자 여정: 메인 → 목록(중고/렌탈/구인) → 상세 → 로그인 → 프로필
// 회귀 확인: 비로그인 목록 500 / 삭제글 상세 노출 / 프로필

const EMAIL = "kanto-review@example.com";
const PASSWORD = "Review!2026";
const DATE = "2026-07-01";
const IMG = `../images/${DATE}`;

test.beforeAll(() => {
  fs.mkdirSync(IMG, { recursive: true });
});

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const emailBtn = page.getByText(/이메일로 로그인|이메일/).first();
  try { await emailBtn.click({ timeout: 6000 }); } catch {}
  await page.waitForSelector('input[type="email"]', { timeout: 12000 });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
}

test("K1 비로그인 메인/목록 200 (15차 500 회귀 확인)", async ({ page }) => {
  for (const path of ["/main", "/usedgoods", "/rental", "/job"]) {
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `${path} status`).toBeLessThan(500);
  }
  await page.screenshot({ path: `${IMG}/kanto-lists.png`, fullPage: false });
});

test("K2 삭제된 중고글 상세 — 비로그인 (soft-delete 노출/크래시)", async ({ page }) => {
  const res = await page.goto("/usedgoods/422", { waitUntil: "domcontentloaded" });
  const status = res?.status();
  await page.screenshot({ path: `${IMG}/kanto-deleted-422.png`, fullPage: false });
  console.log("deleted /usedgoods/422 status =", status);
});

test("K3 로그인 후 메인/프로필", async ({ page }) => {
  await login(page);
  const res = await page.goto("/main", { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBeLessThan(500);
  await page.screenshot({ path: `${IMG}/kanto-loggedin-main.png` });
  const pr = await page.goto("/profile", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${IMG}/kanto-profile.png` });
  console.log("/profile status =", pr?.status());
});
