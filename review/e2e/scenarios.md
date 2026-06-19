# Kanto E2E 시나리오 (매일 갱신)

실제 사용자·관리자 흐름을 "쓰는 순서 그대로" 따라가며 매일 확인한다.
캡처는 `review/images/<날짜>/`에 남긴다.
스펙: `tests/kanto-daily.spec.ts` · dev 포트 3101(기본) · 계정: `test-account.md`

> 참고: 루트 `/`는 개발용 라우트 인덱스(실제 메인 아님). 실제 사용자 메인은 `/main`.
> `api/login`·본인인증·찜이 Upstash Redis 환경변수를 모듈 로드 시 요구. 키 적용 완료.
> 관리자 화면은 테스트 계정(id 198)을 일시 admin 으로 승격해 확인 후 user 로 원복한다.
> 옛 스펙(`kanto-2nd*.spec.ts`)의 `/job/create` 헤딩 literal 검사는 i18n 작업 이후 selector가 어긋나
> fail로 뜨지만, 데일리 K6에서 `/job/create` 200·렌더를 확인하므로 기능 회귀는 아니다(리뷰 전용 옛 spec).

## 사용자 여정

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K1 | 메인 진입 | `/main` → 200, 데스크톱·모바일 렌더 | 2026-06-19 pass |
| K2 | 중고 목록→상세(비로그인) | `/usedgoods` → 카드 클릭 → 상세 | 2026-06-19 pass |
| K2c| 비로그인 상세 3종 회귀 | `/usedgoods/164`·`/rental/159`·`/job/163` 모두 200 | 2026-06-19 pass |
| K3 | 방렌트 목록 | `/rental` 렌더 | 2026-06-19 pass |
| K4 | 구인구직 목록 | `/job` 렌더 | 2026-06-19 pass |
| K5 | 로그인 폼 | `/login` → 이메일 로그인 폼 | 2026-06-19 pass |
| K6 | 로그인 후 둘러보기 | 로그인 → `/main`·`/profile`·`/job/create` | 2026-06-19 **pass (/profile 200, 8차 크래시 해결)** |
| K7 | 방렌트 상세 | `/rental/[id]` 렌더 | 2026-06-19 pass |
| K8 | 구인 상세 | `/job/[id]` 렌더 | 2026-06-19 pass |
| K9 | 로그인 후 중고 상세·찜 | 로그인 → 상세 → 찜 토글 | 2026-06-19 pass (찜 201) |
| K10| 로그인 후 방렌트·구인 상세 | 로그인 → 상세 정상 | 2026-06-19 pass |
| K11| 프로필 본인인증 모달 | `/profile` → 본인인증 모달 | 2026-06-19 **pass (8차 진입불가 해결)** |
| K12| 결제 결과 페이지 | `/payment/return` pending·failed 상태 | 2026-06-19 pass |
| K25| 비밀번호 찾기 모달(신규) | `/login` → 비밀번호 찾기 모달 | 2026-06-19 pass (렌더) |

## 관리자 여정 (테스트 계정 일시 admin 승격)

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K20| 관리자 대시보드 | `/admin` → 통계·차트·신고 큐 | 2026-06-19 pass |
| K21| 신고 관리 | `/admin/reports` → 신고 목록 | 2026-06-19 pass |
| K22| 회원 관리→상세 | `/admin/users` → 회원 카드 → `/admin/users/[id]` | 2026-06-19 pass |
| K23| 글 관리(신규) | `/admin/posts` → 글 목록·상태 토글 | 2026-06-19 pass (렌더) |
| K24| 채팅 관리(신규) | `/admin/chats` → 방 목록 → `/admin/chats/[id]` 메시지 | 2026-06-19 pass (렌더) |

## 보안 회귀 — 비관리자 어드민 접근

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K30| 비관리자(user) 어드민 직접 진입 | role=user 로 `/admin/posts`·`/admin/chats`·`/admin/chats/11`·`/admin/users` 진입 → **차단(리다이렉트)되어야 함** | 2026-06-19 **fail — 전부 200 렌더, 차단 안 됨(남의 1:1 채팅 노출)** |

## 발견 (2026-06-19) — 9차

- **[해결·칭찬] 8차 `/profile` 런타임 크래시 → 200** (K6). `PROVIDER_KEYS` 재정의(`ProfileCard.tsx:21`),
  죽은 `formatSellerInfoCreatedAt` import 제거. 본인인증 모달(K11)도 함께 정상화.
- **[해결·칭찬] tsc 4건 → 0건** (`npx tsc --noEmit` 클린). `npm run build` 성공(8라운드 만의 초록불).
- **[해결·칭찬] CI 게이트 도입** (`.github/workflows/ci.yml` — PR에서 tsc+build). 8차 [필수] #3 마침내 해결.
- **[해결·칭찬] 본인인증 devCode 운영 노출 가드**(8차 [제안]) + **unread 원자 증가 RPC**(`increment_unread`, 8차 [제안]).
- **[필수][신규·치명] 어드민 페이지 인가(authz) 누락**: `/admin/posts`·`/admin/chats`·`/admin/chats/[id]`·`/admin/users`
  페이지에 `role === "admin"` 가드가 없다. `/admin`·`/admin/reports` 두 페이지만 가드가 있고 나머지는 누락.
  K30 실측: role=user 계정으로 `/admin/chats/11` 진입 시 **다른 회원(김도혁·이동근)의 1:1 채팅 전문이 그대로 노출**됨.
  이 페이지들은 service-role(admin) 클라이언트로 RLS를 우회해 읽으므로, 가드가 없으면 곧 전체 데이터 유출.
- **[필수][신규] `togglePostStatus` 서버액션 인가 누락**: `"use server"` 액션이 caller role 검증 없이
  `setPostStatus`(service-role)로 직행. 일반 사용자가 임의 글을 inactive 로 내릴 수 있음.
- 옛 스펙 2건(`kanto-2nd*`) fail = i18n 이후 헤딩 literal selector 어긋남(기능 회귀 아님, 데일리 K6에서 200 확인).
