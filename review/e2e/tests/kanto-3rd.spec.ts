import { test, expect } from "@playwright/test";

// 3차 리뷰(2026-06-10) 전용 E2E.
// 새 화면(이용약관, 중고 글쓰기 이미지 업로드 공통화, 검색창 공동컴포넌트)과
// 지난 1·2차에서 잡힌 라우트 버그(/chats, /jobs)가 고쳐졌는지 화면으로 재확인한다.
// BASE_URL은 실행 시 환경변수로 주입(기본 3101).

const SHOT = "../images";

test("중고거래 목록 — 검색창 공동컴포넌트 렌더", async ({ page }) => {
  await page.goto("/usedgoods");
  // SearchBar는 모바일/데스크톱 입력을 둘 다 렌더하므로(반응형) 보이는 것만 검사
  await expect(
    page.getByPlaceholder("검색어를 입력해주세요").locator("visible=true"),
  ).toBeVisible();
  await page.screenshot({
    path: `${SHOT}/3rd-01-usedgoods-searchbar.png`,
    fullPage: true,
  });
});

test("방렌트 목록 — 검색창 + 지역 드롭다운 렌더", async ({ page }) => {
  await page.goto("/rental");
  await expect(
    page.getByPlaceholder("검색어를 입력해주세요").locator("visible=true"),
  ).toBeVisible();
  await page.screenshot({
    path: `${SHOT}/3rd-02-rental-searchbar.png`,
    fullPage: true,
  });
});

test("이용약관 — 운영정책 페이지 렌더", async ({ page }) => {
  const res = await page.goto("/terms/policy");
  console.log("[/terms/policy] status =", res?.status());
  await page.screenshot({
    path: `${SHOT}/3rd-03-terms-policy.png`,
    fullPage: true,
  });
});

test("이용약관 — 네비게이션(탭 4개) 렌더", async ({ page }) => {
  await page.goto("/terms");
  await page.screenshot({
    path: `${SHOT}/3rd-04-terms-index.png`,
    fullPage: true,
  });
});

test("이용약관 페이지에는 GlobalLayout Header가 숨겨지는지", async ({
  page,
}) => {
  await page.goto("/terms/policy");
  // GlobalLayout: /terms 경로에서 Header/Footer 미렌더 → 약관 전용 레이아웃만
  const navCount = await page.getByRole("navigation").count();
  console.log("[/terms/policy] nav count =", navCount);
});

test("[지난 버그] /chats 라우트 — 404 고쳐졌는지", async ({ page }) => {
  const res = await page.goto("/chats");
  await page.screenshot({ path: `${SHOT}/3rd-05-chats-route.png` });
  console.log("[/chats] status =", res?.status());
});

test("[지난 버그] /jobs 라우트 — 404 고쳐졌는지", async ({ page }) => {
  const res = await page.goto("/jobs");
  await page.screenshot({ path: `${SHOT}/3rd-06-jobs-route.png` });
  console.log("[/jobs] status =", res?.status());
});

test("[참고] /chat (단수, 올바른 채팅 라우트) 동작", async ({ page }) => {
  const res = await page.goto("/chat");
  console.log("[/chat] status =", res?.status());
});
