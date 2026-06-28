# 2026-06-23 성능 감사 — 채팅 제외

`bug/notification_bug` 세션 연장. 채팅(다른 팀원 진행 중) 외 user/admin 전반의 성능 저하 지점을 감사.

## 전제 / 측정 맥락

- 현재 데이터 규모 작음(원격 실측): posts 71 / used_active 45 / jobs_active 13 / rental_active 9 / users 21 / reports 17.
- 따라서 **현재 체감 느림의 주범 = ① 요청당 순차 왕복(레이턴시) 횟수 + ② 캐싱 부재.**
  fetch-everything·인덱스 누락은 데이터 증가 시 터지는 **확장성 폭탄**이며 지금도 상수 오버헤드.
- DB 리전 `ap-southeast-1`(싱가포르) → 왕복 1회당 수십~수백 ms 누적.
- 증거: 코드 정독 + Supabase performance advisor + 원격 카운트 쿼리.

---

## 🔴 A. 요청당 순차 왕복 과다 — 채팅과 동일 원인, 즉시 체감

### A1. 상세 페이지 워터폴 (used/job/rental 전부)
- **원인**: 독립 쿼리를 `await` 직렬 실행.
  - `job/[id]/page.tsx:22,28,29,30` — getJobDetail → viewCountUp → getUserLikeReportStatus → getTranslations (4직렬)
  - `usedgoods/[id]/page.tsx:16,20,27,29` — item → 연관상품 → like/report → viewCountUp (4직렬)
  - `rental/[id]/page.tsx:21,27,30` (3직렬)
  - `getUserLikeReportStatus.ts:14,18,26` 내부도 getUser → users → like/report 쌍 = 최대 3직렬.
  - **상세 1페이지 ≈ 싱가포르 왕복 5~7회 직렬.** `viewCountUp`(쓰기)이 렌더를 막음.
- **해결**: 본문 받은 뒤 viewCountUp/연관상품/like-report를 `Promise.all` 병렬. viewCountUp는 강한 일관성 불필요 → 렌더 블로킹 해제.

### A2. `auth_id → 내부 user.id` 반복 해석 (전역)
- **원인**: `auth.getUser()` + `users.select("id").eq("auth_id")`를 서비스마다 재실행
  (`getUserLikeReportStatus.ts:14-22`, `rental.ts:100-108`, `api/chat/list/route.ts:8-17` 등).
  목록 페이지는 한 요청에서 getSessionUser·getLikeList·getIdentityVerified가 각자 해석 → 동일 조회 3~4회 중복.
- **해결**: 요청 스코프 1회 해석 후 재사용(React `cache()` 메모이즈). 향후 JWT custom claim으로 DB 조회 제거.

---

## 🟠 B. Fetch-everything + 가짜 페이지네이션 + JS 필터

### B1. 목록 페이지 (used/job/rental 공통)
- `.limit()` 없음 → 활성 전체 로드 (`usedGoods.ts:23-29`, `job.ts:15-20`, `rental.ts:40-45`).
- **페이지네이션이 JS**: `usedgoods/page.tsx:40-44` 전부 받고 `slice()`.
- **카테고리/지역/타입 필터도 JS**: `usedGoods.ts:47-56`, `job.ts:38-47`, `rental.ts:63-70`.
- `select("*") + 조인(*)` 과다 컬럼.
- **해결**: DB `.range()` + `count:"exact"`, 필터 `.eq()` push, select 최소 컬럼.

### B2. 인기 목록 (메인)
- `getPopularList`(`main.ts:6-10`) used/job/rental 전체 3개 로드. `getPopularJobs`(`job.ts:52-72`) 전체 받아 JS sort 후 `slice(0,5)`.
- **해결**: 인기 컬럼 기준 `.order().limit(5)` 전용 쿼리 또는 집계 뷰.

### B3. Admin 목록
- `getAdminUsers`(`adminUsers.ts:33-67`)·`getAdminPosts`(`adminPosts.ts:42-47`) 페이지네이션 없이 전 테이블 + JS 집계.
- **해결**: 서버 페이지네이션(`range`) + DB 집계(`count`/`group by`).

---

## 🟡 C. DB 인덱스 / RLS — 모든 쿼리 상수 오버헤드 (advisor 실증)

| 항목 | 증거 | 해결 |
|---|---|---|
| 조인 FK 인덱스 누락 | `used_goods.post_id`,`jobs.post_id`,`rentals.post_id`,`posts.user_id`,`common_likes.target_id/user_id`,`common_reports.user_id/handled_by`,`comments.*`,`user_sanctions.*` unindexed | FK 커버링 인덱스 + 복합 `posts(post_type,status,created_at desc)` |
| RLS per-row 재평가 | `auth_rls_initplan` WARN: users, reviews | `auth.uid()` → `(select auth.uid())` |
| 중복 허용 정책 | `multiple_permissive_policies` WARN: posts/used_goods/jobs/rentals/users/comments 등 | admin+본인 정책 `OR` 단일화 |
| `ilike '%..%'` 선행 와일드카드 | `usedGoods.ts:39`,`job.ts:30`,`rental.ts:55` | pg_trgm 또는 full-text(tsvector) |

