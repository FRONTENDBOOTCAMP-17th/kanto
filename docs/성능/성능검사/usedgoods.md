# 중고거래 목록 성능 검사

- **작업자**: 임태형
- **측정 기간**: 2026-07-01
- **담당 페이지**: `/usedgoods`

## 측정 규칙 (공통 — 반드시 준수)

- **도구**: PageSpeed Insights — https://pagespeed.web.dev
- **디바이스**: **모바일 + 데스크탑 둘 다** 측정
- **대상**: **배포 URL** (로컬 dev 서버 ❌)
- **측정 횟수**: 같은 URL을 2회 이상 돌려 대표값(중간값) 기록
- **기록 기준**: Lab(Lighthouse) 데이터. Field(실제 사용자/CrUX)는 나오면 메모에 참고로만.
- **판정(🟢🟡🔴) 기준**: [성능감사 프레임워크](../../설계/20260630-성능감사-프레임워크.md) §1 표를 따름
  - LCP ≤2.5s 🟢 / ~4s 🟡 / >4s 🔴 · CLS ≤0.1 🟢 · FCP ≤1.8s 🟢

---

## 중고거래 목록 `/usedgoods`

- **대상 URL**: https://kanto-iota.vercel.app/usedgoods
- **PSI 링크 (📱 모바일)**: https://pagespeed.web.dev/analysis?url=https://kanto-iota.vercel.app/usedgoods (2026-07-01 15:17 측정)
- **PSI 링크 (🖥️ 데스크탑)**: https://pagespeed.web.dev/analysis?url=https://kanto-iota.vercel.app/usedgoods (2026-07-01 15:17 측정)

### 성능 점수 (Lab / Lighthouse)

|  디바이스   | Performance | Accessibility | Best Practices | SEO |
| :---------: | :---------: | :-----------: | :------------: | :-: |
|  📱 모바일  |     94      |      84       |       96       | 92  |
| 🖥️ 데스크탑 |     94      |      84       |       96       | 92  |

> 참고: PSI가 이번에 5번째 카테고리 **Agentic Browsing**도 표시함 — 📱 모바일 `1/2` · 🖥️ 데스크탑 `1/2` (통과 1 / 전체 2).

### Core Web Vitals (Lab)

| 지표        | 📱 모바일 |   판정   | 🖥️ 데스크탑 |   판정   |
| ----------- | --------- | :------: | ----------- | :------: |
| LCP         | 2.6 s     |    🟡    | 0.7 s       |    🟢    |
| CLS         | 0         |    🟢    | 0.026       |    🟢    |
| FCP         | 1.2 s     |    🟢    | 0.3 s       |    🟢    |
| TBT         | 170 ms    |          | 190 ms      |          |
| Speed Index | 1.8 s     |          | 0.8 s       |          |

> 📱 모바일 LCP **2.6s = 🟡 Needs Improvement** (2.5s 목표를 근소하게 초과). 모바일이 유일한 미달 지표.

### PSI Insights (개선 기회)

PSI 하단 **Insights** 항목을 나온 만큼 항목명 그대로 옮겨 적고, 예상 절감(Est savings)을 기록한다. (항목은 페이지마다 다르며 개수 제한 없음 — 행을 추가한다.)

| Insight 항목 | 📱 모바일 절감 | 🖥️ 데스크탑 절감 |
| --- | --- | --- |
| Render-blocking requests | ≈ 660 ms | ≈ 150 ms |
| Improve image delivery | ≈ 188 KiB | ≈ 48 KiB |
| Legacy JavaScript | ≈ 15 KiB | ≈ 15 KiB |
| LCP request discovery | — | — |
| LCP breakdown | — | — |
| Optimize DOM size | — | — |
| 3rd parties | — | — |
| Forced reflow | (미검출) | — |
| Layout shift culprits | (미검출) | — |

> 단위는 시간(ms/s)·용량(KiB)으로 PSI 표기 그대로. 절감 수치가 없는(항목만 표시된) 경우 `—`, 해당 디바이스에서 항목 자체가 없으면 `(미검출)`.
>
> **Diagnostics**(점수 미반영, 참고): Reduce unused JavaScript ≈ 203 KiB (양쪽 동일) · Avoid long main-thread tasks (📱 4개 / 🖥️ 5개) · User Timing marks and measures (1개)

### 개선 필요사항

| 우선순위 |       디바이스       | 문제 | 원인 | 개선안 | 상태 |
| :------: | :------------------: | ---- | ---- | ------ | :--: |
| P1 | 📱 모바일 | LCP 2.6s 🟡 (목표 2.5s 초과) | 렌더 차단 660ms + 히어로/카드 이미지 전송 188KiB | 렌더 차단 CSS/JS 지연·인라인, LCP 이미지 `priority`·사이즈 최적화 | 예정 |
| P1 | 📱 모바일 | 이미지 전송 188 KiB 절감 여지 | 이미지 포맷/사이즈 미최적 (모바일 폭 대비 과대) | `next/image` width/quality·AVIF/WebP 적용 점검 | 예정 |
| P2 | 공통 | 미사용 JS 203 KiB (Diagnostics, 양쪽 동일) | 번들에 불필요 코드 포함 추정 | `npm run analyze`로 큰 청크 확인 → 동적 import 분리 | 예정 |
| P2 | 공통 | Legacy JavaScript 15 KiB | 레거시 폴리필/트랜스파일 | 최신 브라우저 타겟 빌드(browserslist) 점검 | 예정 |

> 데스크탑은 Performance 94 · CWV 전부 🟢으로 양호. **모바일 LCP 2.6s(🟡)** 가 유일한 미달 → 모바일 기준 렌더 차단·이미지 최적화가 P1.
> 우선순위 기준: [프레임워크 §5](../../설계/20260630-성능감사-프레임워크.md) (LCP 2.5~4s = P1).

### 접근성 · Best Practices · SEO 지적 항목 (참고)

성능 외 카테고리에서 100점 미만이라 PSI가 지적한 구체 항목. (성능 검사 범위 밖이지만 기록해 둠)

| 카테고리 | 점수 | 지적 항목 |
| :---: | :---: | --- |
| Accessibility | 84 | 버튼에 접근성 이름(accessible name) 없음 · 전경/배경 색 대비 부족 · 터치 타깃 크기·간격 부족 · heading 요소 순서(내림차순) 안 맞음 |
| Best Practices | 96 | 콘솔에 브라우저 에러 로깅됨 · 대용량 1st-party JS에 소스맵 누락 |
| SEO | 92 | `rel=canonical`이 부적절 (개별 페이지가 아닌 도메인 루트(홈)를 가리킴) |
| Agentic Browsing | 1/2 | 접근성 트리(accessibility tree)가 올바르게 구성되지 않음 |

### 메모

- 측정 환경: Lighthouse 13.4.0, HeadlessChromium 146, 단일 페이지 세션 / 초기 로드.
  - 📱 모바일: Emulated Moto G Power, **Slow 4G 스로틀링**
  - 🖥️ 데스크탑: Emulated Desktop, 커스텀 스로틀링
- Field(CrUX) 데이터는 없음(No Data) — Lab 기준만 기록.
- 모바일·데스크탑 모두 현재 1회 측정값 → 규칙(2회 이상 대표값) 충족 위해 재측정 권장.
- 모바일이 Slow 4G라 렌더 차단(660ms)·이미지(188KiB) 부담이 데스크탑보다 크게 잡힘 → 개선 시 모바일 기준으로 확인할 것.
