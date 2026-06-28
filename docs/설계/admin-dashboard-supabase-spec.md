# Admin Dashboard — Supabase 연동 명세

> 브랜치: `feat/admin-dashboard`  
> 작성일: 2026-06-15

---

## 0. SQL 설정 파일이 생긴 이유

어드민 대시보드는 기존 Kanto 서비스 코드에 존재하지 않던 두 가지가 필요했다.

### 문제 1 — 기존 Supabase JS 클라이언트로는 표현하기 어려운 집계 쿼리

대시보드에 필요한 데이터 중 일부는 여러 테이블을 JOIN하거나 `UNION`으로 합산해야 한다.

예를 들어 **지역별 게시글 수**는 `used_goods`, `rentals`, `jobs` 세 테이블에 지역 정보가 흩어져 있어서, 이를 Supabase JS 체이닝 API로 작성하면 쿼리를 3번 따로 날린 뒤 프론트에서 합쳐야 한다. 이런 경우 Postgres 함수(RPC)로 등록해두면 DB 안에서 한 번에 처리하고 결과만 반환받을 수 있다.

또한 **활성 사용자 수**는 posts, chats(user_id_1/2), comments를 모두 합산해야 해서 단순 JS 쿼리로는 작성이 어렵다.

→ `admin_setup_02_rpc.sql`이 이 문제를 해결하기 위해 생성됨

### 문제 2 — 대시보드 전용 집계 쿼리의 성능

대시보드는 페이지 진입 시 14개 쿼리를 동시에 실행한다. 이 중 `common_reports`, `posts`, `users`에 대한 쿼리는 항상 `status`, `created_at`, `deleted_at` 같은 컬럼을 조건으로 사용하는데, 이 컬럼들에 인덱스가 없으면 테이블 전체를 스캔한다.

또한 신고 처리 완료 시각을 기록할 컬럼(`resolved_at`)이 `common_reports`에 없어서 처리율·평균 처리 시간 통계를 낼 수 없었다.

→ `admin_setup_01_indexes.sql`이 이 문제를 해결하기 위해 생성됨

### 적용 방법

두 파일 모두 **Supabase Dashboard → SQL Editor**에서 순서대로 한 번만 실행하면 DB에 영구 반영된다.

```
1. admin_setup_01_indexes.sql  실행  (인덱스 3개 + resolved_at 컬럼 추가)
2. admin_setup_02_rpc.sql      실행  (RPC 함수 5개 등록)
```

`CREATE INDEX IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION`을 사용하므로 중복 실행해도 오류가 발생하지 않는다.

---

## 1. DB 변경 사항

### 1-1. 컬럼 추가 (`common_reports`)

```sql
ALTER TABLE common_reports
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
```

신고 처리 시각을 기록하는 컬럼. 대시보드의 **처리율 · 평균 처리 시간** 계산에 사용.  
신고를 처리할 때 이 컬럼에 처리 완료 시각을 기록해야 통계가 정상 동작함.

---

### 1-2. 인덱스 추가 (`admin_setup_01_indexes.sql`)

대시보드에서 빈번하게 실행되는 집계 쿼리의 성능 최적화용.

```sql
CREATE INDEX IF NOT EXISTS idx_common_reports_status_type_created
  ON common_reports (status, target_type, created_at);

CREATE INDEX IF NOT EXISTS idx_posts_status_created
  ON posts (status, created_at);

CREATE INDEX IF NOT EXISTS idx_users_created_deleted
  ON users (created_at, deleted_at);
```

---

### 1-3. RPC 함수 등록 (`admin_setup_02_rpc.sql`)

Supabase JS 클라이언트에서 직접 집계하기 어려운 쿼리를 Postgres 함수로 등록.

#### `get_daily_signups(days int)`

날짜별 신규 가입자 수 반환. 추이 차트(30일)에 사용.

```sql
SELECT DATE(created_at) AS day, COUNT(*) AS count
FROM users
WHERE created_at >= CURRENT_DATE - (days || ' days')::interval
  AND deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY day;
```

#### `get_active_users_count(days int)`

