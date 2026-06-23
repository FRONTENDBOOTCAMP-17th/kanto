import { test } from "@playwright/test";
import fs from "node:fs";

// 리뷰 전용 일일 E2E (2026-06-23) — 채팅 흐름 집중
// 사용자 여정: 메인 진입 → 로그인 → 플로팅 채팅 위젯 열기(목록) → 채팅 열 때 네트워크 왕복 관찰
const EMAIL = "kanto-review@example.com";
const PASSWORD = "Review!2026";
const DATE = "2026-06-23";
const IMG = `../images/${DATE}`;

test.beforeAll(() => {
  fs.mkdirSync(IMG, { recursive: true });
});

test("사용자 여정: 메인→로그인→채팅 위젯", async ({ page }) => {
  // 1) 메인(비로그인)
  await page.goto("/main", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${IMG}/kanto-01-main.png`, fullPage: false });

  // 2) 로그인 — 소셜 버튼 화면에서 "이메일로 로그인"을 눌러 폼을 연다
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByText(/이메일로 로그인|이메일/).first().click({ timeout: 15000 }).catch(() => {});
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${IMG}/kanto-02-after-login.png`, fullPage: false });

  // 3) 채팅 위젯 열기 — 네트워크 요청 수 집계
  const chatReqs: string[] = [];
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/api/chat") || u.includes("/rest/v1/chats") || u.includes("/rest/v1/messages")) {
      chatReqs.push(`${r.method()} ${u.replace(/https?:\/\/[^/]+/, "")}`);
    }
  });

  const bubble = page.locator("button").filter({ hasText: /채팅|chat/i }).first();
  const fixedBtns = page.locator('.fixed button, [class*="fixed"] button');
  try {
    if (await bubble.count()) {
      await bubble.click({ timeout: 3000 });
    } else if (await fixedBtns.count()) {
      await fixedBtns.last().click({ timeout: 3000 });
    }
    await page.waitForTimeout(2500);
  } catch {
    // 위젯을 못 찾아도 캡처는 남긴다
  }
  await page.screenshot({ path: `${IMG}/kanto-03-chat-widget.png`, fullPage: false });

  console.log(`[채팅 위젯 열 때 채팅 관련 네트워크 요청 ${chatReqs.length}건]`);
  chatReqs.forEach((r) => console.log("  " + r));
});
