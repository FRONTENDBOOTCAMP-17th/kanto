# Terms 페이지 Notion CMS 캐싱 설계

## 문제 정의

Terms 페이지(`/terms/[type]`)에서 약관 탭을 이동할 때마다 Notion API를 재호출하는 현상이 발생했다. 이로 인해 매 네비게이션마다 수백 ms ~ 수 초의 로딩이 반복되었다.

---

## 원인 분석

### 1. Next.js Link prefetch 동작

Network 탭 분석 결과, 약관 페이지 진입 시 `payment`, `age`, `youth`, `privacy`, `service`, `policy` **6개 타입이 동시에 fetch**되는 것을 확인했다.

`TermsNav`의 데스크탑 탭이 모두 화면에 표시되면 Next.js `<Link>`가 자동으로 모든 링크를 prefetch하기 때문이었다.

**해결**: `prefetch={false}` 추가로 클릭 시에만 fetch하도록 변경.

### 2. Server Component의 RSC 재실행

`[type]/page.tsx`는 Server Component로, `<Link>` 클릭 시 Next.js가 서버에 RSC payload를 매번 요청한다. 이 과정에서 `getNotionPage()` → Notion API 호출이 발생했다.

**시도한 해결책과 한계**:

---

## 시도한 방법들

### ❌ 방법 1: `generateStaticParams` (빌드 타임 정적 생성)

```ts
export async function generateStaticParams() {
  return Object.keys(TERMS_MAP).map((type) => ({ type }));
}
```

빌드 타임에 모든 약관 페이지를 미리 생성하면 서버 요청 자체가 사라지는 방식이다.

**실패 이유**: `next-intl`이 `i18n/request.ts`에서 `cookies()`로 locale을 읽는다. `cookies()`는 Next.js의 Dynamic Function으로, 이를 사용하는 모든 라우트는 `ƒ` (Dynamic)으로 강제되어 빌드 타임 정적 생성이 불가능하다.

```
Route (app)
├ ƒ /terms/[type]   ← generateStaticParams가 있어도 Dynamic 유지
```

---

### ❌ 방법 2: `staleTimes` (클라이언트 라우터 캐시)

```ts
// next.config.ts
experimental: {
  staleTimes: { dynamic: 30 },
}
```

Next.js 클라이언트 라우터가 RSC payload를 30초간 메모리에 보관하는 방식이다.

**실패 이유**: `staleTimes`는 전체 동적 라우트에 적용된다. 게시글 목록, 채팅 등 실시간성이 필요한 페이지까지 30초 동안 오래된 데이터를 보여줄 수 있어 채택하지 않았다.

---

### ❌ 방법 3: URL 기반 i18n 전환

`/[locale]/terms/[type]` 구조로 변경하면 locale이 URL에 포함되어 `cookies()`가 필요 없어지고, 정적 생성이 가능해진다.

**실패 이유**: 현재 앱 전체의 라우팅 구조를 변경해야 하는 대규모 작업으로, 이번 범위에 맞지 않아 채택하지 않았다.

---

## 최종 해결책: localStorage + TTL 클라이언트 캐싱

서버 렌더링을 포기하고, 클라이언트에서 데이터를 가져와 localStorage에 저장하는 방식을 채택했다.

```
첫 방문 (/terms/policy)
  → /api/terms?type=policy 호출
  → 응답을 localStorage에 저장 (타임스탬프 포함)

이후 방문 (10시간 이내, 탭 이동 · 새로고침 모두)
  → localStorage에서 즉시 꺼냄 → 서버 요청 없음 ✅

10시간 후
  → 타임스탬프 만료 → API 재호출 → 갱신
```

### 구현 구조

```
[type]/page.tsx          Server Component (타입 유효성 검사만)
    └─ TermsClientContent.tsx   Client Component (localStorage 캐싱 + fetch)
            └─ TermsContent.tsx         렌더링 전용 (변경 없음)

/api/terms/route.ts      title + content 반환하도록 업데이트
```

### 핵심 설계 결정

**`dynamic({ ssr: false })` + `key={type}` 사용**

```tsx
// [type]/page.tsx
const TermsClientContent = dynamic(
  () => import("../_components/TermsClientContent"),
  { ssr: false }
);

return <TermsClientContent key={type} type={type} />;
```

- `ssr: false`: 서버에서 렌더링하지 않으므로 `localStorage`를 초기값으로 안전하게 사용
- `key={type}`: 탭 이동 시 컴포넌트 재마운트 → 레이지 초기화가 새 type으로 재실행

**레이지 초기화로 React Compiler 경고 방지**

```tsx
// effect 내 동기 setState 대신 레이지 초기화 사용
const [data, setData] = useState(() => getCached(type));

useEffect(() => {
  if (data) return; // 캐시 있으면 fetch 생략
  // fetch...
}, [type, data]);
```

React Compiler는 effect 내 동기 setState를 금지한다. 레이지 초기화로 캐시 확인을 effect 밖으로 이동해 해결했다.

### TTL 설정

```ts
const CACHE_DURATION = 36000 * 1000; // 10시간
```

서버 ISR(`revalidate = 36000`)과 동일한 주기로 맞췄다.

---

## 추가 변경 사항

### TermsHeader 언어 변경 기능 추가

Terms 페이지에 언어 변경 기능이 없었다. 기존 `LanguageSwitcher` 컴포넌트를 `TermsHeader`에 추가했다.

### TermsNav UI 개선

6개의 긴 한국어 탭명이 `max-w-3xl` 컨테이너를 초과하여 UI가 깨지는 문제가 있었다.

- 가로 스크롤 추가 (`overflow-x-auto`)
- 스크롤 가능 여부를 나타내는 좌우 그라데이션 페이드 + 화살표 버튼 추가
- `shrink-0`, `whitespace-nowrap`으로 탭 찌그러짐 방지

### `proxy.ts` 마이그레이션

Next.js 16에서 `middleware` → `proxy`로 함수명 규약이 변경되었다. `src/middleware.ts`를 `src/proxy.ts`로 이동하고 export 함수명을 `proxy`로 수정했다.

### `loading.tsx` 제거

클라이언트 컴포넌트가 자체 로딩 스피너를 가지게 되어 `loading.tsx`가 더 이상 표시되지 않는 dead code가 되었다.

---

## 트레이드오프

| 항목 | 내용 |
|------|------|
| SEO | 약관 콘텐츠가 클라이언트에서 렌더링되어 검색엔진에 노출되지 않음. 약관 페이지 특성상 영향 없음 |
| 첫 방문 | 스피너 표시 후 API 호출 (기존과 동일) |
| 이후 방문 | localStorage에서 즉시 표시, 서버 요청 없음 |
| Notion 수정 반영 | 사용자별 캐시 만료(10시간) 후 반영 |
| JS 비활성화 | 콘텐츠 표시 불가. 약관 페이지 특성상 영향 없음 |
