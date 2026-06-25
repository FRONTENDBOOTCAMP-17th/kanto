# AI 이미지 검수(Image Moderation) 시스템 설계

> 상태: 설계 확정 (구현 전)
> 최종 수정: 2026-06-25

## 1. 배경과 목표

### 문제
Kanto는 게시글 작성(중고거래 / 렌탈 / 구인) 시 사용자가 이미지를 업로드한다.
현재 흐름은 **클라이언트 → Supabase Storage 직접 업로드**이며, 검증은 다음 두 가지뿐이다.

- `accept="image/*"` (파일 타입 — 클라이언트 한정)
- 이미지 개수 제한 (최대 10장)

즉 **이미지 내용에 대한 검증이 전혀 없어**, 음란물·폭력·혐오·불법 거래물 이미지가
그대로 공개될 수 있다.

### 목표
1. 업로드 단계에서 AI 비전 모델로 이미지 적합성을 판별해 부적합 이미지를 차단한다.
2. Kanto 전용이 아니라, **타 사이트에서도 REST 호출 한 번으로 재사용 가능한 독립 시스템**으로 만든다.

### 확정된 설계 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 재사용 형태 | **독립 HTTP 마이크로서비스** | 언어/프레임워크 무관하게 어떤 사이트든 REST로 사용 |
| AI 제공자 | **Gemini 2.5-flash 1차 + 비전 폴백** | 기존 챗봇에 Gemini가 이미 연동·비전 지원·무료 티어 |
| 실패 처리 | **fail-open** (실패 시 통과 + 로깅) | 사용자 경험 우선, AI 장애가 업로드 전체를 막지 않게 |
| 차단 카테고리 | 성인/노출, 폭력/유혈, 혐오/극단주의, 불법/위험물 | 임계값은 설정 가능하게 설계 |

---

## 2. 전체 아키텍처

```
[브라우저: 게시글 작성 폼]
  └ 이미지 선택 → 클라가 다운스케일(≤1024px) → Kanto 백엔드 호출
        │
        ▼
[Kanto 서버 라우트] src/app/api/moderate-image/route.ts   ← 검수 서비스 API 키 보관(비공개)
  · IP 레이트리밋 (기존 Upstash 패턴 재사용)
  · 검수 마이크로서비스로 프록시
        │  POST /v1/moderate  (Authorization: Bearer <SERVICE_KEY>)
        ▼
[독립 검수 마이크로서비스]  (별도 배포, 어떤 사이트든 호출 가능)
  · ProviderChain: Gemini(1차) → 비전 폴백(2차)
  · 정책 엔진: 카테고리별 점수 → 임계값 비교 → allow/block/review
  · fail-open: 전부 실패 시 allowed=true + degraded=true
        │
        ▼ 판정 결과 JSON
[브라우저]
  · allowed=true  → 기존대로 Supabase Storage 업로드 진행
  · allowed=false → 미리보기에 추가 안 함 + 차단 사유 표시
```

### 핵심 보안 원칙
클라이언트는 **검수 서비스를 직접 호출하지 않는다** (서비스 API 키 노출 방지).
항상 각 사이트의 자체 백엔드 라우트가 키를 들고 프록시한다.
덕분에 마이크로서비스는 "키 검증 + 판정"만 책임지며, 연결되는 사이트 수에 무관하게 재사용된다.

---

## 3. Part 1 — 독립 검수 마이크로서비스 (재사용 핵심)

### 기술 선택 (권장)
- **런타임/언어**: Node.js + TypeScript (Kanto 팀 친숙)
- **프레임워크**: Hono (경량, Docker / Vercel / Cloudflare / Railway 어디든 배포 가능). Fastify도 대안.
- **배포 형태**: Docker 이미지 1개. 키/정책은 환경변수로 주입.
- **위치**: 별도 저장소 권장. 모노레포라면 `services/image-moderation/`.

### HTTP API 계약 (버전 고정: `/v1`)

#### `POST /v1/moderate`
요청 헤더: `Authorization: Bearer <SERVICE_API_KEY>`

요청 바디:
```jsonc
{
  "image": "data:image/jpeg;base64,...",   // 또는
  "imageUrl": "https://...",                 // 둘 중 하나 필수
  "policy": {                                // (선택) 사이트별 임계값 오버라이드
    "adult": 0.7, "violence": 0.8, "hate": 0.7, "illegal": 0.7
  },
  "context": "post_image"                    // (선택) 로깅/감사용 태그
}
```

