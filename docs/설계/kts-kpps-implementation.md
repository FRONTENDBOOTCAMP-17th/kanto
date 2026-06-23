# 망고 지수 (KTS / KPPS) 구현 문서

> 설계 원본: [kanto-trust-score(KTS).md](./kanto-trust-score(KTS).md) · [kanto-popular-post-score(KPPS).md](./kanto-popular-post-score(KPPS).md)

---

## 구현 범위

| 항목 | 상태 |
|------|------|
| DB 컬럼 추가 (`users`, `posts`) | ✅ |
| `user_trust_history` 테이블 | ✅ |
| `recalculate_kts()` 배치 함수 | ✅ |
| `recalculate_kpps()` 배치 함수 | ✅ |
| pg_cron 스케줄 등록 | ✅ |
| TypeScript 타입 반영 | ✅ |
| 프로필 페이지 망고 지수 UI | ✅ |

---

## 1. 데이터베이스

### 마이그레이션 파일
`supabase/migrations/20260623100000_kts_kpps_scoring.sql`

### 추가된 컬럼

**`users` 테이블**

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `kts_score` | NUMERIC(5,2) | 36 | KTS 점수 (0~100) |
| `kts_grade` | TEXT | 'D' | 등급 (A/B/C/D/E) |

**`posts` 테이블**

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `kpps_score` | NUMERIC(5,2) | 0 | KPPS 점수 (0~100) |
| `is_popular` | BOOLEAN | false | 인기 배지 여부 |

### 신규 테이블 — `user_trust_history`

TrendScore 계산을 위한 주간 등급 스냅샷 테이블.

```sql
user_trust_history (
  user_id     bigint  PK, FK → users(id)
  week_date   date    PK       -- 해당 주 월요일
  kts_score   integer
  grade_level integer          -- 0=E, 1=D, 2=C, 3=B, 4=A
)
```

---

## 2. 배치 함수

### `recalculate_kts()`

전체 유저를 순회하며 5개 구성 요소를 계산 후 `users.kts_score` / `users.kts_grade` 를 업데이트하고, `user_trust_history`에 주간 스냅샷을 upsert 합니다.

| 구성 요소 | 계산 기준 |
|---------|---------|
| ReviewScore (±25) | `reviews` 테이블 평균 별점 × 신뢰 가중치 |
| TransactionScore (0~15) | `transactions.status = 'released'` 완료 건수 × 1.5 |
| ActivityScore (0~10) | 계정 나이(최대 6점) + 게시글 수(최대 4점) |
| TrendScore (0~14) | `user_trust_history` 최근 4주 등급 패턴 |
| PenaltyScore | resolved 신고 ×8 + 7일 제재 ×5 + 30일 제재 ×15 |

**제재 타입 매핑** (`user_sanctions.sanction_type`)

| DB 값 | 감점 |
|-------|------|
| `7d` | -5점 |
| `30d` | -15점 |
| `perm` | 미반영 (설계 문서 미정의) |

**TrendScore 주의사항**  
`user_trust_history`에 4주치 데이터가 쌓인 후부터 계산됩니다. 초기 4주간은 TrendScore = 0.

### `recalculate_kpps()`

`rental` / `used_goods` 게시물을 대상으로 KPPS를 계산하고 유형별 상위 5개에 `is_popular = TRUE`를 부여합니다. **반드시 `recalculate_kts()` 이후 실행해야** KTSBonus가 당일 등급을 반영합니다.

### pg_cron 스케줄

| 함수 | 실행 시각 |
|------|---------|
| `recalculate_kts()` | 매일 03:00, 15:00 |
| `recalculate_kpps()` | 매일 03:30, 15:30 |

---

## 3. TypeScript 타입

`src/type/supabase.ts` 에 수동으로 반영. 마이그레이션을 Supabase 클라우드에 적용한 뒤 `npm run gen:types`를 실행하면 자동 동기화됩니다.

**`useAuthInit.ts`** — `USER_COLUMNS`에 `kts_score, kts_grade` 추가.  
로그인 세션 초기화 및 제재 알림 수신 시 해당 컬럼도 함께 fetching합니다.

---

## 4. 프론트엔드

### 컴포넌트

**`ProfileScore.tsx`** (`src/app/(user)/profile/_components/`)

- `user.kts_score` / `user.kts_grade` 를 읽어 표시
- 페이지 진입 시 0 → 현재 점수까지 1.2초 easeOutQuart 카운트 업 애니메이션
- 등급별 색상 진행 바 (A=teal / B=blue / C=yellow / D=orange / E=red)
- **"지금 갱신" 버튼** — 테스트용, 배포 전 제거 필요

**`ProfileInfoSection.tsx`** — 망고 지수 섹션에서 `<ProfileScore user={user} />` 렌더링

### 서버 액션

**`_lib/actions.ts`** (`src/app/(user)/profile/`)

```ts
// 테스트용 수동 갱신 — 배포 전 제거
export async function refreshKtsScore() {
  await admin.rpc("recalculate_kts");
  await admin.rpc("recalculate_kpps");
}
```

---

## 5. 배포 전 체크리스트

- [ ] Supabase 대시보드에서 마이그레이션 SQL 적용 확인
- [ ] `npm run gen:types` 실행 후 `supabase.ts` 교체
- [ ] "지금 갱신" 버튼 및 `refreshKtsScore` 서버 액션 제거
- [ ] pg_cron 스케줄 등록 여부 확인 (`cron.job` 테이블)
- [ ] 첫 배치 실행 전 `SELECT recalculate_kts()` 수동 실행으로 전체 유저 초기 점수 부여
