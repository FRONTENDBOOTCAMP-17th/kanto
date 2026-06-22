# 20260618 — 채팅 버그 수정 2건

## 담당자 : 김도혁

## 1. 증상

실시간 채팅 중 대화방 모달을 닫거나 목록으로 돌아가는 버튼을 눌렀을 때, 채팅 목록의 읽지 않은 메시지 배지(숫자)가 사라지지 않는다.  
브라우저를 새로고침해도 배지가 그대로 남아 있다.

---

## 2. 원인 분석

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/services/chat/message.ts` | `postMessage()` — 메시지 전송 및 unread 카운터 증가 |
| `src/components/common/chat/chatPanel/room/actions.ts` | `markChatReadAction()` — unread 카운터 0으로 초기화 |
| `src/components/common/chat/chatPanel/room/ChatRoomClient.tsx` | 채팅방 클라이언트 컴포넌트 |
| `src/components/common/chat/FloatingChatWidget.tsx` | 플로팅 채팅 위젯 (목록 ↔ 채팅방 뷰 전환) |
| `src/hooks/chat/useChatListRealtime.ts` | 채팅 목록 실시간 구독 및 상태 업데이트 |

### 버그 흐름

```
1. User A가 채팅방 진입
   → useEffect에서 markChatReadAction(chatId) 호출
   → DB: chats.user_id_A_unread = 0

2. User B가 메시지 전송
   → postMessage() 실행 (server action)
   → DB: chats.user_id_A_unread += 1  ← 증가

3. User A는 채팅방에서 해당 메시지를 실시간으로 확인
   → useChatRoomRealtime이 messages.is_read = true 처리 (messages 테이블)
   → 그러나 chats.user_id_A_unread 는 여전히 1 (리셋 안 됨)

4. User A가 뒤로가기 / 모달 닫기
   → DB: chats.user_id_A_unread = 1 그대로
   → 브라우저 새로고침 시에도 DB 값 그대로이므로 배지 유지
```

### 핵심

`markChatReadAction`은 마운트 시 **딱 한 번**만 호출된다.  
그 이후 대화 중 새 메시지가 올 때마다 `postMessage()`가 수신자의 unread 카운터를 +1 증가시키지만, 채팅방에 머무는 동안에는 이를 리셋하는 로직이 없다.

---

## 3. 수정 내용

### 수정 1 — `ChatRoomClient.tsx` : 언마운트 시 unread 리셋

채팅방에서 나갈 때(컴포넌트 언마운트) `markChatReadAction`을 다시 호출해 대화 중 쌓인 unread 카운터를 DB에서 0으로 초기화한다.

```tsx
// 수정 전
useEffect(() => {
  markChatReadAction(chatId);
}, [chatId]);

// 수정 후
useEffect(() => {
  markChatReadAction(chatId);
  return () => {
    markChatReadAction(chatId);  // 나갈 때도 리셋
  };
}, [chatId]);
```

### 수정 2 — `FloatingChatWidget.tsx` : 뒤로가기 시 낙관적 업데이트

서버 액션 완료 → DB 업데이트 → Supabase Realtime 이벤트 → 상태 반영까지 수백 ms~수 초 딜레이가 있다.  
`onBack` 호출 시점에 로컬 `chats` 상태를 즉시 업데이트해 배지가 바로 사라지도록 한다.

```tsx
// 수정 전
onBack={() => setView("list")}

// 수정 후
onBack={() => {
  setChats((prev) =>
    prev.map((c) => {
      if (c.id !== selectedChatId) return c;
      return {
        ...c,
        user_id_1_unread: c.user_id_1 === currentUserId ? 0 : c.user_id_1_unread,
        user_id_2_unread: c.user_id_2 === currentUserId ? 0 : c.user_id_2_unread,
      };
    })
  );
  setView("list");
}}
```

---

## 4. 수정 후 동작

| 시나리오 | 수정 전 | 수정 후 |
|---------|--------|--------|
| 대화 중 뒤로가기 | 배지 남아 있음 (DB도 unread > 0) | 배지 즉시 사라짐 (낙관적 업데이트) + DB도 0으로 동기화 |
| 뒤로가기 후 새로고침 | 배지 여전히 표시 | 배지 없음 (DB unread = 0) |
| 모달 닫기 | 동일 버그 | 동일하게 해결 |

---

# 버그 2 — 메시지 없이 빈 채팅방이 목록에 생성되는 문제

## 1. 증상

"채팅하기" 버튼을 클릭하기만 해도 채팅 목록에 채팅방이 생성된다.  
메시지를 한 건도 주고받지 않아도 목록에 빈 채팅방이 남는다.

---

## 2. 원인 분석

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/services/chat/postChat.ts` | 채팅방 조회/생성 서비스 |
| `src/components/common/chat/FloatingChatWidget.tsx` | 채팅 위젯 — pendingChatId 구독 및 채팅 목록 상태 관리 |
| `src/app/(user)/usedgoods/[id]/_components/UsedGoodsDetail.tsx` | "채팅하기" 버튼 (중고거래) |
| `src/app/(user)/job/[id]/_components/JobAuthorInfo.tsx` | "채팅하기" 버튼 (구인구직) |
| `src/app/(user)/rental/[id]/_components/RentSellerInfo.tsx` | "채팅하기" 버튼 (임대) |

