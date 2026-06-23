# AI 모듈 설계 문서

## 개요

Kanto 플랫폼에 Anthropic Claude API 기반의 AI 기능 4종을 추가한다.  
모든 AI 기능은 서버 사이드에서만 Claude API를 호출하며, 클라이언트는 Next.js API 라우트를 통해 간접 접근한다.  
기존 Upstash Redis 패턴을 재사용하여 Rate Limiting을 적용하고, 서비스 계층 → API 라우트 → 훅/컴포넌트의 3단계 구조를 따른다.

**AI 공급자**: Anthropic Claude `claude-haiku-4-5-20251001`  
**패키지**: `@anthropic-ai/sdk`  
**환경변수**: `ANTHROPIC_API_KEY`

---

## 기능 목록

| 기능 | 설명 | 트리거 시점 | 인증 |
|---|---|---|---|
| 이미지 검열 | 게시글 이미지 업로드 시 부적절 콘텐츠 하드 블록 | 파일 선택 직후 | 필요 |
| AI 챗봇 | 커뮤니티 도우미 플로팅 위젯 | 플로팅 버튼 클릭 | 불필요 |
| 게시글 요약 | 게시글 상세 페이지 수동 버튼 | 사용자 버튼 클릭 | 필요 |
| 게시글 관리 AI | 콘텐츠 검열·스팸·사기 감지 + 관리자 분석 도구 | 폼 제출 직전 / 관리자 버튼 | 필요 |

---

## 파일 구조

```
src/
├── lib/
│   └── anthropic.ts                          # Anthropic 클라이언트 초기화 (싱글톤)
│
├── type/
│   └── ai.ts                                 # AI 관련 공통 타입 정의
│
├── services/
│   └── ai/
│       ├── moderation.ts                     # 이미지 검열 서비스
│       ├── chatbot.ts                        # 챗봇 시스템 프롬프트 빌더
│       ├── summarize.ts                      # 게시글 요약 서비스
│       └── postModeration.ts                 # 게시글 콘텐츠 검열·스팸·사기 감지
│
├── app/
│   └── api/
│       └── ai/
│           ├── moderation/
│           │   └── route.ts                  # POST: 이미지 검열 API
│           ├── chat/
│           │   └── route.ts                  # POST: AI 챗봇 API (스트리밍)
│           ├── summarize/
│           │   └── route.ts                  # POST: 게시글 요약 API
│           ├── post-moderation/
│           │   └── route.ts                  # POST: 게시글 콘텐츠 검열 API
│           └── admin/
│               └── analyze/
│                   └── route.ts              # POST: 관리자 AI 분석 API
│
├── hooks/
│   └── ai/
│       ├── useAiChat.ts                      # AI 챗봇 훅 (스트리밍 처리)
│       └── usePostSummary.ts                 # 게시글 요약 훅
│
└── components/
    ├── common/
    │   └── ai/
    │       ├── FloatingAiChatWidget.tsx      # 플로팅 AI 챗봇 위젯
    │       └── AiPostSummary.tsx             # 게시글 요약 버튼 + 결과 컴포넌트
    └── (admin)/
        └── admin/
            └── posts/
                └── _components/
                    └── AiAnalysisButton.tsx  # 관리자 AI 분석 버튼 + 결과
```

**기존 파일 수정**:

| 파일 | 변경 내용 |
|---|---|
| `src/hooks/useImageUpload.ts` | `enableModeration` 파라미터 추가, `handleImageSelect` async 전환 |
| `src/components/common/GlobalLayout.tsx` | `FloatingAiChatWidget` 추가 |
| `src/hooks/usedgoods/useCreateUsedGoodsForm.ts` | 폼 제출 전 게시글 콘텐츠 검열 호출 |
| job/rental 생성 폼 훅 | 동일한 콘텐츠 검열 패턴 적용 |
| `src/app/(admin)/admin/posts/_components/` | `AiAnalysisButton` 삽입 |
| `.env.local` | `ANTHROPIC_API_KEY` 추가 |

---

## 공통 설정

### `src/lib/anthropic.ts`

기존 `src/services/notion/notion.ts`의 module-level 초기화 패턴을 따른다.

```typescript
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

> 서버 전용 파일이므로 클라이언트에서 직접 import 금지.

---

### `src/type/ai.ts`

```typescript
// 이미지 검열 결과
export type ImageModerationResult = {
  safe: boolean;
  reason?: string;
};

// AI 챗봇 메시지
export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// 게시글 요약 결과
export type PostSummaryResult = {
  summary: string;
};

// 게시글 콘텐츠 검열 결과
export type PostModerationResult = {
  safe: boolean;
  isSpam: boolean;
  isFraud: boolean;
  reason?: string;
  recommendation: "approve" | "warn" | "reject";
};

