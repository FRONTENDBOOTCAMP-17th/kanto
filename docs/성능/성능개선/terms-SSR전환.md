# terms 페이지 성능 개선 — Notion SSR 전환 + ISR 캐싱

- **담당자**: 박소유
- **대상 페이지**: `/terms/service`, `/terms/privacy`, `/terms/youth`, `/terms/payment`, `/terms/policy`
- **관련 검사 문서**: [../성능검사/policy.md](../성능검사/policy.md) · [../성능검사/youth.md](../성능검사/youth.md) · [../성능검사/payment.md](../성능검사/payment.md) · [../성능검사/termsservice.md](../성능검사/termsservice.md) · [../성능검사/privacy.md](../성능검사/privacy.md)
- **우선순위**: P0
- **상태**: 완료

## 1. 문제 정의

- 모바일 LCP 4.8~5.1s 🔴 — 약관 콘텐츠가 클라이언트에서만 fetch되는 구조로 인한 직렬 지연
- 기존 렌더링 체인: `HTML 도착(빈 화면) → JS 번들 다운로드 → hydrate → /api/terms fetch → Notion API 호출 → 렌더링` 이 순서대로 직렬 실행되어 LCP가 최종 렌더링 시점에 측정됨
- `localStorage` 캐시는 최초 방문(PSI 측정 시나리오)에는 적용되지 않아 PSI 점수 개선에 효과 없음

## 2. PSI Insights (개선 기회)

| Insight 항목 | 디바이스 | 예상 절감 (Est savings) | 이번 개선 반영 |
| --- | :---: | --- | :---: |
| 렌더링 차단 요청 | 📱 모바일 | 590~600ms | ⬜ |
| 네트워크 종속 항목 트리 | 공통 | — | ✅ |
| 레거시 JavaScript | 공통 | 15KiB | ⬜ |
| LCP 분석 (요소 렌더링 지연) | 📱 모바일 | 5,650ms | ✅ |
| 사용하지 않는 자바스크립트 줄이기 | 공통 | 186KiB | ✅ 부분 (react-markdown 서버 이동) |

## 3. 개선 전 / 후 지표

| 지표             |  디바이스   |  개선 전   |  개선 후   | 변화 |
| ---------------- | :---------: | :--------: | :--------: | :--: |
| Performance 점수 |  📱 모바일  | 72~81      |            |      |
| LCP              |  📱 모바일  | 4.8~5.1s 🔴 |            |      |
| TBT              |  📱 모바일  | 150~390ms  |            |      |
| Performance 점수 | 🖥️ 데스크탑 | 93~98      |            |      |
| LCP              | 🖥️ 데스크탑 | 0.9~1.0s 🟢 |            |      |

> 개선 후 값은 동일 조건(PSI, 배포 URL)으로 **재측정**하여 기록.

## 4. 채택 배경 및 의사결정

### 왜 SSR + ISR을 선택했는가

약관 페이지의 LCP 원인은 "콘텐츠가 클라이언트에서만 fetch되는 구조" 자체였다. 이를 해결하기 위해 아래 세 가지 방향을 검토했다.

| 방향 | 내용 | 채택 여부 |
|------|------|:---------:|
| **클라이언트 fetch 유지 + SWR/React Query 도입** | 캐싱 레이어를 추가해 재방문 속도 개선 | ❌ |
| **SSR (revalidate 없음)** | 서버에서 매 요청마다 Notion API 실시간 호출 | ❌ |
| **SSR + ISR (revalidate = 86400)** | 서버에서 Notion 호출, 결과를 하루 캐시 | ✅ |

**SWR/React Query 미채택 이유:** 캐시 레이어를 더해도 최초 방문(PSI 측정 시나리오)에는 여전히 JS 다운로드 → hydrate → API 호출의 직렬 체인이 그대로 남는다. LCP가 개선되지 않는다.

**SSR 단독(revalidate 없음) 미채택 이유:** Notion API 응답이 느릴 경우(500ms~1s) 매 방문마다 지연이 발생한다. 약관 내용은 자주 바뀌지 않으므로 매번 Notion을 호출할 필요가 없다.

**SSR + ISR 채택 이유:** 서버가 HTML을 Notion 데이터로 채워서 브라우저에 전달하므로 직렬 체인이 제거된다. `revalidate = 86400`으로 Notion API는 하루에 한 번만 호출되고 이후 방문은 캐시된 HTML을 즉시 서빙한다. 약관 콘텐츠 특성(변경 빈도 낮음)과 가장 잘 맞는 전략이다.

---

## 5. 개선 작업 내용

### 삭제된 파일

**`TermsClientWrapper.tsx` 삭제**
- 역할: `"use client"` 환경에서 `TermsClientContent`를 `dynamic(ssr:false)`로 감싸는 껍데기 컴포넌트. 서버에서 실행되지 않도록 클라이언트 전용으로 격리하는 역할만 담당했음
- 삭제 이유: 서버 컴포넌트가 Notion을 직접 호출하므로 클라이언트 격리 장치 자체가 불필요해짐
- 역할 이전: 없음 (역할 자체가 제거됨)

**`TermsClientContent.tsx` 삭제**
- 역할: 브라우저에서 마운트된 후 `useEffect`로 `/api/terms`를 fetch → Notion API 호출 → `setState`로 화면 업데이트. 로딩 스피너 / 에러 UI / localStorage 10시간 캐시도 이 파일에서 처리했음
- 삭제 이유: 클라이언트 fetch 자체가 제거되어 로직이 필요 없어짐. localStorage 캐시도 서버 ISR 캐시로 대체
- 역할 이전:
  - 데이터 fetch → `page.tsx`의 `getNotionPage()` 서버 호출로 이전
  - 로딩 UI → `loading.tsx`로 이전
  - 에러 UI → `page.tsx` 에러 체크(`content.includes("불러올 수 없습니다")`)로 이전
  - 캐시 → `revalidate = 86400` ISR로 이전 (브라우저 캐시 → 서버 엣지 캐시)

### 변경된 파일

**`src/app/(user)/terms/[type]/page.tsx`**
- 변경 전: `getLocale()` 호출 후 `TermsClientWrapper`에 props만 전달하는 단순 서버 컴포넌트
- 변경 후: `getNotionPage(pageId)`를 직접 호출해 Notion 데이터를 서버에서 가져와 `TermsContent`에 전달. `export const revalidate = 86400`으로 하루 단위 ISR 캐싱 적용 — 첫 방문 후 24시간은 Notion API를 호출하지 않고 캐시 서빙

### 신규 파일

**`src/app/(user)/terms/[type]/loading.tsx`**
- 역할: 기존 `TermsClientContent`의 로딩 스피너(`teal` 색상 원형 스피너)를 Next.js App Router의 `loading.tsx` 규약으로 이전. 서버가 Notion 데이터를 fetch하는 동안 자동으로 표시됨

- **관련 PR / 커밋**: (배포 후 링크 추가)

## 6. 검증

- 재측정 PSI 링크 (📱 모바일):
- 재측정 PSI 링크 (🖥️ 데스크탑):
- 개선 확인 결과 한 줄:
