# 거래 완료 후 거래 후기 작성 기능 - THLIMM

> [xendit-payment-escrow.md](./xendit-payment-escrow.md) "앞으로 남은 작업" 중 **거래완료 후 채팅 내 후기 작성**(line 113)을 구현한 작업 문서. 선행 작업은 [transaction-complete-system-message.md](./transaction-complete-system-message.md) 참고.

## 1. 프로젝트 개요

### 목적

안전결제(에스크로) 거래가 완료(`released`)되면, **거래 당사자(구매자·판매자)가 서로에 대한 후기(별점 + 선택적 텍스트)를 작성**할 수 있게 하고, 작성된 후기를 **상대방 본인 프로필의 "거래 후기" 탭**에 노출한다. 기존에 `reviews` 테이블·프로필 후기 탭·i18n 문구는 스켈레톤으로만 존재했고 실제 작성/조회/평균 반영 로직이 모두 비어 있었다.

추가로, 이 작업 과정에서 채팅 하단 고정 배너 2종("안전결제 요청하기" / "거래 후기 작성")이 거래·후기 상태를 제대로 따라가지 못해 계속 노출되는 버그가 발견되어 함께 수정했다.

### 핵심 요구사항 (확정)

- **방향: 양방향** — 구매자·판매자 모두 상대방에 대한 후기를 작성. `reviews.role` 에 작성자의 거래 역할(`"buyer"`/`"seller"`)을 저장.
- **중복 판정: 거래(transaction)당 1회** — 같은 상품이라도 새 거래가 완료되면 다시 작성 가능.
- **입력 형식: 별점(1~5, 필수) + 자유 텍스트(선택)** — 텍스트 없이 별점만으로도 후기 등록 가능.
- **열람: 후기 대상자 본인 프로필 `/profile` "거래 후기" 탭** (타인 프로필 공개 페이지는 범위 외).

### 진입점 UX

후기 버튼을 결제 카드(`PaymentCard`) 안에 두면 대화가 이어질 때 카드가 스크롤로 밀려 "후기를 어디서 남기지?" 하는 혼란이 생긴다. 그래서 진입점을 **채팅 입력창 바로 위의 고정 배너**(스크롤 영역 밖, `MessageList` 와 무관하게 항상 노출)로 두었다. 기존 "안전결제 요청하기" 배너와 같은 슬롯·패턴을 재사용한다.

```
[판매자] 안전결제 요청 → 거래 pending 생성
   → 진행 중 거래가 생기는 즉시 "안전결제 요청하기" 배너 숨김(중복 요청 방지)
[구매자] 결제 → paid 전환 → 결제 카드에서 "수령 확인" → 거래 released 전환
   → 시스템 메시지 "구매자가 물건을 수령했습니다 · 거래 후기를 남겨보세요" 삽입
   → 입력창 위 고정 배너 "거래가 완료됐어요 · 상대방에게 후기를 남겨보세요" 등장 (양쪽 모두)
[당사자] 배너 클릭 → 별점(필수)+텍스트(선택) 모달 작성 → createReviewAction
   → reviews insert(transaction_id 포함) + 상대방 users.avg_rating 재계산
   → 배너 사라짐(해당 거래는 작성 완료, 재조회해도 다시 뜨지 않음)
[상대방] /profile "거래 후기" 탭에서 받은 후기 확인
```

### 기술 스택

- **Next.js (App Router)** + **React** (client/server component, server actions `"use server"`)
- **Supabase** (Postgres, RLS, Realtime), 쓰기/조회는 `supabaseAdmin`(service-role)로 RLS 우회
- **next-intl** (ko/en/ta 다국어 — 프로필 후기 탭에 적용, 채팅 영역은 기존 패턴대로 하드코딩 한국어)
- **TypeScript**, **Tailwind CSS**, **lucide-react** 아이콘

---

## 2. 현재 폴더 구조 및 각 파일 역할

이번 작업으로 추가/수정된 파일만 표시.

