-- KTS (Kanto Trust Score) & KPPS (Kanto Popular Post Score) 배치 시스템
-- 설계 문서: docs/설계/kanto-trust-score(KTS).md
--            docs/설계/kanto-popular-post-score(KPPS).md

-- ─── 1. 컬럼 추가 ───────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kts_score NUMERIC(5,2) DEFAULT 36,
  ADD COLUMN IF NOT EXISTS kts_grade TEXT         DEFAULT 'D';

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS kpps_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN      DEFAULT FALSE;

-- ─── 2. user_trust_history 테이블 ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_trust_history (
  user_id     bigint  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_date   date    NOT NULL,  -- 해당 주 월요일
  kts_score   integer NOT NULL,
  grade_level integer NOT NULL,  -- 0=E, 1=D, 2=C, 3=B, 4=A
  PRIMARY KEY (user_id, week_date)
);

CREATE INDEX IF NOT EXISTS user_trust_history_user_id_week_idx
  ON user_trust_history (user_id, week_date DESC);

-- ─── 3. recalculate_kts() ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalculate_kts()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rec              RECORD;
  review_avg       NUMERIC;
  review_cnt       INTEGER;
  conf_weight      NUMERIC;
  review_score     NUMERIC;
  released_cnt     INTEGER;
  cancelled_cnt    INTEGER;
  total_tx         INTEGER;
  tx_score         NUMERIC;
  age_months       NUMERIC;
  activity_score   NUMERIC;
  trend_score      NUMERIC;
  penalty_score    NUMERIC;
  resolved_reports INTEGER;
  sanctions_7d     INTEGER;
  sanctions_30d    INTEGER;
  kts              NUMERIC;
  new_grade        TEXT;
  grade_levels     INTEGER[];
  max_grade        INTEGER;
  grade_base       NUMERIC;
  trend_coeff      NUMERIC;
  weeks_cnt        INTEGER;
  streak_up        INTEGER;
  streak_down      INTEGER;
  stable_cnt       INTEGER;
  i                INTEGER;
