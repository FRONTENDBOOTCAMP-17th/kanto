# URL 파라미터 기반 검색/필터 아키텍처

## 개요

구인구직, 중고거래, 방렌트 목록 페이지의 검색·필터·페이지네이션을 URL 파라미터 방식으로 통일하여 구현한 설계 문서입니다.

## 핵심 설계 원칙

- **서버 컴포넌트**가 `searchParams`를 읽어 DB에서 필터된 데이터를 가져옵니다.
- **클라이언트 컴포넌트**는 URL을 업데이트하는 역할만 담당합니다.
- 각 카드 컴포넌트가 **좋아요 상태를 자체적으로 관리**합니다 (부모에 의존하지 않음).
- URL이 변경되면 서버가 새 데이터를 내려주고, 카드는 새 props를 바로 렌더링합니다.

---

## 아키텍처 구조

```
page.tsx (Server Component)
  ├── searchParams 수신 (search, category/roomType/type, location, page)
  ├── service 함수 호출 → 필터된 데이터 반환
  ├── 페이지네이션 슬라이싱 (ITEMS_PER_PAGE = 12)
  │
  ├── <XxxFilters />  (Client Component)  ← URL 업데이트 전담
  ├── <XxxList />     (Client Component)  ← 카드 렌더링, 세션 관리
  └── <PaginationUrl /> (Client Component) ← 페이지 URL 업데이트
```

---

## 공통 컴포넌트

### `src/hooks/useUrlParams.ts`

URL 파라미터 업데이트 로직을 중앙화한 커스텀 훅입니다. 모든 필터 컴포넌트에서 공유합니다.

```ts
const { updateParams, searchParams } = useUrlParams();
// updateParams({ search: "검색어" })  → URL에 반영, page 파라미터 자동 초기화
// updateParams({ category: "all" })   → 해당 파라미터 삭제 처리
```

- `useRouter`, `usePathname`, `useSearchParams`를 내부에서 관리
- `value === "all"` 또는 빈 값이면 파라미터를 삭제 (클린 URL)
- 파라미터 변경 시 `page`를 자동으로 초기화

### `src/components/common/PaginationUrl.tsx`

`usePathname()`을 사용해 어느 페이지에서든 동작하는 범용 페이지네이션 컴포넌트입니다.

```tsx
<PaginationUrl currentPage={currentPage} totalPage={totalPages} />
```

---

## 서비스 레이어 필터링

### 전략

| 필터 종류 | 방법 |
|---|---|
| 제목 검색 (`search`) | Supabase `.ilike("title", "%검색어%")` (DB 레벨) |
| 카테고리 / 방 유형 / 고용 형태 | JS 후처리 (조인 테이블 컬럼이므로 DB 필터 불가) |
| 지역 (`location`) | JS 후처리 (동일한 이유) |

### 각 서비스 함수 시그니처

```ts
// src/services/usedGoods/usedGoods.ts
getUsedGoodsList(filter?: { search?: string; category?: string; location?: string })

// src/services/rental/rental.ts
getRentalList(filter?: { search?: string; roomType?: string; location?: string })

// src/services/job/useJob.ts
getJobList(filter?: { search?: string; employeeType?: string; location?: string })
```

---

## 카드 컴포넌트 좋아요 자체 관리 패턴

이전 방식은 부모 컴포넌트(useLikes 훅)가 모든 카드의 좋아요 상태를 배열로 관리했습니다.
이 방식은 URL 변경 시 새 props가 와도 state가 갱신되지 않아 두 번 렌더링 문제가 발생했습니다.

**개선 후**: 각 카드가 `isLiked`, `likeCount`를 자체 `useState`로 관리합니다.

```tsx
// JobCard / UsedGoodsCard / RentalCard 공통 패턴
const [isLiked, setIsLiked] = useState(initialIsLiked);
const [likeCount, setLikeCount] = useState(initialLikeCount);

const handleLike = async () => {
  const wasLiked = isLiked;
  setIsLiked(!wasLiked);                          // 낙관적 업데이트
  setLikeCount((c) => c + (wasLiked ? -1 : 1));
  const { error } = await supabase...;
  if (error) { /* 롤백 */ }
};
```

**부모(List 컴포넌트)** 는 세션 정보(`currentUserId`)와 로그인 모달 상태만 관리합니다.

---

## 페이지별 URL 파라미터

| 페이지 | 검색 | 필터1 | 필터2 | 페이지 |
|---|---|---|---|---|
| `/usedgoods` | `search` | `category` | `location` | `page` |
| `/rental` | `search` | `roomType` | `location` | `page` |
| `/job` | `search` | `type` (고용형태) | `location` | `page` |

---

## 파일 구조

```
src/
├── hooks/
│   └── useUrlParams.ts                  # URL 파라미터 공통 훅
├── components/common/
│   └── PaginationUrl.tsx                # 범용 URL 페이지네이션
├── services/
│   ├── usedGoods/usedGoods.ts           # getUsedGoodsList (필터 지원)
│   ├── rental/rental.ts                 # getRentalList (필터 지원)
│   └── job/useJob.ts                    # getJobList (필터 지원)
├── type/
│   └── job.ts                           # EMPLOYEE_TYPES → { id, label }[] 통일
└── app/(user)/
    ├── job/
    │   ├── page.tsx                     # 서버 컴포넌트 (searchParams)
    │   └── _components/
    │       ├── JobFilters.tsx           # 검색/필터 UI
    │       ├── JobList.tsx              # 카드 목록 + 세션
    │       └── JobCard.tsx              # 카드 (좋아요 자체 관리)
    ├── usedgoods/
    │   ├── page.tsx
    │   └── _components/
    │       ├── UsedGoodsFilters.tsx
    │       └── UsedGoodsList.tsx
    └── rental/
        ├── page.tsx
        └── _components/
            ├── RentalFilters.tsx
            ├── RentalList.tsx
            └── RentalCard.tsx
```
