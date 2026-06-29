-- 채팅 미읽음 카운트(플로팅 위젯 배지 / 목록 굵은 글씨·갯수) 미표시 버그 수정.
-- chats.user_id_1_unread / user_id_2_unread 컬럼에 기본값이 없어, 새 채팅 생성 시
-- 값이 NULL 로 남았다. increment_unread 는 `컬럼 + 1` 로 증가시키는데
-- `NULL + 1 = NULL` 이므로 수신자의 미읽음 카운트가 영원히 증가하지 않았다.
--   * 플로팅 위젯에 숫자가 뜨지 않음
--   * 채팅 목록에서 안 읽은 방의 굵은 글씨/갯수 배지가 보이지 않음
-- 기존 NULL 을 0 으로 정리하고, 기본값/NOT NULL 을 부여해 재발을 막는다.
-- 더해 increment_unread 를 coalesce 로 NULL 안전하게 만든다.

update public.chats set user_id_1_unread = 0 where user_id_1_unread is null;
update public.chats set user_id_2_unread = 0 where user_id_2_unread is null;

alter table public.chats alter column user_id_1_unread set default 0;
alter table public.chats alter column user_id_1_unread set not null;
alter table public.chats alter column user_id_2_unread set default 0;
alter table public.chats alter column user_id_2_unread set not null;

create or replace function public.increment_unread(p_chat_id bigint, p_for_user1 boolean)
returns void
language sql
security definer
as $function$
  update public.chats set
    user_id_1_unread = coalesce(user_id_1_unread, 0) + case when p_for_user1 then 1 else 0 end,
    user_id_2_unread = coalesce(user_id_2_unread, 0) + case when p_for_user1 then 0 else 1 end
  where id = p_chat_id;
$function$;
