-- 콘텐츠 관리: 금칙어 룰, 스팸 설정, 제재 알림 템플릿

-- 1. 금칙어 룰 테이블
CREATE TABLE IF NOT EXISTS profanity_rules (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scopes     text[] NOT NULL DEFAULT '{}',
  words      text[] NOT NULL DEFAULT '{}',
  created_by bigint REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profanity_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profanity_rules - admin only" ON profanity_rules
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = my_user_id() AND u.role = 'admin')
  );

-- 2. 스팸 설정 테이블 (싱글톤 - id=1 고정)
CREATE TABLE IF NOT EXISTS spam_config (
  id                    int PRIMARY KEY DEFAULT 1,
  chat_window_sec       int NOT NULL DEFAULT 3,
  chat_max_count        int NOT NULL DEFAULT 5,
  chat_cooldown_sec     int NOT NULL DEFAULT 10,
  max_urls_per_post     int NOT NULL DEFAULT 3,
  profanity_strike_max  int NOT NULL DEFAULT 3,
  report_strike_max     int NOT NULL DEFAULT 5,
  auto_sanction_enabled boolean NOT NULL DEFAULT false,
  updated_by            bigint REFERENCES users(id) ON DELETE SET NULL,
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

ALTER TABLE spam_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spam_config - admin only" ON spam_config
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = my_user_id() AND u.role = 'admin')
  );

INSERT INTO spam_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3. 제재 알림 템플릿 테이블
CREATE TABLE IF NOT EXISTS sanction_templates (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trigger    text NOT NULL CHECK (trigger IN ('profanity', 'spam', 'report')),
  title      text NOT NULL,
  body       text NOT NULL,
  updated_by bigint REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trigger)
);

ALTER TABLE sanction_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sanction_templates - admin only" ON sanction_templates
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = my_user_id() AND u.role = 'admin')
  );

INSERT INTO sanction_templates (trigger, title, body) VALUES
  ('profanity', '금칙어 위반 경고', '금칙어가 포함된 내용을 작성하여 일시적으로 서비스 이용이 제한되었습니다.'),
  ('spam',      '스팸 행위 경고',   '과도한 메시지 전송으로 일시적으로 채팅 기능이 제한되었습니다.'),
  ('report',    '신고 누적 제재',   '다수의 신고가 접수되어 서비스 이용이 제한되었습니다.')
ON CONFLICT (trigger) DO NOTHING;
