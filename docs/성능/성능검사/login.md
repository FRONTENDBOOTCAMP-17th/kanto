# 로그인 페이지 성능 검사

- **작업자**: 김도혁
- **측정 기간**: 2026-07-01
- **담당 페이지**: `/login`

## 측정 규칙 (공통 — 반드시 준수)

- **도구**: PageSpeed Insights — https://pagespeed.web.dev
- **디바이스**: **모바일 + 데스크탑 둘 다** 측정
- **대상**: **배포 URL** (로컬 dev 서버 ❌)
- **측정 횟수**: 같은 URL을 2회 이상 돌려 대표값(중간값) 기록
- **기록 기준**: Lab(Lighthouse) 데이터. Field(실제 사용자/CrUX)는 나오면 메모에 참고로만.
- **판정(🟢🟡🔴) 기준**: [성능감사 프레임워크](../../설계/20260630-성능감사-프레임워크.md) §1 표를 따름
  - LCP ≤2.5s 🟢 / ~4s 🟡 / >4s 🔴 · CLS ≤0.1 🟢 · FCP ≤1.8s 🟢

---

## 로그인 `/login`

- **대상 URL**: https://kanto-iota.vercel.app/login
- **PSI 링크 (📱 모바일)**: https://pagespeed.web.dev/analysis/https-kanto-iota-vercel-app-login/ju579pxpu9?form_factor=mobile
- **PSI 링크 (🖥️ 데스크탑)**: https://pagespeed.web.dev/analysis/https-kanto-iota-vercel-app-login/ju579pxpu9?form_factor=desktop

### 성능 점수 (Lab / Lighthouse)

|  디바이스   | Performance | Accessibility | Best Practices | SEO |
| :---------: | :---------: | :-----------: | :------------: | :-: |
|  📱 모바일  |     75      |      90       |      100       | 61  |
| 🖥️ 데스크탑 |     85      |      90       |      100       | 61  |

### Core Web Vitals (Lab)

| 지표        | 📱 모바일 |   판정   | 🖥️ 데스크탑 |   판정   |
| ----------- | --------- | :------: | ----------- | :------: |
| LCP         | 5.0 초    |    🔴    | 4.3 초      |    🔴    |
| CLS         | 0         |    🟢    | 0           |    🟢    |
| FCP         | 2.1 초    |          | 1.2 초      |          |
| TBT         | 240 ms    |          | 100 ms      |          |
| Speed Index | 3.0 초    |          | 1.2 초      |          |

### PSI Insights (개선 기회)

| Insight 항목 | 디바이스 | 예상 절감 (Est savings) |
| --- | :---: | --- |
| 사용하지 않는 자바스크립트 줄이기 | 공통 | 220 KiB |
| 렌더링 차단 요청 | 📱 | 500 ms |
| 렌더링 차단 요청 | 🖥️ | 590 ms |
| 이미지 전송 개선 | 공통 | 15 KiB |
| 레거시 JavaScript | 공통 | 15 KiB |
| 긴 기본 스레드 작업 피하기 | 📱 | 긴 작업 4개 |
| 긴 기본 스레드 작업 피하기 | 🖥️ | 긴 작업 3개 |
| LCP 요청 탐색 | 공통 | - |
| LCP 분석 | 공통 | - |
| 서드 파티 | 공통 | - |

### 개선 필요사항

| 우선순위 | 디바이스 | 문제 | 원인 | 개선안 | 상태 |
| :------: | :------------------: | ---- | ---- | ------ | :--: |
| P0 | 모바일 | 사용하지 않는 JS 220KiB | 번들에 미사용 코드 포함 | 코드 스플리팅 / tree-shaking 적용 | 예정 |
| P1 | 모바일 | 렌더링 차단 요청 (500ms) | 크리티컬 패스에 블로킹 리소스 존재 | 스크립트 defer/async, CSS 인라인화 검토 | 예정 |
| P1 | 모바일 | 긴 메인 스레드 작업 4개 | JS 실행 시간 과다 | 무거운 작업 분리 및 lazy 처리 | 예정 |
| P2 | 모바일 | 이미지 전송 비효율 (15KiB) | 이미지 포맷/사이즈 미최적화 | WebP 변환, next/image 적용 | 예정 |
| P2 | 모바일 | 레거시 JavaScript (15KiB) | 불필요한 폴리필 포함 | 타겟 브라우저 범위 재설정 | 예정 |
| P2 | 모바일 | 버튼 접근 가능한 이름 없음 | aria-label 누락 | 버튼에 aria-label 또는 텍스트 추가 | 예정 |
| P2 | 모바일 | 색상 대비율 부족 | 전경/배경 색상 대비 미달 | WCAG AA 기준(4.5:1) 충족하도록 색상 조정 | 예정 |
| P2 | 모바일 | SEO: 색인 생성 차단 | robots meta 설정 문제 | noindex 태그 제거 또는 설정 확인 | 예정 |
| P2 | 모바일 | rel=canonical 없음 | canonical 태그 미설정 | 루트 URL이 아닌 실제 페이지 URL로 canonical 추가 | 예정 |

### 메모

- LCP 모바일 5.0초 / 데스크탑 4.3초 모두 🔴, JS 감량 및 렌더링 차단 해소 후 재측정 권장
- Agentic Browsing 1/2: 접근성 트리 구성 문제 (접근성 개선 시 함께 해결 가능)