### 버그 흐름

```
1. 사용자가 "채팅하기" 클릭
   → postChat(userId, sellerId, postId) 호출

2. postChat() 내부
   → DB 조회: 기존 채팅방 없음
   → supabase.from("chats").insert(...)  ← 메시지 없이 즉시 DB INSERT

3. chatId 반환 → openWidget(chatId) 호출
   → FloatingChatWidget에서 /api/chat/list fetch
   → 빈 채팅방이 목록에 포함된 상태로 setChats()

4. useChatListRealtime의 INSERT 이벤트도 발동
   → 목록 중복 갱신
```

### 핵심

`postChat.ts`가 "채팅하기" 버튼 클릭 시점에 **메시지 전송 여부와 무관하게** `chats` 테이블에 row를 INSERT했다.  
채팅방 생성 시점이 "버튼 클릭"이 아닌 "**첫 메시지 전송**"이어야 한다.

---

## 3. 수정 내용

### 핵심 전략: "버튼 클릭 = 채팅방 열기"와 "첫 메시지 전송 = DB 생성" 분리

### 수정 1 — `postChat.ts` : INSERT 제거, 조회 전용으로 변경

```ts
// 수정 전: 기존 채팅 없으면 INSERT
const { data, error } = await supabase.from("chats").insert({ ... }).select("id").single();

// 수정 후: 조회만, 없으면 null 반환
export default async function findChat(...): Promise<number | null> {
  const { data: existing } = await supabase.from("chats").select("id")...maybeSingle();
  return existing?.id ?? null;
}
```

### 수정 2 — `chatStore.ts` : `PendingNewChat` 상태 추가

기존 채팅방이 없을 때 채팅방 UI를 열기 위한 메타데이터를 스토어에 저장한다.

```ts
export interface PendingNewChat {
  buyerId: number;
  sellerId: number;
  postId: number;
  postTitle: string;
  postPrice: number | null;
  partner: SellerInfo;
}
// openNewChat(meta) / clearNewChat() 액션 추가
```

### 수정 3 — 3개 product detail 컴포넌트 : handleChat 분기 처리

```ts
// 수정 후
const chatId = await findChat(userId, partner.id, postId);
if (chatId !== null) {
  useChatStore.getState().openWidget(chatId);   // 기존 채팅방 → 바로 열기
} else {
  useChatStore.getState().openNewChat({ ... }); // 신규 채팅 → 메타 저장
}
```

### 수정 4 — `FloatingChatWidget.tsx` : `pendingNewChat` 구독 추가

```ts
if (state.pendingNewChat && state.pendingNewChat !== prev.pendingNewChat) {
  setIsOpen(true);
  setView("room");
  setSelectedChatId(null);          // chatId 없는 상태로 채팅방 오픈
  setPendingNewChatMeta(state.pendingNewChat);
  useChatStore.getState().clearNewChat();
}
```

### 수정 5 — `ChatRoom.tsx` : null chatId 처리

```ts
// chatId === null이면 API fetch 생략, 메타데이터로 직접 구성
if (chatId === null) {
  setData({
    messages: [],
    currentUser: currentUserOverride,
    chatId: null,
    postId: newChatMeta.postId,
    partner: newChatMeta.partner,
    ...
  });
  return;
}
```

### 수정 6 — `actions.ts` : `createChatAndSendAction` 추가

첫 메시지 전송 시 채팅방 생성 + 메시지 전송을 원자적으로 처리한다.  
레이스 컨디션 방어를 위해 INSERT 전 기존 채팅방 재확인 로직 포함.

```ts
export async function createChatAndSendAction({ partnerUserId, postId, content }) {
  // 1. 기존 채팅방 재확인 (레이스 컨디션 방어)
  // 2. 없으면 chats INSERT
  // 3. postMessage() 호출
  // 4. { chatId, message } 반환
}
```

### 수정 7 — `ChatRoomClient.tsx` : 첫 메시지 전송 시 채팅방 생성

```ts
// activeChatId가 null인 경우 (신규 채팅)
const { chatId: newChatId, message: saved } = await createChatAndSendAction({
  partnerUserId: partner.id,
  postId,
  content,
});
setActiveChatId(newChatId);
onChatCreated?.(newChatId);  // FloatingChatWidget에 실제 chatId 전달
```

### 수정 8 — `useChatMessages` / `useChatRoomRealtime` : `chatId: number | null` 허용

chatId가 null인 동안 Supabase 구독과 메시지 읽음 처리를 skip하도록 null 가드 추가.

---

## 4. 수정 후 동작

| 시나리오 | 수정 전 | 수정 후 |
|---------|--------|--------|
| "채팅하기" 클릭 후 메시지 미전송 | DB에 빈 채팅방 생성, 목록에 표시 | DB 변경 없음, 목록에 미표시 |
| "채팅하기" 클릭 후 첫 메시지 전송 | 버튼 클릭 시점에 이미 채팅방 존재 | 전송 시점에 채팅방 생성 + 메시지 저장 |
| 기존 채팅방 재진입 | 동일 (기존 동작 유지) | 동일 (기존 동작 유지) |

---

*작성일: 2026-06-18 | 담당: 도혁*
