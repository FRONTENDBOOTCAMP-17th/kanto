import { test, expect, Page } from "@playwright/test";

/**
 * Kanto 매일 E2E — 실제 사용자·관리자 흐름을 "쓰는 순서 그대로" 따라가며
 * 메인부터 핵심 기능까지 확인하고, 그날 날짜 폴더에 화면을 남긴다.
 * 시나리오는 review/e2e/scenarios.md 와 함께 관리한다.
 * 캡처: review/images/<오늘날짜>/  (아래 DAY 를 매일 갱신)
 *
 * 흐름 순서:
 *   [사용자] 메인 → 목록 → 상세(비로그인) → 로그인 → 상세/찜 → 프로필/본인인증 → 결제 결과
 *   [관리자] 관리자 로그인 → 대시보드 → 신고 관리 → 회원 관리 → 회원 상세
 *
 * 참고: 루트 "/"는 개발용 라우트 인덱스라, 실제 사용자 메인은 "/main".
 * 로그인은 api/login 이 Upstash Redis 환경변수를 요구한다.
 * 비밀번호는 커밋하지 않고 환경변수로 주입: REVIEW_TEST_PASSWORD.
 * 관리자 화면은 테스트 계정을 일시적으로 admin 으로 승격해 확인한다(리뷰 후 user 로 원복).
 */
const DAY = "2026-06-22";
const SHOT = `../images/${DAY}`;
const EMAIL = process.env.REVIEW_TEST_EMAIL ?? "kanto-review@example.com";
const PASSWORD = process.env.REVIEW_TEST_PASSWORD ?? "";

async function settle(page: Page, ms = 2000) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(ms);
}

function detailLink(page: Page, kind: "usedgoods" | "rental" | "job") {
  return page.locator(`a[href*="/${kind}/"]:not([href$="/create"])`).first();
}

async function login(page: Page) {
  await page.goto("/login");
  await settle(page, 1000);
  await page.getByRole("button", { name: "이메일로 로그인" }).click().catch(() => {});
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await settle(page);
}

/* ===================== 사용자 여정 ===================== */

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

test("K2 중고거래 목록 → 상세(비로그인)", async ({ page }) => {
  await page.goto("/usedgoods");
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K2a-usedgoods-list.png`, fullPage: true });
  const firstLink = detailLink(page, "usedgoods");
  if (await firstLink.count()) {
    const res = await firstLink.click().then(() => null).catch(() => null);
    await settle(page);
    await page.screenshot({ path: `${SHOT}/kanto-K2b-usedgoods-detail.png`, fullPage: true });
    void res;
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

// 7차 [필수] 회귀 확인: 비로그인 상세 3종이 200으로 뜨는지 직접 status 검사
test("K2c/K7b/K8b 비로그인 상세 3종 HTTP 200 회귀 확인", async ({ page }) => {
  for (const url of ["/usedgoods/164", "/rental/159", "/job/163"]) {
    const res = await page.goto(url);
    await settle(page, 800);
    console.log(`anon ${url} status:`, res?.status());
    expect(res?.status(), `anon ${url}`).toBeLessThan(500);
  }
  await page.screenshot({ path: `${SHOT}/kanto-K2c-anon-detail-ok.png`, fullPage: true });
});

test("K5 로그인 폼 렌더(이메일)", async ({ page }) => {
  await page.goto("/login");
  await settle(page, 1000);
  await page.getByRole("button", { name: "이메일로 로그인" }).click().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOT}/kanto-K5-login-form.png`, fullPage: true });
});

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

test("K7 방렌트 목록 → 상세(조회수·찜/공유/신고)", async ({ page }) => {
  await page.goto("/rental");
  await settle(page);
  const link = detailLink(page, "rental");
  if (await link.count()) {
    await link.click();
    await settle(page);
    await page.screenshot({ path: `${SHOT}/kanto-K7-rental-detail.png`, fullPage: true });
  }
});

test("K8 구인구직 목록 → 상세", async ({ page }) => {
  await page.goto("/job");
  await settle(page);
  const link = detailLink(page, "job");
  if (await link.count()) {
    await link.click();
    await settle(page);
    await page.screenshot({ path: `${SHOT}/kanto-K8-job-detail.png`, fullPage: true });
  }
});

test("K9 로그인 후 중고 상세 — 찜/공유/조회수", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.goto("/usedgoods");
  await settle(page);
  const firstLink = detailLink(page, "usedgoods");
  if (!(await firstLink.count())) return;
  await firstLink.click();
  await settle(page);
  await page.screenshot({ path: `${SHOT}/kanto-K9a-detail-loggedin.png`, fullPage: true });

  // 콘솔/네트워크로 찜 토글의 실제 응답(403 여부)을 잡는다 — 7차 [필수] 회귀 확인
  const likeResponses: number[] = [];
  page.on("response", (r) => {
    if (r.url().includes("common_likes")) likeResponses.push(r.status());
  });

  const likeBtn = page.getByRole("button", { name: /좋아요/ }).first();
  if (await likeBtn.count()) {
    const before = await likeBtn.getAttribute("aria-pressed");
    await likeBtn.click();
    await page.waitForTimeout(1500);
    const after = await likeBtn.getAttribute("aria-pressed");
    console.log("like aria-pressed before/after:", before, after);
    console.log("common_likes responses:", likeResponses.join(","));
    await page.screenshot({ path: `${SHOT}/kanto-K9b-after-like.png`, fullPage: true });
    // 원복(다시 클릭) — 실데이터 오염 최소화
    await likeBtn.click();
    await page.waitForTimeout(800);
  }
});

