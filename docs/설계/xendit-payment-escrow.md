# Xendit 안전결제(에스크로) 연동 문서 - THLIMM

## 1. 작업 개요

중고거래는 채팅으로 협의 후 진행되는 구조이므로, **판매자가 채팅 안에서 안전결제를 요청**하면 **구매자가 결제 카드를 눌러 Xendit(필리핀 결제 서비스) 결제 페이지로 이동**해 결제하고, **상품 수령 확인 후 정산되는 에스크로 흐름**을 구현했다.

- 통화: PHP(₱)
- 결제 라이프사이클: `pending(요청)` → `paid(에스크로 보관)` → `released(수령확인·정산완료)`, 그 외 `cancelled`(취소) / `expired`(만료)
- 테스트 모드 기준이라 **실제 자금 보관·판매자 정산(disbursement)은 구현하지 않고 상태값으로만 시뮬레이션**한다.
- 결제 요청은 모든 중고거래 채팅에서 가능하며, 기존 `used_goods.safe_payment` 체크박스는 상품 상세페이지 표시용으로만 유지된다(이번 기능과 별개).

```
[판매자] 채팅에서 "안전결제 요청하기"(금액 입력, 기본값 = 등록가)
   → transactions(status=pending) 생성 + 채팅에 결제요청 카드 메시지 삽입
[구매자] 카드의 "안전결제 진행하기" 클릭
   → Xendit Invoice 생성 → invoice_url 로 리다이렉트 → Xendit 결제 페이지
[Xendit] 결제완료 → webhook 또는 return 페이지 검증으로 status=paid (에스크로 보관)
[구매자] 상품 수령 후 카드의 "수령 확인" 클릭
   → status=released (거래 완료, 판매자 정산은 시뮬레이션)
취소: pending 상태에서 구매자/판매자 모두 취소 가능 → status=cancelled
```

결제 카드는 메시지 목록 안에서 **거래의 현재 status × 보는 사람의 역할(구매자/판매자)** 에 따라 다른 문구/버튼을 보여준다.

---

## 2. 현재 폴더 구조 및 각 파일 역할

```
src/
├── lib/
│   └── xendit.ts                          # Xendit Invoice API 헬퍼 (서버 전용, Secret Key Basic 인증)
│                                           #   createInvoice(): 인보이스 생성 / getInvoice(): 상태 조회
├── type/
│   ├── transaction.ts                     # Transaction, TransactionStatus 타입 (supabase.ts 기반)
│   └── chat/message.ts                    # MessageWithSender 에 transaction?, type 필드 추가
├── services/
│   ├── payment/
│   │   └── transaction.ts                 # 거래 CRUD (전부 supabaseAdmin/service-role로 수행)
│   │                                       #   createTransaction / getTransaction /
│   │                                       #   getTransactionByExternalId / updateTransaction
│   └── chat/message.ts                    # MESSAGE_SELECT 에 transaction join 추가, postMessage 에 type/transactionId 지원
├── components/common/chat/chatPanel/room/
│   ├── paymentActions.ts                  # "use server" 결제 관련 서버 액션
│   │                                       #   createPaymentRequestAction: 판매자가 결제 요청(거래 생성 + 카드 메시지)
│   │                                       #   startCheckoutAction: 구매자가 결제 시작(인보이스 생성, URL 반환)
│   │                                       #   confirmReceiptAction: 구매자 수령확인(paid → released)
│   │                                       #   cancelTransactionAction: pending 거래 취소
│   ├── PaymentRequestModal.tsx            # 판매자가 금액을 입력해 결제를 요청하는 모달
│   ├── PaymentCard.tsx                    # 채팅 메시지 영역에 표시되는 결제 카드 (상태×역할별 분기)
│   ├── MessageList.tsx                    # msg.type === "payment" 일 때 PaymentCard 렌더 (기존 텍스트 버블 분기)
│   ├── ChatRoomClient.tsx                 # 판매자에게만 "안전결제 요청하기" 버튼 노출, 모달/카드 상태 연동
│   └── ChatRoom.tsx                       # /api/chat/[id] 응답에서 sellerId, postPrice 를 받아 Client 로 전달
├── hooks/chat/
│   └── useChatRoomRealtime.ts             # messages INSERT 시 결제 메시지면 transaction join 추가 조회,
│                                           #   transactions UPDATE(해당 chat_id) 구독 → 카드 상태 실시간 갱신
├── app/
│   ├── api/
│   │   ├── chat/[id]/route.ts             # 채팅방 초기 데이터에 sellerId(글쓴이), postPrice(중고가) 추가 반환
│   │   └── payment/xendit/webhook/route.ts # Xendit Invoice "paid"/"expired" 콜백 수신 (x-callback-token 검증)
│   └── (user)/payment/return/page.tsx     # 결제 후 success/failure redirect 도착 지점
│                                           #   인보이스 상태 재조회로 webhook 없이도 paid 갱신 보장
└── constants/routes.ts                    # paymentReturn: "/payment/return" 경로 추가

docs/
└── xendit-payment-escrow.md               # 본 문서
```

### DB 스키마 (공유 Supabase DB에 직접 적용 — 레포에 마이그레이션 파일 없음)

