# 전역(전 페이지) 성능 개선 — Sentry Replay 지연 로딩

- **담당자**: 임태형
- **대상 페이지**: 전체 페이지 (클라이언트 Sentry 초기화는 모든 라우트 공통 엔트리에 포함됨)
- **관련 검사 문서**: [성능검사 전체](../성능검사/) — 12개 검사 문서 모두에서 "미사용 JS" 공통 지적 (아래 §2 표 참고). 전/후 재측정 대표 페이지는 [usedgoods.md](../성능검사/usedgoods.md)
- **우선순위**: P0~P2 <!-- login/signup/privacy는 P0, job/main/payment/policy/youth는 P1, usedgoods는 P2로 각 검사 문서에 기록됨 -->
- **상태**: 진행 <!-- 코드 적용 완료, 배포 후 PSI 재측정 대기 -->

## 1. 문제 정의

- 클라이언트 Sentry 초기화(`src/instrumentation-client.ts`)가 `Sentry.replayIntegration()`을 **정적으로** 포함 → Session Replay 번들(rrweb 포함, minified 300KB+ 규모)이 하이드레이션 전에 실행되는 초기 JS(main-app 엔트리)에 그대로 포함됨
- main-app 엔트리는 **모든 페이지가 공통으로 로드**하므로 특정 페이지가 아닌 전 페이지의 초기 로드에 영향 — 실제로 **성능검사 12개 문서 전부**에서 "사용하지 않는 자바스크립트 줄이기" 185~407 KiB가 공통 지적됨 (§2 표)
- 예) 모바일에서 페이지가 화면에 뜬 직후 버튼·카드를 탭해도 잠깐 반응이 없는 구간 발생 (TBT 모바일 200~480ms, long tasks 3~7건의 기여 요인)
- 특히 세션 리플레이(사용자 화면을 녹화해 에러 분석에 쓰는 Sentry 기능)는 방문자의 10%만 녹화 대상인데(`replaysSessionSampleRate: 0.1`), 그 녹화용 코드는 **전체 방문자가 초기 로드에서 다운로드·실행**하고 있었음 — 10명 중 9명은 쓰지 않을 기능의 비용을 지불하는 구조
- 추가 발견: 레거시 `sentry.client.config.ts`가 `instrumentation-client.ts`와 공존하며 동일한 `Sentry.init()` + Replay 정적 포함을 중복 선언 (webpack 빌드 경로에서 클라이언트 이중 초기화 유발 — SDK가 경고 출력하는 안티패턴)

> 참고: 검사 문서의 "Render-blocking requests 590~600ms" 항목은 CSS일 가능성이 있어, 이 작업의 주 효과는 **초기 JS 페이로드 축소 → unused JS / TBT / LCP 개선**으로 보는 것이 정확함.

## 2. PSI Insights (개선 기회)

성능검사 전체 문서에서 이번 작업이 겨냥하는 "미사용 JS" 항목을 취합. Sentry Replay는 전역 엔트리에 포함되므로 전 페이지에 공통으로 나타난다.

| 검사 문서 (페이지) | 미사용 JS (Est savings) | 검사 문서상 우선순위 | 이번 개선 반영 |
| --- | --- | :---: | :---: |
| go.md (`/go`) | 406~407 KiB | - | ✅ |
| usedgoodsid.md (`/usedgoods/[id]`) | 255~257 KiB | - | ✅ |
| login.md (`/login`) | 220 KiB | P0 | ✅ |
| signup.md (`/signup`) | 219 KiB | P0 | ✅ |
| usedgoods.md (`/usedgoods`) | 204 KiB | P2 | ✅ |
| job.md (`/job`) | 202 KiB | P1 | ✅ |
| main.md (`/main`) | 202 KiB | P1 | ✅ |
| privacy.md (`/terms/privacy`) | 186 KiB | P0 | ✅ |
| payment.md (`/terms/payment`) | 186 KiB | P1 | ✅ |
| policy.md (`/terms/policy`) | 185~186 KiB | P1 | ✅ |
| youth.md (`/terms/youth`) | 185~186 KiB | P1 | ✅ |
| termsservice.md (`/terms/*`) | - (표 참고) | - | ✅ |

이번 작업 범위 밖 (별도 작업으로 보류):

| Insight 항목 | 예상 절감 (Est savings) | 이번 개선 반영 |
| --- | --- | :---: |
| Legacy JavaScript (전 페이지 공통) | 15 KiB | ⬜ |
| Render-blocking requests (usedgoods 590~600ms, signup 730ms, privacy 600ms, login 500ms 등) | 페이지별 상이 | ⬜ (CSS 추정) |
| Improve image delivery (usedgoods) | 2,567 KiB | ⬜ |

> 예상 절감 단위는 시간(ms/s) 또는 용량(KiB)으로 PSI 표기 그대로. · 반영: ✅ 이번에 처리 / ⬜ 보류
> 미사용 JS에는 Sentry 외 요소도 포함되므로 전량 해소되지는 않음. Replay 몫(엔트리 −85.6 KB minified, §3)만큼 전 페이지에서 공통 감소 기대.

