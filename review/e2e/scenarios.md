# Kanto E2E 시나리오 (매일 갱신)

실제 사용자·관리자 흐름을 "쓰는 순서 그대로" 따라가며 매일 확인한다.
캡처는 `review/images/<날짜>/`에 남긴다.
스펙: `tests/kanto-daily.spec.ts` · dev 포트 3100 · 계정: `test-account.md`

> 참고: 루트 `/`는 개발용 라우트 인덱스(실제 메인 아님). 실제 사용자 메인은 `/main`.
> `api/login`·본인인증·찜이 Upstash Redis 환경변수를 모듈 로드 시 요구. 키 적용 완료.
> 관리자 화면은 테스트 계정(id 198)을 일시 admin 으로 승격해 확인 후 user 로 원복한다(2026-06-18 실행).

## 사용자 여정

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K1 | 메인 진입 | `/main` → 200, 데스크톱·모바일 렌더 | 2026-06-18 pass |
| K2 | 중고 목록→상세(비로그인) | `/usedgoods` → 카드 클릭 → 상세 | 2026-06-18 pass (크래시 해결) |
| K2c| 비로그인 상세 3종 회귀 | `/usedgoods/164`·`/rental/159`·`/job/163` 모두 200 | 2026-06-18 **pass (7차 크래시 해결)** |
| K3 | 방렌트 목록 | `/rental` 렌더 | 2026-06-18 pass |
| K4 | 구인구직 목록 | `/job` 렌더 | 2026-06-18 pass |
| K5 | 로그인 폼 | `/login` → 이메일 로그인 폼 | 2026-06-18 pass |
| K6 | 로그인 후 둘러보기 | 로그인 → `/main`·`/profile`·`/job/create` | 2026-06-18 **/profile 런타임 크래시(PROVIDER_KEYS)** / 나머지 200 |
| K7 | 방렌트 상세 | `/rental/[id]` 렌더 | 2026-06-18 pass |
| K8 | 구인 상세 | `/job/[id]` 렌더 | 2026-06-18 pass |
| K9 | 로그인 후 중고 상세·찜 | 로그인 → 상세 → 찜 토글 | 2026-06-18 **pass (찜 201, 403 해결)** |
| K10| 로그인 후 방렌트·구인 상세 | 로그인 → 상세 정상 | 2026-06-18 pass |
| K11| 프로필 본인인증 모달(신규) | `/profile` → 본인인증 모달 | 2026-06-18 **fail (profile 크래시로 진입 불가)** |
| K12| 결제 결과 페이지(신규) | `/payment/return` pending·failed 상태 | 2026-06-18 pass (서버 렌더 정상) |

## 관리자 여정 (테스트 계정 일시 admin 승격)

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K20| 관리자 대시보드 | `/admin` → 통계·차트·신고 큐 | 2026-06-18 pass (완성도 높음) |
| K21| 신고 관리 | `/admin/reports` → 신고 목록 | 2026-06-18 pass |
| K22| 회원 관리→상세 | `/admin/users` → 회원 카드 → `/admin/users/[id]` | 2026-06-18 pass |

## 발견 (2026-06-18) — 8차

- **[필수][신규·치명] `/profile` 런타임 크래시**: `ProfileCard.tsx:37` `PROVIDER_KEYS is not defined`
  + `ProfileCard.tsx:18` `formatSellerInfoCreatedAt` 미존재 import. 국제화 리팩터 중 상수/유틸이 유실됨.
  로그인 사용자가 프로필에 진입하면 즉시 에러 화면. 본인인증(K11)도 진입 불가.
- **[해결·칭찬] 7차 비로그인 상세 3종 크래시 → 200** (K2c). 옵셔널 체이닝 보강 확인.
- **[해결·칭찬] 7차 찜 403 → 201** (K9: aria-pressed false→true, common_likes 201). 알림 트리거 문제 해소.
- **[유지·칭찬] users anon RLS 닫힘**: anon `users?select=*` content-range `*/0`.
- **[해결·칭찬] 빌드 tsc 23건 → 4건**: 옛 DashboardClient 19·usedgoods·rental.ts 정리됨.
- **[필수] 빌드 여전히 빨간불(4건)**: admin/layout.tsx:95 `badge`(타입) + ProfileCard 3건(런타임 크래시 원인).
- **[필수] CI 게이트 여전히 없음**(`.github/workflows` 부재) — 8라운드째. 이번 profile 크래시도 게이트가 있었으면 머지 전 차단됐을 사례.
- **[신규 엔드포인트] 결제 return/webhook·본인인증 라우트**: 멱등 처리·토큰 검증·Redis→메모리 폴백 등 설계 탄탄. (세부 [제안]은 리뷰 본문)
