# [usedgoods / rental / main 목록] 성능 개선 — LCP 이미지 priority + 이미지 캐시 TTL

- **담당자**: 김도혁
- **대상 페이지**: `/usedgoods`, `/rental`, `/main` (목록형 페이지 3곳이 공용 컴포넌트 `ContentCard`를 공유하므로 한 번의 수정으로 공통 적용됨)
- **관련 검사 문서**:
  - [../성능검사/usedgoods.md](../성능검사/usedgoods.md) (임태형) — LCP 4.4s/6.1s 🔴, Improve image delivery 2,567 KiB
  - [../성능검사/main.md](../성능검사/main.md) (박소유) — LCP 모바일 4.7s 🔴, 이미지 전송 개선 233~782 KiB
- **우선순위**: P0 (두 검사 문서 모두 이미지 관련 항목을 P0로 지정)
- **상태**: 진행 (코드 반영 완료 · 배포 후 PSI 재측정 필요)

## 0. 배경 — `priority`가 뭔가

`priority`는 next/image의 `<Image>`가 제공하는 prop. next/image는 기본적으로 화면에 없는 이미지가 초기 로딩을 방해하지 않도록 `loading="lazy"`를 적용함(뷰포트 근처에 오면 그때 로딩 시작). `priority={true}`를 주면:

1. `loading="lazy"`가 빠지고 즉시 로딩됨
2. `fetchPriority="high"`가 붙어 브라우저가 다른 리소스보다 먼저 받아오려고 함
3. `<head>`에 `<link rel="preload" as="image">`가 자동으로 추가돼 HTML 파싱 초기부터 다운로드가 시작됨

즉 "이 이미지가 이 페이지에서 제일 먼저·크게 보여야 하는 이미지"라고 브라우저에 알려주는 신호. Next.js 공식 문서도 **LCP(Largest Contentful Paint) 요소가 되는 이미지에는 반드시 `priority`를 달라**고 권장함 — 안 주면 lazy 로딩 때문에 그 이미지가 늦게 뜨고, 그게 그대로 LCP 시간을 늘림.

다만 모든 이미지에 다 주면 의미가 없어짐(다 "먼저"면 우선순위가 아님) — 그래서 이번 작업에서도 실제로 처음 화면에 보이는 개수만큼만 `priority`를 켜고 나머지는 lazy를 유지함 (§4 참고).

## 1. 문제 → 기대 효과 → 그래서 택한 방법

검사 문서에서 공통으로 지적된 것: LCP가 느리고(usedgoods 모바일 4.4s / 데스크탑 6.1s, main 모바일 4.7s), "Improve image delivery" 항목에서 큰 절감 여지(usedgoods 2,567 KiB, main 233~782 KiB)가 있다는 것이었음. 코드를 추적해서 원인 두 가지를 찾았고, 각각 아래 순서(문제 → 고치면 뭐가 좋아지는가 → 그래서 이렇게 고쳤다)로 접근함.

### 1-1. LCP 이미지가 lazy 로딩되고 있었음

