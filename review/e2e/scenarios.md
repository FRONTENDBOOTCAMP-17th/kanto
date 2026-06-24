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
| K26| 중고 상세 관련매물 캐러셀(신규) | `/usedgoods/[id]` 스크롤 → 관련매물 섹션 렌더 | 2026-06-24 pass |
| K27| GO! 지도 페이지(신규) | `/go` → 지도 렌더, 모임카운트 버튼, 목록패널 토글 | 2026-06-24 pass — Google Maps API 키 미설정으로 "This page can't load Google Maps correctly" 팝업 2개 뜸 |
| K28| GO! 번개모임 만들기 모달(신규) | `/go` → "번개모임 만들기" FAB → 모달 열기 | 2026-06-24 pass (모달 렌더, 장소·주제·날짜 폼 확인) |
| K29| 마이페이지 망고지수(신규) | `/mypage` 진입 → **404** (실제 라우트는 `/profile`) | 2026-06-24 fail — `/mypage`는 존재하지 않음, `/profile`에 망고지수 UI 있음 |

## 관리자 여정 (테스트 계정 일시 admin 승격)

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K20| 관리자 대시보드 | `/admin` → 통계·차트·신고 큐 | 2026-06-24 pass |
| K21| 신고 관리 | `/admin/reports` → 신고 목록 | 2026-06-24 pass |
| K22| 회원 관리→상세 | `/admin/users` → 회원 카드 → `/admin/users/[id]` | 2026-06-24 pass |
| K23| 글 관리 | `/admin/posts` → 글 목록·상태 토글 | 2026-06-24 pass |
| K24| 채팅 관리 | `/admin/chats` → 방 목록 → `/admin/chats/[id]` 메시지 | 2026-06-24 pass |
| K31| GO! 번개모임 관리(신규) | `/admin/go` → 전체 11건, 주제/상태 필터, 상세 drawer(행 클릭) | 2026-06-24 pass |

## 보안 회귀 — 비관리자 어드민 접근

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K30| 비관리자(user) 어드민 직접 진입 | role=user 로 `/admin/posts`·`/admin/chats`·`/admin/chats/11`·`/admin/users` 진입 → **차단(리다이렉트)되어야 함** | 2026-06-22 **pass — 4곳 모두 `/main` 리다이렉트(blocked). 9차 결함 해결**. (2026-06-19 fail) |

## 발견 (2026-06-24) — 12차

- **[필수][신규·치명] GO! 어드민 서버 액션 role 검증 누락**: `adminGetMeetups()`·`adminForceEndMeetup()`
  (`src/services/go/go.ts:270,347`) 가 `"use server"` 임에도 호출자 role 검증이 없음.
  `createAdminClient()`(service-role 키)로 직접 DB를 write한다. 레이아웃 가드는 페이지 진입만 막고
  서버 액션을 직접 호출하는 건 막지 못함. `requireAdmin()` 헬퍼 적용 필요.
- **[필수][신규] `@vis.gl/react-google-maps` npm install 누락**: package.json에는 선언됐으나
  실제 node_modules에 설치 안 됨 → `/go` 진입 시 Turbopack build error overlay 표시, 해당 탭이 dead.
  `npm install` 이 누락된 것으로 보임(팀원 간 동기 필요).
- **[필수][신규] Google Maps API 키 미설정 또는 이 도메인에 미허가**: `/go` 지도 페이지에
  "This page can't load Google Maps correctly" 팝업이 2개 뜸.
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 또는 `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` 문제.
- **[발견] `/mypage` 라우트 없음**: GO! 이후 마이페이지로 연결하는 코드가 있다면 `/profile`로 교정 필요.
  `/mypage` 진입 시 커스텀 404 표시됨.
- **[보안] anon 키 사용자 테이블 노출**: publishable 키로 `GET /rest/v1/users` 시 `id, phone, name, email, auth_id, role, kts_score` 등 전 컬럼 반환(3개 샘플 확인). RLS 미적용 상태. 이전 회차와 동일, 아직 미해결.
- **[보안] meetups·meetup_participants anon 접근 가능**: 두 테이블 모두 anon key로 데이터 반환(join 위치정보 포함).
- **[칭찬] 빌드 클린**: `npm run build` 및 `npx tsc --noEmit` 모두 에러 0건 (패키지 설치 후).
- **[칭찬] admin 레이아웃 가드 정상**: role=admin 계정으로 `/admin`~`/admin/go` 전 경로 진입 확인.
- **[칭찬] 채팅 직렬 왕복 해소**: `api/chat/[id]/route.ts` `Promise.all` 병렬 처리 확인.
- **[칭찬] 인기 게시글 limit 추가**: `main.ts` `getPopularList()` 각 쿼리 `.limit(4)` 확인.
- **[칭찬] GO! 번개모임 관리 UI 품질 우수**: 주제/상태 필터, 검색, 상세 drawer, 강제 종료 confirm, toast 알림까지 완성도 높음.

## 발견 (2026-06-22) — 10차

- **[부분해결·칭찬] 9차 [필수] 어드민 페이지 인가**: 가드를 `(admin)/layout.tsx` 라우트 그룹 레이아웃으로 모음.
  K30 재실행 — role=user 로 어드민 4경로 직접 진입 시 전부 `/main` 리다이렉트(차단 확인). 페이지 읽기 인가 해결.
- **[필수][미해결] 관리자 서버 액션 role 검증 누락**: `togglePostStatus`·`applySanction`·`liftSanction`·
  `resolveReport`·`dismissReport`·`updateReportResolution`(+`getPostReports`)가 `getUser()`로 로그인만 확인, role 미검사.
  서버 액션은 레이아웃 가드를 안 거치는 독립 엔드포인트 → service-role 권한상승 코드상 가능. 처방: `requireAdmin()` 헬퍼.
- **[실측] anon RLS**: publishable 키로 민감 6테이블 직접 read → 전부 0행. `posts`만 공개. tsc `--noEmit` 0건.
- 사용자 여정(K1~K12,K25)·관리자 여정(K20~24) 전부 pass. 옛 `kanto-2nd*` 2건 fail = i18n selector 드리프트(기능 무관).

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
