# 회원가입 약관 Notion CMS 프리로드 설계

## 1. 배경

현재 회원가입 페이지의 필수 약관(`terms`, `privacy`, `age`)은 사용자가 개별 약관 또는 **전체 동의하기**를 눌러 `TermsModal`이 열린 뒤에 `/api/terms` 요청을 시작한다.

따라서 첫 모달에는 Notion CMS 응답을 기다리는 로딩 화면이 노출된다. 전체 동의 시에도 약관 모달이 순서대로 교체되며, 아직 요청하지 않은 다음 약관에서 로딩이 다시 발생할 수 있다.

### 현재 흐름

```text
회원가입 페이지 진입
  → 사용자 정보 입력
  → 전체 동의하기 클릭
  → TermsModal 마운트
  → /api/terms 요청 시작
  → Notion CMS 조회 및 Markdown 변환
  → 약관 표시
```

병목의 직접 원인은 `TermsModal.tsx`의 `useEffect`가 모달 마운트 이후에만 `fetch()`를 실행하는 구조이다.

## 2. 목표

- 회원가입 페이지가 표시되는 즉시 필수 약관 로딩을 백그라운드에서 시작한다.
- 사용자가 약관 모달을 열었을 때 이미 받은 콘텐츠를 즉시 표시한다.
- 특정 약관 요청 실패가 다른 약관 표시를 막지 않도록 한다.
- 선로딩이 끝나기 전에 사용자가 모달을 열어도 동일한 진행 중 요청을 재사용하여 중복 호출하지 않는다.
- 기존의 스크롤 완료 확인, 동의 순서, 다국어 및 서버 캐시 정책을 유지한다.

## 3. 비목표

- Notion 페이지 구조나 `/api/terms` 응답 형식 변경
- 약관 동의 정책 및 필수/선택 항목 변경
- 약관 전문을 회원가입 페이지의 서버 렌더링 결과에 포함
- 전역 상태 라이브러리 또는 별도 데이터 패칭 라이브러리 도입

## 4. 제안 구조

회원가입 페이지 수명 동안 약관 데이터를 보관하는 `useSignupTerms` 훅을 추가한다. `AgreeSection`이 마운트될 때 훅이 약관별 요청을 동시에 시작하고, `TermsModal`은 직접 요청하지 않고 훅이 제공한 상태를 렌더링한다.

```text
SignupPage
  └─ AgreeSection
       ├─ useSignupTerms(locale)
       │    ├─ terms 요청 ───┐
       │    ├─ privacy 요청 ─┼─ Promise.allSettled 방식의 독립 처리
       │    └─ age 요청 ─────┘
       └─ TermsModal
            └─ 선택한 약관의 사전 로드 상태를 props로 수신
```

### 권장 파일 변경

| 파일 | 역할 |
|---|---|
| `signup/_hooks/useSignupTerms.ts` | 약관 선로딩, 상태 보관, 요청 중복 방지, 재시도 |
| `signup/_components/AgreeSection.tsx` | 페이지 진입 시 훅 실행, 현재 약관 상태를 모달에 전달 |
| `signup/_components/TermsModal.tsx` | 자체 `fetch` 제거, 전달받은 데이터/상태 렌더링 |
| `api/terms/route.ts` | 변경 없음. 기존 locale 검증 및 HTTP 캐시 유지 |

## 5. 상태 모델

각 약관은 서로 독립적인 상태를 가진다.

```ts
type ModalType = "terms" | "privacy" | "age";
type LoadStatus = "idle" | "loading" | "success" | "error";

type TermsResource = {
  status: LoadStatus;
  content: string | null;
  error: string | null;
};

type TermsResources = Record<ModalType, TermsResource>;
```

상태 전이는 다음과 같다.

```text
idle → loading → success
               ↘ error → loading(재시도) → success | error
```

`Promise.all()`처럼 하나의 실패로 전체 로딩을 실패 처리하지 않는다. 요청은 항목별로 결과를 반영하거나 `Promise.allSettled()`를 사용한다.

## 6. 상세 동작

### 6.1 페이지 진입 시 선로딩