BEGIN
  FOR rec IN
    SELECT id, post_count, created_at FROM users WHERE deleted_at IS NULL
  LOOP
    -- ── ReviewScore (±25) ──────────────────────────────────────────────────
    SELECT AVG(rating), COUNT(*)
    INTO review_avg, review_cnt
    FROM reviews
    WHERE reviewee_id = rec.id AND deleted_at IS NULL;

    review_avg := COALESCE(review_avg, 0);
    review_cnt := COALESCE(review_cnt, 0);

    conf_weight := CASE
      WHEN review_cnt = 0   THEN 0.0
      WHEN review_cnt <= 3  THEN 0.5
      WHEN review_cnt <= 9  THEN 0.75
      WHEN review_cnt <= 19 THEN 0.9
      ELSE 1.0
    END;

    review_score := GREATEST(-25, LEAST(25,
      (review_avg - 3.0) / 2.0 * 25 * conf_weight
    ));

    -- ── TransactionScore (0~15) ────────────────────────────────────────────
    SELECT
      COUNT(*) FILTER (WHERE status = 'released'),
      COUNT(*) FILTER (WHERE status = 'cancelled')
    INTO released_cnt, cancelled_cnt
    FROM transactions
    WHERE seller_id = rec.id OR buyer_id = rec.id;

    released_cnt := COALESCE(released_cnt, 0);
    cancelled_cnt := COALESCE(cancelled_cnt, 0);
    total_tx      := released_cnt + cancelled_cnt;

    tx_score := LEAST(released_cnt * 1.5, 15);
    IF total_tx > 0 AND cancelled_cnt::NUMERIC / total_tx >= 0.5 THEN
      tx_score := tx_score * 0.5;
    END IF;

    -- ── ActivityScore (0~10) ───────────────────────────────────────────────
    -- 30일 기준 개월 수
    age_months     := EXTRACT(EPOCH FROM (NOW() - rec.created_at)) / 2592000.0;
    activity_score := LEAST(age_months / 12.0 * 6, 6)
                    + LEAST(COALESCE(rec.post_count, 0) * 0.4, 4);

    -- ── TrendScore (0~14) ─────────────────────────────────────────────────
    trend_score := 0;

    SELECT ARRAY_AGG(grade_level ORDER BY week_date DESC)
    INTO grade_levels
    FROM (
      SELECT grade_level, week_date
      FROM user_trust_history
      WHERE user_id = rec.id
        AND week_date >= (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '3 weeks')::date
      ORDER BY week_date DESC
      LIMIT 4
    ) h;

    IF grade_levels IS NOT NULL AND array_length(grade_levels, 1) >= 4 THEN
      weeks_cnt := array_length(grade_levels, 1);

      -- 현재 등급이 E이면 TrendScore = 0
      IF grade_levels[1] > 0 THEN
        max_grade := (SELECT MAX(v) FROM unnest(grade_levels) v);

        grade_base := CASE
          WHEN max_grade <= 0 THEN 0
          WHEN max_grade = 1  THEN 4
          WHEN max_grade = 2  THEN 8
          ELSE 14  -- B(3), A(4)
        END;

        -- 연속 상승세: grade_levels 은 newest-first, [i] > [i+1] 이면 상승
        streak_up := 0;
        FOR i IN 1..weeks_cnt - 1 LOOP
          IF grade_levels[i] > grade_levels[i + 1] THEN
            streak_up := streak_up + 1;
          ELSE
            EXIT;
          END IF;
        END LOOP;

        -- 연속 하락세: [i] < [i+1] 이면 하락
        streak_down := 0;
        FOR i IN 1..weeks_cnt - 1 LOOP
          IF grade_levels[i] < grade_levels[i + 1] THEN
            streak_down := streak_down + 1;
          ELSE
            EXIT;
          END IF;
        END LOOP;

        -- 안정 유지: 현재 등급과 동일한 연속 주 수
        stable_cnt := 0;
        FOR i IN 1..weeks_cnt LOOP
          IF grade_levels[i] = grade_levels[1] THEN
            stable_cnt := stable_cnt + 1;
          ELSE
            EXIT;
          END IF;
        END LOOP;

        trend_coeff := CASE
          WHEN streak_up >= 2   THEN 1.0   -- 상승세
          WHEN stable_cnt >= 3  THEN 1.0   -- 안정 유지
          WHEN streak_down >= 2 THEN 0.20  -- 하락세
          ELSE 0.35                         -- 간헐적
        END;

        trend_score := grade_base * trend_coeff;
      END IF;
    END IF;

    -- ── PenaltyScore ──────────────────────────────────────────────────────
    SELECT COUNT(*)
    INTO resolved_reports
    FROM common_reports
    WHERE target_type = 'user'
      AND target_id = rec.id
      AND status = 'resolved';
    resolved_reports := COALESCE(resolved_reports, 0);

    SELECT
      COUNT(*) FILTER (WHERE sanction_type = '7d'),
      COUNT(*) FILTER (WHERE sanction_type = '30d')
    INTO sanctions_7d, sanctions_30d
    FROM user_sanctions
    WHERE user_id = rec.id;
    sanctions_7d  := COALESCE(sanctions_7d, 0);
    sanctions_30d := COALESCE(sanctions_30d, 0);

    penalty_score := (resolved_reports * 8) + (sanctions_7d * 5) + (sanctions_30d * 15);

    -- ── KTS 최종 계산 ─────────────────────────────────────────────────────
    kts := GREATEST(LEAST(
      36 + review_score + tx_score + activity_score + trend_score - penalty_score,
      100
    ), 0);

    new_grade := CASE
      WHEN kts >= 90 THEN 'A'
      WHEN kts >= 75 THEN 'B'
      WHEN kts >= 50 THEN 'C'
      WHEN kts >= 30 THEN 'D'
      ELSE 'E'
    END;

    UPDATE users SET kts_score = kts, kts_grade = new_grade WHERE id = rec.id;
  END LOOP;

  -- ── 주간 스냅샷 저장 ────────────────────────────────────────────────────
  INSERT INTO user_trust_history (user_id, week_date, kts_score, grade_level)
  SELECT
    id,
    DATE_TRUNC('week', CURRENT_DATE)::date,
    kts_score::integer,
    CASE kts_grade
      WHEN 'A' THEN 4
      WHEN 'B' THEN 3
      WHEN 'C' THEN 2
      WHEN 'D' THEN 1
      ELSE 0
    END
  FROM users
  WHERE deleted_at IS NULL
  ON CONFLICT (user_id, week_date) DO UPDATE SET
    kts_score   = EXCLUDED.kts_score,
    grade_level = EXCLUDED.grade_level;
END;
$$;

-- ─── 4. recalculate_kpps() ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalculate_kpps()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rec         RECORD;
  eng_score   NUMERIC;
  lr_bonus    NUMERIC;
  kts_bonus   NUMERIC;
  qual_bonus  NUMERIC;
  rec_bonus   NUMERIC;
  rep_penalty NUMERIC;
  like_rate   NUMERIC;
  age_days    NUMERIC;
  kpps        NUMERIC;
  img_count   INTEGER;
