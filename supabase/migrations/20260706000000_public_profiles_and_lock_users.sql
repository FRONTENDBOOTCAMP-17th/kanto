-- 목적(19차 리뷰 [필수]): 라이브 DB 에 손으로 적용된 "anon users PII 차단 + public_profiles 뷰"를
--        마이그레이션으로 재현 가능하게 굳힌다. 새 환경에서 마이그레이션을 처음부터 적용해도
--        (1) public_profiles 뷰가 존재하고 (2) anon 이 users 원본의 PII(email·phone 등)를 못 읽는다.
--
-- 배경:
--   - 20260626000000_grant_anon_select_users.sql 이 `grant select on public.users to anon;` 로
--     테이블 전체 SELECT 를 anon 에 열어, RLS 가 행은 걸러도 열(email·phone)은 못 가려 PII 가 노출됐다.
--   - 서비스 전반(rental/chat/go/block/job 등)이 참조하는 public_profiles 뷰 정의가
--     어느 마이그레이션에도 없어, 새 DB reset 시 목록·채팅 쿼리가 전부 깨진다.
--
-- ⚠️ 검증 주의: 이 파일은 19차 리뷰 가이드의 템플릿 + src/type/supabase.ts 의 public_profiles
--    컬럼 정의(id, name, avatar_url, auth_id, created_at, deleted_at)를 기준으로 작성했다.
--    라이브 운영 DB 에 실제로 걸린 뷰 정의·GRANT·RLS 정책과 대조한 뒤 적용하고,
--    적용 후 anon 키로 GET /rest/v1/users?select=email,phone 이 PII 를 안 내려주는지 실측할 것.
--    (이 세션에서는 운영 DB 접근 인증이 없어 실측 대조를 하지 못했다.)

-- 1) 공개용 뷰: 공개해도 안전한 컬럼만 노출한다.
--    security_invoker=on → 조회자(anon/authenticated) 권한으로 원본 users 를 읽어,
--    뷰가 원본 테이블의 권한/RLS 를 우회하지 않게 한다.
create or replace view public.public_profiles
with (security_invoker = on) as
  select id, name, avatar_url, auth_id, created_at, deleted_at
  from public.users;

grant select on public.public_profiles to anon, authenticated;

-- 2) 원본 users: 26일에 열어 둔 통짜 SELECT 를 회수하고(= PII 노출 구멍 차단),
--    공개 뷰가 필요로 하는 안전한 컬럼만 컬럼 단위 GRANT 로 재허용한다.
--    Postgres 는 컬럼 단위 GRANT 를 지원하므로, RLS(행 필터)와 조합해
--    "anon 은 비삭제 행의 공개 컬럼만" 을 정확히 강제할 수 있다.
revoke select on public.users from anon;
grant select (id, name, avatar_url, auth_id, created_at, deleted_at)
  on public.users to anon;
