// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// /job/[id] 한 번 렌더링할 때 Supabase 호출이 몇 번 나가는지 센다 (이슈 #718, 비로그인 기준).
// 측정 범위: generateMetadata + 페이지 본문 + after() 콜백. notices 조회는 레이아웃에서 나가므로 포함하지 않는다.
//
// 기록된 기준값 (페이지 단위)
// - 개선 전 (main c6e95de): jobs 3회 + 조회수 RPC 1회 = 4회
// - React.cache 적용 후 (#724):  jobs 2회 + 조회수 RPC 1회 = 3회
// - ISR 전환 후: jobs 2회 = 2회 (조회수 증가는 클라이언트 ViewCounter로 이동, 서버 렌더에서는 0회)
//   ISR(revalidate=300)이 적용되므로 이 2회는 "요청마다"가 아니라 "페이지 재생성마다" 발생한다.

const state = vi.hoisted(() => {
  const calls: string[] = [];
  const serverClientCreated = { count: 0 };
  const afterCallbacks: Array<() => unknown> = [];
  const requestCache = new Map<unknown, Map<string, unknown>>();

  const job = {
    id: 10,
    post_id: 1,
    images: [] as string[],
    salary: 1000,
    deadline: "2099-01-01",
    location_type: "manila",
    main_task: "업무 내용",
    created_at: "2026-01-01",
    company_name: "Kanto",
    posts: { title: "테스트 공고", status: "active", users: null },
  };

  function builder() {
    const b: Record<string, unknown> = {};
    for (const method of ["select", "eq", "neq", "limit", "order", "in"]) b[method] = () => b;
    b.single = () => Promise.resolve({ data: job, error: null });
    b.then = (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null });
    return b;
  }

  function createFakeClient() {
    return {
      from: (table: string) => {
        calls.push(`from:${table}`);
        return builder();
      },
      rpc: (name: string) => {
        calls.push(`rpc:${name}`);
        return Promise.resolve({ data: null, error: null });
      },
    };
  }

  return { calls, serverClientCreated, afterCallbacks, requestCache, createFakeClient };
});

// 단위 테스트에는 React 렌더 컨텍스트가 없어 React.cache 가 중복 제거를 하지 않는다.
// 요청 단위 메모이제이션을 흉내 내서 "metadata 와 page 가 같은 캐시 함수를 쓰는지"를 검증한다.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache:
      <A extends unknown[], R>(fn: (...args: A) => R) =>
      (...args: A): R => {
        const store = state.requestCache.get(fn) ?? new Map<string, unknown>();
        state.requestCache.set(fn, store);
        const key = JSON.stringify(args);
        if (!store.has(key)) store.set(key, fn(...args));
        return store.get(key) as R;
      },
  };
});

// 쿠키를 읽는 서버 클라이언트. ISR 유지를 위해 상세 페이지에서는 쓰이면 안 된다.
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => {
    state.serverClientCreated.count += 1;
    return state.createFakeClient();
  },
}));
// 쿠키 없는 공개 클라이언트(createPublicClient)가 내부에서 쓰는 클라이언트.
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => state.createFakeClient(),
}));
vi.mock("next/server", () => ({
  after: (callback: () => unknown) => {
    state.afterCallbacks.push(callback);
  },
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => {},
}));
vi.mock("@/services/getUserLikeReportStatus", () => ({
  getUserLikeReportStatus: async () => ({
    userId: undefined,
    initialLiked: false,
    initialReported: false,
  }),
}));
vi.mock("@/utils/postIdCipher", () => ({
  resolvePostId: (id: string) => (Number.isNaN(Number(id)) ? null : Number(id)),
  encryptPostId: (postId: number) => `token-${postId}`,
}));
vi.mock("@/utils/userIdCipher", () => ({
  encryptUserId: (userId: number) => `user-${userId}`,
}));

// 호출 횟수와 무관한 화면 컴포넌트는 빈 컴포넌트로 대체한다.
const emptyComponent = vi.hoisted(() => () => ({ default: () => null }));
vi.mock("@/app/[locale]/(user)/rental/[id]/_components/ImageCarresel", emptyComponent);
vi.mock("@/components/common/ViewCounter", () => ({ ViewCounter: () => null }));
vi.mock("@/components/common/VerifyAuthor", emptyComponent);
vi.mock("@/components/common/RelatedItemsCarousel", emptyComponent);
vi.mock("./_components/BackButton", emptyComponent);
vi.mock("./_components/JobTitle", emptyComponent);
vi.mock("./_components/JobInfo", emptyComponent);
vi.mock("./_components/JobAuthorInfo", emptyComponent);
vi.mock("./_components/JobContent", emptyComponent);
vi.mock("./_components/CompanyInfo", emptyComponent);

async function renderJobDetailOnce() {
  const { default: JobDetailPage, generateMetadata } = await import("./page");
  const params = Promise.resolve({ locale: "ko", id: "1" });

  await generateMetadata({ params });
  await JobDetailPage({ params });
  await Promise.all(state.afterCallbacks.map((callback) => callback()));

  return [...state.calls];
}

describe("/job/[id] 한 번 렌더링할 때의 Supabase 호출 횟수", () => {
  beforeEach(() => {
    state.calls.length = 0;
    state.afterCallbacks.length = 0;
    state.serverClientCreated.count = 0;
    state.requestCache.clear();
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://kanto.test");
  });

  it("jobs 조회는 상세 1회 + 관련 공고 1회로 2회다 (metadata 와 page 가 getJobDetail 을 공유)", async () => {
    const calls = await renderJobDetailOnce();

    expect(calls.filter((call) => call === "from:jobs")).toHaveLength(2);
  });

  it("조회수 RPC 는 서버 렌더에서 호출되지 않는다 (클라이언트 ViewCounter 담당)", async () => {
    const calls = await renderJobDetailOnce();

    expect(calls.filter((call) => call === "rpc:increment_view_count")).toHaveLength(0);
  });

  it("페이지 단위 Supabase 호출은 총 2회다", async () => {
    const calls = await renderJobDetailOnce();

    expect(calls).toHaveLength(2);
  });

  it("쿠키를 읽는 서버 클라이언트를 쓰지 않는다 (ISR 유지 조건)", async () => {
    await renderJobDetailOnce();

    expect(state.serverClientCreated.count).toBe(0);
  });
});
