# 채팅 알림 중복/누적 버그 수정 — 작업 정리

브랜치: `bug/chat-notification-dedupe`
작성: `THLIMM`

## 1. 작업 개요

채팅 메시지가 쌓일 때마다 알림(`common_notifications`)이 **계속 새로 INSERT** 되어, 한 채팅방에서
안 읽은 메시지가 여러 개면 알림 목록에 같은 채팅방 알림이 여러 줄로 누적되는 문제와, 상대가
**채팅방을 보고 있는 중에도** 알림이 발송되는 문제가 있었다. 이를 해결하기 위해 (1) 채팅당
알림 1개로 합치는(dedupe) 트리거 로직과 (2) 상대의 "현재 이 채팅방을 보고 있는지(presence)"
플래그를 도입했다.

## 2. 현재 폴더 구조 및 각 파일의 역할

이번 작업으로 수정/추가된 파일만 정리한다.

```
supabase/migrations/
└── 20260618083928_chat_notification_dedupe.sql
    ├── chats.user_id_1_active / user_id_2_active 컬럼 추가
    │     — 각 사용자가 "지금 이 채팅방 화면을 보고 있는지" 여부
    ├── set_chat_active(p_chat_id, p_user_id, p_active) RPC (security definer)
    │     — RLS 우회 없이 본인 슬롯(user_id_1/2)만 갱신하도록 제한
    └── notify_on_new_message() 트리거 함수 교체 (옛 notify_on_message() 삭제)
          — type='system' 메시지는 알림 생성 skip
          — 수신자가 현재 active(열람중)면 알림 생성 skip
          — 같은 채팅방(related_id) + is_read=false 인 미확인 알림이 있으면
            INSERT 대신 UPDATE(title/body/created_at/is_read 갱신) → 채팅당 알림 1개로 유지

src/
├── hooks/chat/
│   └── useChatRoomRealtime.ts
│         — 채팅방 구독 SUBSCRIBED 시 set_chat_active(active=true) 호출
│         — 채팅방 이탈(cleanup) 및 pagehide(탭 닫기 등 비정상 종료) 이벤트에서
│           set_chat_active(active=false) 호출
│         — 알림 채널 구독 키를 `notifications:${userId}:${Date.now()}` →
│           `notifications:${userId}`로 변경 (재구독 시 채널명이 매번 달라져
│           이전 구독이 정리되지 않고 중복 구독되던 문제 방지)
├── hooks/useNotifications.ts
│   ├── postgres_changes UPDATE 이벤트 구독 추가
│   │     — 트리거가 기존 알림 행을 UPDATE 하는 경우(dedupe)에도 클라이언트
│   │       알림 목록이 실시간으로 갱신되도록 처리 (기존엔 INSERT만 구독)
│   └── 채널명에 useId() 기반 인스턴스 id 추가 (`notifications:${userId}:${instanceId}`)
│         — 헤더 알림벨(NotificationBell)과 /notifications 페이지가 동시에
│           이 훅을 호출하면서 고정된 `notifications:${userId}` 채널명이
│           두 인스턴스 간 충돌해 "cannot add postgres_changes callbacks after
│           subscribe()" 런타임 에러 발생 → 인스턴스별 고유 suffix로 해결
└── type/supabase.ts
      — chats.user_id_1_active/user_id_2_active, set_chat_active RPC 타입 반영
        (Supabase CLI로 자동 생성된 타입 갱신분)

supabase/migrations/
└── 20260618100438_system_message_notification.sql
      — notify_on_new_message() 교체: system 메시지의 알림 skip 로직 제거,
        system 메시지는 title = 메시지 content(시스템 문구 그대로) 사용,
        일반 메시지는 기존대로 발신자명 사용. dedupe·presence skip 로직은 유지

src/components/common/header/
└── NotificationItem.tsx
      — body가 없을 때도 body 줄이 한 줄 높이를 유지하도록 수정(`n.body || " "`)
        → 헤더 드롭다운/알림 페이지 모두에서 항목 높이 통일
```

## 3. 지금까지 완성된 기능/작업

- [x] `chats` 테이블에 presence 플래그(`user_id_1_active`, `user_id_2_active`) 추가
- [x] `set_chat_active` RPC 추가 — 본인 슬롯만 갱신 가능하도록 제한
- [x] 채팅방 입장/이탈 시 presence 플래그 toggle (`useChatRoomRealtime.ts`)
  - 정상 이탈(컴포넌트 unmount) + 비정상 종료(`pagehide`) 모두 커버
- [x] 알림 트리거 교체: system 메시지 skip + 열람중(active) 수신자 skip + 같은 채팅방
      미확인 알림 UPDATE로 합치는 dedupe 로직 적용
- [x] 알림 realtime 채널명을 고정값으로 변경해 재구독 누수/중복 구독 방지
- [x] `useNotifications.ts`에 UPDATE 이벤트 구독 추가 (dedupe로 갱신되는 알림도
      클라이언트에 즉시 반영)
- [x] `src/type/supabase.ts` 타입 갱신
- [x] **알림 높이 통일** — `NotificationItem.tsx`에서 `body`가 없어도 본문 줄이
      한 줄 높이를 차지하도록 수정(`n.body || " "`). 제목(1줄) + 본문(1줄) + 시간(1줄)
      구조를 모든 알림이 동일하게 가져 헤더 드롭다운/알림 페이지 항목 높이가 통일됨
- [x] **시스템 메시지 알림 발송** — `20260618100438_system_message_notification.sql`
      마이그레이션으로 `notify_on_new_message()` 교체. system 메시지도 알림을 보내며,
      title은 발신자명 대신 메시지 content(시스템 문구) 그대로 사용. presence(열람중)
      skip과 dedupe(채팅당 1개) 로직은 동일하게 적용됨. 공유 DB에는 Supabase Studio
      SQL Editor에서 직접 실행해 반영(로컬 `supabase db push`는 기존에 git에 누락된
      과거 마이그레이션 다수로 인해 원격과 히스토리가 어긋나 있어 보류 — 이번 작업과
      무관한 별도 인프라 이슈)
- [x] **알림 채널 충돌 버그 수정** — 위 작업 검증 중 `/notifications` 페이지 접근 시
      "cannot add postgres_changes callbacks for realtime:notifications:... after
      subscribe()" 런타임 에러 발견. 헤더 `NotificationBell`과 알림 페이지가 동시에
      `useNotifications()`를 호출하는데, 채널명이 `notifications:${userId}`로 고정돼
      있어 두 인스턴스가 같은 채널을 공유하려다 충돌. `useId()`로 인스턴스별 고유
      suffix를 붙여(`notifications:${userId}:${instanceId}`) 해결 — 동일 인스턴스
      재구독 시에는 안정적(누수 방지 유지), 인스턴스 간에는 채널이 분리됨

## 4. 남은 작업

없음. 문서 작성 시점 기준 dedupe/presence 로직과 알림 표시(UI/문구) 개선 모두 완료.
실 사용 검증(거래 진행 시 시스템 메시지 알림 동작, 알림 페이지 높이 등)은 사용자가
직접 확인 중.
