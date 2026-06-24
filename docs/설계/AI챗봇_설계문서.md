# 칸토 AI 챗봇 설계 문서

## Context

현재 `Chatbot.tsx`는 UI만 구현되어 있고 백엔드 연동이 전혀 없습니다. 사용자가 메시지를 보내도 AI 응답이 없으며, 세션이 끊기면 대화 내역도 사라집니다. 이 문서는 칸토 플랫폼에 맞는 AI 챗봇을 설계하는 것을 목적으로 합니다.

---

## 1. 서비스 목표

칸토 플랫폼의 AI 어시스턴트는 **고객 지원 자동화**를 목표로 합니다:

- 플랫폼 이용 방법 안내 (인증뱃지, 안전거래, 망고지수 등)
- 거래 프로세스 가이드 (결제, 환불, 분쟁 처리)
- FAQ 자동 응답으로 CS 부담 감소
- 24시간 즉각 응답으로 사용자 경험 향상

---

## 2. 기술 스택 선택

### LLM 제공자: Cerebras (무료)

| 항목 | 내용 |
|------|------|
| 모델 | `llama-3.3-70b` |
| 비용 | **무료** (하루 1,000,000 토큰, 신용카드 불필요) |
| 요청 한도 | 분당 30회 |
| 컨텍스트 | 8,192 토큰 (무료 제한) |
| 다국어 지원 | 한국어 · 영어 · 필리핀어(Tagalog) 지원 |
| Streaming | SSE 스트리밍 응답 지원 |
| SDK | `@cerebras/cerebras_cloud_sdk` - Next.js API Routes에서 사용 |
| API 키 발급 | inference.cerebras.ai 에서 무료 발급 |

### 다국어 응답 전략

사용자가 입력한 언어를 감지하여 **같은 언어로 응답**합니다. 별도 언어 감지 로직 없이 Llama 3.3이 자동 처리합니다.

- 한국어로 질문 → 한국어로 답변
- 영어로 질문 → 영어로 답변
- 필리핀어(Tagalog)로 질문 → 필리핀어로 답변

### 컨텍스트 관리 주의사항

무료 티어의 컨텍스트 윈도우가 8,192 토큰으로 제한됩니다. API 호출 시 대화 이력이 한도를 초과하지 않도록 **최근 N개 메시지만 전송**하는 트리밍 처리가 필요합니다.

---

## 3. 아키텍처 설계

```
[Chatbot.tsx]
     │ POST /api/ai/chat
     │ { messages: [{role, content}] }
     ▼
[src/app/api/ai/chat/route.ts]
     │ Rate Limit 체크 (Upstash Redis - 기존 인프라 재사용)
     │ System Prompt + 대화 이력(트리밍) → Cerebras API
     │ SSE Streaming 응답
     ▼
[Chatbot.tsx]
     │ 스트리밍 텍스트를 실시간 렌더링
     ▼
[사용자 화면]
```

### 대화 이력 저장 전략: **sessionStorage**

- 브라우저 sessionStorage에 대화 이력 저장
- 같은 탭 내 페이지 새로고침 시에도 대화 유지
- 탭 닫기 또는 브라우저 종료 시 자동 초기화
- 서버/DB 비용 없음, 로그인 불필요

---

## 4. API 엔드포인트 설계

### `POST /api/ai/chat`

**Request:**
```typescript
{
  messages: Array<{ role: "user" | "assistant"; content: string }>
}
```

**Response:** `text/event-stream` (SSE Streaming)
```
data: {"delta": "안녕"}
data: {"delta": "하세요"}
data: [DONE]
```

**에러 응답:**
```typescript
{ error: "rate_limit" | "service_unavailable" }
```

**Rate Limiting:**
- Upstash Redis 재사용 (기존 `src/lib/upstash.ts` 활용)
- IP 기준: 분당 10회, 시간당 50회
- 초과 시 429 응답 + "잠시 후 다시 시도해주세요" 메시지

---

## 5. Chatbot.tsx 수정 사항

### 추가할 상태

```typescript
const [isLoading, setIsLoading] = useState(false);
// 스트리밍 중 마지막 메시지를 실시간 업데이트하기 위한 용도
```

### handleSend 수정 흐름

```
1. 사용자 메시지를 state에 추가
2. 로딩 메시지(빈 assistant 메시지) 추가
3. POST /api/ai/chat 호출 (fetch + SSE 스트리밍)
4. delta를 받을 때마다 마지막 메시지 content를 append
5. [DONE] 수신 시 isLoading = false
6. 에러 시: "죄송합니다, 잠시 후 다시 시도해주세요." 표시
```

### 타이핑 인디케이터 (로딩 중)

```tsx
{isLoading && (
  <div className="flex gap-1 px-3 py-2">
    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
  </div>
)}
```

---

## 6. 파일 구조 (변경/추가 파일)

```
src/
├── app/api/ai/
│   └── chat/
│       └── route.ts          # NEW: Cerebras API 연동 엔드포인트
├── components/common/aichatbot/
│   └── Chatbot.tsx           # MODIFY: API 호출 + 스트리밍 렌더링
└── .env.local                # MODIFY: CEREBRAS_API_KEY 추가
```

총 **2개 파일 수정, 1개 파일 신규 생성**.

---

## 7. 환경 변수

```bash
# .env.local에 추가
CEREBRAS_API_KEY=csk-...   # inference.cerebras.ai 에서 무료 발급
```

---

## 8. 구현 단계

### Phase 1 (MVP) — 현재 범위
- [ ] `npm install @cerebras/cerebras_cloud_sdk`
- [ ] inference.cerebras.ai 에서 API 키 발급 후 `.env.local`에 `CEREBRAS_API_KEY` 추가
- [ ] `src/app/api/ai/chat/route.ts` 생성 (스트리밍 + Rate Limit)
- [ ] `Chatbot.tsx` 수정 (API 호출, 스트리밍 렌더링, 타이핑 인디케이터, sessionStorage 연동)

### Phase 2 (개선) — 추후
- [ ] 동적 추천 질문 (LLM이 문맥에 맞게 제안)
- [ ] Markdown 렌더링 (`react-markdown` 이미 설치됨)
- [ ] Supabase에 대화 로그 저장 (분석/모니터링용)

---

## 9. 검증 방법

1. `npm run dev` 실행 후 챗봇 열기
2. "인증뱃지는 어떻게 받나요?" 입력 → 타이핑 인디케이터 표시 → 스트리밍 응답 수신 확인
3. 빠르게 10회 이상 전송 → Rate Limit 메시지 확인
4. 네트워크 탭에서 `/api/ai/chat` 응답이 `text/event-stream` 형식인지 확인
5. CEREBRAS_API_KEY 미설정 시 에러 메시지가 사용자에게 적절히 표시되는지 확인