게시글 작성 · 채팅 · 댓글을 기준으로 활성 사용자 수 집계. KPI 카드에 사용.

```sql
SELECT COUNT(DISTINCT uid) AS count FROM (
  SELECT user_id AS uid FROM posts
    WHERE created_at >= NOW() - (days || ' days')::interval
  UNION
  SELECT user_id_1 AS uid FROM chats
    WHERE last_message_at >= NOW() - (days || ' days')::interval
  UNION
  SELECT user_id_2 AS uid FROM chats
    WHERE last_message_at >= NOW() - (days || ' days')::interval
  UNION
  SELECT user_id AS uid FROM comments
    WHERE created_at >= NOW() - (days || ' days')::interval
) sub;
```

#### `get_region_post_counts(days int)`

used_goods · rentals · jobs 테이블의 지역 정보를 합산해 지역별 게시글 수 반환. 지역 차트에 사용.

```sql
SELECT location, COUNT(*) AS count FROM (
  SELECT ug.location_type::text AS location
    FROM posts p JOIN used_goods ug ON ug.post_id = p.id
    WHERE p.created_at >= NOW() - (days || ' days')::interval AND p.status = 'active'
  UNION ALL
  SELECT r.location::text AS location
    FROM posts p JOIN rentals r ON r.post_id = p.id
    WHERE p.created_at >= NOW() - (days || ' days')::interval AND p.status = 'active'
  UNION ALL
  SELECT j.location_type::text AS location
    FROM posts p JOIN jobs j ON j.post_id = p.id
    WHERE p.created_at >= NOW() - (days || ' days')::interval AND p.status = 'active'
) sub
WHERE location IS NOT NULL
GROUP BY location
ORDER BY count DESC
LIMIT 6;
```

#### `get_reported_users(limit_count int)`

pending 상태 신고 중 회원 대상만 집계. 신고 큐에 사용.

```sql
SELECT r.target_id AS user_id, u.name, u.avatar_url,
  COUNT(r.id) AS report_count,
  MAX(r.reason) AS latest_reason,
  MIN(r.created_at) AS first_reported_at
FROM common_reports r
JOIN users u ON u.id = r.target_id
WHERE r.target_type = 'user' AND r.status = 'pending'
GROUP BY r.target_id, u.name, u.avatar_url
ORDER BY report_count DESC
LIMIT limit_count;
```

#### `get_reported_posts(limit_count int)`

pending 상태 신고 중 게시글 대상만 집계. 신고 큐에 사용.

```sql
SELECT r.target_id AS post_id, p.title, p.post_type::text,
  COUNT(r.id) AS report_count,
  MAX(r.reason) AS latest_reason,
  MIN(r.created_at) AS first_reported_at
FROM common_reports r
JOIN posts p ON p.id = r.target_id
WHERE r.target_type = 'post' AND r.status = 'pending'
GROUP BY r.target_id, p.title, p.post_type
ORDER BY report_count DESC
LIMIT limit_count;
```

---

## 2. 대시보드 데이터 연동 구조

`src/app/(admin)/admin/page.tsx`는 Server Component로, 렌더링 시 `Promise.all`로 아래 쿼리를 병렬 실행. `createAdminClient()`(service_role 키)를 사용해 RLS를 우회하므로 모든 데이터에 제한 없이 접근 가능.

### 2-1. Supabase JS 직접 쿼리

| 목적              | 테이블           | 조건                                                      |
| ----------------- | ---------------- | --------------------------------------------------------- |
| 총 회원수         | `users`          | `deleted_at IS NULL`                                      |
| 오늘 신규 가입    | `users`          | `created_at >= 오늘 00:00` + `deleted_at IS NULL`         |
| 총 게시글         | `posts`          | `status = 'active'`                                       |
| 오늘 신규 게시글  | `posts`          | `status = 'active'` + `created_at >= 오늘 00:00`          |
| 처리 대기 신고    | `common_reports` | `status = 'pending'` (긴급 배너 + 신고 큐)                |
| 전체 게시글 분포  | `posts`          | `status = 'active'` (도넛 차트용 `post_type` 집계)        |
| 인기 게시글 Top 5 | `posts`          | `status = 'active'` → `view_count` 내림차순 limit 5       |
| 신고 유형 분포    | `common_reports` | `created_at >= 30일 전` (reason 텍스트 집계)              |
| 신고 처리 통계    | `common_reports` | `created_at >= 30일 전` (status, created_at, resolved_at) |

