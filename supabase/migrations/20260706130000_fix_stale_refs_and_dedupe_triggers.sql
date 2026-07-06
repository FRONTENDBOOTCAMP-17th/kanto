-- 정리: 삭제된 테이블(comments/community_posts/dating_profiles/matches)을 참조하던 함수 수정,
-- 동일 목적으로 중복 실행되던 트리거/함수 정리.
-- 배경: docs/데이터베이스/supabase-db-객체-정리.md 6절 "특이사항" 참고.

-- 1) cleanup_deleted_users(): 20260626020000/20260706120000에서 삭제된
--    community_posts/comments/dating_profiles/matches 참조 제거.
--    (수정 전에는 삭제 대기 유저가 있으면 이 함수가 호출 시 에러로 전체 롤백됐다.)
CREATE OR REPLACE FUNCTION public.cleanup_deleted_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  target RECORD;
BEGIN
  FOR target IN
    SELECT id, auth_id FROM public.users
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
  LOOP
    DELETE FROM public.messages WHERE sender_id = target.id;
    DELETE FROM public.chats WHERE user_id_1 = target.id OR user_id_2 = target.id;
    DELETE FROM public.used_goods WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target.id);
    DELETE FROM public.jobs WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target.id);
    DELETE FROM public.rentals WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target.id);
    DELETE FROM public.common_likes WHERE user_id = target.id;
    DELETE FROM public.common_reports WHERE user_id = target.id;
    DELETE FROM public.posts WHERE user_id = target.id;
    DELETE FROM public.users WHERE id = target.id;
    DELETE FROM auth.users WHERE id = target.auth_id;
  END LOOP;
END;
$function$;

-- 2) get_active_users_count(): 삭제된 comments 테이블을 조회하던 UNION 절 제거.
--    (수정 전에는 관리자 대시보드 "활성 사용자 수" 위젯이 이 함수 호출 시 에러가 났다.)
CREATE OR REPLACE FUNCTION public.get_active_users_count(days integer)
RETURNS TABLE(count bigint)
LANGUAGE sql
AS $function$
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
  ) sub;
$function$;

-- 3) 회원가입 트리거 중복 제거: handle_new_user()/on_auth_user_created 만 남기고
--    신규_유저_처리()/회원가입_트리거 제거 (동일 목적 중복 실행 방지).
DROP TRIGGER IF EXISTS "회원가입_트리거" ON auth.users;
DROP FUNCTION IF EXISTS public."신규_유저_처리"();

-- 4) 신규 게시글 알림 트리거 중복 제거: notify_on_new_post()/trg_notify_on_new_post 만 남기고
--    notify_new_post()/on_new_post 제거 (status 체크가 없는 구버전이라 초안 단계에도 알림이 나갔다).
DROP TRIGGER IF EXISTS on_new_post ON public.posts;
DROP FUNCTION IF EXISTS public.notify_new_post();

-- 5) 어떤 트리거에도 연결되지 않은 미사용 알림 함수 정리 (comments 테이블 삭제로 이미 죽은 코드).
DROP FUNCTION IF EXISTS public.notify_comment();
DROP FUNCTION IF EXISTS public.notify_on_comment();
DROP FUNCTION IF EXISTS public.notify_like();
DROP FUNCTION IF EXISTS public.notify_message();
