# 20260619 — 채팅 위젯 배경 스크롤(scroll chaining) 버그 수정

## 담당자 : 임태형

---

## 1. 버그 개요

### 증상

플로팅 채팅 위젯(`FloatingChatWidget`)이 열려 있을 때, 위젯 위에 마우스를 올리고 휠을 굴리면(또는 클릭 후 스크롤하면) **위젯이 아니라 뒷배경 페이지가 같이 스크롤**되는 문제.

- 채팅 목록 / 메시지 목록을 끝(맨 위 또는 맨 아래)까지 스크롤한 뒤 계속 휠을 굴리면 배경이 움직임
- 헤더, 검색창, 입력창처럼 스크롤이 없는 영역 위에서 휠을 굴려도 배경이 움직임
- 내용이 짧아 스크롤 자체가 없는 목록 위에서도 배경이 움직임

### 원인

| 파일                                   | 문제                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `FloatingChatWidget.tsx:50-59`         | 모바일(`< 768px`)에서만 `document.body.style.overflow = "hidden"` 처리. 데스크탑(위젯이 우하단에 떠 있는 패널 형태)에는 아무 차단 로직이 없음 |
| `chatPanel/ChatList.tsx:43`            | 스크롤 컨테이너에 `overflow-y-auto`만 있고 스크롤 경계 도달 시 이벤트 전파를 막는 처리 없음                                                   |
| `chatPanel/room/MessageList.tsx:47-50` | 위와 동일                                                                                                                                     |

`document.body.style.overflow = "hidden"`는 **body 자체의 스크롤**만 막을 뿐, 위젯 내부 스크롤 영역에서 발생한 wheel 이벤트가 경계(맨 위/아래)에 도달했을 때 부모로 전파되는 "스크롤 체이닝" 현상은 막지 못한다. 데스크탑에서는 이 처리조차 없었기 때문에 위젯 위 모든 영역에서 배경이 스크롤됐다.

### 수정 내용

CSS `overscroll-behavior: contain` + 위젯 루트에 등록한 non-passive `wheel` 이벤트 핸들러를 결합해서 해결했다.

1. **`ChatList.tsx`**, **`MessageList.tsx`** — 스크롤 컨테이너에 `overscroll-contain` 클래스와 식별용 `data-chat-scroll` 속성 추가.
2. **`FloatingChatWidget.tsx`** — 위젯 패널 div에 `ref`를 연결하고, 위젯이 열려 있는 동안(`isOpen`) `wheel` 이벤트를 `{ passive: false }`로 직접 등록:
   - 이벤트 발생 지점이 `[data-chat-scroll]` 영역이고 아직 스크롤할 여지가 있으면 → 정상 스크롤 허용 (`return`)
   - 스크롤 경계(맨 위/맨 아래)에 도달했거나, 헤더·입력창처럼 스크롤 영역이 아닌 곳이면 → `e.preventDefault()`로 배경 전파를 완전히 차단

> React의 `onWheel` prop은 브라우저 레벨에서 passive 리스너로 등록되어 `preventDefault()`가 동작하지 않는다. 그래서 `ref` + `addEventListener("wheel", handler, { passive: false })` 방식으로 직접 등록해야 한다.

기존 모바일 body-lock(`document.body.style.overflow`) 로직은 그대로 유지. 모바일은 위젯이 풀스크린(`fixed inset-0`)으로 떠서 배경이 보이지 않으므로 기존 처리로 충분하고, 새 wheel 핸들러가 데스크탑/모바일 모두를 안전하게 보완한다.

---

## 2. 현재 폴더 구조 및 각 파일의 역할