### 2-2. RPC 호출

| 호출                     | 파라미터              | 사용 위치               |
| ------------------------ | --------------------- | ----------------------- |
| `get_daily_signups`      | `{ days: 30 }`        | 신규 가입자 추이 차트   |
| `get_active_users_count` | `{ days: 7 }`         | 활성 사용자 KPI 카드    |
| `get_region_post_counts` | `{ days: 7 }`         | 지역별 신규 게시글 차트 |
| `get_reported_users`     | `{ limit_count: 10 }` | 신고 큐 — 회원 탭       |
| `get_reported_posts`     | `{ limit_count: 10 }` | 신고 큐 — 게시글 탭     |

---

## 3. 프론트엔드 가공 로직

Supabase에서 받은 원시 데이터를 화면에 맞게 변환하는 주요 로직.

### post_type 레이블 매핑

```ts
const POST_TYPE_LABEL: Record<string, string> = {
  used_goods: "중고거래",
  jobs: "구인구직",
  rental: "방렌트",
};
```

### 신고 reason 정규화

DB에 자유 텍스트로 저장된 `reason`을 6개 유형으로 정규화:

```ts
function normalizeReason(reason: string | null): string {
  if (reason?.includes("사기") || reason?.includes("거래"))
    return "사기 · 거래 분쟁";
  if (reason?.includes("욕설") || reason?.includes("비방"))
    return "욕설 · 비방";
  if (reason?.includes("스팸") || reason?.includes("광고"))
    return "스팸 · 광고";
  if (reason?.includes("허위")) return "허위 정보";
  if (reason?.includes("불법") || reason?.includes("촬영"))
    return "불법 촬영물";
  return "기타";
}
```

### 신규 가입자 추이 — 빈 날짜 채우기

RPC는 가입자가 있는 날짜만 반환하므로, 없는 날짜를 0으로 채워 연속된 30일 배열 생성:

```ts
function fillDailyGaps(raw: { day: string; count: number }[], days: number) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0];
    const found = raw.find((r) => String(r.day).startsWith(key));
    return { day: key, count: Number(found?.count ?? 0) };
  });
}
```

### 신고 처리 통계 계산

`resolved_at`과 `created_at`의 차이로 평균 처리 시간(시간 단위) 계산:

```ts
const hours = resolved
  .filter((r) => r.resolved_at !== null)
  .map(
    (r) =>
      (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) /
      3_600_000,
  );
const avgHours = hours.length
  ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10
  : null;
```

---

## 4. 기존 코드 수정 사항

### `GlobalLayout.tsx` — 어드민 경로 분리

```ts
const isAdmin = pathname.startsWith("/admin");
const hideShell = isTerms || isLogin || isSignup || isChat || isAdmin;
```

`/admin` 경로에서 일반 유저용 Header · Footer · ScrollToTop을 숨김.  
어드민은 자체 레이아웃(`src/app/(admin)/layout.tsx`)의 사이드바를 사용하기 때문.

### `usedGoods.ts` — 필터 옵션 추가

```ts
interface UsedGoodsListFilter {
  search?: string;
  category?: string;
  location?: string;
  targetIds?: number[]; // 추가: 특정 게시글 ID 목록으로 필터링
  userId?: number; // 추가: 특정 유저의 게시글만 조회
}
```

어드민에서 특정 유저나 특정 게시글 목록을 조회할 수 있도록 확장.

---

## 5. 잔여 이슈

### `common_reports.reason` 자유 텍스트

기존 신고 일부가 자유 텍스트(`'스팸성 광고 게시글로 의심됩니다.'` 등)로 저장됨.  
신고 폼을 드롭다운으로 교체하거나, DB에 정규화된 ENUM 타입 적용 권장.
