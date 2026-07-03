# 임태형 성능 검사

- **작업자**: 임태형
- **측정 기간**: 2026-07-02
- **담당 페이지**: `/usedgoods/[id]`

## 측정 규칙 (공통 — 반드시 준수)

- **도구**: PageSpeed Insights — https://pagespeed.web.dev
- **디바이스**: **모바일 + 데스크탑 둘 다** 측정
- **대상**: **배포 URL** (로컬 dev 서버 ❌)
- **측정 횟수**: 같은 URL을 2회 이상 돌려 대표값(중간값) 기록
- **기록 기준**: Lab(Lighthouse) 데이터. Field(실제 사용자/CrUX)는 나오면 메모에 참고로만.
- **판정(🟢🟡🔴) 기준**: [성능감사 프레임워크](../../설계/20260630-성능감사-프레임워크.md) §1 표를 따름
  - LCP ≤2.5s 🟢 / ~4s 🟡 / >4s 🔴 ㄴ· CLS ≤0.1 🟢 · FCP ≤1.8s 🟢

---

## 중고거래 상세 `/usedgoods/[id]`

- **대상 URL**: https://kanto-iota.vercel.app/usedgoods/431
- **PSI 링크 (📱 모바일)**: 측정일시 2026-07-02 10:41:17 AM
- **PSI 링크 (🖥️ 데스크탑)**: 측정일시 2026-07-02 10:45:29 AM

### 성능 점수 (Lab / Lighthouse)

|  디바이스   | Performance | Accessibility | Best Practices | SEO |
| :---------: | :---------: | :-----------: | :------------: | :-: |
|  📱 모바일  |     81      |      91       |       96       | 100 |
| 🖥️ 데스크탑 |     88      |      91       |       96       | 100 |

### Core Web Vitals (Lab)

| 지표        | 📱 모바일 | 판정 | 🖥️ 데스크탑 | 판정 |
| ----------- | --------- | :--: | ----------- | :--: |
| LCP         | 3.1 s     |  🟡  | 0.8 s       |  🟢  |
| CLS         | 0.001     |  🟢  | 0.027       |  🟢  |
| FCP         | 1.2 s     |  🟢  | 0.3 s       |  🟢  |
| TBT         | 430 ms    |      | 270 ms      |      |
| Speed Index | 4.0 s     |      | 1.2 s       |      |

### PSI Insights (개선 기회)

| Insight 항목                  | 디바이스 | 예상 절감 (Est savings) |
| ----------------------------- | :------: | ----------------------- |
| Render-blocking requests      |  모바일  | 590 ms                  |
| LCP request discovery         |  모바일  | -                       |
| Use efficient cache lifetimes |  모바일  | 14 KiB                  |
| Improve image delivery        |  모바일  | 172 KiB                 |
| Legacy JavaScript             |  모바일  | 15 KiB                  |
| Layout shift culprits         |  모바일  | -                       |
| LCP breakdown                 |  모바일  | -                       |
| 3rd parties                   |  모바일  | -                       |
| Render-blocking requests      | 데스크탑 | 210 ms                  |
| Improve image delivery        | 데스크탑 | 167 KiB                 |
| Legacy JavaScript             | 데스크탑 | 15 KiB                  |
| LCP request discovery         | 데스크탑 | -                       |
| Use efficient cache lifetimes | 데스크탑 | 19 KiB                  |
| Font display                  | 데스크탑 | 10 ms                   |
| Layout shift culprits         | 데스크탑 | -                       |
| Optimize DOM size             | 데스크탑 | -                       |
| LCP breakdown                 | 데스크탑 | -                       |
| 3rd parties                   | 데스크탑 | -                       |

> 단위는 시간(ms/s)·용량(KiB)으로 PSI 표기 그대로. (예: Render-blocking requests, Improve image delivery, Reduce unused JavaScript …)

### 개선 필요사항

| 우선순위 | 디바이스 | 문제                                                                                               | 원인 (코드 확인)                                                                                                                                                                                                                                                                                         | 개선안                                                                                                                                                                                   | 상태 |
| :------: | :------: | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--: |
|    P0    |  모바일  | TBT 430ms · long main-thread tasks 7건 (Reduce JS execution 1.4s / Minimize main-thread work 2.1s) | `UsedGoodsDetail.tsx`가 통째로 `"use client"`이며, 좌표가 있는 매물은 `ApproxAreaMapWithProvider`([ApproxAreaMap.tsx](../../../src/components/common/ApproxAreaMap.tsx))가 진입 즉시 마운트되어 Google Maps JS(`@vis.gl/react-google-maps`) SDK를 동기 로드·실행함 → PSI의 `3rd parties` 인사이트와 직결 | 지도는 "거래 정보" 섹션 하단(폴드 아래)에 위치하므로 `next/dynamic(ssr:false)` + `IntersectionObserver`(또는 "지도 보기" 클릭 시 로드)로 지연 로딩하여 초기 진입 시 Maps SDK 실행을 미룸 | 예정 |
|    P1    |   공통   | Use efficient cache lifetimes (모바일 14 KiB / 데스크탑 19 KiB)                                    | [next.config.ts](../../../next.config.ts)에 `images.minimumCacheTTL` 미설정 → Next.js 이미지 최적화 기본 캐시 수명(60초)이 적용되어 상품 이미지가 자주 재검증됨                                                                                                                                          | `next.config.ts`의 `images`에 `minimumCacheTTL`을 상품 이미지 갱신 빈도에 맞게 상향(예: 하루~한 달 단위)                                                                                 | 예정 |
|    P1    |  모바일  | LCP 3.1s (🟡), Speed Index 4.0s                                                                    | Render-blocking requests(590ms) — `UsedGoodsDetail.tsx` 렌더링에 필요한 클라이언트 번들(지도, 채팅, 캐러셀 로직 등)이 한 번에 로드되어 LCP 이미지보다 우선순위 경합                                                                                                                                      | LCP 대상인 첫 번째 상품 이미지(`ImageCarousel` `priority` 이미지)는 유지하고, 지도·채팅 관련 코드를 위 P0처럼 분리해 초기 번들 축소                                                      | 예정 |
|    P2    |   공통   | Reduce unused JavaScript (모바일 255 KiB / 데스크탑 257 KiB), Legacy JavaScript (15 KiB)           | Sentry(`@sentry/nextjs`)·next-intl 등 전역 클라이언트 번들이 상세 페이지에도 포함되며, 컴포넌트 전체가 클라이언트 렌더링이라 서버에서 처리 가능한 정적 텍스트(상품 설명 등)까지 JS로 내려감                                                                                                              | 상품 정보/설명처럼 상호작용이 없는 영역은 서버 컴포넌트로 분리, 지도·채팅 등 상호작용 영역만 `"use client"` 유지                                                                         | 예정 |

### 메모

- Diagnostics(참고): Reduce unused JavaScript(모바일 255 KiB / 데스크탑 257 KiB), Avoid long main-thread tasks 7건, User Timing marks and measures 1건
- 모바일 TBT(430ms)가 데스크탑(270ms) 대비 크게 높음 — 모바일 JS 실행 부담이 주요 병목
- 데스크탑은 LCP 0.8s로 🟢, Performance 88점으로 상세 페이지 자체는 준수한 편
- 코드 확인 결과: [ImageCarousel.tsx](<../../../src/app/(user)/rental/[id]/_components/ImageCarresel.tsx>)는 이미 `next/image` + 첫 이미지 `priority` 적용이 되어 있어 LCP 이미지 자체 최적화는 양호. 병목은 이미지보다 **지도 SDK·클라이언트 번들 실행**(TBT) 쪽에 가깝다.
