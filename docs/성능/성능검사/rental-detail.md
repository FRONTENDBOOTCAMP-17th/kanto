# 부동산 상세 성능 검사

- **작업자**: dongkeun
- **측정 기간**: 2026-07-02
- **담당 페이지**: `/rental/[id]` (부동산 상세)

## 측정 규칙 (공통 — 반드시 준수)

- **도구**: PageSpeed Insights — https://pagespeed.web.dev
- **디바이스**: **모바일 + 데스크탑 둘 다** 측정
- **대상**: **배포 URL** (로컬 dev 서버 ❌)
- **측정 횟수**: 같은 URL을 2회 이상 돌려 대표값(중간값) 기록
- **기록 기준**: Lab(Lighthouse) 데이터. Field(실제 사용자/CrUX)는 나오면 메모에 참고로만.
- **판정(🟢🟡🔴) 기준**: [성능감사 프레임워크](../../설계/20260630-성능감사-프레임워크.md) §1 표를 따름
  - LCP ≤2.5s 🟢 / ~4s 🟡 / >4s 🔴 ㄴ· CLS ≤0.1 🟢 · FCP ≤1.8s 🟢

---

## 부동산 상세 `/rental/[id]`

- **대상 URL**: https://kanto-iota.vercel.app/rental/439
- **PSI 링크 (📱 모바일)**:
- **PSI 링크 (🖥️ 데스크탑)**:

### 성능 점수 (Lab / Lighthouse)

|  디바이스   | Performance | Accessibility | Best Practices | SEO |
| :---------: | :---------: | :-----------: | :------------: | :-: |
|  📱 모바일  |     86      |      91       |       96       | 100 |
| 🖥️ 데스크탑 |     98      |      91       |       96       | 100 |

### Core Web Vitals (Lab)

| 지표        | 📱 모바일 |   판정   | 🖥️ 데스크탑 |   판정   |
| ----------- | --------- | :------: | ----------- | :------: |
| LCP         | 2.8 s     |    🟡    | 0.9 s       |    🟢    |
| CLS         | 0.001     |    🟢    | 0.027       |    🟢    |
| FCP         | 1.2 s     |    🟢    | 0.3 s       |    🟢    |
| TBT         | 370 ms    |          | 100 ms      |          |
| Speed Index | 3.4 s     |          | 1.1 s       |          |

### PSI Insights (개선 기회)

PSI 하단 **Insights** 항목을 나온 만큼 항목명 그대로 옮겨 적고, 예상 절감(Est savings)을 기록한다. (항목은 페이지마다 다르며 개수 제한 없음 — 행을 추가한다.)

| Insight 항목 | 디바이스 | 예상 절감 (Est savings) |
| --- | :---: | --- |
| 렌더링 차단 요청 (Render-blocking requests) | 📱 모바일 | 590 ms |
| 렌더링 차단 요청 (Render-blocking requests) | 🖥️ 데스크탑 | 240 ms |
| 강제 실행된 리플로우 (Forced reflow) | 📱 모바일 | (절감치 표기 없음) |
| LCP 요청 탐색 (LCP request discovery) | 📱 모바일 | (절감치 표기 없음) |
| LCP 요청 탐색 (LCP request discovery) | 🖥️ 데스크탑 | (절감치 표기 없음) |
| 효율적인 캐시 수명 사용 (Use efficient cache lifetimes) | 📱 모바일 | 11 KiB |
| 효율적인 캐시 수명 사용 (Use efficient cache lifetimes) | 🖥️ 데스크탑 | 15 KiB |
| 이미지 전송 개선 (Improve image delivery) | 📱 모바일 | 188 KiB |
| 이미지 전송 개선 (Improve image delivery) | 🖥️ 데스크탑 | 160 KiB |
| 레거시 JavaScript (Legacy JavaScript) | 📱 모바일 | 15 KiB |
| 레거시 JavaScript (Legacy JavaScript) | 🖥️ 데스크탑 | 15 KiB |
| 레이아웃 변경 원인 (Layout shift culprits) | 📱 모바일 | (절감치 표기 없음) |
| 레이아웃 변경 원인 (Layout shift culprits) | 🖥️ 데스크탑 | (절감치 표기 없음) |
| DOM 크기 최적화 (Optimize DOM size) | 📱 모바일 | (절감치 표기 없음) |
| LCP 분석 (LCP breakdown) | 📱 모바일 | (절감치 표기 없음) |
| LCP 분석 (LCP breakdown) | 🖥️ 데스크탑 | (절감치 표기 없음) |
| 서드 파티 (Third parties) | 📱 모바일 | (절감치 표기 없음) |
| 서드 파티 (Third parties) | 🖥️ 데스크탑 | (절감치 표기 없음) |
| 자바스크립트 실행 시간 단축 (Reduce JavaScript execution time) | 📱 모바일 | 1.3 s |
| 기본 스레드 작업 최소화 (Minimize main-thread work) | 📱 모바일 | 2.1 s |
| 사용하지 않는 자바스크립트 줄이기 (Reduce unused JavaScript) | 📱 모바일 | 255 KiB |
| 사용하지 않는 자바스크립트 줄이기 (Reduce unused JavaScript) | 🖥️ 데스크탑 | 257 KiB |
| 긴 기본 스레드 작업 피하기 (Avoid long main-thread tasks) | 📱 모바일 | 긴 작업 7개 |
| 긴 기본 스레드 작업 피하기 (Avoid long main-thread tasks) | 🖥️ 데스크탑 | 긴 작업 4개 |