- **문제**: [`bab5594`](../../../.git) 커밋(목록 이미지 lazy 로딩 + AVIF 적용)에서 `ImageWithFallback`의 `loading="eager"`를 제거하면서, `ContentCard`를 쓰는 모든 목록(usedgoods/rental/main 인기목록)의 이미지가 next/image 기본값인 `loading="lazy"`가 됨. 카드 목록에 `index` 정보가 전혀 전달되지 않아 **화면에 바로 보이는 첫 카드(=LCP 후보)까지 지연 로딩**되고 있었음. AVIF 전환 자체는 유효한 최적화지만, 그 과정에서 LCP 이미지의 `priority`를 놓친 것.
- **고치면 기대되는 효과**: `priority`를 주면 (§0 참고) lazy가 빠지고 `fetchPriority="high"` + `<link rel="preload">`가 걸려, LCP 후보 이미지가 다른 리소스보다 먼저 다운로드됨 → LCP 시간이 그만큼 줄어듦.
- **그래서 택한 방법**: `ContentCard`에 `priority?: boolean` prop을 추가하고, 각 목록 컴포넌트에서 **실제로 처음 화면에 보이는 개수만큼만** `index` 기반으로 `priority`를 넘김 (그리드는 `index < 4`, 모바일 세로 스택은 `index === 0`). 모든 이미지에 다 주면 "우선순위"라는 의미 자체가 없어지고 `bab5594`가 의도했던 lazy 최적화 효과도 사라지므로, 첫 화면 노출분으로만 범위를 제한함. 상세는 §4.
- **고려했지만 채택하지 않은 방법**:
  - **`bab5594`를 되돌려서 전체 `loading="eager"`로 복귀**: 가장 간단하지만, usedgoods/rental처럼 카드 수가 많은 목록에서 화면 밖 이미지까지 전부 즉시 로딩되어 `bab5594`가 애초에 해결하려던 초기 로드 용량 문제가 그대로 재발함. 기각.
  - **클라이언트에서 실제로 뷰포트에 보이는 카드를 감지해 동적으로 priority 부여** (예: IntersectionObserver로 첫 렌더 시 보이는 카드 판별): `priority`의 핵심 효과인 `<head>` preload 삽입은 **서버 렌더링 시점**에 정해져야 의미가 있는데, 클라이언트 감지는 하이드레이션 이후에나 결과가 나와 이미 늦음. 실익 없이 복잡도만 늘어 기각.
  - **next/image 대신 페이지에 `<link rel="preload" as="image">`를 수동으로 추가**: 이미지 URL·사이즈·포맷을 수동으로 맞춰야 하고 next/image가 만들어주는 것과 결과가 같음. 이미 `priority` prop이 이걸 대신 해주므로 중복 구현이라 기각.
  - **그리드에도 `index === 0`(카드 1개)만 priority 부여**: 데스크탑처럼 한 줄에 최대 4개가 보이는 레이아웃에서는 실제로 화면에 보이는 2~4번째 카드까지 lazy로 남아 개선 효과가 줄어듦. 그리드는 `index < 4`, 세로 1열 스택(모바일 인기목록)만 `index === 0`으로 구분해서 적용.

### 1-2. 이미지 최적화 캐시가 4시간마다 만료됨

- **문제**: `next.config.ts`에 `minimumCacheTTL`이 설정되어 있지 않아 Next.js 기본값(이 버전 기준 4시간, `max-age=14400`)이 적용됨. 같은 이미지를 4시간마다 다시 리사이즈/AVIF 변환해야 해서, 방문자가 캐시 미스를 겪을 때마다 재전송 용량이 커짐. main 검사 문서에도 "모바일 이미지 전송 개선 편차 매우 큼 (233KiB↔782KiB) — 캐시 미스 시 심각해짐"이라고 정확히 이 현상이 기록되어 있음.
- **고치면 기대되는 효과**: 캐시 유효기간을 늘리면 4시간 지날 때마다 겪던 재변환·재전송이 줄어들어, 재방문·다른 방문자의 캐시 적중률이 올라가고 이미지 전송 용량 편차(233~782KiB처럼 캐시 미스 때만 튀는 현상)가 줄어듦.
- **그래서 택한 방법**: `minimumCacheTTL: 60 * 60 * 24 * 30`(30일)로 설정. 게시글 이미지는 등록 후 거의 바뀌지 않는 정적 리소스라 길게 캐시해도 안전하다고 판단함 (수정 시에는 URL 자체가 바뀌므로 캐시 무효화 문제도 없음).
- **고려했지만 채택하지 않은 방법**:
  - **1일 등 더 짧은 TTL**: 4시간보다는 낫지만, 이미지가 거의 안 바뀌는 정적 리소스라는 특성을 고려하면 굳이 짧게 잡을 이유가 없어 절반의 개선에 그침. 기각.
  - **1년 등 매우 긴 TTL / `immutable`**: 캐시 효과는 최대치지만, 신고된 이미지를 내려야 하거나 운영상 이미지를 강제로 갱신해야 할 때 CDN·브라우저 캐시가 오래 남아있게 됨. 현재 업로드 구조상 이미지 URL이 파일명 기준이라(재업로드해도 URL이 안 바뀔 수 있음) 완전히 안전하다고 확신하기 어려워 30일로 절충. 기각(보류).
  - **업로드 시 이미지 URL에 해시/버전을 붙여 `immutable` 캐시로 전환**: 가장 근본적인 해결책이지만 업로드·스토리지 네이밍 구조를 바꿔야 하는 별도 작업이라 이번 범위를 벗어남. 후속 과제로 남김.

## 2. PSI Insights (개선 기회) — 검사 문서에서 이번 작업이 다루는 항목