// 관리자 AI 분석 결과
export type AdminAnalysisResult = {
  recommendation: "keep" | "warn_user" | "delete";
  analysis: string;
  confidence: number; // 0 ~ 1
};
```

---

## Rate Limiting 전략

기존 `src/app/api/login/route.ts`의 Upstash Redis `incr / expire` 패턴을 동일하게 재사용한다.

```typescript
// 공통 패턴
const key = `ai_mod:${userId}`;       // 기능별로 prefix 구분
const count = (await redis.get<number>(key)) ?? 0;
if (count >= LIMIT) {
  return NextResponse.json({ code: "too_many_requests" }, { status: 429 });
}
await redis.incr(key);
await redis.expire(key, 60);          // 1분 TTL
```

| 기능 | Redis Key | 분당 제한 | 인증 기준 |
|---|---|---|---|
| 이미지 검열 | `ai_mod:{userId}` | 20회 | 로그인 사용자 |
| AI 챗봇 | `ai_chat:{ip}` | 10회 | IP |
| 게시글 요약 | `ai_sum:{userId}` | 20회 | 로그인 사용자 |
| 게시글 콘텐츠 검열 | `ai_post_mod:{userId}` | 10회 | 로그인 사용자 |
| 관리자 AI 분석 | `ai_admin:{adminId}` | 30회 | 관리자 계정 |

---

## 1. 이미지 검열

### 목적

게시글 이미지 업로드 시 성인 콘텐츠, 폭력, 혐오, 불법 물품 이미지를 하드 블록한다.

### 서비스: `src/services/ai/moderation.ts`

```typescript
export async function moderateImage(
  base64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
): Promise<ImageModerationResult>
```

- Claude에게 base64 이미지와 텍스트 프롬프트를 함께 전송 (vision)
- 응답은 JSON 형식 강제: `{"safe": boolean, "reason": "..."}`
- 파싱 실패 시 `{ safe: true }` 반환 (false negative 허용, false positive 방지 우선)

**검열 기준 (프롬프트)**:
- Unsafe: 성인/성적 콘텐츠, 그래픽 폭력, 혐오 상징, 불법 물품
- Safe: 중고품, 방/아파트, 업무 관련 이미지, 적절한 복장의 인물

### API Route: `src/app/api/ai/moderation/route.ts`

- **Method**: POST
- **Content-Type**: `multipart/form-data`
- **인증**: Supabase 세션 확인 필수
- **Rate Limit**: `ai_mod:{userId}`, 20회/분
- **처리 흐름**:
  1. `req.formData()`로 파일 수신
  2. `file.arrayBuffer()` → `Buffer.from()` → base64 변환
  3. `moderateImage()` 호출
  4. `{ safe, reason }` 응답

### `src/hooks/useImageUpload.ts` 수정

`enableModeration` 파라미터를 추가하고, `handleImageSelect`를 async로 전환한다.  
기존 `enableModeration = false`일 때는 동작이 완전히 동일하다.

```typescript
export function useImageUpload(
  initialUrls: string[] = [],
  maxCount = 10,
  enableModeration = false,        // ← 신규
) {
  const [isChecking, setIsChecking] = useState(false);   // ← 신규
  const [rejectedCount, setRejectedCount] = useState(0); // ← 신규

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // enableModeration이 false면 기존 로직 그대로
    // enableModeration이 true면 각 파일을 /api/ai/moderation으로 검사
    // 검열 통과 파일만 imageFiles / imagePreviews에 추가
    // 거절된 파일 수를 rejectedCount에 저장
  };

  return { ..., isChecking, rejectedCount };  // ← 신규 반환값
}
```

`ImageUploadField.tsx`에서 `rejectedCount > 0`일 때 경고 문구를 표시한다.

---

## 2. AI 챗봇

### 목적

플로팅 버튼으로 언제든지 접근 가능한 커뮤니티 도우미. 비회원도 사용 가능.  
플랫폼 사용법·거래 팁·커뮤니티 규칙 안내에 특화한다.

### 서비스: `src/services/ai/chatbot.ts`

```typescript
export function buildChatbotSystemPrompt(locale: string): string
```

locale(`ko` / `en` / `fil`)별로 각기 다른 시스템 프롬프트를 반환한다.

**공통 내용**:
- Kanto: 필리핀 한인 커뮤니티 플랫폼
- 기능: 중고거래, 구인구직, 방렌트, 1:1 채팅
- 역할: 플랫폼 사용 안내, 거래 안전 팁, 커뮤니티 규칙

### API Route: `src/app/api/ai/chat/route.ts`

- **Method**: POST
- **Body**: `{ messages: AiChatMessage[], locale: string }`
- **인증**: 불필요 (IP 기반 Rate Limit)
- **Rate Limit**: `ai_chat:{ip}`, 10회/분
- **응답**: `ReadableStream` (text/plain; charset=utf-8) — 스트리밍
- **최대 히스토리**: 마지막 10개 메시지만 API로 전송 (비용 절감)

**스트리밍 패턴**:
```typescript
const stream = new ReadableStream({
  async start(controller) {
    const response = anthropic.messages.stream({ model, max_tokens: 512, system, messages });
    for await (const event of response) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        controller.enqueue(new TextEncoder().encode(event.delta.text));
      }
    }
    controller.close();
  },
});
return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
```

### Hook: `src/hooks/ai/useAiChat.ts`

```typescript
export function useAiChat(locale: string): {
  messages: AiChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
}
```

- `sendMessage`: 사용자 메시지 추가 → API 호출 → ReadableStreamDefaultReader로 청크 누적 → 마지막 assistant 메시지 실시간 업데이트
- `resetChat`: 대화 초기화

### 컴포넌트: `src/components/common/ai/FloatingAiChatWidget.tsx`

기존 `FloatingChatWidget.tsx`와 동일한 구조(패널 + 버튼):

- **패널 크기**: `w-80 h-96` (사용자 채팅보다 약간 작게)
- **상태**: `isOpen`, 메시지 목록, 텍스트 입력창, 전송 버튼
- **로그인 체크 없음** (비회원도 접근 가능)
- 모바일: 전체 화면 오버레이 (`max-md:fixed max-md:inset-0`)

### `GlobalLayout.tsx` 수정

```tsx
<div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
  <ScrollToTop />
  <FloatingAiChatWidget />   {/* ← 추가 (사용자 채팅 위에 배치) */}
  <FloatingChatWidget />
