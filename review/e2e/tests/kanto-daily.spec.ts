import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";

// 리뷰 전용 일일 E2E (2026-06-24) — Kanto GO! + KTS/KPPS + 어드민 GO! 모더레이션 + 관련매물 캐러셀
// 사용자 여정: 메인 → 카테고리 목록 → 상세(관련매물) → 로그인 → GO! 지도 → 마이페이지(망고지수)
// 어드민 여정: /admin 대시보드 → /admin/go → /admin/reports → /admin/users → /admin/chats → /admin/posts

const EMAIL = "kanto-review@example.com";
const PASSWORD = "Review!2026";
const DATE = "2026-06-24";
const IMG = `../images/${DATE}`;

test.beforeAll(() => {
  fs.mkdirSync(IMG, { recursive: true });
});

// ── Helper ──────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  // Try to find email login button
  const emailBtn = page.getByText(/이메일로 로그인|이메일/).first();
  try { await emailBtn.click({ timeout: 8000 }); } catch {}
  await page.waitForSelector('input[type="email"]', { timeout: 12000 });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
}

// ── S01: 메인 페이지 (비로그인) ─────────────────────────────────────────────

test("S01: 메인 페이지 비로그인 진입", async ({ page }) => {
  await page.goto("/main", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${IMG}/kanto-s01-main.png`, fullPage: false });
  // Check popular section loads
  const body = await page.content();
  console.log("[S01] page title:", await page.title());
  console.log("[S01] has popular section:", body.includes("인기") || body.includes("popular"));
});

// ── S02: 중고거래 목록 + 인기뱃지 ──────────────────────────────────────────

test("S02: 중고거래 목록 및 인기뱃지", async ({ page }) => {
  await page.goto("/usedgoods", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${IMG}/kanto-s02-usedgoods-list.png`, fullPage: false });
  const body = await page.content();
  console.log("[S02] has popular badge:", body.includes("인기") || body.includes("popular") || body.includes("badge"));
});

// ── S03: 중고거래 상세 + 관련매물 캐러셀 ────────────────────────────────────

test("S03: 중고거래 상세 페이지 + 관련매물 캐러셀", async ({ page }) => {
  // Navigate to usedgoods list and click first item
  await page.goto("/usedgoods", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const firstItem = page.locator("a[href*='/usedgoods/']").first();
  let detailUrl = "/usedgoods/1";
  try {
    const href = await firstItem.getAttribute("href");
    if (href) detailUrl = href;
    await firstItem.click({ timeout: 5000 });
    await page.waitForTimeout(2500);
  } catch {
    await page.goto(detailUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
  }

  await page.screenshot({ path: `${IMG}/kanto-s03-usedgoods-detail.png`, fullPage: false });
  // Scroll to bottom to reveal related carousel
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${IMG}/kanto-s03-related-carousel.png`, fullPage: true });
  const body = await page.content();
  console.log("[S03] has related section:", body.includes("관련") || body.includes("similar") || body.includes("carousel"));
});

// ── S04: 로그인 ─────────────────────────────────────────────────────────────

test("S04: 이메일 로그인", async ({ page }) => {
  await login(page);
  await page.screenshot({ path: `${IMG}/kanto-s04-after-login.png`, fullPage: false });
  const url = page.url();
  console.log("[S04] After login URL:", url);
  console.log("[S04] Login successful:", !url.includes("/login"));
});

// ── S05: 칸토 GO! 지도 페이지 ───────────────────────────────────────────────

test("S05: 칸토 GO! 지도 페이지", async ({ page }) => {
  await login(page);
  await page.goto("/go", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000); // Map needs time to load
  await page.screenshot({ path: `${IMG}/kanto-s05-go-map.png`, fullPage: false });

  // Mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${IMG}/kanto-s05-go-map-mobile.png`, fullPage: false });
  await page.setViewportSize({ width: 1280, height: 900 });

  const body = await page.content();
  console.log("[S05] GO! page loaded:", body.includes("번개") || body.includes("모임") || body.includes("GO"));
  console.log("[S05] URL:", page.url());

  // Check for list sidebar button
  const listBtn = page.locator("button").filter({ hasText: /모임 진행|번개|GO/i }).first();
  const listBtnCount = await listBtn.count();
  console.log("[S05] List toggle button found:", listBtnCount > 0);

  if (listBtnCount > 0) {
    await listBtn.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${IMG}/kanto-s05-go-list-panel.png`, fullPage: false });
  }
});

// ── S06: 칸토 GO! 모임 생성 모달 ────────────────────────────────────────────

test("S06: 칸토 GO! 모임 생성 모달 열기", async ({ page }) => {
  await login(page);
  await page.goto("/go", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  // Click "번개모임 만들기" FAB
  const createBtn = page.getByText(/번개모임 만들기|만들기/).first();
  try {
    await createBtn.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${IMG}/kanto-s06-go-create-modal.png`, fullPage: false });
    const body = await page.content();
    console.log("[S06] Create modal opened:", body.includes("생성") || body.includes("장소") || body.includes("주제"));
  } catch (e) {
    console.log("[S06] Could not click create button:", String(e).slice(0, 100));
    await page.screenshot({ path: `${IMG}/kanto-s06-go-create-modal.png`, fullPage: false });
  }
});

// ── S07: 마이페이지 망고지수 ────────────────────────────────────────────────

