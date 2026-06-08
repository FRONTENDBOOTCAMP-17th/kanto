import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

// ── 리뷰 전용 E2E (교육생이 작성한 테스트와 무관) ───────────────────────────
// 백엔드: 로컬 Supabase(supabase start). 빈 DB라 데이터 조회 화면은 비어있거나
// 에러일 수 있고, 그 점도 그대로 캡처해서 리뷰에 적는다.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// service role(secret) 키 — 확인된 테스트 계정을 Admin API로 만들 때 사용
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? "";

// 리뷰용 테스트 계정 — 비밀번호는 커밋하지 않는다(공개 repo 유출 방지).
// 실행 시 환경변수로 주입한다. 실제 값은 review/e2e/test-account.md(커밋 제외) 참고.
const TEST_EMAIL = process.env.REVIEW_TEST_EMAIL ?? "kanto-review@example.com";
const TEST_PASSWORD = process.env.REVIEW_TEST_PASSWORD ?? "";

const IMG = (name: string) =>
  path.join(__dirname, "..", "..", "images", name);

// 페이지별 콘솔/페이지 에러를 모아두는 헬퍼
function collectErrors(page: Page, bucket: string[]) {
  page.on("console", (m) => {
    if (m.type() === "error") bucket.push(`[console] ${m.text()}`);
  });
  page.on("pageerror", (e) => bucket.push(`[pageerror] ${e.message}`));
}

// 실제 Supabase에 확인된 리뷰용 계정을 Admin API로 만들어 둔다(이메일 확인 우회).
test.beforeAll(async ({ request }) => {
  const res = await request.post(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SECRET_KEY,
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    data: { email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true },
  });
  // 이미 존재하는 경우(422 등)도 정상으로 본다.
  console.log(`admin createUser status: ${res.status()}`);
});

test("01 홈(개발 인덱스) 렌더링", async ({ page }) => {
  const errs: string[] = [];
  collectErrors(page, errs);
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await page.screenshot({ path: IMG("01-home.png"), fullPage: true });
  console.log("01 errors:", errs);
});

test("02 로그인 페이지 렌더링", async ({ page }) => {
  await page.goto("/login");
  await page.screenshot({ path: IMG("02-login-page.png"), fullPage: true });
});

test("03 이메일 회원가입 계정으로 로그인", async ({ page }) => {
  const errs: string[] = [];
  collectErrors(page, errs);
  await page.goto("/login");
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await page.locator("#email").fill(TEST_EMAIL);
  await page.locator("#password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  // 로그인 성공 시 "/"로 router.push
  await page.waitForURL("**/", { timeout: 10_000 }).catch(() => {});
  await page.screenshot({ path: IMG("03-after-login.png"), fullPage: true });
  console.log("03 url:", page.url(), "errors:", errs);
});

test("04 중고마켓 목록 (빈 DB 동작 확인)", async ({ page }) => {
  const errs: string[] = [];
  collectErrors(page, errs);
  await page.goto("/usedgoods");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: IMG("04-usedgoods.png"), fullPage: true });
  console.log("04 errors:", errs);
});

test("05 프로필 페이지", async ({ page }) => {
  const errs: string[] = [];
  collectErrors(page, errs);
  await page.goto("/profile");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: IMG("05-profile.png"), fullPage: true });
  console.log("05 errors:", errs);
});

test("06 채팅 목록", async ({ page }) => {
  const errs: string[] = [];
  collectErrors(page, errs);
  await page.goto("/chat");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: IMG("06-chat.png"), fullPage: true });
  console.log("06 errors:", errs);
});

test("07 [버그] 채팅 링크 /chats 는 404", async ({ page }) => {
  const res = await page.goto("/chats");
  await page.screenshot({ path: IMG("07-chats-404.png"), fullPage: true });
  // 라우트가 /chat 인데 코드에서 /chats 로 연결 → 404 예상
  console.log("07 /chats status:", res?.status());
  expect(res?.status()).toBe(404);
});
