# 회원가입 페이지 성능 검사

- **작업자**: 김도혁
- **측정 기간**: 2026-07-01
- **담당 페이지**: `/signup`

## 측정 규칙 (공통 — 반드시 준수)

- **도구**: PageSpeed Insights — https://pagespeed.web.dev
- **디바이스**: **모바일 + 데스크탑 둘 다** 측정
- **대상**: **배포 URL** (로컬 dev 서버 ❌)
- **측정 횟수**: 같은 URL을 2회 이상 돌려 대표값(중간값) 기록
- **기록 기준**: Lab(Lighthouse) 데이터. Field(실제 사용자/CrUX)는 나오면 메모에 참고로만.
- **판정(🟢🟡🔴) 기준**: [성능감사 프레임워크](../../설계/20260630-성능감사-프레임워크.md) §1 표를 따름
  - LCP ≤2.5s 🟢 / ~4s 🟡 / >4s 🔴 · CLS ≤0.1 🟢 · FCP ≤1.8s 🟢

---

## 회원가입 `/signup`

- **대상 URL**: https://kanto-iota.vercel.app/signup
- **PSI 링크 (📱 모바일)**: https://pagespeed.web.dev/analysis/https-kanto-iota-vercel-app-signup/blwwxkicrw?form_factor=mobile
- **PSI 링크 (🖥️ 데스크탑)**: https://pagespeed.web.dev/analysis/https-kanto-iota-vercel-app-signup/blwwxkicrw?form_factor=desktop

### 성능 점수 (Lab / Lighthouse)

|  디바이스   | Performance | Accessibility | Best Practices | SEO |
| :---------: | :---------: | :-----------: | :------------: | :-: |
|  📱 모바일  |     76      |      92       |      100       | 61  |
| 🖥️ 데스크탑 |     99      |      92       |      100       | 61  |

### Core Web Vitals (Lab)

| 지표        | 📱 모바일 |   판정   | 🖥️ 데스크탑 |   판정   |
| ----------- | --------- | :------: | ----------- | :------: |
| LCP         | 4.9 초    |    🔴    | 1.0 초      |    🟢    |
| CLS         | 0         |    🟢    | 0           |    🟢    |
| FCP         | 1.2 초    |          | 0.3 초      |          |
| TBT         | 290 ms    |          | 40 ms       |          |
| Speed Index | 2.1 초    |          | 0.7 초      |          |

### PSI Insights (개선 기회)

| Insight 항목 | 디바이스 | 예상 절감 (Est savings) |
| --- | :---: | --- |
| 사용하지 않는 자바스크립트 줄이기 | 공통 | 219 KiB |
| 렌더링 차단 요청 | 📱 | 730 ms |
| 렌더링 차단 요청 | 🖥️ | 230 ms |
| 이미지 전송 개선 | 📱 | 15 KiB |
| 레거시 JavaScript | 공통 | 15 KiB |
| 긴 기본 스레드 작업 피하기 | 📱 | 긴 작업 3개 |
| 긴 기본 스레드 작업 피하기 | 🖥️ | 긴 작업 2개 |
| DOM 크기 최적화 | 📱 | - |
| LCP 요청 탐색 | 공통 | - |
| 네트워크 종속 항목 트리 | 공통 | - |
| LCP 분석 | 공통 | - |
| 서드 파티 | 공통 | - |

### 개선 필요사항

| 우선순위 | 디바이스 | 문제 | 원인 | 개선안 | 상태 |
| :------: | :------------------: | ---- | ---- | ------ | :--: |
| P0 | 모바일 | 사용하지 않는 JS 219KiB | 번들에 미사용 코드 포함 | 코드 스플리팅 / tree-shaking 적용 | 예정 |
| P1 | 모바일 | 렌더링 차단 요청 (730ms) | 크리티컬 패스에 블로킹 리소스 존재 | 스크립트 defer/async, CSS 인라인화 검토 | 예정 |
| P1 | 모바일 | 긴 메인 스레드 작업 3개 | JS 실행 시간 과다 | 무거운 작업 분리 및 lazy 처리 | 예정 |
| P2 | 모바일 | 이미지 전송 비효율 (15KiB) | 이미지 포맷/사이즈 미최적화 | WebP 변환, next/image 적용 | 예정 |
| P2 | 모바일 | 레거시 JavaScript (15KiB) | 불필요한 폴리필 포함 | 타겟 브라우저 범위 재설정 | 예정 |
| P2 | 모바일 | DOM 크기 과다 | 불필요한 DOM 노드 존재 | 불필요한 wrapper 제거 및 가상화 검토 | 예정 |
| P2 | 모바일 | 색상 대비율 부족 | 전경/배경 색상 대비 미달 | WCAG AA 기준(4.5:1) 충족하도록 색상 조정 | 예정 |
| P2 | 모바일 | 터치 영역 크기/간격 부족 | 버튼·링크 tap target 미달 | 최소 48×48px 확보 | 예정 |
| P2 | 모바일 | SEO: 색인 생성 차단 | robots meta 설정 문제 | noindex 태그 제거 또는 설정 확인 | 예정 |
| P2 | 모바일 | rel=canonical 없음 | canonical 태그 미설정 | 루트 URL이 아닌 실제 페이지 URL로 canonical 추가 | 예정 |

### 메모

- 모바일 LCP 4.9초 🔴, 렌더링 차단(730ms)이 login(500ms)보다 크므로 우선 해소 권장
- 데스크탑은 Performance 99 / LCP 1.0초 🟢로 매우 양호
- Agentic Browsing 2/2 통과 (login의 1/2 대비 개선된 상태)
