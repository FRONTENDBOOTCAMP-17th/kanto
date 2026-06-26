# Kanto 프로젝트 완성도 평가 보고서

> 작성일: 2026-06-26  
> 분석 대상: `c:\Users\User\OneDrive\바탕 화면\kanto`  
> 브랜치: `develop`

---

## 1. 프로젝트 개요

**Kanto**는 필리핀 거주 한인 커뮤니티를 위한 마켓플레이스 플랫폼입니다. 기존 Facebook 그룹을 대체하여 중고거래·구인구직·렌탈·모임을 하나의 플랫폼에서 제공하는 것을 목표로 합니다.

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| 스타일링 | Tailwind CSS v4 · shadcn/ui (Radix Nova) |
| 백엔드 | Supabase (PostgreSQL + Auth + Realtime) |
| 결제 | Xendit (페소 결제) |
| 캐시/Rate Limit | Upstash Redis |
| 다국어 | next-intl (한국어 · 영어 · 필리핀어) |
| 모니터링 | Sentry · Google Maps |
| AI | Groq · Gemini · Cerebras (모더레이션·챗봇) |

---

## 2. 구현 완료 기능

### 사용자 기능
- **마켓플레이스 3종**: 중고거래 · 구인구직 · 렌탈 (목록/상세/작성/수정/삭제)
- **모임(Go)**: 구글 맵 기반 지역 모임 생성 및 그룹채팅
- **실시간 채팅**: 1:1 채팅 · 그룹채팅 (Supabase Realtime)
- **결제 시스템**: Xendit 인보이스 발행 · 에스크로 · 후기
- **알림**: 채팅·댓글·게시글 알림
- **신고/모더레이션**: 사용자·게시글 신고, AI 이미지 모더레이션
- **다국어 지원**: 한/영/필 완전 번역 동기화
- **AI 챗봇**: 인라인 플로팅 챗봇

### 어드민 기능
- **대시보드**: KPI 카드 · 트렌드 차트 · 리포트 센터
- **사용자 관리**: 목록·상세·제재·정지
- **게시글 관리**: 목록·상세·삭제·상태 토글
- **채팅 모니터링**: 채팅 목록·내용 열람
- **감사 로그**: 전체 시스템 작업 이력
- **운영 설정**: 비속어 필터 · 스팸 감지 · 공지 방송 · 유지보수 모드
- **권한 관리**: 어드민 역할·팀 관리
- **결제 관리**: 결제 내역 조회
- **신고 처리**: 신고 대시보드·처리

---

## 3. 미완성 / 누락 기능

### 🔴 Critical — 접근 시 404 오류 발생

`/business` 라우트 하위 3개 페이지에 `page.tsx` 파일이 없어 실제 접근이 불가능합니다.

| 라우트 | 파일 경로 | 상태 |
|--------|-----------|------|
| `/business/company` | `src/app/(user)/business/company/` | page.tsx 없음 |
| `/business/company/create` | `src/app/(user)/business/company/create/` | page.tsx 없음 |
| `/business/dashboard` | `src/app/(user)/business/dashboard/` | page.tsx 없음 |

컴포넌트 폴더(`_components/`)와 레이아웃 구조는 존재하지만 실제 페이지 구현이 없습니다.

### 🟠 High — 테스트 없음

프로젝트 전체에 테스트 파일이 단 한 개도 없습니다.

- 테스트 설정 파일(vitest.config.ts, jest.config.ts) 없음
- 단위 테스트, 통합 테스트, E2E 테스트 모두 부재
- 결제·인증 등 크리티컬 경로도 테스트 미적용

### 🟡 Low — PWA/오프라인 지원 없음

- `public/manifest.json` 없음
- Service Worker 없음
- 모바일 앱처럼 설치하거나 오프라인 캐싱 불가

---

## 4. 코드 품질 분석

### 양호한 항목 ✅

| 항목 | 결과 |
|------|------|
| TODO/FIXME 주석 | 0건 (완전 clean) |
| console.log 잔존 | 0건 |
| `any` 타입 사용 | 3건 (모두 의도적 우회) |
| i18n 번역 동기화 | 한/영/필 3개 언어 완전 일치 (각 23개 최상위 키) |
| 어드민 인증 (POST/DELETE) | 정상 보호 |
| 반응형 UI | `md:` 브레이크포인트 전반 적용 |

### 개선 필요 항목 ⚠️

#### 서비스 레이어 에러 핸들링 불일치

Supabase 쿼리 결과에서 `error`를 확인하지 않고 `data`를 바로 사용하는 패턴이 여러 곳에 있습니다.

```ts
// ❌ 현재 (에러 무시)
const { data } = await supabase.from("transactions").select(...)
return data

// ✅ 권장
const { data, error } = await supabase.from("transactions").select(...)
if (error) throw error
return data
```

| 파일 | 문제 위치 | 심각도 |
|------|-----------|--------|
| `src/services/payment/transaction.ts` | 6곳 이상 | Medium |
| `src/services/go/groupChat.ts` | 5곳 이상 | Medium |
| `src/services/go/go.ts` | 다수 | Medium |
| `src/services/report.ts` | `checkReported()` | Low |
| `src/services/view.ts` | `supabase.rpc()` 호출 | Low |

