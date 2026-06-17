# Admin Reports — 신고 처리 및 제재 로직 구현

## 개요

어드민 신고 내역 페이지에서 **검토 버튼 클릭 → 처리완료/무시 → DB 반영** 흐름과,
처리 완료 후 상세를 다시 열어 **수정**할 수 있는 기능을 구현했습니다.

---

## 작업 폴더 구조

```
src/app/(admin)/admin/reports/
├── page.tsx                          ← 서버 컴포넌트 (데이터 페칭)
├── _lib/
│   ├── constants.ts                  ← 타입 및 스타일 상수
│   └── actions.ts                    ← 서버 액션 (신규)
└── _components/
    └── ReportsClient.tsx             ← 클라이언트 컴포넌트 (UI)
```

---

## 각 파일 역할

### `page.tsx` — 서버 컴포넌트

- 어드민 권한 확인 후 `common_reports` 전체 목록을 조회합니다.
- 신고된 게시글/유저 정보를 배치 조회(N+1 방지)하여 `Report` 객체로 가공합니다.
- **이번 작업에서 추가된 컬럼**: `resolved_at`, `post_deactivated`, `sanction_type`, `sanction_expires_at`를 함께 조회하고 `ReportsClient`에 전달합니다.
- `createAdminClient()`(서비스 롤 키)를 사용하여 RLS를 우회합니다.

---

### `_lib/constants.ts` — 타입 및 상수

공통 타입과 스타일 토큰을 정의합니다.

| 항목 | 설명 |
|------|------|
| `ReportType` | `"post"` \| `"user"` |
| `Status` | `"pending"` \| `"resolved"` \| `"dismissed"` |
| `Sanction` | `"none"` \| `"7d"` \| `"30d"` \| `"perm"` |
| `Outcome` | 처리 결과 객체 (deactivated, sanctionLabel, target, resolvedDate) |
| `Report` | 신고 데이터 인터페이스 |
| `REASON_STYLE` | 신고 사유별 색상 맵 |
| `STATUS_STYLE` | 처리 상태별 라벨·색상 맵 |
| `SANCTION_LABEL` | 제재 키 → 한국어 라벨 맵 |

**이번 작업에서 `Report` 인터페이스에 추가된 필드:**

```typescript
targetId: number          // common_reports.target_id (서버 액션에 전달)
authorId?: number         // 게시글 신고 시 작성자 user_id (제재 대상)
resolvedAt?: string | null       // 처리 일시
postDeactivated?: boolean        // 게시글 비활성화 여부
sanctionType?: Sanction | null   // 적용된 제재 종류
sanctionExpiresAt?: string | null // 제재 만료 일시
```

---

### `_lib/actions.ts` — 서버 액션 (신규 생성)

`"use server"` 지시어를 사용하는 서버 액션 파일입니다.
`createAdminClient()`로 DB에 직접 쓰고, 완료 후 `revalidatePath("/admin/reports")`를 호출하여 페이지 데이터를 갱신합니다.

#### `resolveReport(reportId, opts)`

대기중 신고를 **처리완료**로 변경합니다.

1. `common_reports` 업데이트: `status = 'resolved'`, `resolved_at`, `post_deactivated`, `sanction_type`, `sanction_expires_at`
2. 게시글 비활성화 옵션이 켜진 경우 → `posts.status = 'inactive'`
3. 제재가 선택된 경우 → `users.suspended_until` 업데이트
   - `7d`: 현재 시각 + 7일
   - `30d`: 현재 시각 + 30일
   - `perm`: `9999-12-31T23:59:59Z` (영구)

#### `dismissReport(reportId)`

신고를 **무시 처리**합니다.

- `common_reports` 업데이트: `status = 'dismissed'`, `resolved_at`, 나머지 결과 컬럼 초기화

#### `updateReportResolution(reportId, opts)`

이미 처리된 신고의 결과를 **수정**합니다.

- 게시글 비활성화 **취소** 시 → `posts.status = 'active'` 복원
- 제재 **해제** 시 → `users.suspended_until = null`
- 제재 **변경** 시 → 새 만료 일시로 `users.suspended_until` 재설정

---

### `_components/ReportsClient.tsx` — 클라이언트 컴포넌트

필터링, 페이지네이션, 드로어(상세 패널) 등 모든 UI 인터랙션을 담당합니다.

**이번 작업에서 변경된 부분:**

| 함수 | 변경 내용 |
|------|-----------|
| `startEdit()` | 로컬 state 대신 `sel.postDeactivated`, `sel.sanctionType`(DB 값)을 읽어 편집 폼 초기화 |
| `resolve()` | 서버 액션 `resolveReport()` / `updateReportResolution()` 호출 추가. 낙관적 UI 업데이트는 유지 |
| `dismiss()` | 서버 액션 `dismissReport()` 호출 추가 |
| 처리 결과 표시 | 로컬 `outcomes` state가 없을 때 DB 값(`sel.postDeactivated`, `sel.sanctionType`, `sel.resolvedAt`)을 fallback으로 사용 — 이전 세션에서 처리된 신고도 결과 표시 가능 |

**낙관적 업데이트 전략:**
버튼 클릭 즉시 로컬 state를 업데이트해 UI를 즉각 반영하고, 서버 액션은 비동기로 실행합니다. 실패 시 토스트 메시지로 알립니다.

---

## DB 스키마 변경 내역

