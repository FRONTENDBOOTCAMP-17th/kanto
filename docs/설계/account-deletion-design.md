# 회원 탈퇴 기술 설계 문서

작성일: 2026-06-14

---

## 1. 개요

회원 탈퇴는 즉시 완전 삭제 대신 **30일 유예 기간을 두는 소프트 딜리트(Soft Delete)** 방식으로 구현합니다.  
유예 기간 동안 로그인은 유지되며, 탈퇴 철회가 가능합니다.

| 시점 | 처리 내용 |
|---|---|
| 탈퇴 요청 즉시 | 거래성 게시글 비공개, `deleted_at` 기록, 기능 제한 |
| 30일 이내 | 탈퇴 철회 가능, 로그인 유지 |
| 30일 후 (매일 새벽 3시 UTC) | 모든 데이터 영구 삭제 |

---

## 2. 전체 흐름

### 탈퇴 요청

```
사용자 "회원 탈퇴" 클릭 (ProfileInfoSection)
  ↓
확인 모달 표시
  ↓
"탈퇴하기" 클릭 → DELETE /api/user
  ├─ 중고거래·구인구직·방렌트 posts.status = "inactive" (즉시 비공개)
  └─ public.users.deleted_at = now() 기록
  ↓
supabase.auth.signOut() → clearUser() → 홈 리다이렉트
```

### 탈퇴 예정 상태 (로그인 후)

```
로그인 성공
  ↓
useAuthInit → users 테이블에서 deleted_at 포함 조회 → Zustand store 저장
  ↓
GlobalLayout → DeletionPendingBanner 렌더링 (deleted_at 있을 때)
ProfileInfoSection → "탈퇴 철회" 버튼 표시
글쓰기 버튼(WriteButton) → 알림 후 차단
찜하기(LikeButton, UsedGoodsDetail) → 알림 후 차단
create 페이지 직접 접근 → 목록 페이지로 서버 리다이렉트
```

### 탈퇴 철회

```
"탈퇴 철회" 클릭 (배너 또는 ProfileInfoSection)
  ↓
PATCH /api/user
  ├─ users.deleted_at = NULL
  └─ posts.status = "active" 복구 (inactive였던 게시글만)
  ↓
users 테이블 재조회 → setUser → 배너 사라짐
```

---

## 3. DB 변경사항

### public.users 테이블

| 컬럼 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | 탈퇴 요청 시각. NULL이면 정상 계정 |

---

## 4. API Routes

### `DELETE /api/user` — 탈퇴 요청

**파일**: `src/app/api/user/route.ts`

**처리 순서**

```
1. 세션 검증 → auth.users.id 추출
2. auth_id로 public.users.id 조회
3. posts 비공개: post_type IN ('used_goods', 'jobs', 'rental') → status = 'inactive'
4. users.deleted_at = now()
5. 200 OK
```

**에러 응답**

| 상황 | 코드 | 메시지 |
|---|---|---|
| 미인증 | 401 | 인증되지 않은 요청입니다. |
| 유저 없음 | 404 | 사용자 정보를 찾을 수 없습니다. |
| 게시글 처리 실패 | 500 | 게시글 비공개 처리에 실패했습니다. |
| deleted_at 기록 실패 | 500 | 계정 삭제 요청에 실패했습니다. |

---

### `PATCH /api/user` — 탈퇴 철회

**처리 순서**

```
1. 세션 검증 → auth.users.id 추출
2. auth_id로 public.users.id 조회
3. users.deleted_at = NULL
4. posts 복구: post_type IN ('used_goods', 'jobs', 'rental') AND status = 'inactive' → status = 'active'
5. 200 OK
```

**에러 응답**

| 상황 | 코드 | 메시지 |
|---|---|---|
| 미인증 | 401 | 인증되지 않은 요청입니다. |
| 유저 없음 | 404 | 사용자 정보를 찾을 수 없습니다. |
| 철회 실패 | 500 | 탈퇴 철회에 실패했습니다. |
| 게시글 복구 실패 | 500 | 게시글 복구에 실패했습니다. |

---

## 5. 클라이언트 구현

### 5-1. ProfileInfoSection (계정 삭제 섹션)

`user.deleted_at` 여부에 따라 조건부 렌더링:

| 상태 | UI |
|---|---|
| 정상 계정 | "회원 탈퇴" 버튼 → 확인 모달 → DELETE /api/user |
| 탈퇴 예정 | "탈퇴 신청된 계정" 안내 문구 + "탈퇴 철회" 버튼 → PATCH /api/user |

### 5-2. DeletionPendingBanner

