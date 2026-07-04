# 소유 성능 검사

- **작업자**: 소유 (parksoyou)
- **측정 기간**: 2026-07-02
- **담당 페이지**: `/terms/payment`

## 측정 규칙 (공통 — 반드시 준수)

- **도구**: PageSpeed Insights — https://pagespeed.web.dev
- **디바이스**: **모바일 + 데스크탑 둘 다** 측정
- **대상**: **배포 URL** (로컬 dev 서버 ❌)
- **측정 횟수**: 같은 URL을 2회 이상 돌려 대표값(평균값) 기록
- **기록 기준**: Lab(Lighthouse) 데이터. Field(실제 사용자/CrUX)는 나오면 메모에 참고로만.
- **판정(🟢🟡🔴) 기준**: [성능감사 프레임워크](../../설계/20260630-성능감사-프레임워크.md) §1 표를 따름
  - LCP ≤2.5s 🟢 / ~4s 🟡 / >4s 🔴 · CLS ≤0.1 🟢 · FCP ≤1.8s 🟢

---

## 결제 정책 페이지 `/terms/payment`

- **대상 URL**: https://kanto-iota.vercel.app/terms/payment
- **PSI 링크 (📱 모바일)**: https://pagespeed.web.dev/analysis/https-kanto-iota-vercel-app-terms-payment/w7n66cq73l?form_factor=mobile
- **PSI 링크 (🖥️ 데스크탑)**: https://pagespeed.web.dev/analysis/https-kanto-iota-vercel-app-terms-payment/w7n66cq73l?form_factor=desktop

### 성능 점수 (Lab / Lighthouse)

|  디바이스   | Performance | Accessibility | Best Practices | SEO |
| :---------: | :---------: | :-----------: | :------------: | :-: |
|  📱 모바일  |     78      |      100      |      100       | 92  |
| 🖥️ 데스크탑 |     98      |      100      |      100       | 92  |

### Core Web Vitals (Lab)

| 지표        | 📱 모바일 |   판정   | 🖥️ 데스크탑 |   판정   |
| ----------- | :-------: | :------: | :---------: | :------: |
| LCP         |   4.9s    |    🔴    |    0.9s     |    🟢    |
| CLS         |     0     |    🟢    |      0      |    🟢    |
| FCP         |   1.2s    |    🟢    |    0.3s     |    🟢    |
| TBT         |   230ms   |    🟡    |    90ms     |    🟢    |
| Speed Index |   1.9s    |    🟢    |    0.7s     |    🟢    |

### PSI Insights (개선 기회)

| Insight 항목 | 디바이스 | 예상 절감 (Est savings) |
| --- | :---: | --- |
| 렌더링 차단 요청 | 📱 모바일 | 600ms |
| 네트워크 종속 항목 트리 | 📱 모바일 | — |
| 레거시 JavaScript | 📱 모바일 | 15KiB |
| LCP 분석 | 📱 모바일 | — |
| 렌더링 차단 요청 | 🖥️ 데스크탑 | 160ms |
| 네트워크 종속 항목 트리 | 🖥️ 데스크탑 | — |
| 레거시 JavaScript | 🖥️ 데스크탑 | 15KiB |
| 레이아웃 변경 원인 | 🖥️ 데스크탑 | — |
| LCP 분석 | 🖥️ 데스크탑 | — |

**진단 (Diagnostics)**

| 진단 항목 | 디바이스 | 상세 |
| --- | :---: | --- |
| 사용하지 않는 자바스크립트 줄이기 | 공통 | 186KiB |
| 긴 기본 스레드 작업 피하기 | 📱 모바일 | 긴 작업 5개 발견 |
| 긴 기본 스레드 작업 피하기 | 🖥️ 데스크탑 | 긴 작업 4개 발견 |

> 단위는 시간(ms/s)·용량(KiB)으로 PSI 표기 그대로.

### 개선 필요사항

| 우선순위 |       디바이스       | 문제 | 원인 | 개선안 | 상태 |
| :------: | :------------------: | ---- | ---- | ------ | :--: |
|    P0    |        모바일        | LCP 4.9s 🔴 | 렌더링 차단(600ms), Notion CMS 콘텐츠 로딩 지연 | 렌더링 차단 제거, 약관 콘텐츠 SSG/ISR 캐싱 적용 | 예정 |
|    P1    |        모바일        | TBT 230ms 🟡 | 긴 작업 5개, JS 블로킹 | 코드 스플리팅, 불필요 스크립트 지연 로딩 | 예정 |
|    P1    |        공통          | 미사용 JS 186KiB | 불필요한 번들 포함 | Tree-shaking, dynamic import | 예정 |
|    P2    |        공통          | 레거시 JavaScript (15KiB) | 구형 폴리필 포함 | 레거시 폴리필 제거 | 예정 |

### 메모

- 접근성·권장사항 **100점 만점** — policy, youth와 동일
- 데스크탑 성능 98, LCP 0.9s 매우 우수
- 모바일 LCP(4.9s) 🔴 — policy(4.8s)·youth(5.0s)와 동일한 Notion CMS 패턴
- `/terms` 3개 페이지(policy·youth·payment) 공통 이슈 — SSG 일괄 적용으로 동시 해결 가능
- SEO 92 — `rel=canonical` 이 도메인 루트를 가리켜 감점 (전 페이지 공통)