</div>
```

---

## 3. 게시글 요약

### 목적

게시글 상세 페이지에서 사용자가 수동으로 버튼을 눌러 긴 본문을 2~3문장으로 요약받는다.

### 서비스: `src/services/ai/summarize.ts`

```typescript
export async function summarizePost(data: {
  title: string;
  content: string;
  postType: "used_goods" | "job" | "rental";
  locale: string;
}): Promise<PostSummaryResult>
```

- `max_tokens: 256`
- 요약 언어는 `locale`(`ko` / `en` / `fil`)에 따라 지시

### API Route: `src/app/api/ai/summarize/route.ts`

- **Method**: POST
- **Body**: `{ title, content, postType, locale }`
- **인증**: Supabase 세션 확인 필수
- **Rate Limit**: `ai_sum:{userId}`, 20회/분
- **응답**: `{ summary: string }`

### Hook: `src/hooks/ai/usePostSummary.ts`

```typescript
export function usePostSummary(): {
  summary: string | null;
  isLoading: boolean;
  summarize: (data: { title: string; content: string; postType: string; locale: string }) => Promise<void>;
}
```

- 한 번 요약된 이후 `summary`가 유지되어 재요청 불필요

### 컴포넌트: `src/components/common/ai/AiPostSummary.tsx`

Props: `{ title: string; content: string; postType: string }`

- 버튼 클릭 → 로딩 스피너 → 요약 박스 표시
- 이미 요약된 경우 버튼 숨김 (재요청 방지)
- 게시글 상세 페이지(중고거래, 구인구직, 방렌트)에서 import하여 본문 아래에 배치

---

## 4. 게시글 관리 AI

### 목적

- **콘텐츠 자동 검열**: 게시글 작성/수정 시 커뮤니티 규칙 위반 콘텐츠 차단
- **스팸/사기 감지**: 반복 문구, 비정상 가격, 외부 결제 링크 탐지
- **관리자 AI 보조**: 신고된 게시글에 대해 AI가 분석 + 처리 권고를 제시

### 서비스: `src/services/ai/postModeration.ts`

```typescript
export async function moderatePostContent(data: {
  title: string;
  content: string;
  price?: number;
  postType: "used_goods" | "job" | "rental";
}): Promise<PostModerationResult>
```

하나의 Claude 호출로 세 가지(safe, isSpam, isFraud)를 동시 판단한다.

**검열 기준 (프롬프트에 명시)**:

| 플래그 | 판단 기준 |
|---|---|
| `safe = false` | 불법 물품, 혐오 표현, 성인 콘텐츠 |
| `isSpam = true` | 동일 문구 반복, 무의미한 문자열, 과도한 광고 키워드 |
| `isFraud = true` | 시장가 대비 비정상 저가 + 선입금 유도 문구, 외부 결제 링크, 피싱 URL 패턴 |

**recommendation 결정 로직**:
```
safe=false OR isFraud=true → "reject"
isSpam=true               → "warn"
otherwise                 → "approve"
```

### API Route: `src/app/api/ai/post-moderation/route.ts`

- **Method**: POST
- **Body**: `{ title, content, price?, postType }`
- **인증**: Supabase 세션 확인 필수
- **Rate Limit**: `ai_post_mod:{userId}`, 10회/분
- **응답**: `PostModerationResult`

**폼 제출 흐름 수정** (`useCreateUsedGoodsForm.ts` 등):

```
handleSubmit
  └─ 1. /api/ai/post-moderation 호출
       ├─ 통과 (approve) → 기존 Supabase insert 진행
       ├─ 경고 (warn)   → 사용자에게 수정 권고 메시지 표시 후 제출 차단
       └─ 거절 (reject) → 제출 차단 + 사유 표시
