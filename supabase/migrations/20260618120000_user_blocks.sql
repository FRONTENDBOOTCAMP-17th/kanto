CREATE TABLE IF NOT EXISTS user_blocks (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blocker_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own blocks - select" ON user_blocks
  FOR SELECT USING (blocker_id = my_user_id());
CREATE POLICY "own blocks - insert" ON user_blocks
  FOR INSERT WITH CHECK (blocker_id = my_user_id());
CREATE POLICY "own blocks - delete" ON user_blocks
  FOR DELETE USING (blocker_id = my_user_id());
