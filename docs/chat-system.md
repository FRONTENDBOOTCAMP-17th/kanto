# 채팅 시스템 설계 문서

## 개요

Next.js 15 App Router + Supabase 기반의 실시간 1:1 채팅 시스템입니다.
게시글(중고거래 · 방렌트 · 구인구직)을 매개로 두 사용자 간의 채팅방이 생성되며,
메시지 실시간 수신, 읽음 처리, 도배 방지, 페이지네이션, 안 읽은 메시지 수 표시를 지원합니다.

---

## 파일 구조

```
src/
├── app/(user)/chat/
│   ├── page.tsx                        # 채팅 목록 페이지 (Server Component)
│   ├── _components/
│   │   ├── ChatListClient.tsx          # 채팅 목록 클라이언트 (상태 · Realtime 관리)
│   │   └── ChatListItem.tsx            # 개별 채팅 항목 컴포넌트
│   └── [id]/
│       ├── page.tsx                    # 채팅방 페이지 (Server Component)
│       ├── actions.ts                  # Server Actions
│       └── _components/
│           ├── ChatRoomClient.tsx      # 채팅방 클라이언트 (오케스트레이터)
│           ├── ChatHeader.tsx          # 헤더 (상대방 정보 · 메뉴)
│           ├── MessageList.tsx         # 메시지 목록 · 이전 메시지 버튼
│           └── ChatInput.tsx           # 메시지 입력창
├── hooks/
│   ├── useClickOutside.ts              # 외부 클릭 감지 공통 훅
│   └── chat/
│       ├── useSpamPrevention.ts        # 도배 방지 훅
│       ├── useChatRoomRealtime.ts      # 채팅방 실시간 메시지 훅
│       ├── useChatListRealtime.ts      # 채팅 목록 실시간 갱신 훅
│       └── useChatMessages.ts          # 메시지 상태 · 페이지네이션 훅
├── services/chat/
│   ├── chat.ts                         # 채팅방 조회 서비스
│   └── message.ts                      # 메시지 조회 · 전송 서비스
├── type/chat/
│   ├── chat.ts                         # Chat · ChatWithUsers 타입
│   └── message.ts                      # Message · MessageWithSender 타입
└── utils/
    └── formatTime.ts                   # 시간 포맷 공통 유틸
```

---

## DB 스키마 (관련 테이블)

### `chats`
| 컬럼 | 타입 | 설명 | 비고 |
|---|---|---|---|
| id | bigint | PK | |
| user_id_1 | bigint | 채팅 개설자 FK → users.id | 원본 |
| user_id_2 | bigint | 상대방 FK → users.id | 원본 |
| last_message_at | timestamptz | 마지막 메시지 시각 | 원본 |
| created_at | timestamptz | 생성 시각 | 원본 |
| post_id | bigint | 연결된 게시글 FK → posts.id | **추가** |
| last_message_content | text | 마지막 메시지 내용 | **추가** |
| user_id_1_unread | int | user_id_1의 안 읽은 메시지 수 | **추가** |
| user_id_2_unread | int | user_id_2의 안 읽은 메시지 수 | **추가** |

### `messages`
| 컬럼 | 타입 | 설명 | 비고 |
|---|---|---|---|
| id | bigint | PK | |
| chat_id | bigint | 속한 채팅방 FK → chats.id | 원본 |
| sender_id | bigint | 발신자 FK → users.id | 원본 |
| content | text | 메시지 내용 | 원본 |
| is_read | boolean | 상대방 읽음 여부 (기본 false) | 원본 |
| created_at | timestamptz | 발송 시각 | 원본 |
| post_id | bigint | 연결된 게시글 FK → posts.id | **추가** |

---

## 스키마 변경 이력

채팅 기능 개발 과정에서 원본 설계에서 다음 컬럼들이 추가되었습니다.

### `chats` 테이블 추가 컬럼

| 컬럼 | 추가 이유 |
|---|---|
| `post_id` | 채팅방이 어떤 게시글에서 시작됐는지 연결하기 위해. 채팅방 헤더에 게시글 제목 표시에 사용 |
| `last_message_content` | 채팅 목록에서 마지막 메시지 내용을 표시하기 위해. messages 테이블 JOIN 없이 단일 쿼리로 해결 |
| `user_id_1_unread` | 안 읽은 메시지 수 표시를 위해. messages 전체를 JOIN해서 필터링하는 것보다 카운트 컬럼을 직접 관리하는 방식이 쿼리 비용상 유리 |
| `user_id_2_unread` | 위와 동일. 1:1 채팅 구조이므로 참여자별로 컬럼을 분리해서 관리 |

### `messages` 테이블 추가 컬럼