```
src/
├── type/
│   └── review.ts                          # (신규) Review = Tables<"reviews">,
│                                           #   ReviewWithReviewer(작성자 name/avatar 조인 포함)
├── services/
│   ├── review/
│   │   └── review.ts                      # (신규) 후기 CRUD — 전부 supabaseAdmin(service-role)
│   │                                       #   createReview: reviews insert(transaction_id 포함) 후 평균 재계산
│   │                                       #   recalcAvgRating: reviewee의 reviews 평균 → users.avg_rating
│   │                                       #   getReviewByTransactionAndReviewer: 거래당 1후기 중복 판정
│   │                                       #   getReviewsForUser: 프로필 탭용 목록(작성자 조인)
│   └── payment/
│       └── transaction.ts                 # (수정) getReleasedTransactionsForChat: chat_id+status='released' 거래를
│                                           #     released_at DESC, id DESC(보조 정렬) 로 결정적으로 조회
│                                           #   hasBlockingTransactionForChat: 진행 중(pending/paid)·완료(released)
│                                           #     거래 존재 여부 — 안전결제 배너 차단 판정
├── components/common/chat/chatPanel/room/
│   ├── paymentActions.ts                  # (수정) "use server" 서버 액션
│   │                                       #   createReviewAction: 당사자/상태/별점 검증(텍스트는 선택) + 거래당
│   │                                       #     중복 차단 + 후기 생성
│   │                                       #   getChatBannerStateAction: 채팅의 배너 상태(후기 작성 대상 거래 id +
│   │                                       #     안전결제 요청 차단 여부)를 한 번에 조회 — 구 getReviewableTransactionAction 흡수
│   │                                       #   confirmReceiptAction: 시스템 메시지 문구 변경
│   │                                       #     ("거래가 완료되었습니다" → "구매자가 물건을 수령했습니다 · 거래 후기를 남겨보세요")
│   ├── ReviewBanner.tsx                   # (신규) 입력창 위 고정 후기 작성 배너(클릭 시 모달), onReviewed로 부모 재조회
│   ├── ReviewModal.tsx                    # (신규) 별점(1~5, 필수) + textarea(선택) 작성 모달 → createReviewAction
│   ├── ChatRoomClient.tsx                 # (수정) getChatBannerStateAction으로 reviewableTxId·paymentRequestBlocked 조회
│   │                                       #   트리거: 마운트 + 시스템 메시지 개수 변화(결제/수령확인 시 자동 갱신)
│   │                                       #   reviewableTxId 있으면 ReviewBanner 렌더, canRequestPayment는
│   │                                       #     판매자+가격존재 && !paymentRequestBlocked 일 때만 노출
│   └── PaymentCard.tsx                    # (수정) released 분기는 "거래 완료" 한 줄만(후기 진입은 배너로 분리)
├── app/(user)/profile/
│   ├── page.tsx                           # (수정) 로그인 유저의 받은 후기 getReviewsForUser 조회 → ProfileCard로 전달
│   └── _components/
│       ├── ProfileCard.tsx               # (수정) reviews props 수신, avgRating/reviewCount 계산,
│       │                                   #   사이드바 활동통계 "받은 후기" 수 반영, 후기 탭에 전달
│       └── sections/
│           └── ProfileReviewsSection.tsx # (수정) 하드코딩 0 → 실제 평점/건수/후기 목록 렌더
│                                           #   (작성자 이름·별점·내용·작성일·역할 배지), 내용 없으면 본문 단락 생략,
│                                           #   0건이면 빈 상태
messages/
├── ko.json / en.json / ta.json           # (수정) Profile.reviews 에 roleBuyer/roleSeller 키 추가

docs/
└── transaction-review-write.md           # (신규) 본 문서
```

### DB 스키마 (공유 Supabase DB에 직접 적용)

| 테이블 | 변경 |
| --- | --- |
| `reviews` (컬럼 추가) | `transaction_id bigint null → transactions.id` (FK) + 부분 유니크 인덱스 `(transaction_id, reviewer_id) WHERE deleted_at IS NULL AND transaction_id IS NOT NULL` |

- `reviews` 테이블·`users.avg_rating`·`role`/`post_id`/`post_title`/`post_price` 컬럼은 기존부터 존재(스켈레톤). 이번엔 거래 단위 판정을 위해 `transaction_id`만 추가했다.
- `content` 컬럼은 `NOT NULL string`으로 유지 — 텍스트 미입력 시 빈 문자열(`""`)을 저장하는 방식으로 별도 마이그레이션 없이 "선택사항" 요구를 충족.
- `supabase db query --linked` 로 원격 DB에 적용 후 `npm run gen:types` 로 `src/type/supabase.ts` 재생성.
- 기존 후기 데이터(테스트로 생성된 2건)는 `transaction_id = null` 이라 거래 단위 중복 판정에 간섭하지 않으며, 프로필 목록에는 그대로 노출된다.

---

## 3. 지금까지 완성된 기능/작업