## 3. 개선 전 / 후 지표

전/후 비교는 대표 페이지 `/usedgoods`로 측정 (전역 변경이므로 다른 페이지도 동일한 효과를 받음).

| 지표             |  디바이스   |  개선 전   |  개선 후   | 변화 |
| ---------------- | :---------: | :--------: | :--------: | :--: |
| Performance 점수 |  📱 모바일  |     81     |            |      |
| LCP              |  📱 모바일  |   4.4 s    |            |      |
| TBT              |  📱 모바일  |   200 ms   |            |      |
| CLS              |  📱 모바일  |     0      |            |      |
| Performance 점수 | 🖥️ 데스크탑 |     77     |            |      |
| LCP              | 🖥️ 데스크탑 |   6.1 s    |            |      |

> 개선 후 값은 동일 조건(PSI, 배포 URL)으로 **재측정**하여 기록.

**로컬 번들 실측 (프로덕션 빌드, Turbopack, build-manifest 기준) — 전 페이지 공통 main-app 엔트리**

> 팀원 성능 개선 작업(#506~#509: 이미지 AVIF/lazy 로딩, 쿼리 병렬화 등)이 머지된 최신 develop 기준으로 재측정한 값 (2026-07-02).

| 항목 | 개선 전 | 개선 후 |
| --- | --- | --- |
| main-app 엔트리 JS 합계 | 819.6 KB | **734.0 KB (−85.6 KB)** |
| Replay 구현 코드 위치 | 537.5 KB 엔트리 청크에 포함 | **331.1 KB 비동기 청크로 분리** |
| 초기 HTML의 Replay 청크 참조 | 있음 (엔트리 경유) | **없음** (`load` + idle 이후 동적 로드) |

## 4. 개선 작업 내용

### 4-1. `src/instrumentation-client.ts` — Replay 지연 로딩

- `Sentry.init()`은 **즉시 실행 유지** → 초기 에러 이벤트 유실 없음
- `integrations: [Sentry.replayIntegration()]` 정적 포함 제거
- Replay는 `window` `load` 이벤트 + `requestIdleCallback`(폴백 `setTimeout 3s`) 시점에 동적 `import("@sentry/nextjs")`로 로드 후 `Sentry.addIntegration()`으로 추가 — LCP/TBT 측정 구간 이후로 실행이 밀림
- `enabled: process.env.NODE_ENV === "production"` 추가 (서버/엣지 설정과 일관성, dev 노이즈 차단)
- `replaysSessionSampleRate` / `replaysOnErrorSampleRate`는 `init`에 유지 — 지연 추가된 인테그레이션이 클라이언트 옵션에서 읽어감

### 4-2. `sentry.client.config.ts` 삭제

- `instrumentation-client.ts`와 중복인 레거시 파일. 이 파일이 남아 있으면 webpack 빌드에서 둘 다 엔트리에 주입되어 이중 초기화 + Replay tree-shake 무산
- 내용은 전부 `instrumentation-client.ts`가 대체

### 4-3. 검토 후 채택하지 않은 방안

| 방안 | 판정 |
| --- | --- |
| `Sentry.lazyLoadIntegration("replayIntegration")` | ❌ Sentry CDN(`browser.sentry-cdn.com`)에서 `<script>` 주입하는 서드파티 로드 — 광고차단기/CSP/신규 origin 문제. 동적 import가 셀프 호스팅으로 동일 효과 |
| `tracesSampleRate` 조정으로 tracing 번들 제거 | ❌ 런타임 옵션은 번들 크기와 무관 (`browserTracingIntegration`은 항상 포함) |
| `Sentry.init` 전체를 idle로 지연 | ❌ init 전 발생 에러 완전 유실. Replay 분리 후 남는 코어 대비 리스크가 큼 |

- 관련 PR / 커밋: <!-- 커밋/PR 생성 후 기입 -->

### 트레이드오프

- Replay 로드 전(페이지 로드~idle 사이) 발생한 에러는 **이벤트는 정상 수신되지만 리플레이 영상 없음**
- 세션 리플레이(10% 샘플)의 녹화 시작 지점이 초기 페인트 이후로 밀림
- `enabled: production`으로 dev 환경에서는 Sentry 이벤트 미전송 (의도된 동작)

## 5. 검증

- 로컬 검증 완료: 프로덕션 빌드 후 `next start` → 초기 HTML에 Replay 청크 미포함, 전 페이지 공통 엔트리 JS −85.6 KB 확인
- 재측정 PSI 링크 (📱 모바일): <!-- 배포 후 측정 -->
- 재측정 PSI 링크 (🖥️ 데스크탑): <!-- 배포 후 측정 -->
- 개선 확인 결과 한 줄: <!-- 배포 후 기입 -->