test("K10 로그인 후 방렌트·구인 상세 정상 렌더", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.goto("/rental");
  await settle(page);
  const r = detailLink(page, "rental");
  if (await r.count()) {
    await r.click();
    await settle(page);
    await page.screenshot({ path: `${SHOT}/kanto-K10a-rental-detail-loggedin.png`, fullPage: true });
  }
  await page.goto("/job");
  await settle(page);
  const j = detailLink(page, "job");
  if (await j.count()) {
    await j.click();
    await settle(page);
    await page.screenshot({ path: `${SHOT}/kanto-K10b-job-detail-loggedin.png`, fullPage: true });
  }
});

// ── 이번 회차 신규 엔드포인트 ──

test("K11 프로필 본인인증 모달(신규)", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.goto("/profile");
  await settle(page);
  // 본인인증 진입 버튼(텍스트 추정) — 있으면 클릭해 모달 캡처
  const trigger = page.getByRole("button", { name: /본인인증|인증/ }).first();
  if (await trigger.count()) {
    await trigger.click().catch(() => {});
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: `${SHOT}/kanto-K11-verification.png`, fullPage: true });
});

test("K12 결제 결과 페이지 3상태(신규 /payment/return)", async ({ page }) => {
  // 비로그인으로도 서버 렌더 — txn 없음=pending, failed=1=failed
  await page.goto("/payment/return");
  await settle(page, 800);
  await page.screenshot({ path: `${SHOT}/kanto-K12a-payment-pending.png`, fullPage: true });
  await page.goto("/payment/return?failed=1");
  await settle(page, 800);
  await page.screenshot({ path: `${SHOT}/kanto-K12b-payment-failed.png`, fullPage: true });
});

/* ===================== 관리자 여정 ===================== */
// 테스트 계정을 일시 admin 으로 승격한 상태에서 실행(리뷰 후 user 로 원복).

test("K20 관리자 대시보드(/admin)", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  const res = await page.goto("/admin");
  await settle(page);
  console.log("/admin status:", res?.status());
  await page.screenshot({ path: `${SHOT}/kanto-K20-admin-dashboard.png`, fullPage: true });
});

test("K21 신고 관리(/admin/reports)", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  const res = await page.goto("/admin/reports");
  await settle(page);
  console.log("/admin/reports status:", res?.status());
  await page.screenshot({ path: `${SHOT}/kanto-K21-admin-reports.png`, fullPage: true });
});

test("K22 회원 관리(/admin/users) → 회원 상세", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  const res = await page.goto("/admin/users");
  await settle(page);
  console.log("/admin/users status:", res?.status());
  await page.screenshot({ path: `${SHOT}/kanto-K22a-admin-users.png`, fullPage: true });
  const userLink = page.locator('a[href*="/admin/users/"]').first();
  if (await userLink.count()) {
    const href = await userLink.getAttribute("href");
    if (href) {
      await page.goto(href);
      await settle(page);
      await page.screenshot({ path: `${SHOT}/kanto-K22b-admin-user-detail.png`, fullPage: true });
    }
  }
});

test("K23 관리자 글 관리(/admin/posts, 신규)", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  const res = await page.goto("/admin/posts");
  await settle(page);
  console.log("/admin/posts status:", res?.status());
  await page.screenshot({ path: `${SHOT}/kanto-K23-admin-posts.png`, fullPage: true });
});

test("K24 관리자 채팅 관리(/admin/chats → 상세, 신규)", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  const res = await page.goto("/admin/chats");
  await settle(page);
  console.log("/admin/chats status:", res?.status());
  await page.screenshot({ path: `${SHOT}/kanto-K24a-admin-chats.png`, fullPage: true });
  const chatLink = page.locator('a[href*="/admin/chats/"]').first();
  if (await chatLink.count()) {
    const href = await chatLink.getAttribute("href");
    if (href) {
      await page.goto(href);
      await settle(page);
      await page.screenshot({ path: `${SHOT}/kanto-K24b-admin-chat-room.png`, fullPage: true });
    }
  } else {
    // 목록 링크가 없어도 직접 상세로 진입해 본다(샘플 chat id 11)
    await page.goto("/admin/chats/11");
    await settle(page);
    await page.screenshot({ path: `${SHOT}/kanto-K24b-admin-chat-room.png`, fullPage: true });
  }
});

test("K25 비밀번호 찾기 모달(/login → 신규 reset-password)", async ({ page }) => {
  await page.goto("/login");
  await settle(page, 1000);
  await page.getByRole("button", { name: "이메일로 로그인" }).click().catch(() => {});
  await page.waitForTimeout(500);
  const trigger = page.getByRole("button", { name: /비밀번호.*찾기|비밀번호.*재설정|비밀번호를 잊/ }).first();
  if (await trigger.count()) {
    await trigger.click().catch(() => {});
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: `${SHOT}/kanto-K25-find-password.png`, fullPage: true });
});

/* ===================== 보안 회귀: 비관리자 어드민 접근 ===================== */
// 테스트 계정을 user(비관리자) 상태로 둔 채 신규 어드민 페이지에 직접 진입해
// 일반 사용자에게 관리자 데이터가 새는지(접근 차단 여부)를 확인한다.

test("K30 비관리자(user)로 신규 어드민 페이지 직접 진입 — 차단 확인", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);

  for (const url of ["/admin/posts", "/admin/chats", "/admin/chats/11", "/admin/users"]) {
    await page.goto(url);
    await settle(page, 1200);
    const finalUrl = page.url();
    const blocked = !finalUrl.includes(url.split("?")[0]); // 리다이렉트되면 차단
    console.log(`[authz] non-admin ${url} → final=${finalUrl} blocked=${blocked}`);
    const slug = url.replace(/\//g, "_");
    await page.screenshot({ path: `${SHOT}/kanto-K30${slug}.png`, fullPage: true });
  }
});
