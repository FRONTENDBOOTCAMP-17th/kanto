# 내 프로필 페이지 기술 설계 문서

최종 수정일: 2026-06-14

---

## 1. 개요

내 프로필 페이지는 로그인한 사용자가 자신의 계정 정보를 조회·수정할 수 있는 페이지입니다.  
URL: `/profile` (파라미터 없음 — 항상 현재 로그인 사용자 본인의 프로필만 접근 가능)

---

## 2. 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 전역 상태 | Zustand (`useAuthStore`) |
| 백엔드 | Supabase (Database, Storage, Auth) |
| 아이콘 | lucide-react |

---

## 3. 파일 구조

```
src/
├── app/(user)/profile/
│   ├── page.tsx                              # 서버 컴포넌트 — DB/Auth 선(先)조회 후 props 전달
│   └── _components/
│       ├── ProfileCard.tsx                   # 오케스트레이터 (activeTab, avatarFile 상태)
│       ├── ProfileAside.tsx                  # 데스크탑 aside 네비게이션 + 모바일 탭
│       ├── ProfileField.tsx                  # 공통 폼 인풋 컴포넌트
│       ├── profileAvatar.tsx                 # 아바타 이미지 + 업로드 버튼
│       └── sections/
│           ├── ProfileInfoSection.tsx        # 프로필 편집 · 비밀번호 변경 · 계정 삭제
│           ├── ProfileReviewsSection.tsx     # 거래 후기
│           ├── ProfileAlertsSection.tsx      # 알림 설정 · 관심 카테고리 · 키워드
│           ├── ProfileBlockedSection.tsx     # 차단한 사용자
│           └── ProfileSettingsSection.tsx    # 지역 · 언어 · 소셜 계정 연동
│
├── hooks/profile/
│   ├── useAlertSettings.ts                  # 알림 토글 · 카테고리 · 키워드 상태 및 DB 동기화
│   ├── useProfileInfo.ts                    # 프로필 저장 · 계정 삭제/복구 로직
│   └── useProfileSettings.ts               # 지역 · 언어 · 소셜 연동 로직
│
└── services/profile/
    ├── profileAlert.ts                      # 알림 설정 Supabase update 함수
    ├── profileInfo.ts                       # 아바타 업로드 · 프로필 update · 사용자 조회
    └── profileSettings.ts                   # 소셜 identity 연결/해제
```

---

## 4. 데이터 흐름 — 서버 선(先)조회 패턴

클라이언트에서 마운트 후 fetch하면 탭 전환 시 로딩 지연이 발생합니다.  
이를 해결하기 위해 서버 컴포넌트(`page.tsx`)에서 데이터를 미리 조회해 props로 내려줍니다.

```
page.tsx (서버)
  ├── supabase.auth.getUser() → user.identities
  └── supabase.from("users").select(...) → alertSettings
        ↓
  ProfileCard (client)
        ↓
  ┌─────────────────────────┬──────────────────────────────┐
  │ ProfileAlertsSection    │ ProfileSettingsSection        │
  │   initialSettings prop  │   initialIdentities prop      │
  │   → useAlertSettings()  │   → useProfileSettings()      │
  │     useState 초기값      │     useState 초기값            │
  │     (DB fetch 없음)      │     (getUserIdentities 없음)   │
  └─────────────────────────┴──────────────────────────────┘
```

**핵심 원칙**: 훅은 서버에서 받은 초기값으로 `useState`를 초기화하고, 이후 변경은 서비스 함수를 통해 DB에 직접 반영합니다. 마운트 후 별도 조회 없음.

---

## 5. 레이어별 역할

### 5-1. `page.tsx` — 서버 컴포넌트

```typescript
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("alert_chat, alert_comment, alert_post, interest_categories, alert_keywords")
    .eq("auth_id", user.id)
    .single();

  return (
    <ProfileCard
      alertSettings={...}
      initialIdentities={user.identities ?? []}
    />
  );
}
```

- 인증 확인 + 미로그인 시 `/login` 리다이렉트
- 알림 설정과 소셜 identities를 서버에서 조회
- 클라이언트 컴포넌트에 props로 전달

### 5-2. 서비스 레이어 — `services/profile/`

클라이언트 사이드 Supabase 호출을 훅에서 분리합니다. 팀 컨벤션(`likeToggle.ts` 패턴)을 따릅니다.

**`profileAlert.ts`**
```typescript
import { supabase } from "@/lib/supabase";

export async function updateAlertToggle(userId, field, value) { ... }
export async function updateInterestCategories(userId, categories) { ... }
export async function updateAlertKeywords(userId, keywords) { ... }
```

**`profileInfo.ts`**
```typescript
export async function uploadAvatar(userId, avatarFile): Promise<string>
export async function updateProfile(userId, payload): Promise<User>
export async function fetchRestoredUser(authId): Promise<User | null>
```

**`profileSettings.ts`**
```typescript
export async function linkSocialIdentity(provider, redirectTo) { ... }
export async function unlinkSocialIdentity(identity) { ... }
```

### 5-3. 훅 레이어 — `hooks/profile/`

UI 상태 관리 + 서비스 함수 호출을 담당합니다. Supabase를 직접 사용하지 않습니다.

| 훅 | 입력 | 역할 |
|---|---|---|
| `useAlertSettings(initial)` | `AlertSettings` | 토글·카테고리·키워드 state + optimistic update |
| `useProfileInfo(user, avatarFile)` | user, File | 저장·삭제·복구 핸들러 + 모달 상태 |
| `useProfileSettings(initialIdentities)` | `UserIdentity[]` | 소셜 연동 state + 리다이렉트 후 notice 처리 |

---

## 6. 알림 설정 기능

### 6-1. `users` 테이블 컬럼

