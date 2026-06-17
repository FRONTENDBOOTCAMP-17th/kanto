# Kanto E2E 시나리오 (매일 갱신)

실제 사용자 흐름을 따라가며 매일 확인한다. 캡처는 `review/images/<날짜>/`에 남긴다.
스펙: `tests/kanto-daily.spec.ts` · dev 포트 3100 · 계정: `test-account.md`

> 참고: 루트 `/`는 개발용 라우트 인덱스(실제 메인 아님). 실제 사용자 메인은 `/main`.
> `api/login`이 Upstash Redis 환경변수(`UPSTASH_REDIS_REST_URL/TOKEN`)를 모듈 로드 시 요구.
> 키를 받아 적용한 뒤 로그인 제출~로그인 후 흐름까지 확인 완료(2026-06-16).

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K1 | 메인 진입 | `/main` 진입 → 200, 데스크톱·모바일 렌더 | 2026-06-16 pass |
| K2 | 중고거래 목록→상세 | `/usedgoods` → 카드 클릭 → 상세 | 2026-06-16 pass |
| K3 | 방렌트 목록 | `/rental` 렌더 | 2026-06-16 pass |
| K4 | 구인구직 목록 | `/job` 렌더 | 2026-06-16 pass |
| K5 | 로그인 폼 | `/login` → 이메일 로그인 폼 노출 | 2026-06-16 pass |
| K6 | 로그인 후 둘러보기 | 로그인 → `/main`·`/profile`·`/job/create` 200 + 채팅 위젯 | 2026-06-16 pass(전부 200, 로그인 상태 확인) |

## 발견 (2026-06-16)
- 빌드: `npx tsc --noEmit` 실패 — `src/app/(admin)/admin/_components/DashboardClient.tsx` `DashboardData` 미export(TS2305) + implicit any 다수. 6라운드째 빨간불(dev 렌더는 됨).
- 로그인: Upstash Redis 키 적용 후 이메일 로그인 정상. 로그인 후 `/main`·`/profile`·`/job/create` 모두 200 렌더(헤더 로그인 상태, 프로필 편집·회원 탈퇴 UI, 구인 글쓰기 1/2 폼 확인).
- 로그인 라우트가 Upstash 키를 모듈 최상단 `process.env.X!`로 즉시 사용 → 키 없는 환경(새 팀원·CI)에선 import 시 크래시. 지연 초기화로 우아하게 실패하도록 권유([제안]).
- 채팅은 라우트(`/chats`)에서 플로팅 위젯(`FloatingChatWidget`)으로 전환됨 → 과거 `/chats` 404 지적은 구조 변경으로 해소.