| Insight 항목 | 대상 페이지 | 디바이스 | 예상 절감 (Est savings) | 이번 개선 반영 |
| --- | --- | :---: | --- | :---: |
| Improve image delivery | usedgoods | 모바일/데스크탑 | 2,567 KiB | ✅ |
| 이미지 전송 개선 | main | 모바일 | 233~782 KiB | ✅ |
| 이미지 전송 개선 | main | 데스크탑 | 48 KiB | ✅ |
| Render-blocking requests | usedgoods/main | 모바일/데스크탑 | 590~600ms | ⬜ (별도 작업) |
| Legacy JavaScript | usedgoods/main | 공통 | 15 KiB | ⬜ (별도 작업) |

## 3. 개선 전 / 후 지표

### 3-1. PSI (배포 URL 기준) — 재측정 필요

> 템플릿 지침대로 개선 후 값은 **동일 조건(PSI, 배포 URL)으로 재측정**해서 기록해야 함. 이 브랜치는 아직 배포 전이라 아래 표는 배포·머지 후 담당자가 채워야 함. 임의로 추정치를 적지 않음.

| 지표             |  디바이스   |  개선 전 (검사 문서 기준)  |  개선 후   | 변화 |
| ---------------- | :---------: | :--------: | :--------: | :--: |
| LCP (usedgoods)  |  📱 모바일  |   4.4s 🔴  |  (배포 후 재측정) | — |
| LCP (usedgoods)  | 🖥️ 데스크탑 |   6.1s 🔴  |  (배포 후 재측정) | — |
| LCP (main)       |  📱 모바일  |   4.7s 🔴  |  (배포 후 재측정) | — |
| Improve image delivery (usedgoods) | 모바일/데스크탑 | 2,567 KiB | (배포 후 재측정) | — |

## 4. 변경 파일 (§1-1, §1-2를 코드로 옮긴 결과)

- `next.config.ts` — `images.minimumCacheTTL: 60 * 60 * 24 * 30` (30일) 추가 (§1-2)
- `src/components/common/ContentCard.tsx` — `priority?: boolean` prop 추가, 캐러셀의 첫 번째(`idx === 0`) 이미지에만 전달 (`ImageWithFallback`은 `ImageProps`를 그대로 spread하므로 별도 수정 불필요)
- `src/app/(user)/main/_components/MainCard.tsx`, `src/app/(user)/rental/_components/RentalCard.tsx` — `priority` prop을 받아 `ContentCard`로 전달
- `src/app/(user)/rental/_components/RentalList.tsx`, `src/app/(user)/usedgoods/_components/UsedGoodsList.tsx` — `.map((post, index) => ...)`로 `priority={index < 4}` 전달 (그리드가 `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`라 최대 4개까지가 첫 줄에 들어올 수 있음)
- `src/app/(user)/main/_components/popular/PopularList.tsx`, `PopularTabs.tsx` — 데스크탑 4열 그리드는 `index < 4`, 모바일은 세로 1열 스택 레이아웃이라 실제 최초 노출 아이템인 `index === 0`만, 그리고 모바일 3개 탭(중고/구인/부동산) 중 실제로 화면 최상단에 오는 첫 탭(중고거래)에만 `priority`를 켬 — 나머지 두 탭은 스크롤해야 보이는 영역이라 priority를 주면 오히려 불필요한 즉시 로딩이 늘어남

## 5. 검증

- **재측정 PSI 링크 (📱 모바일)**: 배포 후 작성
- **재측정 PSI 링크 (🖥️ 데스크탑)**: 배포 후 작성
- **로컬 검증 방법**: `git worktree`로 별도 작업 트리 생성 → `npm ci` → `next build` → `next start` (전/후 각각 빌드) → Playwright로 DOM 속성(`loading`, `fetchPriority`)과 네트워크 요청 순서 확인, `curl`로 `/_next/image` 응답의 `Cache-Control` 헤더 직접 대조
- **개선 확인 결과 한 줄**: LCP 후보 이미지의 `loading=lazy` → `auto` 전환과 요청 순서 앞당김, 이미지 캐시 수명 4시간 → 30일(180배) 확대를 로컬 프로덕션 빌드로 직접 확인함. Performance 점수/LCP 초 단위 개선폭은 배포 후 PSI로 재측정해서 이 문서의 3-1 표를 채워야 완료 처리 가능.

## 6. 관련 후속 작업

- **메인 모바일 인기목록 개수 축소 (4개 → 2개)**: 예정. 노출 이미지 개수 자체를 줄여 초기 로드 용량을 추가로 낮출 것으로 기대됨. 작업 착수 시 별도 문서로 분리해 전/후 지표 기록 예정.