test("S07: 마이페이지 망고지수(KTS/KPPS)", async ({ page }) => {
  await login(page);
  // Try profile/mypage routes
  for (const path of ["/mypage", "/profile", "/my"]) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      const body = await page.content();
      if (!body.includes("404") && !body.includes("not found")) {
        console.log(`[S07] Found mypage at: ${path}`);
        break;
      }
    } catch {}
  }
  await page.screenshot({ path: `${IMG}/kanto-s07-mypage-mango.png`, fullPage: false });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${IMG}/kanto-s07-mypage-mango-scroll.png`, fullPage: false });
  const body = await page.content();
  console.log("[S07] has 망고지수:", body.includes("망고") || body.includes("KTS") || body.includes("점수") || body.includes("mango"));
});

// ── ADMIN S08: 어드민 대시보드 ──────────────────────────────────────────────

test("S08: 어드민 대시보드 /admin", async ({ page }) => {
  await login(page);
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${IMG}/kanto-s08-admin-dashboard.png`, fullPage: false });
  const url = page.url();
  const body = await page.content();
  console.log("[S08] URL:", url);
  console.log("[S08] Admin access:", !url.includes("/login") && !url.includes("/main"));
  console.log("[S08] Has dashboard content:", body.includes("대시보드") || body.includes("KPI") || body.includes("신고") || body.includes("통계"));
});

// ── ADMIN S09: 번개모임 관리 ────────────────────────────────────────────────

test("S09: 어드민 GO! 번개모임 관리 /admin/go", async ({ page }) => {
  await login(page);
  await page.goto("/admin/go", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${IMG}/kanto-s09-admin-go.png`, fullPage: false });
  const url = page.url();
  const body = await page.content();
  console.log("[S09] URL:", url);
  console.log("[S09] GO! admin page loaded:", body.includes("번개모임") || body.includes("모임 관리") || body.includes("Kanto GO"));

  // Try clicking on a meetup row to open the drawer
  const firstRow = page.locator("tr").nth(1); // skip header
  try {
    await firstRow.click({ timeout: 3000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${IMG}/kanto-s09-admin-go-drawer.png`, fullPage: false });
    console.log("[S09] Drawer opened on row click");
  } catch {
    console.log("[S09] Could not click meetup row (may be empty)");
  }
});

// ── ADMIN S10: 신고 관리 ────────────────────────────────────────────────────

test("S10: 어드민 신고 관리 /admin/reports", async ({ page }) => {
  await login(page);
  await page.goto("/admin/reports", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${IMG}/kanto-s10-admin-reports.png`, fullPage: false });
  const body = await page.content();
  console.log("[S10] Reports page:", body.includes("신고") || body.includes("report"));
});

// ── ADMIN S11: 유저 관리 ────────────────────────────────────────────────────

test("S11: 어드민 유저 관리 /admin/users", async ({ page }) => {
  await login(page);
  await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${IMG}/kanto-s11-admin-users.png`, fullPage: false });
  const body = await page.content();
  console.log("[S11] Users admin page:", body.includes("유저") || body.includes("사용자") || body.includes("회원"));
});

// ── ADMIN S12: 채팅 관리 ────────────────────────────────────────────────────

test("S12: 어드민 채팅 관리 /admin/chats", async ({ page }) => {
  await login(page);
  await page.goto("/admin/chats", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${IMG}/kanto-s12-admin-chats.png`, fullPage: false });
  const body = await page.content();
  console.log("[S12] Chats admin page:", body.includes("채팅") || body.includes("chat"));
});

// ── ADMIN S13: 게시글 관리 ──────────────────────────────────────────────────

test("S13: 어드민 게시글 관리 /admin/posts", async ({ page }) => {
  await login(page);
  await page.goto("/admin/posts", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${IMG}/kanto-s13-admin-posts.png`, fullPage: false });
  const body = await page.content();
  console.log("[S13] Posts admin page:", body.includes("게시글") || body.includes("포스트") || body.includes("post"));
});

// ── S14: 채팅 위젯 (로그인 후) + 네트워크 요청 관찰 ─────────────────────────

test("S14: 채팅 위젯 열기 + 채팅룸 진입 네트워크 관찰", async ({ page }) => {
  await login(page);
  await page.goto("/main", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const chatReqs: string[] = [];
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/api/chat") || u.includes("/rest/v1/chats") || u.includes("/rest/v1/messages")) {
      chatReqs.push(`${r.method()} ${u.replace(/https?:\/\/[^/]+/, "")}`);
    }
  });

  // Find chat bubble/button
  const bubble = page.locator("button").filter({ hasText: /채팅|chat/i }).first();
  const fixedBtns = page.locator('.fixed button, [class*="fixed"] button');
  try {
    if (await bubble.count()) {
      await bubble.click({ timeout: 3000 });
    } else if (await fixedBtns.count()) {
      await fixedBtns.last().click({ timeout: 3000 });
    }
    await page.waitForTimeout(2500);
  } catch { /* ignore */ }

  await page.screenshot({ path: `${IMG}/kanto-s14-chat-widget.png`, fullPage: false });
  console.log(`[S14] 채팅 위젯 열 때 네트워크 요청 ${chatReqs.length}건`);
  chatReqs.forEach((r) => console.log("  " + r));

  // Try to enter a chat room from the list
  const chatItem = page.locator('[class*="chat"] li, [class*="chat"] a, [class*="ChatList"] li').first();
  try {
    await chatItem.click({ timeout: 3000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${IMG}/kanto-s14-chat-room.png`, fullPage: false });
    console.log(`[S14] 채팅룸 진입 후 총 네트워크 요청 ${chatReqs.length}건`);
    chatReqs.forEach((r) => console.log("  " + r));
  } catch {
    console.log("[S14] Could not enter chat room from widget");
  }
});