- [x] `reviews.transaction_id` 컬럼 + 유니크 인덱스 추가, 타입 재생성
- [x] 후기 서비스(`createReview`/`recalcAvgRating`/`getReviewByTransactionAndReviewer`/`getReviewsForUser`)
- [x] 서버 액션 `createReviewAction`(당사자·상태·별점 검증, **거래당 1후기 중복 차단**, 후기 생성 + 평균 재계산, **텍스트 내용은 선택**)
- [x] 서버 액션 `getChatBannerStateAction`(채팅의 배너 노출 상태를 한 번에 조회 — **페이지네이션/realtime 수신 여부와 무관하게 서버에서 권위 조회**)
- [x] 수령확인(`released`) 시 시스템 메시지 문구를 후기 유도 문구로 변경
- [x] 채팅 입력창 위 **고정 후기 작성 배너**(`ReviewBanner`) + 별점(필수)/텍스트(선택) 모달(`ReviewModal`)
- [x] 수령확인 직후 시스템 메시지 도착을 트리거로 **양쪽 화면에 배너 자동 등장**, 작성 후 자동 숨김(재조회해도 다시 뜨지 않음)
- [x] **"안전결제 요청하기" 배너가 거래 완료 후에도 계속 노출되던 문제 수정** — `hasBlockingTransactionForChat`(진행 중 `pending`/`paid` 또는 완료 `released` 거래 존재 여부)를 `canRequestPayment`에 반영. `cancelled`/`expired`만 있으면 재요청 허용.
- [x] **후기 작성 배너가 작성 후에도 계속 노출되던 문제(비결정적 정렬) 수정** — `getReleasedTransactionsForChat`이 `released_at DESC` 단독 정렬이라 nullable 컬럼 동순위에서 순서가 불안정 → "최신 완료 거래" 판정이 매번 달라져 배너가 반복 노출됨. `id DESC`를 보조 정렬키로 추가해 결정적으로 수정.
- [x] 후기 텍스트 입력을 **선택사항으로 변경** — 별점만으로 등록 가능, 빈 내용은 프로필 목록에서 본문 단락 생략
- [x] 프로필 "거래 후기" 탭 실제 데이터 연결(평점/건수/목록), 사이드바 "받은 후기" 수 반영
- [x] i18n(ko/en/ta) 역할 배지 키 추가
- [x] 타입체크(`tsc --noEmit`)·신규/수정 파일 lint 통과

### 트러블슈팅 기록

1. **카드가 스크롤로 밀림** → 진입점을 결제 카드 내부에서 **입력창 위 고정 배너**로 이전.
2. **로드된 메시지 스캔의 한계** → 결제 카드 메시지가 최신 50개 밖으로 페이지네이션되면 배너 대상 거래를 못 찾음. **서버 권위 조회**로 전환.
3. **중복 판정 단위 오류(DB 검증)** → 중복 판정이 "상품(post)당 1회"였는데, 테스트 채팅의 released 거래 10여 건이 모두 같은 상품이라 어제 작성한 후기 1건이 모든 거래에 매칭 → 배너가 영구 숨김. **"거래(transaction)당 1회"로 변경**해 해결.
4. **후기 배너가 작성 후 다시 뜨는 문제** → "최신 완료 거래"를 `released_at DESC` 단독으로 정렬했는데 nullable 컬럼이라 동순위 순서가 비결정적 → 매번 다른 거래가 "최신"으로 판정되어 작성해도 다른 거래로 배너가 재노출됨. `id DESC` 보조 정렬로 해결.
5. **안전결제 배너가 거래 완료 후에도 노출** → `canRequestPayment`가 판매자·가격 존재만 보고 거래 상태를 전혀 고려하지 않았음. 진행 중/완료 거래 존재 여부를 보는 `hasBlockingTransactionForChat`을 추가해 해결.

---

## 4. 앞으로 남은 작업

- [ ] **E2E 실거래 검증** — 두 계정으로 결제 요청(배너 숨김 확인) → 결제 → 수령확인 → 양쪽 배너 등장 → 후기 작성(텍스트 미입력 케이스 포함) → 상대 프로필 반영, 그리고 같은 상품의 새 거래에서 배너 재등장까지 확인.
- [ ] **후기 수정/삭제** — 현재는 작성만 가능. `reviews.updated_at`/`deleted_at`(소프트 삭제) 컬럼은 있으나 UI/액션 미구현.
- [ ] **타인 프로필에서 후기 열람** — 현재는 후기 대상자 본인만 `/profile`에서 확인 가능. 공개 프로필 페이지(`/profile/[id]` 등)는 미구현(범위 외).
- [ ] **알림 연동** — 후기가 등록되면 대상자에게 알림을 보낼지 여부 미정.
- [ ] **시스템 메시지/배너 문구의 i18n** — 채팅 영역 문구는 기존 패턴대로 하드코딩 한국어. 다국어가 필요하면 별도 작업.
- [ ] **거래 취소 시 안전결제 배너 즉시 갱신** — `cancelled`/`expired` 전환은 시스템 메시지를 남기지 않아 `systemMsgCount` 트리거가 발동하지 않음. 취소 직후 같은 화면에서는 재마운트 전까지 배너가 갱신되지 않는 드문 케이스(현재 범위 외).
