# 임태형 성능 검사

- **작업자**: 임태형
- **측정 기간**: 2026-07-02
- **담당 페이지**: `/usedgoods` (상세 페이지는 [usedgoodsid.md](./usedgoodsid.md) 참고)

## 측정 규칙 (공통 — 반드시 준수)

- **도구**: PageSpeed Insights — https://pagespeed.web.dev
- **디바이스**: **모바일 + 데스크탑 둘 다** 측정
- **대상**: **배포 URL** (로컬 dev 서버 ❌)
- **측정 횟수**: 같은 URL을 2회 이상 돌려 대표값(중간값) 기록
- **기록 기준**: Lab(Lighthouse) 데이터. Field(실제 사용자/CrUX)는 나오면 메모에 참고로만.
- **판정(🟢🟡🔴) 기준**: [성능감사 프레임워크](../../설계/20260630-성능감사-프레임워크.md) §1 표를 따름
  - LCP ≤2.5s 🟢 / ~4s 🟡 / >4s 🔴 ㄴ· CLS ≤0.1 🟢 · FCP ≤1.8s 🟢

---

## 중고거래 `/usedgoods`

- **대상 URL**: https://kanto-iota.vercel.app/usedgoods
- **PSI 링크 (📱 모바일)**: 측정일시 2026-07-02 10:05:51 AM
- **PSI 링크 (🖥️ 데스크탑)**: 측정일시 2026-07-02 10:12:39 AM

### 성능 점수 (Lab / Lighthouse)

|  디바이스   | Performance | Accessibility | Best Practices | SEO |
| :---------: | :---------: | :-----------: | :------------: | :-: |
|  📱 모바일  |     81      |      84       |       96       | 92  |
| 🖥️ 데스크탑 |     77      |      84       |       96       | 92  |

### Core Web Vitals (Lab)

| 지표        | 📱 모바일 | 판정 | 🖥️ 데스크탑 | 판정 |
| ----------- | --------- | :--: | ----------- | :--: |
| LCP         | 4.4 s     |  🔴  | 6.1 s       |  🔴  |
| CLS         | 0         |  🟢  | 0           |  🟢  |
| FCP         | 1.2 s     |  🟢  | 1.2 s       |  🟢  |
| TBT         | 200 ms    |      | 110 ms      |      |
| Speed Index | 1.9 s     |      | 1.8 s       |      |

### PSI Insights (개선 기회)

| Insight 항목             | 디바이스 | 예상 절감 (Est savings) |
| ------------------------ | :------: | ----------------------- |
| Improve image delivery   |  모바일  | 2,567 KiB               |
| Render-blocking requests |  모바일  | 590 ms                  |
| Forced reflow            |  모바일  | -                       |
| LCP request discovery    |  모바일  | -                       |
| Legacy JavaScript        |  모바일  | 15 KiB                  |
| LCP breakdown            |  모바일  | -                       |
| 3rd parties              |  모바일  | -                       |
| Improve image delivery   | 데스크탑 | 2,567 KiB               |
| Render-blocking requests | 데스크탑 | 600 ms                  |
| LCP request discovery    | 데스크탑 | -                       |
| Legacy JavaScript        | 데스크탑 | 15 KiB                  |
| LCP breakdown            | 데스크탑 | -                       |
| 3rd parties              | 데스크탑 | -                       |

> 단위는 시간(ms/s)·용량(KiB)으로 PSI 표기 그대로. (예: Render-blocking requests, Improve image delivery, Reduce unused JavaScript …)

### 개선 필요사항

| 우선순위 | 디바이스 | 문제                                                            | 원인                                                                     | 개선안                                                                       | 상태 |
| :------: | :------: | --------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | :--: |
|    P0    |   공통   | LCP 지연 (모바일 4.4s / 데스크탑 6.1s, 🔴)                      | LCP 대상 이미지 최적화 미흡 · Improve image delivery 예상 절감 2,567 KiB | LCP 이미지 next/image 최적화(WebP/AVIF, 적정 사이즈) + priority/preload 적용 | 예정 |
|    P1    |   공통   | Render-blocking requests (모바일 590ms / 데스크탑 600ms)        | 렌더링 차단 CSS/JS 리소스 존재                                           | critical CSS 인라인화, 불필요 스크립트 defer/async 처리                      | 예정 |
|    P1    |   공통   | Avoid enormous network payloads (총 4,063 KiB)                  | 이미지·JS 번들 총 용량 과다                                              | 이미지 압축/최적화, 불필요 리소스·의존성 정리                                | 예정 |
|    P2    |   공통   | Reduce unused JavaScript (204 KiB) / Legacy JavaScript (15 KiB) | 미사용 코드 포함, 구형 브라우저 대상 트랜스파일                          | 코드 스플리팅·dynamic import, 빌드 타겟 최신화                               | 예정 |
|    P2    |  모바일  | TBT 200ms, long main-thread tasks 7건                           | 메인스레드 점유 JS 작업 다수                                             | 무거운 로직 분할 실행, code splitting으로 초기 번들 축소                     | 예정 |

### 메모

- Diagnostics(참고): Reduce unused JavaScript 204 KiB, Avoid enormous network payloads (Total 4,063 KiB), Avoid long main-thread tasks (모바일 7건 / 데스크탑 3건), User Timing marks and measures 1건
- LCP가 모바일 4.4s, 데스크탑 6.1s로 🔴 구간 — 개선 필요사항 작성 시 최우선 검토 대상

<!-- ▲▲▲ 여기까지가 페이지 한 개 블록 ▲▲▲ -->
