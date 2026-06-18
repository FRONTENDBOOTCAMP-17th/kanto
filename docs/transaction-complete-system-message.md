# 거래 진행 알림 시스템 메시지 자동 발송 - THLIMM

> [xendit-payment-escrow.md](./xendit-payment-escrow.md) "앞으로 남은 작업" 항목 중 **거래완료 알림 메시지 자동 발송**을 구현한 작업 문서.

## 1. 작업 개요

기존에는 결제 상태(`paid`/`released`)가 바뀌어도 채팅 내 변화는 **결제 카드(PaymentCard) 자체의 문구/버튼이 바뀌는 것**뿐이었다. 대화가 이어지면 카드가 위로 밀려 올라가, 구매자/판매자가 "결제 완료" "거래 완료" 같은 상태 전환을 놓치는 문제가 있었다.

이를 해소하기 위해, 거래 상태가 바뀌는 시점(`paid`, `released`)에 **채팅창 하단에 가운데 정렬된 시스템 메시지를 자동으로 한 줄 삽입**하도록 했다.

- `status → paid` 시: `"결제가 완료되었습니다 · 상품 수령 후 결제 카드에서 '수령 확인'을 눌러주세요"`
- `status → released` 시: `"거래가 완료되었습니다"`
- 시스템 메시지는 `messages.type = 'system'`으로 구분하며, 일반 텍스트/결제 카드 메시지와 달리 발신자 말풍선이 아닌 **가운데 정렬 배지(pill)** 형태로 렌더링한다.
- `paid` 전환은 **webhook**과 **return 페이지 폴백** 두 경로 모두에서 발생할 수 있으므로, 두 곳 모두에서 동일한 메시지를 발송한다(트랜잭션이 이미 `paid`/`released`로 멱등 처리되어 있어 중복 전환 자체는 방지되지만, 두 경로가 거의 동시에 실행되면 메시지가 중복 삽입될 가능성은 테스트 범위에서 허용).

```
[Xendit webhook] status=PAID  ─┐
                                ├→ updateTransaction(status: "paid")  → postSystemMessage("결제가 완료되었습니다 ...")
[return 페이지 폴백 재조회]    ─┘   (먼저 처리된 쪽만 동작, 멱등)

[구매자] "수령 확인" 클릭
   → updateTransaction(status: "released") → postSystemMessage("거래가 완료되었습니다")

[실시간] messages INSERT(type=system) 구독
   → 양쪽 채팅창에 가운데 정렬 배지로 즉시 표시
```

---

## 2. 현재 폴더 구조 및 각 파일 역할

이번 작업으로 수정된 파일만 표시(에스크로 결제 전체 구조는 [xendit-payment-escrow.md](./xendit-payment-escrow.md) 참고).

```
src/
├── services/payment/
│   └── transaction.ts                      # postSystemMessage() 추가
│                                            #   - supabaseAdmin(service-role)으로 messages에 type='system' 행 insert
│                                            #     (webhook은 로그인 세션이 없으므로 admin 클라이언트 필수)
│                                            #   - chats.last_message_at/last_message_content, 상대방 unread count 갱신
│                                            #     (postMessage의 채팅목록 갱신 패턴과 동일하게 맞춤)
├── components/common/chat/chatPanel/room/
│   ├── paymentActions.ts                   # confirmReceiptAction 수정
│   │                                        #   - updateTransaction(released) 후 postSystemMessage("거래가 완료되었습니다") 호출
│   └── MessageList.tsx                     # 메시지 렌더링 분기 추가
│                                            #   - msg.type === "system" 이면 좌/우 말풍선 대신
│                                            #     가운데 정렬 pill(rounded-full, 회색 배경)로 렌더링
├── hooks/chat/
│   └── useChatRoomRealtime.ts              # realtime INSERT 핸들러에 system 분기 추가
│                                            #   - 기존 로직은 "내가 보낸 메시지는 낙관적 업데이트로 이미 화면에 있으니
│                                            #     realtime 수신은 skip" 방식인데, 시스템 메시지는 클라이언트가
│                                            #     낙관적으로 미리 넣어둔 적이 없으므로 이 skip 로직을 우회해
│                                            #     보낸 사람/받는 사람 양쪽 모두에게 즉시 반영되도록 처리
│                                            #   - sender_id 가 buyer_id 이므로 sender 필드는
│                                            #     currentUser/partner 중 일치하는 쪽으로 채워줌
├── app/
│   ├── api/payment/xendit/webhook/route.ts # PAID/SETTLED 전환 시 postSystemMessage(PAID_MESSAGE) 호출
│   └── (user)/payment/return/page.tsx      # 인보이스 재조회로 paid 갱신 시 동일하게 postSystemMessage 호출
│                                            #   (webhook 미수신 환경에서의 폴백 경로)

docs/
└── transaction-complete-system-message.md  # 본 문서
```

