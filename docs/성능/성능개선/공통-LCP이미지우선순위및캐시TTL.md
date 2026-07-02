# [usedgoods / rental / main 목록] 성능 개선 — LCP 이미지 priority + 이미지 캐시 TTL

- **담당자**: 김도혁
- **대상 페이지**: `/usedgoods`, `/rental`, `/main` (목록형 페이지 3곳이 공용 컴포넌트 `ContentCard`를 공유하므로 한 번의 수정으로 공통 적용됨)
- **관련 검사 문서**:
  - [../성능검사/usedgoods.md](../성능검사/usedgoods.md) (임태형) — LCP 4.4s/6.1s 🔴, Improve image delivery 2,567 KiB
  - [../성능검사/main.md](../성능검사/main.md) (박소유) — LCP 모바일 4.7s 🔴, 이미지 전송 개선 233~782 KiB
  - `/rental` 자체 검사 문서는 아직 작성 전 (본인 담당 페이지, 별도로 채울 예정). 이번 개선은 `usedgoods`/`main` 검사에서 공통으로 지적된 "이미지 전송/LCP" 항목의 원인을 코드에서 직접 추적해 진행함.
- **우선순위**: P0 (두 검사 문서 모두 이미지 관련 항목을 P0로 지정)
- **상태**: 진행 (코드 반영 완료 · 배포 후 PSI 재측정 필요)

## 1. 문제 정의

검사 문서에서 공통으로 지적된 것: LCP가 느리고(usedgoods 모바일 4.4s / 데스크탑 6.1s, main 모바일 4.7s), "Improve image delivery" 항목에서 큰 절감 여지(usedgoods 2,567 KiB, main 233~782 KiB)가 있다는 것이었음. 코드를 추적한 결과 원인 두 가지를 특정함.

1. **LCP 이미지가 lazy 로딩되고 있음**
   [`bab5594`](../../../.git) 커밋(목록 이미지 lazy 로딩 + AVIF 적용)에서 `ImageWithFallback`의 `loading="eager"`를 제거하면서, `ContentCard`를 쓰는 모든 목록(usedgoods/rental/main 인기목록)의 이미지가 next/image 기본값인 `loading="lazy"`가 됨. 카드 목록에 `index` 정보가 전혀 전달되지 않아 **화면에 바로 보이는 첫 카드(=LCP 후보)까지 지연 로딩**되고 있었음. AVIF 전환 자체는 유효한 최적화지만, 그 과정에서 LCP 이미지의 `priority`를 놓친 것.
2. **이미지 최적화 캐시가 4시간마다 만료됨**
   `next.config.ts`에 `minimumCacheTTL`이 설정되어 있지 않아 Next.js 기본값(이 버전 기준 4시간, `max-age=14400`)이 적용됨. 같은 이미지를 4시간마다 다시 리사이즈/AVIF 변환해야 해서, 방문자가 캐시 미스를 겪을 때마다 재전송 용량이 커짐. main 검사 문서에도 "모바일 이미지 전송 개선 편차 매우 큼 (233KiB↔782KiB) — 캐시 미스 시 심각해짐"이라고 정확히 이 현상이 기록되어 있음.

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

### 3-2. 로컬 검증 지표 (실측, 이번 작업에서 직접 확인)

PSI는 배포 URL만 인정하므로 위 표는 못 채우지만, **원인이 실제로 고쳐졌는지**는 로컬 프로덕션 빌드(`next build && next start`)로 직접 확인함. 팀 공용 dev 서버(3000번 포트)를 건드리지 않기 위해 `git worktree`로 별도 작업 트리를 만들어 빌드/구동함.

| 항목 | 개선 전 | 개선 후 |
| --- | --- | --- |
| `/usedgoods` 첫 4개 카드 이미지 `loading` 속성 | `lazy` (전체 동일) | `auto` (첫 4개만, 5번째부터는 여전히 `lazy`) |
| 첫 카드 이미지의 네트워크 요청 순서 | 전체 리소스 중 약 43~50번째 (헤더 로고보다 늦음) | 약 7~10번째 (헤더 로고보다 먼저) |
| `/_next/image` 응답 `Cache-Control` | `public, max-age=14400, must-revalidate` (4시간) | `public, max-age=2592000, must-revalidate` (30일, 약 180배) |

> `loading`/`Cache-Control` 값은 `curl`과 Playwright(`browser_evaluate`, `browser_network_request`)로 직접 응답 헤더/DOM 속성을 확인한 값이며, 브라우저 캐시로 오염되지 않도록 매번 새 서버 인스턴스에 대해 재확인함.

## 4. 개선 작업 내용

**변경 파일**

- `next.config.ts` — `images.minimumCacheTTL: 60 * 60 * 24 * 30` (30일) 추가
- `src/components/common/ContentCard.tsx` — `priority?: boolean` prop 추가, 캐러셀의 첫 번째(`idx === 0`) 이미지에만 전달 (`ImageWithFallback`은 `ImageProps`를 그대로 spread하므로 별도 수정 불필요)
- `src/app/(user)/main/_components/MainCard.tsx`, `src/app/(user)/rental/_components/RentalCard.tsx` — `priority` prop을 받아 `ContentCard`로 전달
- `src/app/(user)/rental/_components/RentalList.tsx`, `src/app/(user)/usedgoods/_components/UsedGoodsList.tsx` — `.map((post, index) => ...)`로 `priority={index < 4}` 전달 (그리드가 `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`라 최대 4개까지가 첫 줄에 들어올 수 있음)
- `src/app/(user)/main/_components/popular/PopularList.tsx`, `PopularTabs.tsx` — 데스크탑 4열 그리드는 `index < 4`, 모바일은 세로 1열 스택 레이아웃이라 실제 최초 노출 아이템인 `index === 0`만, 그리고 모바일 3개 탭(중고/구인/부동산) 중 실제로 화면 최상단에 오는 첫 탭(중고거래)에만 `priority`를 켬 — 나머지 두 탭은 스크롤해야 보이는 영역이라 priority를 주면 오히려 불필요한 즉시 로딩이 늘어남

**적용 기준**: priority는 "실제로 처음 화면에 보이는 개수"만큼만 주고 나머지는 그대로 lazy를 유지함. 전부에 priority를 주면 `bab5594`가 의도했던 AVIF+lazy 최적화 효과가 무의미해지므로, 그리드 첫 줄 범위 내로만 제한함.

## 5. 검증

- **재측정 PSI 링크 (📱 모바일)**: 배포 후 작성
- **재측정 PSI 링크 (🖥️ 데스크탑)**: 배포 후 작성
- **로컬 검증 방법**: `git worktree`로 별도 작업 트리 생성 → `npm ci` → `next build` → `next start` (전/후 각각 빌드) → Playwright로 DOM 속성(`loading`, `fetchPriority`)과 네트워크 요청 순서 확인, `curl`로 `/_next/image` 응답의 `Cache-Control` 헤더 직접 대조
- **개선 확인 결과 한 줄**: LCP 후보 이미지의 `loading=lazy` → `auto` 전환과 요청 순서 앞당김, 이미지 캐시 수명 4시간 → 30일(180배) 확대를 로컬 프로덕션 빌드로 직접 확인함. Performance 점수/LCP 초 단위 개선폭은 배포 후 PSI로 재측정해서 이 문서의 3-1 표를 채워야 완료 처리 가능.
