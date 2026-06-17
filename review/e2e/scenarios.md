# Kanto E2E 시나리오 (매일 갱신)

실제 사용자 흐름을 따라가며 매일 확인한다. 캡처는 `review/images/<날짜>/`에 남긴다.
스펙: `tests/kanto-daily.spec.ts` · dev 포트 3100 · 계정: `test-account.md`

> 참고: 루트 `/`는 개발용 라우트 인덱스(실제 메인 아님). 실제 사용자 메인은 `/main`.
> `api/login`이 Upstash Redis 환경변수(`UPSTASH_REDIS_REST_URL/TOKEN`)를 모듈 로드 시 요구.
> 키를 받아 적용한 뒤 로그인 제출~로그인 후 흐름까지 확인 완료(2026-06-16).

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K1 | 메인 진입 | `/main` 진입 → 200, 데스크톱·모바일 렌더 | 2026-06-17 pass |
| K2 | 중고 목록→상세 | `/usedgoods` → 카드 클릭 → 상세 | 2026-06-17 **fail (비로그인 상세 크래시)** |
| K3 | 방렌트 목록 | `/rental` 렌더 | 2026-06-17 pass |
| K4 | 구인구직 목록 | `/job` 렌더 | 2026-06-17 pass |
| K5 | 로그인 폼 | `/login` → 이메일 로그인 폼 노출 | 2026-06-17 pass |
| K6 | 로그인 후 둘러보기 | 로그인 → `/main`·`/profile`·`/job/create` 200 + 채팅 위젯 | 2026-06-17 pass(전부 200) |
| K7 | 방렌트 상세(비로그인) | `/rental/[id]` 렌더 | 2026-06-17 **fail (auth_id null 크래시)** |
| K8 | 구인 상세(비로그인) | `/job/[id]` 렌더 | 2026-06-17 **fail (auth_id null 크래시)** |
| K9 | 로그인 후 중고 상세·찜 | 로그인 → 중고 상세 → 찜 토글 | 2026-06-17 상세 렌더 pass / **찜 토글 fail(403 롤백)** |
| K10 | 로그인 후 방렌트·구인 상세 | 로그인 → 상세 정상 렌더 | 2026-06-17 pass(로그인 시 정상) |

## 발견 (2026-06-17) — 7차
- **[필수] 상세 3종 비로그인 크래시**: `usedgoods/[id]` (UsedGoodsDetail.tsx:43 `data.posts.users.created_at`),
  `job/[id]/page.tsx:38` (`job.posts.users.auth_id`), `rental/[id]/page.tsx:40` (`rental.posts.users.auth_id`).
  원인: users RLS가 닫히며 anon은 작성자 `users(...)` 조인이 null → 옵셔널 체이닝 없이 접근 → 서버 런타임 크래시.
  로그인 시엔 정상 렌더(K9·K10). 캡처: K2b/K7/K8(에러), K9b/K10(정상).
- **[필수] 찜하기 깨짐**: 인증 사용자로 `common_likes` insert가 HTTP 403 — 에러 테이블이 `common_notifications`.
  찜 insert에 걸린 알림 트리거가 `common_notifications` RLS 위반 → 트랜잭션 롤백. unlike(delete)는 204.
- **[해결·칭찬] users anon RLS 닫힘**: anon `GET /users?select=*` → content-range `*/0` (0행).
  common_likes·common_reports·chats·messages도 anon 0행, posts만 공개. 1차부터 끌어온 노출 문제 해소.
- **[필수] 빌드 7라운드째 빨간불**: `npx tsc --noEmit` 23건 — RentalCreateForm amenities 3건(신규) + admin DashboardClient 19 + usedgoods/page.tsx:63 + rental.ts:95.
- 로그인은 Upstash 키 적용 후 정상. CI(tsc/build) 게이트 여전히 없음(`.github/workflows` 부재).