Supabase CLI로 원격 DB에 직접 적용했습니다 (`supabase db query --linked`).

### `common_reports` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `post_deactivated` | `BOOLEAN NOT NULL DEFAULT FALSE` | 게시글 비활성화 여부 |
| `sanction_type` | `TEXT CHECK IN ('7d','30d','perm')` | 적용된 제재 종류 |
| `sanction_expires_at` | `TIMESTAMPTZ` | 제재 만료 일시 |

### `users` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `suspended_until` | `TIMESTAMPTZ` | 정지 만료 일시 (`null`=정상, `9999-12-31`=영구 정지) |

---

## 완료된 기능

| 기능 | 설명 |
|------|------|
| 신고 처리완료 | 처리 결과(게시글 비활성화, 유저 제재)를 DB에 저장 |
| 신고 무시 | `common_reports.status = 'dismissed'` 처리 |
| 처리 결과 수정 | 이미 처리된 신고를 다시 열어 제재/비활성화 변경 가능 |
| 게시글 비활성화 | `posts.status = 'inactive'` → 다른 사용자에게 노출 중단 |
| 게시글 재활성화 | 수정 시 비활성화 취소 → `posts.status = 'active'` 복원 |
| 유저 정지 저장 | `users.suspended_until` 에 정지 만료 일시 기록 (7일/30일/영구) |
| 제재 해제/변경 | 수정 시 `suspended_until` 재설정 또는 `null` 로 초기화 |
| 처리 결과 표시 | 드로어에서 이전 세션 처리 결과도 DB 값으로 표시 |
| DB 마이그레이션 | Supabase CLI로 원격 DB에 신규 컬럼 4개 직접 적용 |

---

## 남은 작업

### 유저 정지 실제 적용 — 글쓰기/댓글 차단

현재 `users.suspended_until` 에 정지 일시가 **저장**되지만, 실제로 해당 유저의 행동을 **막는 로직이 없습니다.**
아래 파일들의 글 생성 로직에 정지 여부 체크를 추가해야 합니다.

**체크 로직 패턴 (각 생성 함수 상단에 추가):**

```typescript
const { data: userRow } = await supabase
  .from("users")
  .select("suspended_until")
  .eq("auth_id", user.id)
  .single();

if (userRow?.suspended_until && new Date(userRow.suspended_until) > new Date()) {
  throw new Error("계정이 정지 상태입니다.");
}
```

**체크가 필요한 파일 목록:**

| 파일 | 게시글 유형 |
|------|------------|
| `src/hooks/usedgoods/useCreateUsedGoodsForm.ts` | 중고거래 글쓰기 |
| `src/hooks/useCreateJobForm.ts` | 구인구직 글쓰기 |
| `src/app/(user)/rental/create/_components/RentalCreateForm.tsx` | 방렌트 글쓰기 |
| 커뮤니티 글쓰기 훅/폼 (확인 필요) | 커뮤니티 글쓰기 |
| 댓글 작성 로직 (확인 필요) | 댓글 |

> 현재 글쓰기가 클라이언트 사이드에서 직접 Supabase에 insert 하는 구조이므로,  
> 각 훅/폼에서 insert 전에 위 체크를 추가하는 방식이 가장 빠릅니다.  
> 보안 강화가 필요하다면 서버 액션으로 이전하는 것을 권장합니다.

---

### 비활성화된 게시글 URL 직접 접근 처리

현재 `status = 'inactive'` 인 게시글의 URL로 직접 접근하면 **404 페이지**가 표시됩니다.  
게시글 상세 페이지가 쿼리 시 `status = 'active'` 조건을 포함하거나, 결과가 없을 때 `notFound()`를 호출하기 때문입니다.

**검토가 필요한 동작:**

| 접근 주체 | 현재 동작 | 권장 동작 |
|-----------|-----------|-----------|
| 일반 유저 | 404 | "비활성화된 게시글입니다" 안내 페이지 표시 |
| 게시글 작성자 | 404 | 동일하게 안내 or 본인 게시글임을 알리는 메시지 |
| 어드민 | 404 | 게시글 내용을 볼 수 있어야 할 수 있음 |

**작업 위치:**  
각 게시글 상세 페이지의 서버 컴포넌트(`page.tsx`)에서 `notFound()` 대신 상태에 따른 분기 처리 추가 필요.

```typescript
if (!post) return notFound();

// 추가 필요
if (post.status === "inactive") {
  // 비활성화 안내 UI 렌더링 or redirect
}
```

---

## 처리 흐름 요약

```
어드민 클릭 "처리완료"
    │
    ├─ [즉시] 로컬 state 업데이트 (낙관적 UI)
    │
    └─ [비동기] resolveReport() 서버 액션
            ├─ common_reports 상태 업데이트
            ├─ posts.status = 'inactive' (게시글 비활성화 선택 시)
            ├─ users.suspended_until 설정 (제재 선택 시)
            └─ revalidatePath() → 페이지 데이터 갱신

어드민 클릭 "상세" (처리완료 신고)
    │
    └─ 드로어 오픈 → DB에서 온 처리 결과 표시
            └─ "수정" 클릭 → updateReportResolution() 서버 액션
                    ├─ 비활성화 취소 시 posts.status = 'active'
                    ├─ 제재 해제 시 suspended_until = null
                    └─ 제재 변경 시 suspended_until 재설정
```