BEGIN
  UPDATE posts SET is_popular = FALSE
  WHERE post_type IN ('rental', 'used_goods');

  FOR rec IN
    SELECT
      p.id,
      p.post_type,
      p.like_count,
      p.view_count,
      p.created_at,
      p.is_sold,
      u.kts_grade,
      CASE p.post_type
        WHEN 'rental'     THEN COALESCE(jsonb_array_length((r.images)::jsonb), 0)
        WHEN 'used_goods' THEN COALESCE(jsonb_array_length((ug.images)::jsonb), 0)
      END AS img_count,
      r.amenities,
      r.deposit,
      r.price       AS rent_price,
      ug.condition,
      ug.safe_payment,
      COALESCE(rpt.resolved_count, 0) AS resolved_reports
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN rentals    r  ON r.post_id  = p.id AND p.post_type = 'rental'
    LEFT JOIN used_goods ug ON ug.post_id = p.id AND p.post_type = 'used_goods'
    LEFT JOIN (
      SELECT target_id, COUNT(*) AS resolved_count
      FROM common_reports
      WHERE target_type = 'post' AND status = 'resolved'
      GROUP BY target_id
    ) rpt ON rpt.target_id = p.id
    WHERE p.status = 'active'
      AND p.post_type IN ('rental', 'used_goods')
      AND (p.post_type != 'used_goods' OR p.is_sold = FALSE)
  LOOP
    -- EngagementScore
    eng_score := LEAST(rec.like_count, 20)::NUMERIC / 20 * 30
               + LEAST(rec.view_count, 500)::NUMERIC / 500 * 10;

    -- LikeRateBonus
    like_rate := rec.like_count::NUMERIC / GREATEST(rec.view_count, 1);
    lr_bonus  := LEAST(like_rate / 0.10, 1.0) * 20;

    -- KTSBonus
    kts_bonus := CASE rec.kts_grade
      WHEN 'A' THEN 20
      WHEN 'B' THEN 15
      WHEN 'C' THEN 10
      WHEN 'D' THEN 5
      ELSE 0
    END;

    -- QualityBonus
    img_count  := LEAST(COALESCE(rec.img_count, 0), 5);
    qual_bonus := img_count;
    IF rec.post_type = 'rental' THEN
      IF rec.amenities IS NOT NULL
         AND jsonb_array_length(rec.amenities::jsonb) >= 3 THEN
        qual_bonus := qual_bonus + 3;
      END IF;
      IF rec.deposit IS NOT NULL AND rec.rent_price IS NOT NULL THEN
        qual_bonus := qual_bonus + 2;
      END IF;
    ELSIF rec.post_type = 'used_goods' THEN
      IF rec.condition IS NOT NULL THEN qual_bonus := qual_bonus + 2; END IF;
      IF rec.safe_payment = TRUE    THEN qual_bonus := qual_bonus + 3; END IF;
    END IF;
    qual_bonus := LEAST(qual_bonus, 10);

    -- RecencyBonus
    age_days  := EXTRACT(EPOCH FROM (NOW() - rec.created_at)) / 86400;
    rec_bonus := CASE
      WHEN age_days <= 1  THEN 10
      WHEN age_days <= 3  THEN 8
      WHEN age_days <= 7  THEN 6
      WHEN age_days <= 14 THEN 3
      ELSE 1
    END;
    IF rec.post_type = 'rental' THEN
      rec_bonus := GREATEST(rec_bonus, 3);
    END IF;

    -- ReportPenalty
    rep_penalty := LEAST(rec.resolved_reports * 10, 30);

    -- KPPS
    kpps := GREATEST(LEAST(
      eng_score + lr_bonus + kts_bonus + qual_bonus + rec_bonus - rep_penalty,
      100
    ), 0);

    UPDATE posts SET kpps_score = kpps WHERE id = rec.id;
  END LOOP;

  -- E등급 제외하고 유형별 상위 5개에만 is_popular = TRUE
  UPDATE posts SET is_popular = TRUE
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             RANK() OVER (PARTITION BY post_type ORDER BY kpps_score DESC) AS rnk
      FROM posts
      WHERE post_type IN ('rental', 'used_goods')
        AND status = 'active'
        AND (post_type != 'used_goods' OR is_sold = FALSE)
        AND user_id IN (SELECT id FROM users WHERE kts_grade != 'E')
    ) ranked
    WHERE rnk <= 5
  );
END;
$$;

-- ─── 5. pg_cron 스케줄 등록 ────────────────────────────────────────────────
-- KTS: 매일 03:00, 15:00 실행
-- KPPS: KTS 완료 후 03:30, 15:30 실행
SELECT cron.schedule('recalculate-kts',  '0 3,15 * * *',   'SELECT recalculate_kts()');
SELECT cron.schedule('recalculate-kpps', '30 3,15 * * *',  'SELECT recalculate_kpps()');