**파일**: `src/components/common/DeletionPendingBanner.tsx`  
**위치**: `GlobalLayout` — 헤더 바로 아래, 모든 페이지에 표시

- `user.deleted_at`이 있을 때만 렌더링
- 남은 일수 실시간 계산: `Math.ceil((expiresAt - Date.now()) / 86400000)`
- "탈퇴 철회" 버튼 → PATCH /api/user → users 재조회 → 배너 사라짐

```
탈퇴 예정 계정입니다. N일 후 모든 데이터가 영구 삭제됩니다.  [탈퇴 철회]
```

### 5-3. 기능 제한

**찜하기 — 1차 (LikeButton, UsedGoodsDetail)**

```typescript
if (user?.deleted_at) {
  alert("탈퇴 예정 계정은 찜하기를 이용할 수 없습니다.");
  return;
}
```

**글쓰기 버튼 — 1차 (WriteButton)**

```typescript
if (user?.deleted_at) {
  alert("탈퇴 예정 계정은 새 글을 작성할 수 없습니다.");
  return;
}
```

**create 페이지 직접 접근 — 2차 (서버 리다이렉트)**

`/usedgoods/create`, `/job/create`, `/rental/create` 서버 컴포넌트에서 `deleted_at` 확인:

```typescript
const { data: dbUser } = await supabase
  .from("users")
  .select("id, deleted_at")
  .eq("auth_id", user.id)
  .single();

if (dbUser.deleted_at) redirect("/usedgoods"); // 목록으로 리다이렉트
```

---

## 6. 게시글 처리 정책

| 게시글 유형 | 탈퇴 요청 즉시 | 탈퇴 철회 시 | 30일 후 |
|---|---|---|---|
| 중고거래 (`used_goods`) | 비공개 (`inactive`) | 복구 (`active`) | 삭제 |
| 구인구직 (`jobs`) | 비공개 (`inactive`) | 복구 (`active`) | 삭제 |
| 방렌트 (`rental`) | 비공개 (`inactive`) | 복구 (`active`) | 삭제 |
| 커뮤니티 | 미구현 | 미구현 | 삭제 |
| 랜덤채팅 | 미구현 | 미구현 | 삭제 |

---

## 7. 채팅 메시지 처리

- 유예 기간 동안 상대방이 채팅 내역을 볼 수 있음
- 30일 후 스케줄러가 일괄 삭제

---

## 8. 스케줄러 (pg_cron)

**실행 주기**: 매일 새벽 3시 UTC  
**함수**: `cleanup_deleted_users()` (PostgreSQL, `SECURITY DEFINER`)

**삭제 순서** (FK 참조 순서 준수)

```
messages → chats
→ used_goods / jobs / rentals / community_posts
→ comments → common_likes → common_reports
→ posts → dating_profiles → matches
→ public.users → auth.users
```

**Edge Function 불필요**: `SECURITY DEFINER` 함수가 postgres 롤 권한으로 `auth.users` 직접 삭제

---

## 9. 인증 흐름 — deleted_at 반영

`useAuthInit` (`src/hooks/useAuthInit.ts`) — 앱 전체 인증 구독:

```typescript
.select("id, name, email, phone, auth_id, avatar_url, provider, role, post_count, created_at, updated_at, deleted_at")
```

- 로그인 시 `deleted_at` 포함 조회 → Zustand store에 저장
- 클라이언트 컴포넌트에서 `useAuthStore().user.deleted_at`으로 접근

---

## 10. 보안

- 서비스 롤 키(`SUPABASE_SECRET_KEY`)는 서버사이드(`/api/user`)에서만 사용
- 클라이언트는 자신의 세션 쿠키로만 인증, 타인 계정 조작 불가
- create 페이지: 클라이언트 차단(1차) + 서버 리다이렉트(2차) 이중 보호
- 찜하기: 클라이언트 차단만 (서버 RLS로 보완 권장)

---

## 11. 미구현 / 추후 과제

| 항목 | 비고 |
|---|---|
| 탈퇴 전 비밀번호 재확인 | 이메일 로그인 유저 보안 강화 |
| 탈퇴 확인 이메일 발송 | Edge Function + 이메일 서비스 연동 필요 |
| 커뮤니티 게시글 즉시 비공개 | 미구현 |
| 찜하기 서버사이드 RLS 보호 | 클라이언트 차단만으로는 DevTools 우회 가능 |
| rental/create 서버 리다이렉트 | rental create 페이지 구현 시 추가 필요 |
| D-7, D-1 안내 이메일 | 탈퇴 7일·1일 전 알림 |
