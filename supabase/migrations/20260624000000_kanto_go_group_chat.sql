-- 칸토 go! v2 — 번개모임 단체채팅
-- 멤버십은 테이블로 두지 않고 파생: 호스트(posts.user_id) ∪ meetup_participants(status='joined')
-- FK는 PostgREST 임베드 해소를 위해 조인 대상 테이블을 직접 참조 (20260623010000에서 고친 버그류 재발 방지)

CREATE TABLE IF NOT EXISTS meetup_chat_rooms (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  meetup_post_id  bigint NOT NULL UNIQUE REFERENCES meetups(post_id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,   -- end_at + 24h. 만료 시 lazy/cron 삭제
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended'))
);

CREATE TABLE IF NOT EXISTS meetup_chat_messages (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id     bigint NOT NULL REFERENCES meetup_chat_rooms(id) ON DELETE CASCADE,
  sender_id   bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     text NOT NULL,
  type        text NOT NULL DEFAULT 'text' CHECK (type IN ('text','system')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mcm_room_created ON meetup_chat_messages(room_id, created_at DESC);

-- 읽음 상태: 풀 read-receipt 대신 멤버별 last_read_at 1행 (unread count 계산용)
CREATE TABLE IF NOT EXISTS meetup_chat_reads (
  room_id       bigint NOT NULL REFERENCES meetup_chat_rooms(id) ON DELETE CASCADE,
  user_id       bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- 멤버십 헬퍼: 호스트 ∪ joined 참여자. SECURITY DEFINER로 RLS 재귀 방지
-- (meetups/meetup_participants는 이미 SELECT USING(true)라 재귀 위험이 크진 않지만, 일관된 패턴 유지)
CREATE OR REPLACE FUNCTION public.is_meetup_chat_member(p_room_id bigint, p_user_id bigint)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM meetup_chat_rooms r
    JOIN posts p ON p.id = r.meetup_post_id
    WHERE r.id = p_room_id
      AND (
        p.user_id = p_user_id
        OR EXISTS (
          SELECT 1 FROM meetup_participants mp
          WHERE mp.meetup_post_id = r.meetup_post_id
            AND mp.user_id = p_user_id
            AND mp.status = 'joined'
        )
      )
  );
$$;

ALTER TABLE meetup_chat_rooms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_chat_reads    ENABLE ROW LEVEL SECURITY;

-- rooms: 멤버만 조회. INSERT/UPDATE/DELETE 정책은 두지 않음 — 방 생성/종료는
-- 서비스 레이어의 admin 클라이언트(RLS 우회)로 처리. "멤버여야 방을 만들 수 있는데
-- 방이 멤버십을 정의한다"는 순환을 회피.
CREATE POLICY "meetup_chat_rooms - select member" ON meetup_chat_rooms
  FOR SELECT USING (is_meetup_chat_member(id, (select my_user_id())));

-- messages: 멤버만 read, 멤버 본인 발신만 write
CREATE POLICY "meetup_chat_messages - select member" ON meetup_chat_messages
  FOR SELECT USING (is_meetup_chat_member(room_id, (select my_user_id())));
CREATE POLICY "meetup_chat_messages - insert member" ON meetup_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = (select my_user_id())
    AND is_meetup_chat_member(room_id, (select my_user_id()))
  );

-- reads: 본인 행만
CREATE POLICY "meetup_chat_reads - select own" ON meetup_chat_reads
  FOR SELECT USING (user_id = (select my_user_id()));
CREATE POLICY "meetup_chat_reads - insert own" ON meetup_chat_reads
  FOR INSERT WITH CHECK (user_id = (select my_user_id()));
CREATE POLICY "meetup_chat_reads - update own" ON meetup_chat_reads
  FOR UPDATE USING (user_id = (select my_user_id()));

-- Realtime: messages만 publication에 추가.
-- rooms/posts는 추가하지 않음 — publication에 없는 테이블을 같은 채널에서 구독하면
-- 채널 전체가 깨지는 문제를 useLiveMeetups.ts에서 이미 겪었음(posts 구독 시도 회귀).
ALTER PUBLICATION supabase_realtime ADD TABLE meetup_chat_messages;

-- 24h 유예 정리 cron 백스톱 (주 메커니즘은 서비스 레이어의 lazy delete)
SELECT cron.schedule(
  'meetup-chat-cleanup',
  '0 * * * *',
  $$DELETE FROM meetup_chat_rooms WHERE expires_at < now()$$
);

-- common_reports.target_type에는 CHECK 제약이 없음을 대시보드에서 확인함(sanction_type만 제약 존재).
-- 'message' 타겟 신고 insert는 별도 조치 없이 통과함.