| 컬럼 | 추가 이유 |
|---|---|
| `post_id` | 메시지가 어떤 게시글 맥락에서 전송됐는지 추적하기 위해. 추후 게시글 삭제 시 연계 처리 등에 활용 가능 |

---

## 기술 선택과 이유

### Supabase Realtime (`postgres_changes`)
메시지 실시간 수신을 위해 Supabase의 `postgres_changes` 이벤트를 사용합니다.
WebSocket 기반으로 DB 변경사항을 직접 구독하기 때문에 별도의 서버 구성 없이 실시간 기능을 구현할 수 있습니다.

- **채팅방**: `messages` 테이블의 INSERT(새 메시지), UPDATE(읽음 처리) 구독
- **채팅 목록**: `chats` 테이블의 UPDATE 구독 (마지막 메시지 · unread 변경 감지)

### 커서 기반 페이지네이션
메시지 목록은 최초 50개만 로드하며, 이전 메시지는 커서 방식으로 추가 로드합니다.

**오프셋 방식 대신 커서를 선택한 이유:**
- 오프셋 방식은 새 메시지가 쌓일수록 페이지가 밀려 중복·누락이 발생합니다.
- `created_at`을 커서로 사용하면 "이 시각 이전 50개"를 정확하게 가져올 수 있습니다.

```
GET messages WHERE chat_id = :id AND created_at < :cursor
ORDER BY created_at DESC LIMIT 50
→ reverse() → 화면에 오름차순 표시
```

### 낙관적 업데이트 (Optimistic UI)
메시지 전송 시 서버 응답을 기다리지 않고 임시 메시지를 즉시 화면에 추가합니다.
전송 실패 시 임시 메시지를 제거합니다. 임시 ID는 `Date.now()`(13자리 timestamp)를 사용하며,
Realtime으로 실제 메시지가 수신되면 임시 메시지를 교체합니다.

```
전송 → 임시 메시지 추가(id: Date.now()) → 서버 저장
→ Realtime INSERT 수신 → 임시 메시지를 실제 메시지로 교체
```

### unread 카운트 - DB 컬럼 방식
안 읽은 메시지 수를 `chats` 테이블의 `user_id_1_unread`, `user_id_2_unread` 컬럼으로 관리합니다.

**messages JOIN 방식 대신 컬럼 방식을 선택한 이유:**
- JOIN 방식은 채팅 목록 조회 시 모든 메시지를 함께 가져와야 해서 비효율적입니다.
- 컬럼 방식은 단일 숫자 값만 읽으므로 쿼리 비용이 거의 없습니다.
- Realtime UPDATE 이벤트로 목록 UI가 즉시 갱신됩니다.

---

## 주요 기능 구현

### 1. 날짜 구분선 (`MessageList`)

날짜가 바뀌는 지점에 `──── 2026년 6월 6일 ────` 형태의 구분선을 삽입합니다.

```
messages.map((msg, index) => {
  현재 메시지의 날짜와 이전 메시지의 날짜를 toDateString()으로 비교
  → 다르면 구분선 렌더링 후 메시지 버블 렌더링
  → 같으면 메시지 버블만 렌더링
})
```

`key`는 기존 `div` 대신 `Fragment`에 부여해서 구분선과 메시지 버블을 하나의 단위로 묶습니다.

---

### 2. 실시간 메시지 (`useChatRoomRealtime`)

```
messages INSERT → 발신자 정보 조합 → 낙관적 메시지와 교체 또는 새 메시지 추가
messages UPDATE → is_read 상태만 업데이트
```

상대방이 보낸 메시지가 INSERT되면 즉시 `is_read: true`로 업데이트합니다.
(채팅방을 열고 있는 상태 = 이미 읽은 것으로 처리)

### 2. 도배 방지 (`useSpamPrevention`)

3초 슬라이딩 윈도우 안에 5개 이상 전송 시 10초 쿨다운을 적용합니다.

```
전송 시각을 useRef 배열에 기록
→ 3초 이내 기록만 필터링
→ 5개 이상이면 isCooldown = true, 10초 카운트다운 시작
→ 쿨다운 중 입력창 비활성화 + placeholder에 남은 시간 표시
```

**왜 `useState`가 아닌 `useRef`로 timestamps를 관리하는가:**
timestamps 배열은 렌더링에 영향을 주지 않아야 하고, 변경 시 리렌더링이 불필요합니다.
`useRef`는 렌더링과 독립적으로 값을 유지합니다.

### 3. 페이지네이션 스크롤 복원 (`useChatMessages`)

이전 메시지를 로드할 때 스크롤 위치가 위로 튀는 문제를 방지합니다.

