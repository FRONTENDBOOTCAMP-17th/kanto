-- 칸토 go! 번개모임 (위치 기반 일회성 모임)
-- posts 재사용: post_type = 'meetup'(text), user_id = 주최자
-- ID 타입은 기존 컨벤션대로 bigint (posts.id / users.id 모두 bigint)

CREATE TABLE IF NOT EXISTS meetups (
  post_id          bigint PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  topic            text NOT NULL,                  -- meetupTopics 키
  start_at         timestamptz NOT NULL,
  end_at           timestamptz NOT NULL,           -- 자동만료/핀 사라짐 기준
  location_lat     double precision NOT NULL,
  location_lng     double precision NOT NULL,
  location_address text NOT NULL,                  -- reverse geocoding 결과
  location_detail  text,                           -- 주최자 보정 한 줄 (nullable)
  description      text NOT NULL,
  max_participants int NOT NULL DEFAULT 6
);

CREATE TABLE IF NOT EXISTS meetup_participants (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  meetup_post_id bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id        bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at      timestamptz NOT NULL DEFAULT now(),
  status         text NOT NULL DEFAULT 'joined' CHECK (status IN ('joined','cancelled')),
  UNIQUE (meetup_post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meetup_participants_post ON meetup_participants(meetup_post_id);

-- RLS (user_blocks 등 기존 컨벤션과 동일하게 my_user_id() 사용)
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_participants ENABLE ROW LEVEL SECURITY;

-- meetups: 누구나 조회 / 주최자(posts.user_id)만 생성·수정·삭제
CREATE POLICY "meetups - select" ON meetups
  FOR SELECT USING (true);
CREATE POLICY "meetups - insert" ON meetups
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = my_user_id())
  );
CREATE POLICY "meetups - update" ON meetups
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = my_user_id())
  );
CREATE POLICY "meetups - delete" ON meetups
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = my_user_id())
  );

-- meetup_participants: 누구나 조회 / 본인만 참여·취소
CREATE POLICY "meetup_participants - select" ON meetup_participants
  FOR SELECT USING (true);
CREATE POLICY "meetup_participants - insert" ON meetup_participants
  FOR INSERT WITH CHECK (user_id = my_user_id());
CREATE POLICY "meetup_participants - update" ON meetup_participants
  FOR UPDATE USING (user_id = my_user_id());

-- v1 Realtime (핀/정원 자동 갱신)
ALTER PUBLICATION supabase_realtime ADD TABLE meetups;
ALTER PUBLICATION supabase_realtime ADD TABLE meetup_participants;