| 컬럼 | 타입 | 기본값 | 의미 |
|---|---|---|---|
| `alert_chat` | `boolean` | `true` | 채팅 알림 수신 여부 |
| `alert_comment` | `boolean` | `true` | 댓글 알림 수신 여부 |
| `alert_post` | `boolean` | `false` | 새 게시글 알림 수신 여부 |
| `interest_categories` | `text[]` | `NULL` | NULL = 전체 선택, 배열 = 선택된 카테고리만 |
| `alert_keywords` | `text[]` | `NULL` | 키워드 알림 목록 (최대 5개) |

### 6-2. 관심 카테고리 설계

- 카테고리 전체 체크 = DB에 `NULL` 저장 (절약)
- 일부만 선택 = 선택된 key 배열 저장
- 클라이언트에서 `NULL` 수신 시 → 전체 선택으로 초기화

```typescript
// useAlertSettings 초기화
useState<string[]>(initial.interest_categories ?? ALL_KEYS)
```

### 6-3. 새 게시글 DB 트리거

새 글이 등록될 때 `notify_new_post()` 함수가 실행됩니다.

```sql
-- 조건: alert_post=true AND 카테고리 일치 AND 키워드 포함
WHERE u.alert_post = true
  AND (u.interest_categories IS NULL OR category_key = ANY(u.interest_categories))
  AND EXISTS (
    SELECT 1 FROM unnest(u.alert_keywords) kw
    WHERE NEW.title ILIKE '%' || kw || '%'
  );
```

- `SECURITY DEFINER`로 선언 — RLS 우회하여 다른 사용자 알림 테이블에 INSERT 가능
- 카테고리 AND 키워드 동시 일치 시에만 알림 발송

### 6-4. post_type → category_key 매핑

| post_type | category_key |
|---|---|
| `used_goods` | `usedgoods` |
| `jobs` | `jobs` |
| `rental` | `rental` |
| `community` | `community` |

---

## 7. 소셜 계정 연동

### 연동 흐름

```
연결하기 클릭
  → sessionStorage.setItem("linkingProvider", provider)
  → supabase.auth.linkIdentity({ provider, redirectTo })
  → OAuth 리다이렉트
  → page.tsx 재실행 (서버)
  → user.identities에 새 identity 포함됨
  → useProfileSettings 초기화 시 sessionStorage 체크
  → "소셜 계정이 연결되었습니다." notice 표시
```

### 에러 처리

- URL에 `error_code` 파라미터 → lazy initializer에서 에러 notice 설정 → useEffect에서 URL 클린업
- `identity_already_exists`: 다른 계정에 이미 연동된 소셜 계정
- `same_identity`: 현재 계정에 이미 연동된 소셜 계정

### 해제 규칙

- `identities.length > 1`일 때만 "해제" 버튼 노출 — 마지막 로그인 수단 삭제 방지

---

## 8. 프로필 저장

```
저장하기 클릭
  → avatarFile 존재 시 uploadAvatar() → Storage upload → 공개 URL 반환
  → updateProfile() → users 테이블 update
  → setUser(updated) → Zustand store 갱신
```

- 아바타 경로: `avatars/{userId}/profile` (확장자 없음, upsert)
- 캐시 버스팅: `publicUrl + ?v=${Date.now()}`

---

## 9. 계정 삭제 / 복구

| 동작 | 구현 |
|---|---|
| 삭제 | `DELETE /api/user` → `supabase.auth.signOut()` → 홈 이동 |
| 복구 | `PATCH /api/user` → `fetchRestoredUser(authId)` → store 갱신 |

- 삭제는 실제로 `deleted_at` 컬럼 설정 (소프트 삭제) — 30일 후 영구 삭제
- `supabase.auth.signOut()`은 서비스 레이어로 분리하지 않음 (store 클리어와 결합된 UI 로직)

---

## 10. 보안 구조

```
URL /profile         → userId 파라미터 없음 (타인 접근 불가)
useAuthStore         → 서버 JWT 세션 기반으로 채워짐 (클라이언트 조작 불가)
Supabase DB update   → .eq("id", user.id) — RLS 정책으로 이중 보호
Supabase Storage     → avatars/{user.id}/profile — Storage 정책으로 보호
```

**RLS 필수 정책**
```sql
CREATE POLICY "update own profile"
ON users FOR UPDATE
USING (auth_id = auth.uid());
```

---

## 11. 접근성

| 요소 | 적용 |
|---|---|
| aside 네비게이션 | `role="tablist"`, `role="tab"`, `aria-selected` |
| 알림 토글 | `role="switch"`, `aria-checked` |
| 탈퇴 확인 모달 | `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby` |
| 모달 포커스 | 오픈 시 취소 버튼 자동 포커스, Escape 키 닫기 |
| 알림 배너 | `role="alert"`, `aria-live="polite"` |

---

## 12. 미구현 / 추후 과제

| 항목 | 비고 |
|---|---|
| 비밀번호 변경 로직 | UI만 구현, `supabase.auth.updateUser` 연결 필요 |
| 지역 설정 저장 | `region` state는 있으나 DB 컬럼 및 저장 핸들러 없음 |
| 언어 설정 적용 | `language` state는 있으나 i18n 라이브러리 연동 필요 |
| 거래 후기 | 후기 테이블 설계 및 연동 필요 |
| 차단한 사용자 | blocked_users 테이블 설계 필요 |
| 활동 통계 (찜 목록) | favorites 테이블 count 쿼리 필요 |
| 이미지 검열 | Storage 업로드 후 서버사이드 검열 파이프라인 필요 |
| 알림 키워드 없이 카테고리만으로도 알림 | 현재는 카테고리 AND 키워드 둘 다 충족해야 알림 발송 |