```
src/components/common/chat/
├── FloatingChatWidget.tsx        # 전역 플로팅 위젯 컨테이너. list/room 뷰 전환, 열림 상태,
│                                  # 채팅 목록(chats) 상태, unread 합계 계산, 모바일 body-scroll-lock,
│                                  # (신규) 데스크탑 포함 전체 배경 스크롤 체이닝 차단 담당
├── ChatBubbleButton.tsx          # 우하단 원형 토글 버튼. 안 읽은 메시지 수(unreadCount) 배지 표시
└── chatPanel/
    ├── ChatList.tsx              # 채팅 목록 뷰. 검색창 + 채팅방 리스트, 내부 스크롤 영역 보유
    ├── ChatListItem.tsx          # 채팅 목록의 개별 항목(상대방 정보, 마지막 메시지, unread 배지, 시간)
    └── room/
        ├── ChatRoom.tsx          # 채팅방 데이터 로더. chatId 또는 newChatMeta로 초기 메시지/상대방
        │                          # 정보를 fetch해서 ChatRoomClient에 전달하는 서버 데이터 게이트웨이 역할
        ├── ChatRoomClient.tsx    # 채팅방 오케스트레이터. 훅(useSpamPrevention/useChatMessages/
        │                          # useChatRoomRealtime)에서 상태·로직을 받아 하위 UI 컴포넌트에 전달
        ├── ChatHeader.tsx        # 채팅방 헤더. 상대방 정보, 뒤로가기, 더보기 메뉴(신고/차단/나가기)
        ├── MessageList.tsx       # 메시지 목록 UI. 날짜 구분선, 이전 메시지 더 불러오기, 결제 카드 렌더링,
        │                          # (신규) overscroll-contain + data-chat-scroll 마커 보유
        ├── ChatInput.tsx         # 메시지 입력창. Enter 전송, 도배 방지 쿨다운 표시
        ├── PaymentCard.tsx       # 메시지 내 결제 요청/완료 카드 UI
        ├── PaymentRequestModal.tsx # 결제(거래) 요청 모달
        ├── ReviewBanner.tsx      # 거래 완료 후 리뷰 작성 유도 배너
        ├── ReviewModal.tsx       # 리뷰 작성 모달
        ├── actions.ts            # Server Actions: 메시지 전송/조회, 채팅방 생성+첫메시지 전송,
        │                          # 읽음 처리(markChatReadAction), 차단 여부 확인
        ├── blockUserAction.ts    # Server Action: 사용자 차단 처리
        ├── leaveChatAction.ts    # Server Action: 채팅방 나가기
        ├── paymentActions.ts     # Server Action: 채팅방 결제/거래 배너 상태 조회
        └── toggleReserveAction.ts # Server Action: 거래 예약 상태 토글
```

관련 외부 모듈 (참고, 이번 작업 대상 아님):

- `src/hooks/chat/` — `useChatListRealtime`, `useChatRoomRealtime`, `useChatMessages`, `useSpamPrevention`
- `src/store/chatStore.ts` — 위젯 열기/닫기, unreadCount, pendingChatId, pendingNewChat 전역 상태
- `docs/chat-system.md` — 채팅 시스템 전체 설계 문서 (DB 스키마, Realtime, 페이지네이션 등)

---

## 3. 지금까지 완성된 기능/작업

- 플로팅 채팅 위젯 열기/닫기, 목록 ↔ 채팅방 뷰 전환
- 채팅 목록: 검색, 안 읽은 메시지 배지, 마지막 메시지/시간 표시
- 채팅방: 메시지 실시간 송수신, 날짜 구분선, 이전 메시지 페이지네이션, 도배 방지(3초/5회 → 10초 쿨다운)
- 신규 채팅(채팅방 미생성 상태) 진입 → 첫 메시지 전송 시점에 채팅방 생성
- 거래(결제) 요청/완료 카드, 거래 예약 토글, 리뷰 작성 배너 및 모달
- 상대방 신고 / 차단 / 채팅방 나가기
- 안 읽은 메시지 카운트 동기화 버그 수정 (`docs/20260618-chat-unread-bug-도혁.md`)
- 빈 채팅방 생성 방지 — "채팅하기" 클릭과 채팅방 DB 생성 시점 분리 (`docs/20260618-chat-unread-bug-도혁.md`)
- **채팅 위젯 배경 스크롤 체이닝 버그 수정 (본 문서)** — `ChatList`/`MessageList`에 `overscroll-contain` 적용, `FloatingChatWidget`에 non-passive wheel 핸들러로 배경 스크롤 완전 차단

---