`AgreeSection` 마운트 시 현재 locale을 기준으로 `terms`, `privacy`, `age` 요청을 즉시 시작한다.

```ts
const resources = useSignupTerms(locale);
```

요청 URL은 기존 API를 그대로 사용한다.

```text
/api/terms?type=terms&locale=ko
/api/terms?type=privacy&locale=ko
/api/terms?type=age&locale=ko
```

세 요청은 순차 `await`하지 않고 동시에 시작한다. `age`는 서버의 정적 문자열이므로 응답 비용이 작지만, 모달의 데이터 공급 방식을 통일하기 위해 같은 리소스 모델에 포함한다.

### 6.2 진행 중 Promise 재사용

React 개발 모드의 Strict Mode 재실행이나 빠른 모달 조작으로 동일 요청이 중복될 수 있다. 훅 모듈 내부에 `locale:type` 키 기반의 진행 중 Promise 캐시를 둔다.

```ts
const inFlight = new Map<string, Promise<TermsResponse>>();
```

- 동일 키 요청이 진행 중이면 새 `fetch` 대신 기존 Promise를 반환한다.
- 요청 완료 후 `inFlight`에서 제거한다.
- 응답 데이터의 장기 캐시는 기존 브라우저 HTTP 캐시와 서버 캐시 헤더에 맡긴다.

### 6.3 모달 열기

`TermsModal`은 아래 값을 props로 받는다.

```ts
interface TermsModalProps {
  modalType: ModalType;
  resource: TermsResource;
  onRetry: () => void;
  onClose: () => void;
  onAgree: () => void;
}
```

- `success`: 첫 렌더부터 Markdown 콘텐츠 표시
- `loading`: 기존 로딩 UI 표시. 선로딩 중인 동일 요청의 완료를 기다림
- `error`: 오류 문구와 재시도 버튼 표시
- `idle`: 방어적으로 즉시 해당 항목 로딩 시작

모달 내부의 데이터 요청 `useEffect`는 제거한다. 스크롤 위치 및 동의 가능 여부만 모달의 로컬 상태로 유지한다.

### 6.4 전체 동의 흐름

기존 큐 순서인 `terms → privacy → age`를 유지한다. 첫 모달을 읽는 동안 나머지 두 약관도 이미 병렬로 로드되므로, 다음 모달 전환 시 콘텐츠가 즉시 표시될 가능성이 높다.

### 6.5 locale 변경

약관 데이터 키에 locale을 반드시 포함한다. 언어가 변경되면 새 locale의 약관을 다시 선로딩하며, 이전 언어의 응답이 현재 화면 상태를 덮어쓰지 않도록 effect cleanup 플래그 또는 요청 세대(generation) 값을 사용한다.

```text
ko:terms ≠ en:terms ≠ fil:terms
```

## 7. 오류 및 예외 처리

- 한 약관이 실패해도 성공한 다른 약관 콘텐츠는 정상 표시한다.
- 실패한 약관에서는 동의 버튼을 비활성화하고 재시도 동작을 제공한다.
- 재시도는 해당 `type + locale`만 다시 호출한다.
- 컴포넌트 언마운트 후에는 상태를 갱신하지 않는다. 단, 이미 시작한 GET 요청은 브라우저 캐시를 채울 수 있으므로 반드시 취소할 필요는 없다.
- API의 `400`, `502` 및 JSON 파싱 실패를 모두 `error` 상태로 처리한다.
- 응답의 `content`가 문자열인지 런타임에서 확인해 잘못된 응답을 성공 처리하지 않는다.

## 8. 캐시 전략

현재 `/api/terms`에는 다음 캐시 정책이 있다.

```http
Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400
```

이번 변경은 이 정책을 유지한다.

- 훅 상태: 현재 회원가입 페이지 세션에서 즉시 재사용
- 진행 중 Promise 캐시: 동일 요청의 동시 중복 방지
- 브라우저/공유 캐시: 페이지 재진입 및 사용자 간 서버 응답 재사용
- `getNotionPage` 메모리 캐시: 서버 인스턴스 내 Notion API 호출 감소

