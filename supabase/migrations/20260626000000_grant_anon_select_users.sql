-- 비로그인(anon) 사용자가 메인 진입 시 "permission denied for table users" 발생 수정.
-- 원인: RLS 정책 "users: anon 공개 정보만 조회"(deleted_at IS NULL)는 존재하지만,
--       그 전제인 테이블 레벨 SELECT GRANT 가 anon 에 없어 정책이 평가조차 되지 못함.
--       (Postgres 는 테이블 GRANT 통과 후에야 RLS 를 적용)
-- 영향: posts ↔ users (posts_user_id_fkey) 조인 쿼리(getJobList, getPopularList 등)가 anon 컨텍스트에서 전부 실패.
-- 행/컬럼 노출 범위는 기존 anon SELECT 정책이 그대로 제어한다.

grant select on public.users to anon;
