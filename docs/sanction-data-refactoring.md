# 제재(Sanction) 데이터 구조 리팩토링

> 유저 정지/제재 데이터의 3중 복제를 제거하고, 책임을 분리하는 작업 기록.
> 작성: 2026-06-19

---

## 1. 작업 개요

### 배경
유저 정지/제재 관련 데이터가 여러 테이블에 흩어져 있었고, 특히 **제재 결과(종류 + 만료일)가 3곳에 복제**되어 정합성이 깨질 위험이 있었다.

| 테이블 | 역할 | 관계 |
|--------|------|------|
| `users.suspended_until` | **현재 정지 상태** (denormalized, 빠른 권한 체크용) | 1:1 |
| `user_sanctions` | 제재 **이력 로그** (`7d`/`30d`/`perm`/`lifted`) | 1:N |
| `common_reports` | 신고 기록 ~~+ 처리 결과~~ | 신고 단위 |
| `user_blocks` | 유저 간 **차단** (별개 도메인, 손대지 않음) | N:M |

### 문제: 제재 결과의 3중 복제
같은 제재 결과가 세 곳에 따로 저장되어 있었다:
1. `users.suspended_until`
2. `user_sanctions.sanction_type` / `expires_at`
3. `common_reports.sanction_type` / `sanction_expires_at` ← **중복의 근원**

### 목표 아키텍처 (책임 분리)
- **`users`** = 현재 상태만 (`suspended_until`) — 기존 그대로, 변경 없음
- **`user_sanctions`** = 제재 이력의 **Single Source of Truth** + `report_id` FK 추가
- **`common_reports`** = 신고 기록만. 제재 결과 컬럼 제거, `user_sanctions.report_id` 역참조로 대체
- **`user_blocks`** = 무수정 (관리자 제재가 아닌 유저 기능, N:M)

### 핵심 설계 결정
- **신고↔제재 연결 방향**: `user_sanctions.report_id` (신고 1건이 게시물 비활성화 + 유저 제재처럼 복수 액션을 낳을 수 있으므로 1:N 허용)
- **"현재 제재" 판별**: 제재 수정 시 `user_sanctions`에 새 행이 append되므로, **`report_id`가 같은 행 중 최신(created_at 최대)** 이 현재 결과
- **단계별 안전 진행 + dual-write**: Phase 1에서 읽기만 전환하고 기존 컬럼은 데이터 유지(롤백 안전망) → 안정화 후 Phase 2에서 DROP

---

## 2. 각 파일의 역할

### 마이그레이션
| 파일 | 역할 |
|------|------|
| `supabase/migrations/20260619000000_link_reports_to_sanctions.sql` | **Phase 1** — `user_sanctions.report_id` FK(+인덱스) 추가, 기존 resolved 신고 백필 |
| `supabase/migrations/20260619010000_drop_report_sanction_columns.sql` | **Phase 2** — `common_reports.sanction_type` / `sanction_expires_at` DROP |

### 쓰기 경로 (제재 부과/수정)
| 파일 | 역할 | 변경 |
|------|------|------|
| `src/app/(admin)/admin/reports/_lib/actions.ts` | 신고 처리: `resolveReport` / `updateReportResolution` / `dismissReport` | `user_sanctions` insert에 `report_id` 추가(Phase 1) + `common_reports.sanction_*` 쓰기 제거(Phase 2) |
| `src/app/(admin)/admin/users/_actions/applySanction.ts` | 관리자 직접 제재(신고 무관) | 변경 없음 — `report_id`는 NULL |
| `src/app/(admin)/admin/users/_actions/liftSanction.ts` | 정지 해제 (`lifted` 기록) | 변경 없음 |

### 읽기 경로 (제재 결과 표시)
| 파일 | 역할 | 변경 |
|------|------|------|
| `src/app/(admin)/admin/reports/page.tsx` | 신고 목록 + 제재 결과 표시 | 제재 정보를 `user_sanctions`(report_id 조인, 최신 행)에서 조회하도록 전환 |
| `src/app/(admin)/admin/posts/_actions/getPostReports.ts` | 게시물별 신고 이력 (제재 라벨 표시) | **두 번째 소비처** — `common_reports.sanction_type` 대신 `user_sanctions`에서 조회 |
| `src/app/(admin)/admin/reports/_components/ReportsClient.tsx` | 신고 UI 렌더 | 변경 없음 (page.tsx가 같은 필드를 채워줌) |
| `src/app/(admin)/admin/posts/_components/AdminPostsClient.tsx` | 게시물 신고 이력 UI | 변경 없음 (getPostReports가 같은 필드를 채워줌) |

### 정지 상태 체크 (변경 없음 — 참고)
`suspended_until`만 읽으므로 이번 리팩토링 영향 없음:
`src/middleware.ts`, `src/hooks/useSuspended.ts`, `src/hooks/useAuthInit.ts`,
`src/components/common/SuspendedBanner.tsx`, `SuspendedModal.tsx`, `src/store/chatStore.ts`

### 타입
| 파일 | 변경 |
|------|------|
| `src/type/supabase.ts` | `user_sanctions`에 `report_id` 추가 / `common_reports`에서 `sanction_type`·`sanction_expires_at` 제거 |

