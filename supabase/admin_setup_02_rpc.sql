-- ================================================================
-- Step 2: RPC Functions (5개)
-- ================================================================

-- 1. 날짜별 신규 가입자 수 (추이 차트용)
CREATE OR REPLACE FUNCTION get_daily_signups(days int)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql AS $$
  SELECT
    DATE(created_at) AS day,
    COUNT(*)          AS count
  FROM users
  WHERE created_at >= CURRENT_DATE - (days || ' days')::interval
    AND deleted_at IS NULL
  GROUP BY DATE(created_at)
  ORDER BY day;
$$;

-- 2. 활성 사용자 수 (게시글 + 채팅 + 댓글 기준)
CREATE OR REPLACE FUNCTION get_active_users_count(days int)
RETURNS TABLE(count bigint)
LANGUAGE sql AS $$
  SELECT COUNT(DISTINCT uid) AS count
  FROM (
    SELECT user_id AS uid FROM posts
    WHERE created_at >= NOW() - (days || ' days')::interval
    UNION
    SELECT user_id_1 AS uid FROM chats
    WHERE last_message_at >= NOW() - (days || ' days')::interval
    UNION
    SELECT user_id_2 AS uid FROM chats
    WHERE last_message_at >= NOW() - (days || ' days')::interval
    UNION
    SELECT user_id AS uid FROM comments
    WHERE created_at >= NOW() - (days || ' days')::interval
  ) sub;
$$;

-- 3. 지역별 게시글 수 (used_goods + rentals + jobs 합산)
CREATE OR REPLACE FUNCTION get_region_post_counts(days int)
RETURNS TABLE(location text, count bigint)
LANGUAGE sql AS $$
  SELECT location, COUNT(*) AS count
  FROM (
    SELECT ug.location_type::text AS location
    FROM posts p
    JOIN used_goods ug ON ug.post_id = p.id
    WHERE p.created_at >= NOW() - (days || ' days')::interval
      AND p.status = 'active'
    UNION ALL
    SELECT r.location::text AS location
    FROM posts p
    JOIN rentals r ON r.post_id = p.id
    WHERE p.created_at >= NOW() - (days || ' days')::interval
      AND p.status = 'active'
    UNION ALL
    SELECT j.location_type::text AS location
    FROM posts p
    JOIN jobs j ON j.post_id = p.id
    WHERE p.created_at >= NOW() - (days || ' days')::interval
      AND p.status = 'active'
  ) sub
  WHERE location IS NOT NULL
  GROUP BY location
  ORDER BY count DESC
  LIMIT 6;
$$;

-- 4. 신고된 회원 목록 (pending 상태만)
CREATE OR REPLACE FUNCTION get_reported_users(limit_count int DEFAULT 10)
RETURNS TABLE(
  user_id       bigint,
  name          text,
  avatar_url    text,
  report_count  bigint,
  latest_reason text,
  first_reported_at timestamptz
)
LANGUAGE sql AS $$
  SELECT
    r.target_id        AS user_id,
    u.name,
    u.avatar_url,
    COUNT(r.id)        AS report_count,
    MAX(r.reason)      AS latest_reason,
    MIN(r.created_at)  AS first_reported_at
  FROM common_reports r
  JOIN users u ON u.id = r.target_id
  WHERE r.target_type = 'user'
    AND r.status = 'pending'
  GROUP BY r.target_id, u.name, u.avatar_url
  ORDER BY report_count DESC
  LIMIT limit_count;
$$;

-- 5. 신고된 게시글 목록 (pending 상태만)
CREATE OR REPLACE FUNCTION get_reported_posts(limit_count int DEFAULT 10)
RETURNS TABLE(
  post_id       bigint,
  title         text,
  post_type     text,
  report_count  bigint,
  latest_reason text,
  first_reported_at timestamptz
)
LANGUAGE sql AS $$
  SELECT
    r.target_id        AS post_id,
    p.title,
    p.post_type::text,
    COUNT(r.id)        AS report_count,
    MAX(r.reason)      AS latest_reason,
    MIN(r.created_at)  AS first_reported_at
  FROM common_reports r
  JOIN posts p ON p.id = r.target_id
  WHERE r.target_type = 'post'
    AND r.status = 'pending'
  GROUP BY r.target_id, p.title, p.post_type
  ORDER BY report_count DESC
  LIMIT limit_count;
$$;
