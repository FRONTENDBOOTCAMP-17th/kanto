-- ================================================================
-- Step 1: Indexes + resolved_at column
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_common_reports_status_type_created
  ON common_reports (status, target_type, created_at);

CREATE INDEX IF NOT EXISTS idx_posts_status_created
  ON posts (status, created_at);

CREATE INDEX IF NOT EXISTS idx_users_created_deleted
  ON users (created_at, deleted_at);

ALTER TABLE common_reports
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
