-- 제재 결과의 3중 복제 제거 (Phase 1): 신고 -> 제재 FK 연결
-- common_reports.sanction_type / sanction_expires_at 는 Phase 2 에서 DROP 예정.
-- 이 마이그레이션은 FK 컬럼 추가 + 기존 데이터 백필까지만 수행한다.

ALTER TABLE user_sanctions
  ADD COLUMN IF NOT EXISTS report_id bigint
  REFERENCES common_reports(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_sanctions_report_id_idx
  ON user_sanctions (report_id);

-- 백필: 기존 resolved 신고의 결과(sanction_*)를 대응 user_sanctions 행에 매핑.
-- 매칭 기준: user_id + sanction_type + expires_at (7d/30d 만료값은 사실상 유니크).
-- 게시물 대상 신고는 작성자(post.user_id)가 제재 대상.
UPDATE user_sanctions us
SET report_id = cr.id
FROM common_reports cr
WHERE us.report_id IS NULL
  AND cr.status = 'resolved'
  AND cr.sanction_type IS NOT NULL
  AND us.sanction_type = cr.sanction_type
  AND us.expires_at IS NOT DISTINCT FROM cr.sanction_expires_at
  AND us.user_id = CASE
        WHEN cr.target_type = 'user' THEN cr.target_id
        ELSE (SELECT p.user_id FROM posts p WHERE p.id = cr.target_id)
      END;
