-- rate_limit_events: 로그인 실패 제한(scope='login_fail') / AI챗봇 요청 제한(scope='ai_chat')
-- Redis get→incr→expire 대체. 슬라이딩 윈도우: 카운터 대신 이벤트 행을 쌓고 최근 구간만 센다.
-- (테이블을 Supabase 대시보드에서 먼저 만들어 제약 없이 존재하므로, 아래는 신규 생성과
--  기존 테이블 보강을 모두 커버한다.)

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope       text NOT NULL CHECK (scope IN ('login_fail', 'ai_chat')),
  identifier  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rate_limit_events ALTER COLUMN scope SET NOT NULL;
ALTER TABLE rate_limit_events ALTER COLUMN identifier SET NOT NULL;
ALTER TABLE rate_limit_events DROP CONSTRAINT IF EXISTS rate_limit_events_scope_check;
ALTER TABLE rate_limit_events ADD CONSTRAINT rate_limit_events_scope_check
  CHECK (scope IN ('login_fail', 'ai_chat'));

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup
  ON rate_limit_events (scope, identifier, created_at);

-- 서버(admin 클라이언트, RLS 우회)만 접근. 브라우저에서 직접 조회/기록할 이유 없음 → 정책 없이 기본 차단.
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;

-- 백스톱: 주 삭제 메커니즘은 서비스 레이어의 lazy delete(요청 처리 중 윈도우 밖 행 삭제).
-- 한동안 요청이 없어 lazy delete가 발동 안 되는 identifier의 잔여 행을 시간당 1회 정리.
SELECT cron.schedule(
  'rate-limit-events-cleanup',
  '0 * * * *',
  $$DELETE FROM rate_limit_events
    WHERE (scope = 'login_fail' AND created_at < now() - interval '15 minutes')
       OR (scope = 'ai_chat'    AND created_at < now() - interval '60 seconds')$$
);
