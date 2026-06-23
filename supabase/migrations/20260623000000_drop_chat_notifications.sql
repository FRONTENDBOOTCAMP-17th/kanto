-- 채팅 알림을 common_notifications 에 더 이상 쌓지 않는다.
-- 채팅 안읽음은 우측 하단 플로팅 위젯에서 자체 카운트로 처리하므로,
-- 알림(종/전체보기)에는 정지/해제 등 시스템 알림만 남긴다.

-- 1. 메시지 INSERT 시 채팅 알림을 만들던 트리거/함수 제거
drop trigger if exists trg_notify_on_new_message on public.messages;
drop function if exists public.notify_on_new_message();

-- 2. 기존에 쌓여 있던 채팅 알림 정리
delete from public.common_notifications where type = 'chat';

-- 참고: chats.user_id_1_active / user_id_2_active 컬럼과 set_chat_active RPC 는
-- 위 트리거의 presence 체크 용도로만 추가됐던 것이라 이제 사용되지 않는다.
-- 다만 클라이언트(useChatRoomRealtime)가 아직 set_chat_active 를 호출하므로
-- RPC/컬럼은 남겨 둔다(무해한 no-op). 추후 정리 시 클라이언트 호출과 함께 제거할 것.
