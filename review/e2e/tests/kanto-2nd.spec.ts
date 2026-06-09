import { test, expect } from "@playwright/test";

// 2차 리뷰(2026-06-09) 전용 E2E.
// 새 화면(방렌트 목록, 구인 글쓰기)과 지난 1차에서 잡힌 라우트 버그(/chats, /jobs)를 화면으로 확인한다.
// BASE_URL은 실행 시 환경변수로 주입(기본 3101).

const SHOT = "../images";

test("방렌트 목록 페이지 렌더링", async ({ page }) => {
  await page.goto("/rental");
  await expect(page.getByRole("heading", { name: "방렌트" })).toBeVisible();
  await page.screenshot({ path: `${SHOT}/2nd-01-rental-list.png`, fullPage: true });
});

test("구인구직 글쓰기 페이지 렌더링", async ({ page }) => {
  await page.goto("/job/create");
  await expect(page.getByRole("heading", { name: "구인구직 글쓰기" })).toBeVisible();
  await page.screenshot({ path: `${SHOT}/2nd-02-job-create.png`, fullPage: true });
});

test("[지난 버그] /chats 라우트 — 404 여부 확인", async ({ page }) => {
  const res = await page.goto("/chats");
  await page.screenshot({ path: `${SHOT}/2nd-03-chats-route.png` });
  // 상태코드 기록(통과/실패 판정은 리뷰 본문에서 해석)
  console.log("[/chats] status =", res?.status());
});

test("[지난 버그] 구인 작성 성공 리다이렉트 대상 /jobs — 404 여부 확인", async ({ page }) => {
  const res = await page.goto("/jobs");
  await page.screenshot({ path: `${SHOT}/2nd-04-jobs-route.png` });
  console.log("[/jobs] status =", res?.status());
});
