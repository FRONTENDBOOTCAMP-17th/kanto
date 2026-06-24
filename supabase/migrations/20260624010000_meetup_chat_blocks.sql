-- 칸토 go! 그룹채팅 전용(방 범위) 차단
-- 기존 user_blocks(전역 차단)과 별개로, "이 채팅에서만 차단"을 지원하기 위한 테이블.
-- user_blocks와 동일한 RLS 패턴(본인 행만 select/insert/delete).

CREATE TABLE IF NOT EXISTS meetup_chat_blocks (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id     bigint NOT NULL REFERENCES meetup_chat_rooms(id) ON DELETE CASCADE,
  blocker_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, blocker_id, blocked_id)
);

ALTER TABLE meetup_chat_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own chat blocks - select" ON meetup_chat_blocks
  FOR SELECT USING (blocker_id = (select my_user_id()));
CREATE POLICY "own chat blocks - insert" ON meetup_chat_blocks
  FOR INSERT WITH CHECK (blocker_id = (select my_user_id()));
CREATE POLICY "own chat blocks - delete" ON meetup_chat_blocks
  FOR DELETE USING (blocker_id = (select my_user_id()));
