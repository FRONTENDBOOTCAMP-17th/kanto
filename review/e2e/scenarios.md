# Kanto E2E 시나리오 (매일 갱신)

실제 사용자 흐름을 따라가며 매일 확인한다. 캡처는 `review/images/<날짜>/`에 남긴다.
스펙: `tests/kanto-daily.spec.ts` · dev 포트 3100 · 계정: `test-account.md`

> 참고: 루트 `/`는 개발용 라우트 인덱스(실제 메인 아님). 실제 사용자 메인은 `/main`.
> `api/login`이 Upstash Redis 환경변수(`UPSTASH_REDIS_REST_URL/TOKEN`)를 모듈 로드 시 요구 →
> 그 키가 없는 리뷰 환경에선 로그인 제출 검증 불가(로그인 폼 렌더까지만 확인).

| ID | 시나리오 | 단계 → 기대 | 최근 결과 |
| -- | -------- | ----------- | --------- |
| K1 | 메인 진입 | `/main` 진입 → 200, 데스크톱·모바일 렌더 | 2026-06-16 pass (data 로딩 화면) |
| K2 | 중고거래 목록→상세 | `/usedgoods` → 카드 클릭 → 상세 | 2026-06-16 pass |
| K3 | 방렌트 목록 | `/rental` 렌더 | 2026-06-16 pass |
| K4 | 구인구직 목록 | `/job` 렌더 | 2026-06-16 pass |
| K5 | 로그인 폼 | `/login` → 이메일 로그인 폼 노출 | 2026-06-16 pass(폼까지) · 제출은 Upstash env 필요 |
| K6 | 로그인 후 프로필/글쓰기 | 로그인 → `/profile`·`/job/create` | 보류: Upstash env 없어 로그인 제출 불가 |
| K7 | 플로팅 채팅 위젯 | 로그인 후 채팅 버블 노출 | 보류(로그인 의존) |

## 발견 (2026-06-16)
- 빌드: `npx tsc --noEmit` 실패 — `src/app/(admin)/admin/_components/DashboardClient.tsx` `DashboardData` 미export(TS2305) + implicit any 다수. 6라운드째 빨간불.
- 로그인 라우트가 Upstash Redis 키를 모듈 최상단에서 `process.env.X!`로 즉시 사용 → 키 없으면 라우트 import 시 크래시. 리뷰 환경 한계로 로그인 검증 불가(학생 버그로 단정하지 않음). 실제 배포엔 키가 있을 것으로 보이나, 키 부재 시 우아하게 실패하도록 지연 초기화 검토 여지.
- 채팅은 라우트(`/chats`)에서 플로팅 위젯(`FloatingChatWidget`)으로 전환됨 → 과거 `/chats` 404 지적은 구조 변경으로 해소.
