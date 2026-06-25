-- 모임 종료 시 채팅방 삭제를 참여자 채팅 목록에 즉시 반영하기 위해
-- meetup_chat_rooms DELETE 이벤트도 Realtime으로 발행한다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'meetup_chat_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meetup_chat_rooms;
  END IF;
END $$;