> 단위는 시간(ms/s)·용량(KiB)으로 PSI 표기 그대로. (예: Render-blocking requests, Improve image delivery, Reduce unused JavaScript …)

### 개선 필요사항

| 우선순위 |       디바이스       | 문제 | 원인 | 개선안 | 상태 |
| :------: | :------------------: | ---- | ---- | ------ | :--: |
| P1 | 공통 (특히 모바일) | LCP 모바일 2.8s 🟡 / 데스크탑 0.9s 🟢, SI 모바일 3.4s | 렌더링 차단 요청(모바일 590ms·데스크탑 240ms) + JS 실행 지연 | 중요 CSS 인라인/비차단 로드, LCP 리소스 우선 로드 | 예정 |
| P1 | 공통 | 미사용/레거시 JS (unused 모바일 255KiB·데스크탑 257KiB, legacy 15KiB), TBT 370/100ms, 메인 스레드 2.1s, JS 실행 1.3s, 긴 작업 7/4개 | 공통 청크 미사용 코드·폴리필 트랜스파일 | 코드 스플리팅·동적 import, Baseline 타겟 트랜스파일 축소 | 예정 |
| P2 | 공통 | 이미지 전송 절감 여지 (모바일 188KiB·데스크탑 160KiB) | 반응형 이미지·최신 포맷 미적용, 표시 크기 대비 원본 과대 | srcset/sizes 조정, WebP/AVIF 적용, 캐시 TTL 연장 | 예정 |
| P2 | 공통 | 접근성 91 — 버튼 접근 이름 누락·대비 부족 | 아이콘 버튼 aria-label 누락, 저대비 텍스트 다수 | aria-label 추가, 색상 대비 상향 | 예정 |

### 메모

- 에뮬레이션 — 📱 모바일: Moto G Power / 느린 4G. 🖥️ 데스크탑: 데스크톱 / 맞춤형 제한. 둘 다 Lighthouse 13.4.0 / 단일 페이지 세션. Field(CrUX) 데이터 없음.
- 성능 점수 가중치 — 📱 모바일: FCP+10, LCP+21, TBT+21, CLS+25, SI+9 / 🖥️ 데스크탑: FCP+10, LCP+24, TBT+29, CLS+25, SI+10.
- 데스크탑 98점으로 우수 — CWV 전부 🟢. 남은 개선 여지는 모바일(LCP 2.8s·SI 3.4s)과 두 디바이스 공통 JS 부담.
- 콘솔 오류: 브라우저 오류 로그 감지(Google Maps/Supabase Realtime 계열 추정).
- Best Practices: CSP·COOP·XFO 헤더 부재(보안 감사 실패), 대형 자사 JS 소스맵 누락.