응답 (200):
```jsonc
{
  "requestId": "uuid",
  "allowed": true,
  "action": "allow",              // allow | block | review
  "categories": {
    "adult":    { "score": 0.02, "flagged": false },
    "violence": { "score": 0.01, "flagged": false },
    "hate":     { "score": 0.00, "flagged": false },
    "illegal":  { "score": 0.03, "flagged": false }
  },
  "reason": null,                  // block 시 사람이 읽을 사유
  "provider": "gemini-2.5-flash",
  "degraded": false,               // true면 fail-open으로 통과된 것
  "latencyMs": 640
}
```

#### `GET /healthz`
→ `{ "ok": true }` (배포 헬스체크용)

### 내부 구조
```
src/
  server.ts              // Hono 앱 + 라우트 + 인증 미들웨어
  moderate.ts            // 오케스트레이션: ProviderChain + 정책 적용 + fail-open
  policy.ts              // 카테고리 정의, 기본 임계값, action 결정 로직
  providers/
    types.ts             // ModerationProvider 인터페이스
    gemini.ts            // 1차: gemini-2.5-flash, 구조화 JSON 출력
    fallback.ts          // 2차: 비전 폴백
  image.ts               // imageUrl→base64 다운로드, 크기/MIME 검증
```

### 제공자 추상화
제공자 교체·추가를 쉽게 하기 위한 인터페이스:
```ts
type Category = "adult" | "violence" | "hate" | "illegal";

interface ModerationResult {
  categories: Record<Category, number>; // 0~1 점수
}

interface ModerationProvider {
  name: string;
  moderate(imageBase64: string, mime: string): Promise<ModerationResult>;
}
```

#### Gemini 제공자 (1차)
기존 챗봇 `src/app/api/ai/chat/route.ts`의 `@google/generative-ai` 사용 패턴을 재사용한다.
단, 텍스트가 아니라 `inlineData`로 이미지를 넣고, 점수를 JSON으로 받도록
`responseMimeType: "application/json"` + `responseSchema`(또는 프롬프트로 엄격 JSON 강제)를 쓴다.

프롬프트 요지:
> "이미지를 분석해 adult / violence / hate / illegal 4개 카테고리 각각에 대해
> 0~1 확률을 매겨 **오직 JSON으로만** 답하라."

#### 비전 폴백 (2차)
⚠️ 기존 챗봇 폴백 모델(Groq / Cerebras의 `llama-3.3-70b`)은 **텍스트 전용이라 이미지 입력 불가**.
따라서 비전 가능한 폴백이 필요하다. 후보:
- **Groq 멀티모달 모델** (`llama-4-scout` / `maverick` 계열 등) — 기존 Groq 키 재사용 가능
- 또는 **OpenAI `omni-moderation`** — 이미지 지원, 전용 moderation API라 매우 안정적

→ 구현 첫 작업으로 Groq 멀티모달 가용성을 확인하고, 가용하면 Groq를, 아니면 OpenAI를 채택한다.

### fail-open 로직 (`moderate.ts`)
- Gemini 실패 → 폴백 시도.
- 폴백도 실패/타임아웃(예: 8초)이면 `{ allowed: true, action: "allow", degraded: true }` 반환 + `console.warn` 기록.
- transient 에러(503/429)는 backoff 재시도. 기존 `route.ts`의 재시도 패턴을 차용한다.

### 정책 엔진 (`policy.ts`)
- 카테고리별 `score >= threshold`면 `flagged`.
- 하나라도 flagged면 `action = "block"`.
- 기본 임계값은 환경변수/기본값으로, 요청 `policy`로 사이트별 오버라이드.

### 인증 & 운영
- 사이트별 `SERVICE_API_KEY` 발급(단순 Bearer). 키 목록은 환경변수(`API_KEYS=key1,key2`).
- 레이트리밋은 1차로 호출측(Kanto 라우트)에서 처리. 서비스단 추가 보호는 후순위.
- 로깅: requestId · 사이트 · action · 점수 · degraded 여부.
  **이미지 원본은 저장하지 않는다** (프라이버시).

---

## 4. Part 2 — Kanto 통합