```
loadMore 호출
→ prevScrollHeight 저장
→ 메시지 상태 업데이트
→ requestAnimationFrame으로 다음 렌더 시점에
   scrollTop = 새 scrollHeight - prevScrollHeight 으로 복원
```

새 메시지가 추가될 때는 자동으로 최하단으로 스크롤하지만,
이전 메시지 로드 중에는 스크롤을 고정해야 하므로 `wasLoadingMore` ref 플래그로 구분합니다.

### 4. 읽음 처리 흐름

```
[채팅방 입장]
useChatMessages mount → 상대방이 보낸 안 읽은 메시지 전체 is_read: true 업데이트
markChatReadAction → chats.user_id_N_unread = 0

[상대방 메시지 실시간 수신]
useChatRoomRealtime INSERT 이벤트 → 즉시 is_read: true 업데이트

[메시지 전송]
postMessage → chats 업데이트 시 상대방 unread + 1 함께 처리
```

### 5. 시간 포맷 (`formatTime.ts`)

채팅방과 채팅 목록에서 다른 시간 표시 방식을 사용합니다.

| 위치 | 함수 | 예시 |
|---|---|---|
| 채팅방 메시지 | `formatMessageTime` | 오전 10:30 |
| 채팅 목록 | `formatChatListTime` | 오전 10:30 / 어제 / 3일 전 / 2주 전 / 1달 전 |
| 채팅방 날짜 구분선 | `formatDateDivider` | 2026년 6월 6일 |

---

## 컴포넌트 설계 원칙

### 역할 분리
`ChatRoomClient`는 훅에서 상태와 로직을 받아 컴포넌트에 내려주는 **오케스트레이터** 역할만 합니다.
비즈니스 로직은 훅, UI는 컴포넌트가 담당합니다.

```
ChatRoomClient (오케스트레이터)
├── useSpamPrevention     → 도배 방지 상태 + 로직
├── useChatMessages       → 메시지 상태 + 페이지네이션 + 스크롤
├── useChatRoomRealtime   → Realtime 구독 (사이드이펙트만)
├── ChatHeader            → 헤더 UI (메뉴 상태 자체 관리)
├── MessageList           → 메시지 목록 UI
└── ChatInput             → 입력창 UI
```

### 자기완결형 컴포넌트
`ChatHeader`는 드롭다운 메뉴 open/close 상태와 `useClickOutside`를 내부에서 직접 관리합니다.
부모가 메뉴 상태를 알 필요가 없기 때문입니다.

---

## 고민했던 내용들

### Zustand 전역 상태 도입 여부
채팅 관련 상태(메시지, 채팅방 목록)를 Zustand로 관리하는 방안을 검토했으나,
현재 단계에서는 각 페이지가 독립적으로 동작하고 공유 상태가 없으므로 로컬 상태로 충분합니다.
추후 알림 아이콘(헤더의 안 읽은 메시지 뱃지 등) 전역 노출이 필요해질 때 도입을 검토합니다.

### Hook 분리 기준
단순히 코드 줄 수를 줄이기 위한 분리가 아니라, **재사용 가능성**과 **관심사 분리**를 기준으로 분리했습니다.

- `useClickOutside`: 채팅 외 다른 UI에서도 재사용 가능 → `src/hooks/` 최상위
- `useSpamPrevention`, `useChatRoomRealtime`, `useChatMessages`, `useChatListRealtime`: 채팅 전용 → `src/hooks/chat/`

### 도배 판단 기준
처음에는 1.5초 윈도우를 사용했으나, 빠르게 타이핑하는 정상적인 사용자도 막히는 문제가 있어 3초로 변경했습니다.
5회 초과 시 10초 쿨다운으로 설정했으며, 쿨다운 중 입력창 placeholder에 남은 시간을 표시해 사용자 경험을 개선했습니다.

### 스크롤 복원에 `requestAnimationFrame` 사용 이유
`setState` 이후 DOM 업데이트는 비동기로 일어나기 때문에, 상태 변경 직후 `scrollHeight`를 읽으면 이전 값이 나옵니다.
`requestAnimationFrame`으로 다음 페인트 직전에 실행해야 정확한 `scrollHeight`를 얻을 수 있습니다.

### unread 카운트 동시성 문제
`postMessage`에서 unread 카운트를 증가시킬 때 현재 값을 읽어서 +1하는 방식을 사용합니다.
두 사람이 동시에 메시지를 보내면 이론적으로 카운트가 누락될 수 있습니다.
현재 1:1 채팅 구조에서 실제 동시 전송 가능성은 낮아 허용 범위로 판단했습니다.
완전한 정합성이 필요하다면 Supabase DB Function(RPC)으로 원자적 증가를 구현해야 합니다.