```

### API Route: `src/app/api/ai/admin/analyze/route.ts`

관리자 전용 심층 분석 엔드포인트.

- **Method**: POST
- **Body**: `{ postId, title, content, price?, postType, reportReason? }`
- **인증**: Supabase Admin 세션 확인 (관리자만 접근 가능)
- **Rate Limit**: `ai_admin:{adminId}`, 30회/분
- **처리**: `moderatePostContent`를 기반으로 관리자용 상세 프롬프트 추가
- **응답**: `AdminAnalysisResult`

**관리자용 추가 프롬프트**:
```
You are reviewing this post for admin moderation.
Report reason from user: {reportReason}
Provide a detailed analysis and confidence score (0.0–1.0).
Respond ONLY with JSON: { "recommendation": "keep"|"warn_user"|"delete", "analysis": "...", "confidence": 0.0–1.0 }
```

### 컴포넌트: `src/components/(admin)/admin/posts/_components/AiAnalysisButton.tsx`

Props: `{ postId: number; title: string; content: string; postType: string; reportReason?: string }`

- 관리자 게시글 목록/상세에서 각 게시글 옆 "AI 분석" 버튼
- 클릭 시 `/api/ai/admin/analyze` 호출
- 결과를 인라인으로 표시:
  - **권고 뱃지**: 유지(초록) / 경고(노랑) / 삭제(빨강)
  - **분석 사유**: 텍스트
  - **신뢰도**: `{(confidence * 100).toFixed(0)}%`
- AI 권고는 참고용이며 관리자가 최종 결정 (자동 처리 없음)

---

## 데이터 흐름

### 이미지 검열

```
사용자 이미지 선택
  → useImageUpload.handleImageSelect (async)
  → POST /api/ai/moderation (FormData)
  → moderateImage() → Claude Vision API
  → { safe, reason }
  → safe=false: 파일 거부 + rejectedCount++ + 경고 UI
  → safe=true: 기존 로직대로 preview 추가
```

### AI 챗봇 메시지 전송

```
사용자 입력 전송
  → useAiChat.sendMessage()
  → POST /api/ai/chat (JSON: messages, locale)
  → anthropic.messages.stream()
  → ReadableStream → 청크 단위 UI 업데이트
  → 완료 시 isLoading = false
```

### 게시글 요약

```
사용자 "AI 요약" 버튼 클릭
  → usePostSummary.summarize()
  → POST /api/ai/summarize
  → summarizePost() → Claude API
  → { summary }
  → AiPostSummary 컴포넌트 내 박스에 표시
```

### 게시글 작성 제출

```
사용자 게시글 작성 완료 → 제출 버튼
  → POST /api/ai/post-moderation
  → moderatePostContent() → Claude API
  → approve: Supabase insert 진행
  → warn/reject: 제출 차단 + 사유 표시
```

### 관리자 AI 분석

```
관리자 "AI 분석" 버튼 클릭
  → POST /api/ai/admin/analyze
  → moderatePostContent() + 관리자 프롬프트 → Claude API
  → AdminAnalysisResult
  → AiAnalysisButton 컴포넌트에서 인라인 표시
```

---

## 검증 시나리오

| 시나리오 | 기대 결과 |
|---|---|
| 부적절한 이미지 선택 | 이미지 거부 + 경고 문구 표시, 안전한 이미지는 정상 추가 |
| 챗봇 질문 전송 | 스트리밍으로 실시간 응답, 완료 후 isLoading 해제 |
| 게시글 "AI 요약" 버튼 클릭 | 로딩 후 요약 박스 표시, 재클릭 시 이미 표시된 요약 유지 |
| 스팸 내용으로 게시글 제출 | 제출 차단 + "스팸으로 감지된 내용이 포함되어 있습니다" 메시지 |
| 사기성 내용으로 게시글 제출 | 제출 차단 + 사유 표시 |
| 관리자 AI 분석 버튼 클릭 | 권고(유지/경고/삭제) + 분석 사유 + 신뢰도 표시 |
| Rate Limit 초과 | 429 응답, UI에서 "잠시 후 다시 시도해주세요" 표시 |
