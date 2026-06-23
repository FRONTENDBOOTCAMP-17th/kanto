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
- `multiple_permissive_policies` WARN(posts/used_goods/jobs/rentals/users/comments/community_posts/dating_profiles, SELECT/UPDATE/DELETE)는 미적용.
- 사유: 8개 테이블 보안 정책을 OR 단일화하는 전면 재작성이라 보안 면적이 크고, 현재 규모에선 이득 미미. PERMISSIVE 정책은 어차피 OR로 평가되므로 기능 동일하나, 안전하게 별도 리뷰 회차(가능하면 팀과)로 진행 권장.

### 후속
- [ ] C-3 중복 정책 병합(리뷰 회차).
- [ ] 데이터 증가 후 `unused_index` 재평가(실제 사용 시작되면 INFO 사라짐).
- 권장 다음 단계: B(진짜 페이지네이션/필터) 또는 D(캐싱).