### 변경 없는 의존 구조 (참고)

- `messages.type` 컬럼은 기존에 `'text' | 'payment'` 두 값만 쓰였고 DB 레벨 enum 제약은 없는 `text default 'text'` 컬럼이므로, `'system'` 값 추가에 스키마 변경이 필요 없었다.
- `MessageWithSender`(`src/type/chat/message.ts`) 타입도 변경 없이 그대로 사용 — 시스템 메시지는 `transaction: null`로 채워 보낸다.

---

## 3. 완성된 기능

- [x] `postSystemMessage()` 서비스 함수 추가 (서버 전용, service-role)
- [x] webhook 경로(`paid` 전환) 시 시스템 메시지 발송
- [x] return 페이지 폴백 경로(`paid` 전환) 시 동일 메시지 발송
- [x] 수령확인(`released` 전환) 시 시스템 메시지 발송
- [x] `MessageList`에 시스템 메시지용 가운데 정렬 UI 분기 추가
- [x] 실시간 구독에서 시스템 메시지를 양쪽 모두에게 즉시 반영하도록 skip-own 로직 우회

---

## 4. 트러블슈팅 — `permission denied for table messages`

구현 직후 테스트에서, 구매자가 수령 확인을 누르면 결제 카드에 "거래 완료"와 함께 `permission denied for table messages` 에러가 뜨고 가운데 배지가 보이지 않는 문제가 있었다.

- **원인:** `postSystemMessage()`는 `supabaseAdmin`(service-role)으로 `messages`에 insert 하는데, 해당 DB에서 `service_role` 역할에 **`messages` 테이블 권한이 부여돼 있지 않았다**(`transactions`에는 있었음). 그래서 `transactions` 갱신은 성공해 카드만 "거래 완료"로 바뀌고, 뒤이은 메시지 insert가 실패해 배지가 생성되지 않았다. (일반 채팅은 `authenticated` 역할로 insert 하므로 영향 없었음.)
- **수정:** Supabase에서 `service_role`에 `messages` 권한을 부여해 해결.
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO service_role;
  ```
- **보강:** 시스템 메시지 발송은 부가 UX이므로, 발송이 실패하더라도 거래 상태 전환(수령 확인/결제 완료 표시) 자체가 깨지지 않도록 `confirmReceiptAction` / webhook / return 페이지의 발송 호출을 `try/catch`로 감쌌다.

---

## 5. 남은 작업 / 주의사항

- [ ] webhook과 return 페이지가 거의 동시에 실행되는 드문 경쟁 상태에서 시스템 메시지가 중복 삽입될 수 있음 — 현재는 허용 범위로 두고 별도 멱등 가드는 추가하지 않음
- [ ] E2E 실결제 테스트로 두 경로(webhook 실등록 / return 폴백) 모두에서 메시지가 정상 발송되는지 확인 필요
- [ ] [xendit-payment-escrow.md](./xendit-payment-escrow.md)의 "거래완료 후 채팅 내 후기 작성" 항목은 이번 작업 범위에 포함되지 않음
