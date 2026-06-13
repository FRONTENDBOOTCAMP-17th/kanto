# 내 프로필 페이지 기술 설계 문서

작성일: 2026-06-13

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
src/app/(user)/profile/
├── page.tsx                          # 서버 컴포넌트, 레이아웃 래퍼
└── _components/
    ├── ProfileCard.tsx               # 오케스트레이터 (activeTab, avatarFile 상태 관리)
    ├── ProfileAside.tsx              # aside 네비게이션 + 모바일 탭 (Tab 타입 export)
    ├── ProfileInfoSection.tsx        # 사용자 정보 탭 (편집, 비밀번호 변경, 계정 삭제)
    ├── ProfileReviewsSection.tsx     # 거래 후기 탭
    ├── ProfileAlertsSection.tsx      # 알림 설정 + 관심 카테고리 탭
    ├── ProfileBlockedSection.tsx     # 차단한 사용자 탭
    ├── ProfileSettingsSection.tsx    # 앱 설정 탭 (지역, 언어, 계정 연동)
    ├── ProfileField.tsx              # 공통 폼 인풋 컴포넌트
    └── profileAvatar.tsx             # 아바타 이미지 + 업로드 버튼
```

---

## 4. 컴포넌트 설계

### 4-1. ProfileCard (오케스트레이터)

```
useAuthStore → user 존재 여부 확인 (null guard)
  ↓
ProfileForm 렌더링
  - activeTab 상태 (Tab 타입)
  - avatarFile 상태 (File | null)
  ↓
┌────────────┬─────────────────┬──────────────────────┐
│ ProfileAside│    사이드바      │    메인 콘텐츠         │
│  (aside)   │ (아바타, 통계,   │  activeTab에 따라    │
│            │  계정정보,       │  섹션 컴포넌트 렌더링  │
│            │  본인인증)       │                      │
└────────────┴─────────────────┴──────────────────────┘
```

**역할 분리 원칙**
- `ProfileCard`: `activeTab`, `avatarFile`만 관리
- 각 섹션 컴포넌트: 자신의 UI 상태 독립 관리
- `useAuthStore`: `setUser`, `clearUser` — Zustand에서 직접 소비

### 4-2. ProfileAside

```typescript
export type Tab = "info" | "reviews" | "alerts" | "blocked" | "settings";
```

- **데스크탑**: `<aside>` 좌측 세로 네비게이션 (`hidden md:flex`)
- **모바일**: 사이드바 상단 가로 스크롤 탭 (`flex md:hidden`)
- `activeTab`, `onTabChange` props로 상태 위임

### 4-3. 섹션 컴포넌트별 책임

| 컴포넌트 | 내부 상태 | 외부 의존 |
|---|---|---|
| `ProfileInfoSection` | `name`, `phone` | `user`, `avatarFile` props, `useAuthStore.setUser` |
| `ProfileAlertsSection` | `chatAlert`, `commentAlert`, `postAlert`, `selectedCategories` | 없음 |
| `ProfileSettingsSection` | `region`, `language`, `identities` | `supabase.auth` |
| `ProfileReviewsSection` | 없음 | 없음 |
| `ProfileBlockedSection` | 없음 | 없음 |

---

## 5. 인증 및 상태 관리

### useAuthInit (전역 구독)

`Header.tsx`에서 `useAuthInit()`을 호출하여 앱 전체에서 인증 상태를 구독합니다.

```typescript
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session) { clearUser(); return; }
  const { data } = await supabase
    .from("users")
    .select("id, name, email, phone, auth_id, avatar_url, provider, role, post_count, created_at, updated_at")
    .eq("auth_id", session.user.id)
    .single();
  if (data) setUser(data as User);
});
```

- Supabase JWT 세션 기반으로 `users` 테이블에서 사용자 정보를 가져와 Zustand store에 저장
- 프로필 페이지는 별도 fetch 없이 `useAuthStore()`만으로 사용자 데이터 소비

### 보안 구조

```
URL /profile          → userId 파라미터 없음 (타인 접근 불가)
useAuthStore          → 서버 JWT 세션 기반으로 채워짐 (조작 불가)
Supabase DB update    → .eq("id", user.id) — RLS 정책으로 이중 보호
Supabase Storage      → avatars/{user.id}/profile 경로 — Storage 정책으로 보호
```

**RLS 필수 정책 (Supabase 대시보드)**
```sql
-- users 테이블: 자신의 행만 수정 가능
CREATE POLICY "update own profile"
ON users FOR UPDATE
USING (auth_id = auth.uid());
```

---

## 6. 주요 기능 구현

### 6-1. 프로필 사진 업로드

```
사용자 파일 선택 (profileAvatar.tsx → useImageUpload(1))
  ↓