---

## 5. 보안 개선 항목

### 🔴 어드민 API GET 엔드포인트 인증 누락

POST·DELETE는 인증이 적용되어 있으나, 일부 GET 엔드포인트에 인증 체크가 없습니다.

| 파일 | 문제 |
|------|------|
| `src/app/api/admin/sanction-templates/route.ts` | GET에 `getAdminUser()` 없음 |
| `src/app/api/admin/profanity-rules/route.ts` | GET에 `getAdminUser()` 없음 |

누구나 어드민 데이터를 조회할 수 있는 상태입니다.

### 🟠 검색 파라미터 미검증

```ts
// src/app/api/admin/profanity-rules/search-posts/route.ts
const keyword = searchParams.get("keyword") // 검증 없이 DB 쿼리에 사용
```

입력값 길이 제한 및 특수문자 필터링이 없습니다.

### 🟠 PUT 작업 감사 로그 누락

| 파일 | 문제 |
|------|------|
| `src/app/api/admin/notices/[id]/route.ts` | PUT에 감사 로그 없음 |
| `src/app/api/admin/profanity-rules/[id]/route.ts` | PUT에 감사 로그 없음 |

POST/DELETE는 감사 로그가 기록되지만 수정(PUT) 작업은 추적되지 않습니다.

### 🟡 환경변수 시작 시 유효성 검증 없음

앱 시작 시 필수 환경변수가 없어도 오류 없이 실행되다가 런타임에 실패합니다.

```ts
// 현재: ! 단언으로 처리 (런타임 오류 가능)
process.env.SUPABASE_SECRET_KEY!

// 권장: 시작 시 빠른 실패 (src/env.ts 또는 @t3-oss/env-nextjs)
if (!process.env.SUPABASE_SECRET_KEY) throw new Error("SUPABASE_SECRET_KEY missing")
```

---

## 6. 접근성(A11y) 개선 항목

| 파일 | 문제 | 심각도 |
|------|------|--------|
| `src/components/common/aichatbot/Chatbot.tsx` (189-210번줄) | 새 채팅·기록·닫기 버튼에 `aria-label` 없음 | Medium |
| `src/components/common/Pagination.tsx` | `<nav>` 요소에 `aria-label` 필요 | Medium |
| `src/app/(user)/signup/_components/SignupForm.tsx` (77-79번줄) | 에러 메시지가 입력 필드와 `aria-describedby`로 연결 안 됨 | Medium |

Header, ChatInput, SignupForm 레이블 등 대부분의 ARIA 구현은 양호합니다.

---

## 7. 성능 개선 항목

### 이미지 Lazy Loading

```ts
// src/components/common/ImageWithFallback.tsx:20
// ❌ 현재: 모든 이미지에 eager 적용
loading="eager"

// ✅ 권장: 기본값 lazy, 히어로/로고만 eager 유지
loading="lazy"  // 기본값으로 변경
```

### AI 공급자 번들

`src/app/api/ai/chat/route.ts`에서 Gemini · Groq · Cerebras 세 가지 공급자를 동시에 import합니다. 동적 import 또는 단일 공급자로 통일하면 Cold Start 시간을 줄일 수 있습니다.

### 번들 크기 분석 도구 미설정

`@next/bundle-analyzer`가 설정되어 있지 않아 번들 크기 모니터링이 어렵습니다.

---

## 8. 우선순위별 액션 아이템

| 우선순위 | 항목 | 대상 파일 | 예상 작업량 |
|----------|------|-----------|-------------|
| 🔴 **P1** | 어드민 GET 엔드포인트 인증 추가 | `api/admin/sanction-templates/route.ts`<br>`api/admin/profanity-rules/route.ts` | 소 |
| 🔴 **P1** | 비즈니스 페이지 구현 또는 라우트 제거 | `src/app/(user)/business/` | 대 |
| 🟠 **P2** | 서비스 레이어 에러 핸들링 통일 | `services/payment/transaction.ts`<br>`services/go/groupChat.ts`<br>`services/go/go.ts` | 중 |
| 🟠 **P2** | 검색 파라미터 입력 검증 | `api/admin/profanity-rules/search-posts/route.ts` | 소 |
| 🟠 **P2** | PUT 감사 로그 추가 | `api/admin/notices/[id]/route.ts`<br>`api/admin/profanity-rules/[id]/route.ts` | 소 |
| 🟡 **P3** | 환경변수 시작 시 검증 | `src/env.ts` 신규 생성 | 소 |
| 🟡 **P3** | 접근성 aria-label 보완 | `Chatbot.tsx`<br>`Pagination.tsx`<br>`SignupForm.tsx` | 소 |
| 🟡 **P3** | 이미지 lazy loading 기본값 변경 | `ImageWithFallback.tsx` | 소 |
| 🔵 **P4** | 테스트 인프라 구축 (vitest) | 전체 | 대 |
| 🔵 **P4** | 번들 분석 도구 추가 | `next.config.ts` | 소 |
| 🔵 **P4** | PWA manifest 추가 | `public/manifest.json` | 소 |