## 🟢 D. 캐싱 부재
- `usedgoods/[id]/page.tsx:1` `force-dynamic` → 매 조회 DB 직격.
- **해결**: 공개 데이터 ISR/세그먼트 캐시, 사용자별 부분만 클라이언트/Suspense 분리.

---

## 우선순위 / 진행

1. **A (왕복 병렬화 + auth id 캐시)** — 코드만, 리스크 낮음, 채팅 외 전 페이지 즉시 체감. ← **본 세션 진행**
2. **C (인덱스 + RLS)** — 마이그레이션 1~2개, 추가형이라 리스크 낮음.
3. **B (진짜 페이지네이션/필터)** — 효과 크나 UI까지 수정, 중간 작업량.
4. **D (캐싱)** — 공개/사용자별 분리 설계 필요, 중간.

### 진행 로그
- [x] **A2 user 해석 React `cache()` 메모이즈** (2026-06-23)
  - `user.ts`: `getAuthUser`/`getCurrentUserId` `cache()` 추가, `getSessionUser`도 `cache()` 래핑, `getIdentityVerified`가 `getAuthUser` 공유.
  - `likes.ts`·`getUserLikeReportStatus.ts`: 자체 `getUser()`+`users` 조회 제거 → `getCurrentUserId()` 사용.
  - 효과: 한 요청에서 여러 서비스가 호출하던 `auth.getUser()`/users 조회가 1회로 dedupe(특히 목록 페이지의 getSessionUser+getLikeList+getIdentityVerified 동시 호출).
- [x] **A1 상세 3페이지 워터폴 병렬화 + `after()`** (2026-06-23)
  - `usedgoods/[id]`: 연관상품 + like/report `Promise.all`, `viewCountUp` → `after()`.
  - `job/[id]`: like/report + `getTranslations` `Promise.all`, `viewCountUp` → `after()`.
  - `rental/[id]`: `viewCountUp` → `after()` (잔여는 like/report 단건).
  - 효과: 상세 진입 직렬 5~7 왕복 → 본문 1회 + 병렬 1회. 조회수 쓰기는 응답 후 실행(렌더 비차단).
  - 검증: `tsc --noEmit` 0, `eslint` 0.

### 후속(A 범위 외, 동일 패턴 확장 가능)
- `getSessionUser`가 root `layout.tsx`와 페이지에서 중복 호출되던 것도 `cache()`로 dedupe됨(부수 이득).
- `api/chat/list/route.ts` 등 라우트 핸들러의 auth_id→id 조회는 채팅 담당자 작업과 겹쳐 미수정.

---

## C 진행 로그 (인덱스 + RLS) — 2026-06-23, 사용자 명시 승인 하 적용

> ⚠️ 프로덕션 마이그레이션은 auto-mode 분류기가 "모호한 지시"로 1차 거부 → AskUserQuestion으로 명시 승인 후 적용.

### C-1. 인덱스 — `20260623044432_perf_add_indexes`
- FK 커버링 17개 + 복합 `posts(post_type,status,created_at desc)` + `pg_trgm` 트라이그램(`posts.title`).
- 채팅 테이블(chats/messages) 제외 — 채팅 담당자가 같은 DB에 `add_chat_performance_indexes`/`add_mark_chat_read_rpc`를 별도 적용 중인 것을 마이그레이션 목록에서 확인, 충돌 회피.
- 검증: 어드바이저의 `unindexed_foreign_keys` 중 타깃 항목 전부 해소(남은 건 의도 제외분).
- **단서**: 현재 71행 규모라 Postgres가 seq scan을 선호 → 새 인덱스 17개가 어드바이저에 `unused_index`(INFO)로 뜸. 정상이며 데이터 증가 대비용. 즉각 체감 변화는 미미.

### C-2. RLS initplan — `20260623044501_perf_rls_initplan`
- `auth.uid()` → `(select auth.uid())` 래핑(의미 보존). 대상: `users`(본인수정), `reviews`(select_admin/insert_user/update_admin).
- `ALTER POLICY`로 적용(정책 공백 구간 없음). `role = my_role()` 가드 보존 확인.
- 검증: 어드바이저 `auth_rls_initplan` WARN **전부 해소**.

