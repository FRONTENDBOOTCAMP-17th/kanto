-- recalculate_kpps()의 is_popular 부여 조건 수정
-- 기존 조건은 렌탈(rental) 게시물에 is_sold 체크가 적용되지 않아,
-- 판매/계약 완료된 렌탈도 인기(is_popular) 플래그를 계속 받을 수 있었음.
-- 유형과 무관하게 is_sold = FALSE인 게시물만 인기로 표시되도록 통일.

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
  -- (is_sold 체크를 post_type과 무관하게 일괄 적용 — 렌탈도 판매/계약완료 시 제외)
  UPDATE posts SET is_popular = TRUE
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             RANK() OVER (PARTITION BY post_type ORDER BY kpps_score DESC) AS rnk
      FROM posts
      WHERE post_type IN ('rental', 'used_goods')
        AND status = 'active'
        AND is_sold = FALSE
        AND user_id IN (SELECT id FROM users WHERE kts_grade != 'E')
    ) ranked
    WHERE rnk <= 5
  );
END;
$$;

SELECT recalculate_kpps();
