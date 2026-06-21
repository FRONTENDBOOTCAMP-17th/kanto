# 채팅 "1"(안읽음) 표시 타이밍 수정 — 작업 정리

브랜치: `bug/chat-read-timing`
작성: `THLIMM`

## 1. 현재 폴더 구조 및 각 파일의 역할

채팅 기능과 관련된 파일만 정리합니다.

```
src/
├── app/api/chat/
│   ├── list/route.ts           # GET — 내 채팅 목록 API (getChatList 호출)
│   └── [id]/route.ts           # GET — 특정 채팅방 상세 + 메시지 목록 API
│
├── components/common/chat/
│   ├── ChatBubbleButton.tsx     # 우하단 플로팅 채팅 버튼, unreadCount 배지 표시
│   ├── FloatingChatWidget.tsx   # 채팅 위젯 최상위 — 목록뷰 ↔ 채팅방뷰 전환 관리
│   └── chatPanel/
│       ├── ChatList.tsx         # 채팅 목록(검색 포함) 클라이언트 컴포넌트
│       ├── ChatListItem.tsx     # 채팅 목록 항목 — unreadCount 배지, 마지막 메시지 표시
│       └── room/
│           ├── ChatRoom.tsx           # 채팅방 데이터 로딩(목록→상세 전환) 래퍼
│           ├── ChatRoomClient.tsx     # 채팅방 메인 클라이언트 — 메시지 전송/낙관적 업데이트,
│           │                          # 읽음처리 useEffect, realtime/메시지 훅 연결
│           ├── ChatHeader.tsx         # 채팅방 헤더(상대 정보, 나가기 메뉴)
│           ├── MessageList.tsx        # 메시지 리스트 렌더링, "1"(안읽음) 표시 담당
│           ├── ChatInput.tsx          # 메시지 입력창
│           ├── PaymentCard.tsx        # 채팅 내 안전결제 카드 메시지
│           ├── PaymentRequestModal.tsx# 안전결제 요청 모달
│           ├── ReviewBanner.tsx       # 거래 완료 후 리뷰 작성 유도 배너
│           ├── ReviewModal.tsx        # 리뷰 작성 모달
│           ├── actions.ts             # 서버 액션 — 메시지 전송, 채팅 생성, markChatReadAction 등
│           ├── leaveChatAction.ts     # 서버 액션 — 채팅방 나가기
│           ├── paymentActions.ts      # 서버 액션 — 결제 요청/확정/취소, 리뷰 작성
│           └── toggleReserveAction.ts # 서버 액션 — 중고거래 예약 상태 토글
│
├── hooks/chat/
│   ├── useChatMessages.ts       # 메시지 상태, 페이지네이션, 채팅방 진입 시 읽음 일괄 처리
│   ├── useChatRoomRealtime.ts   # 채팅방 realtime 구독(INSERT/UPDATE) + presence(접속 여부)
│   ├── useChatListRealtime.ts   # 채팅 목록 realtime 구독(목록 갱신)
│   └── useSpamPrevention.ts     # 연속 전송(도배) 방지 훅
│
├── services/chat/
│   ├── chat.ts                  # 채팅 목록/상세 조회 (서버 전용)
│   ├── message.ts                # 메시지 조회/전송, unread 카운터 증가 (서버 전용)
│   └── postChat.ts               # 게시글 기준 기존 채팅방 탐색
│
└── type/chat/
    ├── chat.ts                  # Chat, ChatWithUsers 타입
    └── message.ts                # Message, MessageWithSender 타입
```

### 핵심 데이터 모델

- `messages.is_read` (boolean, 기본 `false`) — **상대방이 이 메시지를 읽었는지**. 메시지
  버블 옆 "1" 표시는 `isMine && !is_read`일 때만 나타난다.
- `chats.user_id_1_unread` / `user_id_2_unread` (int) — 채팅 목록의 안읽음 배지 카운트.
  메시지 단위 `is_read`와는 별개 컬럼으로, 채팅방 입장/퇴장 시 0으로 초기화된다.

## 2. 지금까지 완성된 기능/작업

### 문제

채팅방에서 메시지를 보낼 때, 내가 보낸 메시지 옆에 표시되는 안읽음 표시 "1"이:

- 상대가 채팅방을 보고 있어 바로 읽는 상황에서도 **잠깐 나타났다 사라지는 깜빡임**이
  발생했고,
- 반대로 상대가 채팅방을 보고 있지 않아 정말 못 읽은 상황에서는 **"1"이 즉시 나타나지
  않고 한 박자 늦게 나타나는** 회귀가 1차 수정에서 새로 발생했다.

### 원인

1. 메시지 전송 시 낙관적(optimistic) 메시지가 `is_read: false`로 즉시 화면에 추가되어
   "1"이 먼저 보인다.
2. 상대가 채팅방을 보고 있으면 상대 클라이언트가 INSERT 실시간 이벤트를 받아 즉시
   `is_read: true`로 갱신하고, 그 UPDATE가 내 화면으로 왕복(수백 ms)해 돌아오면서
   "1"이 사라진다 — 이 왕복 시간 동안 "1"이 깜빡인다.
3. 상대가 지금 채팅방을 보고 있는지 여부를 알 방법이 없어, 단순히 "메시지가 막 보낸
   것이면 무조건 N초 기다렸다 표시"하는 방식으로는 두 요구사항(깜빡임 제거 / 못 읽었을
   때 즉시 표시)을 동시에 만족시킬 수 없었다.

### 해결 — Supabase Realtime Presence 도입

상대가 **지금 채팅방을 보고 있는지**를 실시간으로 정확히 판단하도록 Presence를 추가했다.

- `useChatRoomRealtime.ts`: 기존에 구독 중이던 `chat-room-${chatId}` 채널에 presence를
  추가. 본인 접속 시 `channel.track(...)`으로 존재를 알리고, `presence` `sync` 이벤트로
  `channel.presenceState()`에 상대방 id가 있는지 확인해 `partnerOnline` 상태를 계산,
  훅이 `{ partnerOnline }`을 반환하도록 변경.
- `ChatRoomClient.tsx`: `partnerOnline`을 받아 `MessageList`에 prop으로 전달.
- `MessageList.tsx`: "1" 렌더링을 `UnreadMark` 컴포넌트로 분리해 `partnerOnline`에 따라
  분기:
  - 상대가 **오프라인**(못 보고 있음) → "1"을 **즉시** 표시.
  - 상대가 **온라인**(보고 있음) → 실제 읽음 처리가 도착할 시간(약 1초)만큼 표시를
    지연. 그 사이 진짜 `is_read: true`가 오면 컴포넌트가 언마운트되어 "1"이 한 번도
    보이지 않음(깜빡임 제거).

기존 메시지 읽음 처리 로직(`useChatMessages.ts`의 채팅방 진입 시 일괄 읽음 처리,
`actions.ts`의 `markChatReadAction`, 채팅 목록 unread 카운터 등)은 변경하지 않았다 —
이번 작업은 표시(presentation) 타이밍 문제만 다룬다.

### 검증 완료 항목

- `npx eslint` 통과 (React 19 `react-hooks/purity`, `react-hooks/set-state-in-effect`
  규칙 위반 없음 — 시간 계산을 렌더 본문이 아닌 `useEffect`에서 수행, `setState`는
  항상 비동기 콜백(`setTimeout`) 안에서만 호출).
- `npx tsc --noEmit` 통과.
