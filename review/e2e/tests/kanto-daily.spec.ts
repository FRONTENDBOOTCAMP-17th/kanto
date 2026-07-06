import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";

// 리뷰 전용 일일 E2E (2026-07-06, 19차) — 발표(7/8) 이틀 전, UI 개편 회귀 확인 중심
// 사용자 여정: 메인 → 목록(중고/렌탈/구인, 필터 UI 개편) → 상세 → 로그인/회원가입(개편) → 프로필
// 이월 확인: anon users PII / 삭제글 상세 노출 / 비로그인 목록 500

const EMAIL = "kanto-review@example.com";
const PASSWORD = "Review!2026";
const DATE = "2026-07-06";
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

test("K1 비로그인 메인/목록 200 (500 회귀 확인)", async ({ page }) => {
  for (const path of ["/main", "/usedgoods", "/rental", "/job"]) {
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `${path} status`).toBeLessThan(500);
  }
  await page.goto("/usedgoods", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${IMG}/kanto-01-usedgoods-list.png`, fullPage: false });
});

test("K2 목록 필터 UI 개편 (FilterBar/FilterModal 렌더)", async ({ page }) => {
  await page.goto("/rental", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${IMG}/kanto-02-rental-list.png`, fullPage: false });
  await page.goto("/job", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${IMG}/kanto-03-job-list.png`, fullPage: false });
});

test("K3 삭제된 중고글 상세 — 비로그인 (soft-delete 노출/크래시)", async ({ page }) => {
  const res = await page.goto("/usedgoods/422", { waitUntil: "domcontentloaded" });
  const status = res?.status();
  await page.screenshot({ path: `${IMG}/kanto-04-deleted-422.png`, fullPage: false });
  console.log("deleted /usedgoods/422 status =", status);
});

test("K4 로그인/회원가입 페이지 개편 렌더", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${IMG}/kanto-05-login.png`, fullPage: false });
  const su = await page.goto("/signup", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${IMG}/kanto-06-signup.png`, fullPage: false });
  console.log("/signup status =", su?.status());
});

test("K5 로그인 후 메인/프로필", async ({ page }) => {
  await login(page);
  const res = await page.goto("/main", { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBeLessThan(500);
  await page.screenshot({ path: `${IMG}/kanto-07-loggedin-main.png` });
  const pr = await page.goto("/profile", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${IMG}/kanto-08-profile.png` });
  console.log("/profile status =", pr?.status());
});
