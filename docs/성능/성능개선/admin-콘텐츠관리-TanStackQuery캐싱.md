# 어드민 콘텐츠 관리 `/admin/operation/content` 성능 개선 — TanStack Query 도입으로 불필요한 GET 재요청 제거

- **담당자**: 김도혁
- **대상 페이지**: `/admin/operation/content` (금칙어 관리 · 스팸 관리)
- **관련 검사 문서**: 해당 없음 — PSI 감사가 아니라 어드민 API 요청 패턴 리뷰 중 발견
- **우선순위**: P1
- **상태**: 완료
- **관련 커밋**: `949293d` refactor: 어드민 콘텐트 영역 리팩토링

## 1. 문제 정의 (무엇이 · 왜 발생했는가)

- `content/page.tsx`는 "금칙어 관리" / "스팸 관리" 탭을 `{section === "profanity" && <ProfanitySection />}` 형태의 **조건부 렌더링**으로 전환한다. 즉 탭을 옮길 때마다 이전 섹션 컴포넌트가 완전히 언마운트되고, 돌아오면 새로 마운트된다.
- 하위 컴포넌트(`ProfanityList`, `SpamConfigCard`, `SanctionTemplateList`)는 각자 마운트 시점에 데이터를 GET으로 가져온다. 캐시가 없다면 **탭을 왔다 갔다 할 때마다 서버에 동일한 데이터를 매번 재요청**하게 된다.
- 서버/UI 상태가 분리돼 있지 않아, 저장·삭제 후 최신 상태를 반영하려면 전체 재조회에 의존하는 구조였다.

## 2. 개선 작업 내용

- `@tanstack/react-query`(`^5.101.1`)를 도입하고 전역 `QueryClient`(`src/components/common/Providers.tsx`)에 `staleTime: 30 * 1000`(30초)을 기본값으로 설정 — 30초 이내 재마운트는 캐시를 그대로 재사용하고 네트워크 요청을 생략한다.
- `ProfanityList`, `SpamConfigCard`, `SanctionTemplateList`를 `useQuery`로 전환(쿼리 키: `profanity-rules`, `spam-config`, `sanction-templates`).
- 저장/삭제 뮤테이션 후 재조회 대신 캐시를 직접 갱신:
  - `SpamConfigCard`, `SanctionTemplateList` → `queryClient.setQueryData`로 응답값을 캐시에 바로 반영 (재요청 없음)
  - `ProfanityList` → 삭제 후 `invalidateQueries`로만 갱신

## 3. 측정 방법론

- 이 페이지는 관리자 세션(Supabase 인증)이 있어야 접근 가능해, 이번 환경에서 실제 로그인 상태로 브라우저 계측을 하는 것은 불가능했다.
- 대신 **실제 프로덕션 컴포넌트 코드**(`ProfanitySection`, `SpamSection`과 그 하위 컴포넌트)를 jsdom + React 19 + 실제 `@tanstack/react-query` 라이브러리 위에서 그대로 렌더링하고, `fetch`만 스텁으로 가로채 호출 횟수를 세는 방식으로 측정했다. 컴포넌트 마운트/언마운트, 쿼리 캐시 판단 로직은 전부 실제 코드가 수행한다.
- 시나리오: 초기 진입 → "금칙어 관리" ↔ "스팸 관리" 탭 5회 왕복 → "룰 등록" ↔ "룰 목록" 2회 왕복 (모두 30초 캐시 윈도우 이내에 발생하는 세션 가정).
- 비교 기준(Before)은 "컴포넌트를 지금처럼 분리하되 TanStack Query 캐시가 없는 경우"(`staleTime: 0`, 마운트마다 재요청)로 잡았다. 실제 리팩토링 이전(`949293d` 이전) 코드는 섹션이 언마운트되지 않는 단일 파일 구조라 애초에 재요청이 거의 없었으므로, 그 버전과 비교하면 이 수치는 의미가 달라진다 — 정확히는 **"컴포넌트 분리가 유발했을 재요청 증가분을 캐시가 상쇄한 효과"**다.

## 4. 개선 전 / 후 지표

동일 시나리오(탭 5회 왕복 + 룰 등록/목록 2회 왕복)에서 발생한 GET 요청 수:

| 엔드포인트 | Before (캐시 없음, staleTime=0) | After (현재 코드, staleTime=30s) | 변화 |
| --- | :---: | :---: | :---: |
| `GET /api/admin/profanity-rules` | 8 | 1 | −7 |
| `GET /api/admin/spam-config` | 5 | 1 | −4 |
| `GET /api/admin/sanction-templates` | 5 | 1 | −4 |
| **합계** | **18** | **3** | **−15 (−83.3%)** |

> 최초 진입 시 1회씩(총 3회)은 캐시 유무와 무관하게 항상 발생한다. 이후 재요청은 캐시 도입 후 전부 0건으로 수렴했다.

## 5. 검증

- 위 표의 수치는 실제 컴포넌트 트리 + 실제 `QueryClient` 캐시 판단 로직을 구동해 얻은 결과이며, `staleTime`을 30_000 → 0으로 바꾸는 것 외에 컴포넌트 코드는 동일하게 유지해 재현 가능하다.
- 감소율은 세션 내 탭 전환 빈도에 비례한다 (전환이 잦을수록 절감 폭이 커진다). 다만 "최초 1회를 제외한 재요청이 전부 캐시로 흡수된다"는 구조적 결론은 시나리오 반복 횟수와 무관하게 동일하다.
- 이 측정은 `fetch` 호출 횟수만 집계하므로 실제 네트워크 지연·서버 부하 절감분까지 정량화한 것은 아니다.
