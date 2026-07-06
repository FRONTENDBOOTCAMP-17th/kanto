-- 코드에서 전혀 참조되지 않는 미사용 테이블 정리.
-- comments, matches, dating_profiles: 관련 기능이 앱에 구현된 적 없음.
-- banned_keywords: profanity_rules 로 대체되어 더 이상 사용되지 않음.
-- community_posts: 커뮤니티 게시판 기능 제거(20260626020000_drop_community_posts.sql)와 동일한 정리.
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.banned_keywords CASCADE;
DROP TABLE IF EXISTS public.dating_profiles CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
