# 2026-06-23 알림 기능 버그 정리 — 작업 기록

`bug/notification_bug` 브랜치. 알림(종/전체보기) 관련 버그 수정 세션 정리.
어제(06-22) 대화의 번호 목록 원문이 `--continue` 요약 과정에서 증발해, 다시 증발하지 않도록 기록을 남긴다.

---

## 대상 버그

사용자가 기억하는 핵심 두 가지(어제 #3·#6으로 부르던 것):

- **#3 모두읽음 비영속**: 알림이 X개 있을 때 "모두 읽음"을 누르고 새로고침하면 다시 X개(미읽음)로 복구됨. 드롭다운·전체보기 동일. 단, **하나씩 직접 클릭해 읽음 처리하면 정상**.
- **#6 종 카운트 미연동**: 전체보기 페이지에서 "모두 읽기"로 읽음 처리하면 헤더 종(bell)의 숫자도 줄어들어야 함.

추가로 같은 세션에서 다룬 DB 측 이슈:

- **채팅 알림 누적**: 메시지 INSERT 트리거가 `common_notifications`에 `type='chat'` 행을 계속 쌓음. 채팅 안읽음은 우측 하단 플로팅 위젯이 자체 처리하므로 알림에는 불필요.
- **NULL 데이터로 인한 정렬 불안정**: 관리자 정지/해제 알림 INSERT가 `created_at`·`is_read`를 채우지 않아 NULL로 남음.

---

## 결론 요약

| 항목 | 원인 위치 | 해결 수단 | 비고 |
|---|---|---|---|
| #3 모두읽음 비영속 | 프론트 쿼리 | **코드** | 마이그레이션 불요 |
| #6 종 카운트 미연동 | 프론트 구조 | **코드** | 마이그레이션 불요 |
| 채팅 알림 누적 | DB 트리거 | **마이그레이션** | 프론트 불가 |
| NULL 정렬/방지 | DB 스키마·데이터 | **마이그레이션** | 프론트 불가 |

> 정정: 06-22 시점에 #3·#6을 "코드만으로는 불가"라고 했으나 이는 오류였다.
> 두 버그는 DB 전용 이슈(트리거·NULL)와 뭉뚱그려진 것이고, 실제로는 코드 변경만으로 해결된다.
> 그래서 Supabase 미적용 상태에서도 #3·#6은 정상 동작한다.

---

## 코드로 해결된 것 (마이그레이션 무관)

### #3 — `src/hooks/useNotifications.ts` `markAllRead`
- **원인**: 옛 코드 `.eq("receiver_id", userId).eq("is_read", false)`.
  SQL 3치 논리상 `is_read = false`는 `is_read IS NULL` 행을 매칭하지 못한다.
  → NULL 행은 업데이트되지 않고, 새로고침 시 다시 미읽음(`!null === true`)으로 부활.
- **수정**: `.eq("is_read", false)` 제거 → receiver의 모든 행을 `is_read=true`로 갱신(NULL 행 포함) → 영속화.
- 하나씩 클릭(`markAsRead`)은 `.eq("id", n.id)`로 단건 갱신이라 NULL 무관 → 원래 정상이었던 이유.

### #6 — `NotificationBell` ↔ 전체보기 페이지 동기화
- 두 컴포넌트는 각자 `useNotifications()` 인스턴스라 상태 직접 공유는 없음.
- `useNotifications.ts`의 **Realtime UPDATE 구독**으로 동기화: 페이지의 모두읽음이 DB를 갱신 →
  행별 `postgres_changes` UPDATE 이벤트 → 종 인스턴스 상태 갱신 → `unreadCount` 재계산 → 배지 감소.

### 부수 변경
- 조회 쿼리에 `.order("id", desc)` 타이브레이커 추가, `limit` 20 → 50 (`useNotifications.ts`).
- 전체보기 페이지: `!is_read && type !== "chat"` 필터로 미읽음·비채팅만 노출 (`notifications/page.tsx`).
- 종 드롭다운: 이동할 곳 없는 알림(정지/해제)은 클릭해도 드롭다운 유지, 읽음 처리만 (`NotificationBell.tsx`).

---

## 마이그레이션이 필요한 것 (프론트로 불가)

### `20260622000000_notifications_not_null_defaults.sql`
- **근거 데이터(원격 실측, 06-23)**: 전체 353행 중 `created_at IS NULL` **329행(93%)**, `is_read IS NULL` 46행.
  최신 행 id 1087~1094 전부 `type='suspension'`, `created_at=null` → **지금도 NULL 생성 중**.
- **원인**: `src/app/(admin)/admin/users/_actions/applySanction.ts:67` 등 정지/해제 알림 INSERT가
  `created_at`·`is_read`를 넣지 않음 + 컬럼 DEFAULT 부재.
- **영향(잠복)**: `.order("created_at", desc)`는 Postgres에서 **NULLS FIRST**.
  → NULL 329행이 전부 상단으로 올라오고, `created_at`이 채워진 행은 하단으로 밀려 `limit(50)`에서 잘릴 수 있음.
  현재는 id순 ≈ 시간순이라 가려져 있음.
- **조치**: 기존 NULL backfill + `is_read`/`created_at`에 DEFAULT·NOT NULL 부여.

### `20260623000000_drop_chat_notifications.sql`
- **근거 데이터**: `type='chat'` 106행. 종(`NotificationBell.tsx:101-102`)은 `type` 필터 없이 `!is_read`만 보므로
  미읽음 채팅 알림이 종 배지/드롭다운에 노출·카운트됨(전체보기는 `type!=='chat'`로 거름).
- **조치**: 메시지 INSERT 트리거 `trg_notify_on_new_message`/함수 `notify_on_new_message()` DROP,
  기존 `type='chat'` 행 DELETE.
- **참고**: `chats.user_id_*_active` 컬럼 / `set_chat_active` RPC는 클라이언트가 아직 호출하므로 no-op로 잔존. 추후 정리.

---

## 적용 상태 / 후속

- [x] `20260622`, `20260623` 원격 Supabase 적용 (06-23, Supabase MCP `apply_migration`)
  - 적용 전(실측): total 357 / created_at NULL 330 / is_read NULL 48 / chat 108 / 트리거 **생존(1)**
  - 적용 후(검증): total **249** / created_at NULL **0** / is_read NULL **0** / chat **0** / 트리거 **0** / is_read·created_at **NOT NULL**
  - 트리거가 살아서 chat 행이 106→108로 계속 증가 중이었음을 적용 직전 확인.
- [ ] **버전 불일치 정리(후속)**: MCP `apply_migration`이 적용 시각 기준으로 버전을 새로 매겨,
  원격 히스토리는 `20260623013159_notifications_not_null_defaults`,
  `20260623013218_drop_chat_notifications`로 기록됨. 로컬 파일명(`20260622000000`, `20260623000000`)과 불일치.
  두 마이그레이션 모두 **멱등**(`drop ... if exists`, 멱등 alter, 이미 정리된 데이터의 update/delete)이라
  향후 `db push` 시 재실행돼도 무해하나, 히스토리 정리 회차에 로컬 파일명을 원격 버전에 맞춰 리네임하거나 양쪽을 일치시킬 것.
  (메모리 [[migration_history_cleanup]] 와 함께 처리)
- [ ] (선택) `applySanction.ts` 등 INSERT가 `created_at`/`is_read`를 명시하도록 보강 — 마이그레이션 DEFAULT로 커버되나 방어적
- [x] 트리거/RLS/적용 마이그레이션 SQL 정밀 점검 — 본 세션에서 MCP로 완료