### 4-1. 프록시 라우트 (신규)
`src/app/api/moderate-image/route.ts`
- 기존 `src/app/api/ai/chat/route.ts`의 **Upstash IP 레이트리밋 패턴 복사** (key 접두사만 `moderate_image:`).
- 바디로 `{ image: base64 }`를 받아 검수 서비스 `POST /v1/moderate`로 전달.
- `MODERATION_SERVICE_URL`, `MODERATION_SERVICE_KEY`를 `.env.local`에서 읽음(서버 전용).
- 서비스 결과를 그대로 클라이언트에 반환.

### 4-2. 업로드 훅 수정 (핵심 통합 지점)
`src/hooks/useImageUpload.ts` — 현재 `handleImageSelect`는 선택 즉시 무조건 미리보기에 추가한다.
여기에 **선택 시점 검수**를 삽입한다(가장 빠른 피드백):
1. 선택된 각 파일을 canvas로 ≤1024px 다운스케일 → base64
2. `/api/moderate-image` 호출
3. `allowed=true` → 기존대로 `imageFiles` / `imagePreviews`에 추가
4. `allowed=false` → 추가하지 않고 차단 사유를 호출측에 전달

추가 반환값: `isChecking`(검수 중 로딩), `blockedReason`(차단 사유).
`src/components/common/ImageUploadField.tsx`는 로딩 스피너 / 차단 토스트만 소폭 추가.

### 4-3. 제출 시 2차 방어 (선택, 권장)
폼 제출 직전(예: `CreateUsedGoodsForm.tsx`의 Supabase 업로드 루프 전)에 한 번 더 확인하면
클라이언트 우회를 막을 수 있다. MVP에서는 선택-시점만으로 충분하므로 후속 과제로 둔다.

### 4-4. 다국어
차단 사유 문구는 `next-intl` 메시지 키로 추가(ko / en / tl). 기존 i18n 구조 사용.

---

## 5. 구현 순서 (단계별 검증)

| 단계 | 작업 | 검증 |
|---|---|---|
| 1 | 설계 문서 저장 (본 문서) | 파일 존재 / 리뷰 |
| 2 | 폴백 모델 가용성 확인 (Groq 멀티모달 vs OpenAI omni) | 샘플 이미지로 호출 성공 |
| 3 | 마이크로서비스 스캐폴딩 (Hono + healthz + 인증) | `GET /healthz` 200 |
| 4 | Gemini 제공자 + 정책 엔진 | 안전/유해 샘플로 정확한 점수·판정 |
| 5 | 폴백 + fail-open | 키 무효화 시 폴백, 둘 다 죽이면 degraded=true 통과 |
| 6 | Kanto 프록시 라우트 | curl base64 전송 시 판정 반환, 레이트리밋 429 |
| 7 | useImageUpload 통합 + UI | 작성 폼 e2e: 정상 통과 / 유해 차단 |
| 8 | (선택) 제출 시 2차 방어 | 우회 시도 차단 확인 |

---

## 6. 검증 (End-to-End)
- **유닛**: provider 응답 파싱, 정책 임계값 경계값, fail-open 경로
- **샘플셋**: 안전 이미지 N장 + 카테고리별 유해 샘플 → 오탐/미탐 측정
- **수동 e2e**: `/usedgoods/create`에서 정상 이미지 업로드 성공, 유해 이미지 차단 메시지 확인
- **회귀**: 검수 서비스 다운 상태에서도(fail-open) 업로드가 막히지 않는지 확인
- **서비스 헬스**: `GET /healthz`, 레이트리밋 429

---

## 7. 미해결 / 구현 시 확정할 사항
- 폴백 비전 모델 최종 선택 (단계 2에서 확정)
- 다중 이미지 검수: 1요청 배치 vs 개별 요청 (개별 권장 — 부분 차단 표시 용이)
- 임계값 기본값 튜닝 (샘플셋 결과 기반)
- 마이크로서비스 배포 위치 (Railway / Render / Vercel / 자체 Docker)

## 8. 변경/생성 파일 요약
- 신규(서비스): 별도 저장소 또는 `services/image-moderation/` 전체
- 신규(Kanto): `src/app/api/moderate-image/route.ts`
- 신규(Kanto): `docs/image-moderation/DESIGN.md` (본 문서)
- 수정(Kanto): `src/hooks/useImageUpload.ts`, `src/components/common/ImageUploadField.tsx`
- 수정(Kanto): `.env.local` (`MODERATION_SERVICE_URL`, `MODERATION_SERVICE_KEY`), i18n 메시지