---

## 3. 지금까지 완성된 작업

### ✅ 완료된 작업

**Phase 1 — FK 연결 + 읽기 전환 + 백필 (코드·DB 모두 적용 완료)**
- [x] `user_sanctions.report_id` FK + 인덱스 추가 (원격 DB 적용 — SQL Editor 직접 실행)
- [x] 기존 resolved 신고 백필 (`user_id + sanction_type + expires_at` 매칭)
- [x] 미매칭 4건(id 59·63·65·67) 보정 — 신고가 기록한 결정을 그대로 담은 이력 행 합성. **잔여 0 확인**
- [x] dual-write: `resolveReport` / `updateReportResolution`의 `user_sanctions` insert에 `report_id` 추가
- [x] 읽기 전환: `page.tsx` — `user_sanctions`에서 최신 행 조회 (전환기 폴백 포함)
- [x] 타입: `supabase.ts`에 `report_id` 추가

**Phase 2 — 컬럼 DROP (코드 완료, DB 미적용)**
- [x] `actions.ts` — `common_reports.sanction_*` 쓰기 제거 (3개 함수)
- [x] `page.tsx` — select·타입·폴백에서 `sanction_*` 제거
- [x] `getPostReports.ts` — `user_sanctions`에서 제재 라벨 조회하도록 전환 (놓쳤던 소비처)
- [x] `supabase.ts` — `common_reports` 타입에서 두 컬럼 제거
- [x] DROP 마이그레이션 파일 작성
- [x] `tsc --noEmit` 통과 (기존 무관 에러 `nodemailer` 제외), `eslint` 통과

---

## 4. 앞으로 남은 작업

### ⏳ 남은 작업

1. **Phase 1 앱 동작 확인** (배포/로컬 환경)
   - 기존 신고 목록의 제재 배지가 그대로 보이는지
   - 신규 신고 처리 시 `user_sanctions.report_id` 채워지고 UI 정상
   - 제재 수정 시 최신 제재로 반영
   - 게시물 관리 페이지의 신고 이력 제재 라벨 정상

2. **Phase 2 DROP 실행** — ⚠️ **반드시 코드 배포 후**
   - 순서: `코드 머지·배포` → DROP. 구 코드가 살아있는 상태에서 DROP하면 컬럼에 쓰던 코드가 에러남
   - SQL Editor에서 (이력 divergence 때문에 `db push` 대신 직접 실행):
     ```sql
     ALTER TABLE common_reports DROP COLUMN IF EXISTS sanction_type;
     ALTER TABLE common_reports DROP COLUMN IF EXISTS sanction_expires_at;
     ```
   - 며칠 운영해보고 문제없을 때 진행 권장 (서두를 이유 없음)

### 🔧 별도 과제: 마이그레이션 이력 divergence

**진단 완료** — 로컬↔원격 마이그레이션 *이력 기록*이 어긋나 있으나, **스키마는 완전히 일치**(11개 객체 존재 확인). 순수 기록 불일치라 위험한 스키마 문제는 없음. 단, 이 때문에 `supabase db push`가 막혀 있어 이번 마이그레이션도 SQL Editor로 우회 적용함.

**상태**
- 원격 `schema_migrations`에 ~30개 기록 — 로컬 파일 없음 (과거 파일 squash/삭제 추정)
- 로컬 마이그레이션이 원격 기록에 없음 — SQL Editor 직접 적용으로 기록 누락 추정

**권장 해결 (실행은 팀 합의 후, 다른 마이그레이션 작업 없는 시점)**
```bash
# 1) 로컬 파일이 이미 적용됨 → applied 기록
supabase migration repair --status applied 20260618000000 20260618083928 \
  20260618100000 20260618100438 20260618120000 20260619000000

# 2) 원격 기록뿐(로컬 파일 없음) 30개 → reverted 기록 정리
supabase migration repair --status reverted 20260602142723 ... 20260618070237

# 3) 확인 후 push
supabase migration list
supabase db push
```
**트레이드오프**: 30개를 reverted 처리하면 그 파일이 로컬에 없으므로 `supabase db reset` 시 기반 스키마 복원 불가. 완전한 재구축 소스가 필요하면 추가로 `supabase db pull`로 현재 원격 스키마를 baseline 마이그레이션으로 캡처해야 함.

---

## 부록: 검증 쿼리

**백필 잔여 확인** (0이어야 정상)
```sql
SELECT count(*) FROM common_reports cr
WHERE cr.status = 'resolved' AND cr.sanction_type IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM user_sanctions us WHERE us.report_id = cr.id);
```

**정합성 대조** (현재 상태 vs 최신 이력)
```sql
-- 정지 중인 유저의 suspended_until 과 최신 활성 제재 expires_at 일치 확인
SELECT u.id, u.suspended_until, us.expires_at
FROM users u
JOIN LATERAL (
  SELECT expires_at FROM user_sanctions
  WHERE user_id = u.id AND sanction_type <> 'lifted'
  ORDER BY created_at DESC LIMIT 1
) us ON true
WHERE u.suspended_until IS NOT NULL;
```