별도 `localStorage` 저장은 이번 범위에서 사용하지 않는다. 회원가입 페이지 체류 중 즉시 표시한다는 목표에는 메모리 상태와 기존 HTTP 캐시로 충분하며, 장기 저장에 따른 locale/TTL/스키마 무효화 복잡도를 피할 수 있다.

## 9. UX 정책

- 선로딩은 회원가입 폼의 첫 화면 렌더링을 막지 않는다.
- 약관 요청 실패가 이름, 이메일, 비밀번호 입력을 방해하지 않는다.
- 선로딩 완료 전 모달을 연 경우에만 기존 로딩 UI를 짧게 표시한다.
- 콘텐츠 로딩이 완료된 시점마다 스크롤 가능 높이를 다시 계산한다.
- `age`는 기존대로 스크롤 없이 동의할 수 있다.
- `terms`, `privacy`는 기존대로 끝까지 읽거나 하단 이동 후 동의할 수 있다.

## 10. 성능 및 부하 고려사항

페이지 진입 즉시 최대 3개의 API 요청이 발생한다. 다만 `age`는 Notion을 호출하지 않고, 실질적인 Notion 기반 요청은 `terms`, `privacy` 2개이다. 두 요청은 기존 HTTP 캐시와 서버 메모리 캐시의 보호를 받는다.

기대 효과:

- 사용자가 폼을 입력하는 시간을 약관 로딩 시간으로 활용
- 모달 클릭 후 체감 대기 시간 대부분 제거
- 전체 동의 과정에서 다음 약관 로딩 반복 제거
- 진행 중 요청 재사용으로 불필요한 중복 호출 방지

## 11. 테스트 계획

### 단위/컴포넌트 테스트

1. `AgreeSection` 마운트 직후 locale별 3개 요청이 시작된다.
2. 세 요청이 순차가 아닌 병렬로 시작된다.
3. 성공한 리소스는 모달 첫 렌더에 즉시 표시된다.
4. 한 요청 실패가 다른 리소스의 성공 상태를 변경하지 않는다.
5. 동일 키를 연속 요청해도 실제 `fetch`는 한 번만 실행된다.
6. 재시도 시 실패한 항목만 다시 요청한다.
7. locale 변경 후 이전 locale 응답이 현재 상태를 덮어쓰지 않는다.

### E2E 테스트

1. `/signup` 진입 직후 Network에서 약관 요청이 시작되는지 확인한다.
2. 응답 완료 후 전체 동의를 누르면 첫 약관에 로딩 문구가 보이지 않는지 확인한다.
3. 다음 약관으로 이동해도 추가 대기 없이 콘텐츠가 표시되는지 확인한다.
4. 느린 네트워크에서 선로딩 도중 모달을 열어도 중복 요청 없이 정상 완료되는지 확인한다.
5. API 실패 시 동의가 차단되고 재시도로 복구되는지 확인한다.
6. 한국어, 영어, 필리핀어 각각 올바른 콘텐츠가 표시되는지 확인한다.

## 12. 완료 조건

- 회원가입 페이지 진입 시 약관 3종의 비동기 로딩이 시작된다.
- 선로딩 완료 후 모달을 열면 로딩 화면 없이 콘텐츠가 표시된다.
- 전체 동의 모달 큐에서 같은 약관을 중복 요청하지 않는다.
- 요청 실패 및 locale 변경 시 잘못된 콘텐츠로 동의할 수 없다.
- 기존 약관 동의 및 스크롤 검증 동작에 회귀가 없다.

## 13. 구현 순서

1. 공용 타입과 `useSignupTerms` 훅을 추가한다.
2. 훅에 병렬 선로딩, 진행 중 Promise 중복 방지, 항목별 재시도를 구현한다.
3. `AgreeSection`에서 훅을 실행하고 선택된 리소스를 모달에 전달한다.
4. `TermsModal`의 자체 fetch 로직을 제거하고 표현 컴포넌트로 변경한다.
5. 단위 테스트와 느린 네트워크 기반 E2E 검증을 수행한다.

