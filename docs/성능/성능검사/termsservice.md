# 임태형 성능 검사

- **작업자**: 임태형
- **측정 기간**: 2026-07-02
- **담당 페이지**: `/terms/service`

## 측정 규칙 (공통 — 반드시 준수)

- **도구**: PageSpeed Insights — https://pagespeed.web.dev
- **디바이스**: **모바일 + 데스크탑 둘 다** 측정
- **대상**: **배포 URL** (로컬 dev 서버 ❌)
- **측정 횟수**: 같은 URL을 2회 이상 돌려 대표값(중간값) 기록
- **기록 기준**: Lab(Lighthouse) 데이터. Field(실제 사용자/CrUX)는 나오면 메모에 참고로만.
- **판정(🟢🟡🔴) 기준**: [성능감사 프레임워크](../../설계/20260630-성능감사-프레임워크.md) §1 표를 따름
  - LCP ≤2.5s 🟢 / ~4s 🟡 / >4s 🔴 ㄴ· CLS ≤0.1 🟢 · FCP ≤1.8s 🟢

---

## 이용약관 `/terms/service`

- **대상 URL**: https://kanto-iota.vercel.app/terms/service
- **PSI 링크 (📱 모바일)**: 측정일시 2026-07-02 10:58:44 AM
- **PSI 링크 (🖥️ 데스크탑)**: 측정일시 2026-07-02 11:04:36 AM (11:03 AM GMT+9 캡처)

### 성능 점수 (Lab / Lighthouse)

|  디바이스   | Performance | Accessibility | Best Practices | SEO |
| :---------: | :---------: | :------------: | :-------------: | :-: |
|  📱 모바일  |     72      |      100       |       100       | 92  |
| 🖥️ 데스크탑 |     96      |      100       |       100       | 92  |

### Core Web Vitals (Lab)

| 지표        | 📱 모바일 | 판정 | 🖥️ 데스크탑 | 판정 |
| ----------- | --------- | :--: | ----------- | :--: |
| LCP         | 5.1 s     |  🔴  | 1.0 s       |  🟢  |
| CLS         | 0         |  🟢  | 0           |  🟢  |
| FCP         | 1.2 s     |  🟢  | 0.3 s       |  🟢  |
| TBT         | 390 ms    |      | 150 ms      |      |
| Speed Index | 2.0 s     |      | 0.7 s       |      |

### PSI Insights (개선 기회)

| Insight 항목              | 디바이스 | 예상 절감 (Est savings) |
| -------------------------- | :------: | ----------------------- |
| Render-blocking requests   |  모바일  | 590 ms                  |
| Forced reflow              |  모바일  | -                       |
| Network dependency tree    |  모바일  | -                       |
| Legacy JavaScript          |  모바일  | 15 KiB                  |
| Optimize DOM size          |  모바일  | -                       |
| LCP breakdown              |  모바일  | -                       |
| 3rd parties                |  모바일  | -                       |
| Render-blocking requests   | 데스크탑 | 150 ms                  |
| Forced reflow              | 데스크탑 | -                       |
| Network dependency tree    | 데스크탑 | -                       |
| Legacy JavaScript          | 데스크탑 | 15 KiB                  |
| Layout shift culprits      | 데스크탑 | -                       |
| LCP breakdown              | 데스크탑 | -                       |
| 3rd parties                | 데스크탑 | -                       |

> 단위는 시간(ms/s)·용량(KiB)으로 PSI 표기 그대로. (예: Render-blocking requests, Improve image delivery, Reduce unused JavaScript …)

### 개선 필요사항

| 우선순위 | 디바이스 | 문제 | 원인 (코드 확인) | 개선안 | 상태 |
| :------: | :------: | ---- | ---- | ------ | :--: |
|    P0    |  모바일  | LCP 5.1s (🔴), Network dependency tree | 콘텐츠 전체가 클라이언트에서만 렌더링됨. [TermsClientWrapper.tsx](../../../src/app/(user)/terms/_components/TermsClientWrapper.tsx)가 `next/dynamic(..., { ssr: false })`로 [TermsClientContent.tsx](../../../src/app/(user)/terms/_components/TermsClientContent.tsx)를 불러오고, 이 컴포넌트는 마운트 후 `useEffect`에서 `/api/terms`를 fetch해 내용을 채움 → HTML(서버) → JS 번들 다운로드 → hydrate → API fetch → 렌더링의 직렬 체인이 그대로 LCP 지연으로 이어짐 | `[type]/page.tsx`에서 서버 컴포넌트로 Notion 콘텐츠를 직접 fetch해 초기 HTML에 포함(서버 렌더링), `ssr:false` 제거. 데이터 필요 시점에만 클라이언트 상태가 필요한 부분(로딩 스피너 등)만 최소한으로 클라이언트화 | 예정 |
|    P1    |   공통   | LCP 지연의 2차 원인 — API 응답 자체가 느림 | [api/terms/route.ts](../../../src/app/api/terms/route.ts) → [notion.ts](../../../src/services/notion/notion.ts)의 `getNotionPage`가 프로덕션에서는 캐시 없이 매 요청마다 Notion API(`notion.pages.retrieve` + `pageToMarkdown`)를 실시간 호출함 (`devPageCache`는 `NODE_ENV === "development"`에서만 적용) | 약관 내용은 자주 바뀌지 않으므로 Next.js `fetch`/route에 `revalidate`(ISR)를 적용하거나, 서버 컴포넌트에서 `unstable_cache`/`revalidate`로 Notion 응답을 캐싱 | 예정 |
|    P2    |   공통   | Reduce unused JavaScript (186 KiB), Legacy JavaScript (15 KiB), 모바일 TBT 390ms(long main-thread tasks 5건) | [TermsContent.tsx](../../../src/app/(user)/terms/_components/TermsContent.tsx)에서 `react-markdown` + `remark-gfm`이 클라이언트 번들에 포함되어 매 방문마다 브라우저에서 마크다운을 파싱·렌더링함 | P0(서버 렌더링 전환) 적용 시 마크다운 파싱이 서버로 이동해 클라이언트 JS 실행량·TBT가 함께 줄어듦. 서버 렌더링 전환이 어렵다면 최소한 `react-markdown`을 별도 청크로 dynamic import해 초기 실행 부담 완화 | 예정 |

### 메모

- 모바일 LCP 5.1s(🔴) vs 데스크탑 1.0s(🟢) — 격차가 매우 큼. 원인은 이미지가 아니라 **"콘텐츠가 클라이언트 사이드에서만 fetch되어 렌더링되는 구조"** 자체이며, Slow 4G 회선을 쓰는 모바일 측정에서 JS 다운로드+API 왕복 지연이 그대로 드러난 것으로 판단됨
- `localStorage` 캐시(`CACHE_DURATION` 10시간)는 재방문 시에는 도움이 되지만, **최초 방문(Lighthouse 측정 시나리오)에는 적용되지 않음** — PSI 점수 개선에는 효과 없음
- P0(서버 렌더링 전환)이 LCP·TBT·Network dependency tree 세 가지 인사이트를 동시에 해결하는 근본 대책