avatarFile 상태를 ProfileCard로 전달 (onFileChange prop)
  ↓
저장하기 클릭 시 (ProfileInfoSection.handleSave)
  ↓
supabase.storage.from("images").upload(`avatars/${user.id}/profile`, avatarFile, { upsert: true })
  ↓
getPublicUrl + `?v=${Date.now()}` (캐시 버스팅)
  ↓
users 테이블 avatar_url 업데이트 → setUser로 store 갱신
```

- 고정 경로 (`avatars/{userId}/profile`, 확장자 없음) + `upsert: true` → 항상 같은 파일 덮어쓰기
- 캐시 버스팅: 쿼리스트링 `?v={timestamp}` 추가

### 6-2. 비밀번호 변경

이메일 로그인 사용자에게만 표시:

```typescript
{(!user.provider || user.provider === "email") && <PasswordSection />}
```

### 6-3. 계정 연동 (소셜 로그인 연결/해제)

```typescript
// 현재 연결된 identity 목록 조회
supabase.auth.getUserIdentities()

// 새 소셜 계정 연결 (OAuth 리다이렉트)
supabase.auth.linkIdentity({ provider: "google" | "kakao" | "facebook" })

// 연결 해제 (마지막 identity는 해제 불가)
supabase.auth.unlinkIdentity(identity)
```

- `identities.length > 1`일 때만 "해제" 버튼 노출 — 계정 잠금 방지

### 6-4. 모바일 사이드바 조건부 표시

편집 탭 외에는 사이드바(아바타, 통계, 계정정보, 본인인증) 숨김:

```typescript
<div className={`flex flex-col gap-6 ${activeTab !== "info" ? "hidden md:flex" : ""}`}>
```

---

## 7. 레이아웃 구조

### 데스크탑 (md 이상)

```
┌─────────────────────────────────────────────────┐
│ 헤더 (뒤로가기 + "내 프로필")                      │
├──────────┬──────────────────┬───────────────────┤
│  aside   │    사이드바       │   메인 콘텐츠       │
│  w-32    │    w-64          │   flex-1          │
│          │                  │                   │
│ • 사용자  │ • 아바타          │ (activeTab에 따라) │
│   정보   │ • 이름/이메일     │ • 프로필 편집       │
│ • 후기   │ • 활동 통계       │ • 비밀번호 변경     │
│ • 알림   │ • 계정 정보       │ • 거래 후기         │
│ • 차단   │ • 본인인증        │ • 알림 설정         │
│ • 앱설정 │                  │ • 차단/앱설정 등    │
└──────────┴──────────────────┴───────────────────┘
```

### 모바일

```
┌────────────────────────┐
│ 헤더                    │
├────────────────────────┤
│ 탭 스트립 (가로 스크롤)  │
├────────────────────────┤
│ 사이드바 (편집 탭만 표시) │
├────────────────────────┤
│ 메인 콘텐츠             │
└────────────────────────┘
```

---

## 8. Supabase 설정 요구사항

| 항목 | 내용 |
|---|---|
| `users` 테이블 RLS | `auth_id = auth.uid()` UPDATE 정책 필수 |
| Storage `images` 버킷 | `avatars/` 경로 업로드 정책 필요 |
| OAuth 프로바이더 | Google, Kakao, Facebook 활성화 필요 (계정 연동 기능) |
| `linkIdentity` | Supabase Auth 프로젝트에서 활성화 필요 |

---

## 9. 미구현 / 추후 과제

| 항목 | 비고 |
|---|---|
| 비밀번호 변경 로직 | UI만 구현, `supabase.auth.updateUser` 연결 필요 |
| 회원 탈퇴 로직 | `handleDeleteAccount` 빈 함수 |
| 지역 설정 저장 | DB 컬럼 또는 별도 테이블 설계 필요 |
| 언어 설정 적용 | i18n 라이브러리 연동 필요 |
| 거래 후기 | 후기 테이블 설계 및 연동 필요 |
| 차단한 사용자 | blocked_users 테이블 설계 필요 |
| 활동 통계 (찜 목록) | favorites 테이블 count 쿼리 필요 |
| 이미지 검열 | Storage 업로드 후 서버사이드 검열 파이프라인 필요 |