### C-3. 중복 허용 정책 병합 — **보류**
- `multiple_permissive_policies` WARN(posts/used_goods/jobs/rentals/users/comments/dating_profiles, SELECT/UPDATE/DELETE)는 미적용.
- 사유: 8개 테이블 보안 정책을 OR 단일화하는 전면 재작성이라 보안 면적이 크고, 현재 규모에선 이득 미미. PERMISSIVE 정책은 어차피 OR로 평가되므로 기능 동일하나, 안전하게 별도 리뷰 회차(가능하면 팀과)로 진행 권장.

### 후속
- [ ] C-3 중복 정책 병합(리뷰 회차).
- [ ] 데이터 증가 후 `unused_index` 재평가(실제 사용 시작되면 INFO 사라짐).

---

## B 진행 로그 (페이지네이션/필터) — 2026-06-23

### B1. 목록 3종 DB 페이지네이션 + DB 필터
- 서비스 시그니처 변경: `getUsedGoodsList`/`getJobList`/`getRentalList` → `(filter, pagination?) => { posts, total }`.
  - `used_goods!inner`/`jobs!inner`/`rentals!inner` 로 바꿔 자식 컬럼 필터를 DB로 push:
    - 카테고리/지역(`used_goods.category`,`used_goods.location_type`), 고용형태/지역(`jobs.employee_type`,`jobs.location_type`), 방종류/지역(`rentals.room_type`,`rentals.location`).
  - `count: "exact"` + `.range()` 로 진짜 페이지네이션. `created_at`+`id` 정렬로 경계 안정성 확보.
  - location 값은 URL string → `TradeLocation` 캐스팅(드롭다운으로 값 제한됨).
- 호출처 6곳 갱신: `usedgoods/page`,`job/page`,`rental/page`(페이저 `total` 사용), `myposts/page`,`favorites/page`(DB 페이지네이션으로 전환, `offset` 슬라이스 제거).
- 효과: "12개 보여주려 전체 테이블 + 조인 + 이미지 페치 후 JS slice" → 페이지당 정확히 N건만 페치. JS 필터 제거.
- 검증: `tsc` 0, `eslint` 0.

### B2. 인기목록 전용 소량 페치
- `getPopularList`(main): 종류별 전체 → `{page:1,pageSize:4}` 4건씩만. 반환을 `{posts}`로 풀어 `Popular.tsx` 계약 유지.
- `getPopularJobs`: 전체 jobs 스캔 → `not("jobs.popular_count","is",null)` 로 큐레이션된 소량만 DB에서 추린 뒤 JS 정렬(부모를 자식 컬럼으로 정렬은 PostgREST 불가).

### B3. Admin 목록 — **보류**
- `getAdminPosts`/`getAdminUsers` 는 admin 클라이언트 컴포넌트가 클라이언트 측 페이지네이션 → 서버 페이지네이션 전환은 UI(페이저 URL 연동)까지 손봐야 함. admin 저트래픽이라 ROI 낮아 별도 회차로 보류.

---

## D 진행 로그 (캐싱) — 2026-06-23, **의도적 보류 + 사유**

조사 결과 **안전하게 출시 가능한 코드 캐싱이 없음**을 확인하여, cosmetic 변경으로 흉내내지 않고 설계만 남긴다.

- 상세/목록 페이지는 per-user 데이터(getSessionUser/getLikeList, 쿠키 의존)와 공개 데이터가 섞여 **세그먼트 단위 ISR 불가**(쿠키 read → 항상 dynamic).
- 공개 본문만 `unstable_cache`로 캐싱하려면 **태그 무효화 배선**이 필요한데, 게시글 변경 지점이 흩어져 있어 누락 시 **가격/판매완료(is_sold)/예약(is_reserved) stale = 거래 플랫폼 치명적 버그**:
  - 클라이언트 폼(`useCreateJobForm`, `CreateUsedGoodsForm.tsx`, `RentalCreateForm.tsx`, `DeleteButton.tsx`)은 브라우저 supabase 클라이언트 직접 호출 → `revalidateTag` 불가(서버 액션 아님).
  - `paymentActions`(is_sold)·`toggleReserveAction`(is_reserved)은 **채팅 패널 소유** → 채팅 담당자 작업과 겹침.
- `usedgoods/[id]` 의 `force-dynamic` 제거도 **순효과 없음**(쿠키 read로 어차피 dynamic) → 안 건드림.
- **권장(별도 회차)**: ① 게시글 변경을 서버 액션으로 일원화 → ② 공개 detail/list 페치를 anon 클라이언트 + `unstable_cache`(tag `post-{id}`) → ③ 모든 변경 액션에 `revalidateTag`. 채팅 소유 액션은 담당자와 조율. runtime 검증 가능한 환경에서 진행.

### 진행 로그
- [x] B1 목록 3종 DB 페이지네이션 + DB 필터
- [x] B2 인기목록 전용 소량 페치
- [ ] B3 admin 서버 페이지네이션(보류)
- [~] D 캐싱 — 안전 범위 없음 확인, 설계만 문서화(보류)
