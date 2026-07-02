# go 페이지 성능 개선 — Google Maps 동적 로딩 + 스켈레톤

- **담당자**: 박소유
- **대상 페이지**: `/go`
- **관련 검사 문서**: [../성능검사/go.md](../성능검사/go.md)
- **우선순위**: P0
- **상태**: 완료

## 1. 문제 정의

- 모바일 LCP 8.1s 🔴, TBT 480ms 🔴 — 서비스 전체 최악 페이지
- `@vis.gl/react-google-maps` SDK(~2MB)가 초기 번들에 포함되어 페이지 진입 즉시 다운로드 및 실행됨
- Maps SDK 실행 중 메인 스레드 블로킹 → JS 실행 1.7s, 긴 작업 11개 발생 → TBT 480ms
- LCP 대상 요소(Map)가 SDK 로드 완료 후에야 렌더링되어 LCP 8.1s 측정

## 2. PSI Insights (개선 기회)

| Insight 항목 | 디바이스 | 예상 절감 (Est savings) | 이번 개선 반영 |
| --- | :---: | --- | :---: |
| 렌더링 차단 요청 | 📱 모바일 | 700ms | ⬜ |
| LCP 분석 | 📱 모바일 | — | ✅ |
| LCP 요청 탐색 | 📱 모바일 | — | ✅ |
| 네트워크 종속 항목 트리 | 📱 모바일 | — | ✅ |
| 효율적인 캐시 수명 사용 | 공통 | 272~290KiB | ⬜ |
| 이미지 전송 개선 | 공통 | 79KiB | ⬜ |
| 레거시 JavaScript | 공통 | 15KiB | ⬜ |
| 사용하지 않는 자바스크립트 줄이기 | 공통 | ~406KiB | ✅ 부분 (Maps SDK 번들 분리) |

## 3. 개선 전 / 후 지표

| 지표             |  디바이스   |  개선 전   |  개선 후   | 변화 |
| ---------------- | :---------: | :--------: | :--------: | :--: |
| Performance 점수 |  📱 모바일  | 57         |            |      |
| LCP              |  📱 모바일  | 8.1s 🔴    |            |      |
| TBT              |  📱 모바일  | 480ms 🔴   |            |      |
| Speed Index      |  📱 모바일  | 6.7s 🔴    |            |      |
| Performance 점수 | 🖥️ 데스크탑 | 86         |            |      |
| LCP              | 🖥️ 데스크탑 | 2.1s 🟡    |            |      |

> 개선 후 값은 동일 조건(PSI, 배포 URL)으로 **재측정**하여 기록.

## 4. 채택 배경 및 의사결정

### 왜 dynamic import를 선택했는가

`/go` 페이지는 LCP 8.1s, TBT 480ms로 서비스 전체에서 가장 낮은 성능을 보였다. 원인은 `@vis.gl/react-google-maps` SDK(~2MB)가 초기 번들에 포함되어 페이지 진입 즉시 다운로드·실행되는 구조였다. 이를 해결하기 위해 아래 방향을 검토했다.

| 방향 | 내용 | 채택 여부 |
|------|------|:---------:|
| **mounted state + 스켈레톤만 적용** | hydration 전 스켈레톤 표시로 LCP 개선 | ❌ 단독 채택 불가 |
| **IntersectionObserver로 스크롤 시 맵 로드** | 화면에 들어올 때 Maps SDK 로드 | ❌ |
| **정적 지도 이미지로 대체** | 초기에 이미지, 클릭 시 실제 맵 로드 | ❌ |
| **dynamic import로 Maps SDK 번들 분리** | 초기 번들에서 SDK 제거, lazy load | ✅ |

**mounted state 단독 미채택 이유:** `useState(false) → useEffect → setMounted(true)` 패턴은 LCP 대상 요소를 스켈레톤으로 교체해 LCP 측정 시점을 앞당기지만, Maps SDK는 여전히 파일 상단 `import`에 포함되어 초기 번들에 묶인다. 스켈레톤이 보이는 동안에도 SDK가 다운로드·실행되므로 TBT가 개선되지 않는다. 이 때문에 스켈레톤을 `dynamic`의 `loading` 옵션으로 통합하는 방식으로 전환했다.

**IntersectionObserver 미채택 이유:** `/go` 페이지는 맵 자체가 전체 화면을 차지하므로 "스크롤해서 뷰포트에 들어올 때" 라는 조건이 성립하지 않는다. 진입 즉시 맵이 보여야 한다.

**정적 이미지 대체 미채택 이유:** 인터랙션(핀 클릭, 드래그, 줌)이 맵의 핵심 기능이므로 정적 이미지로 대체하면 사용자 경험이 크게 저하된다.

**dynamic import 채택 이유:** `next/dynamic`으로 `GoMapClient`를 lazy load하면 Maps SDK가 초기 번들에서 완전히 분리되어 별도 청크로 생성된다. 초기 JS 실행량이 줄어 TBT가 개선되고, `loading: () => <GoMapSkeleton />`으로 SDK 다운로드 중 스켈레톤을 자연스럽게 표시할 수 있다. 코드 구조는 기존 로직을 파일만 이동한 것이므로 동작 변경이 없다.

---

## 5. 개선 작업 내용

- `src/app/(user)/go/_components/GoMapClient.tsx` 신규 생성 — 기존 `page.tsx`의 Maps SDK 포함 로직 전체 이동
- `src/app/(user)/go/page.tsx` 경량 shell로 교체 — `next/dynamic(ssr:false)`으로 `GoMapClient` lazy load, Maps SDK가 초기 번들에서 제거됨
- `GoMapSkeleton` 컴포넌트 추가 — Maps SDK 다운로드 중 구글맵 기본 배경색(`#e5e3df`) + 필터칩·버튼 스켈레톤 표시, LCP 대상 요소를 즉시 렌더링되는 스켈레톤으로 교체
- **관련 PR / 커밋**: (배포 후 링크 추가)

## 6. 검증

- 재측정 PSI 링크 (📱 모바일):
- 재측정 PSI 링크 (🖥️ 데스크탑):
- 개선 확인 결과 한 줄:
