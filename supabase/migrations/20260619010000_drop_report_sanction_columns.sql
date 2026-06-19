-- 제재 결과의 3중 복제 제거 (Phase 2): common_reports 의 결과 컬럼 삭제.
-- 제재 결과는 이제 user_sanctions(report_id 로 연결)가 단일 출처(SoT).
-- 선행 조건: Phase 1(20260619000000) 적용 + 백필 완료, 그리고 이 컬럼을 더 이상
-- 읽거나 쓰지 않는 코드가 배포되어 있어야 한다.

ALTER TABLE common_reports DROP COLUMN IF EXISTS sanction_type;
ALTER TABLE common_reports DROP COLUMN IF EXISTS sanction_expires_at;