| 테이블/타입                  | 내용                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transaction_status` (enum)  | `pending`/`paid`/`released`/`cancelled`/`expired`                                                                                                         |
| `transactions` (신규 테이블) | `id, post_id, chat_id, buyer_id, seller_id, amount, status, external_id(unique), xendit_invoice_id, xendit_invoice_url, created_at, paid_at, released_at` |
| `messages` (컬럼 추가)       | `type text default 'text'` (`'text' \| 'payment'`), `transaction_id bigint null → transactions.id`                                                        |

- `transactions`는 RLS 활성화 + "거래 당사자만 SELECT" 정책. 쓰기(insert/update)는 전부 서버 코드에서 `supabaseAdmin`(service role)으로 수행해 RLS를 우회한다.
- Realtime publication(`supabase_realtime`)에 `transactions` 테이블 추가 — 카드 상태 변화를 양쪽에 실시간 반영하기 위함.
- 스키마는 `supabase db query --linked -f xendit-schema.sql` 로 공유 원격 DB에 직접 적용했고, 적용 후 `npm run gen:types` 로 `src/type/supabase.ts` 를 재생성했다. SQL 파일 자체는 적용 후 삭제(레포에 커밋하지 않음).

### 환경변수 (`.env.local`)

| 키                      | 용도                                                                          |
| ----------------------- | ----------------------------------------------------------------------------- |
| `XENDIT_SECRET_KEY`     | Invoice 생성/조회용 서버 시크릿 키 (Test Mode, Money-in products: Write 권한) |
| `XENDIT_CALLBACK_TOKEN` | webhook 검증용 토큰 (아직 미설정 — webhook 미사용 시 불필요)                  |
| `NEXT_PUBLIC_BASE_URL`  | Invoice의 success/failure redirect URL 구성에 사용 (`http://localhost:3000`)  |

---

## 3. 완성된 기능/작업

- [x] Supabase 공유 DB에 `transactions` 테이블, `transaction_status` enum, `messages.type`/`transaction_id` 컬럼 적용 + 타입 재생성 + Realtime 등록 + RLS 정책
- [x] Xendit Invoice API 연동 (`createInvoice`, `getInvoice`)
- [x] 결제 요청 → 거래 생성 → 채팅에 결제 카드 메시지 삽입 (판매자 권한 검증 포함)
- [x] 구매자 결제 시작 → 인보이스 생성/재사용 → Xendit 결제 페이지 리다이렉트
- [x] 결제완료 처리 이중화: webhook 수신 + return 페이지에서 인보이스 상태 재검증(webhook 없이도 동작)
- [x] 구매자 수령확인 → `released` 전환 (거래 완료)
- [x] `pending` 상태 거래 취소 (구매자/판매자 모두 가능)
- [x] 채팅 UI: 결제요청 버튼(판매자 전용), 금액 입력 모달, 상태×역할별 결제 카드 렌더링
- [x] 실시간 동기화: 결제 메시지 INSERT 시 거래정보 조회, `transactions` UPDATE 구독으로 양쪽 카드 상태 갱신
- [x] 타입체크(`tsc --noEmit`)·lint 신규/수정 파일 기준 통과
- [x] `XENDIT_SECRET_KEY` 발급 및 `.env.local` 반영, dev 서버 정상 기동 확인

---

## 4. 앞으로 남은 작업

- [ ] **E2E 실결제 테스트**: 판매자 요청 → 구매자 결제(Xendit 테스트 결제수단) → return 페이지 → `paid` 반영 → 수령확인 → `released` 전환까지 실제 두 계정으로 끝까지 확인
- [ ] `XENDIT_CALLBACK_TOKEN` 설정 — 로컬은 공개 URL이 없어 webhook 등록이 어려우므로, 필요 시 ngrok/cloudflared 같은 터널을 연결해 webhook 경로까지 테스트하거나, 배포 후 정식 등록
- [ ] (선택) 결제 완료/거래완료 시 상품을 자동으로 "판매완료(`posts.status = inactive`)" 처리할지 여부 논의 — 현재는 미구현
- [ ] **거래완료 알림 메시지 자동 발송**: 수령확인(`released`) 시 채팅방에 새 시스템 메시지를 자동 삽입 — 결제 카드가 위로 밀려 상태 변경을 놓치는 문제 해소. `type='system'` 등 별도 메시지 타입으로 구분해 UI에서 식별 가능하게 처리
- [ ] **거래완료 후 채팅 내 후기 작성**: `released` 전환 후 채팅창에 후기 작성 UI 노출 — 간단한 인증(거래 당사자 여부 확인) 후 평점·텍스트 입력, 작성된 후기는 기존 "내 정보 > 거래 후기" 프로필 화면에서 확인 가능하도록 연동
- [ ] (범위 외, 후속 과제) 분쟁 처리·부분환불 플로우 — 현재는 해피패스(요청→결제→수령확인→완료)와 pending 취소만 지원
- [ ] (범위 외, 후속 과제) 실제 에스크로 자금 보관과 판매자 정산(Xendit Disbursement/XenPlatform 연동) — 현재는 `status` 값으로만 시뮬레이션
