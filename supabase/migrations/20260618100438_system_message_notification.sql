-- system 메시지(거래 진행 자동 안내)도 알림을 발송하도록 트리거 함수 교체
-- title을 발신자명("OOO님이 새 메시지를 보냈습니다") 대신 시스템 문구 그대로 사용

create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receiver_id bigint;
  v_receiver_active boolean;
  v_title text;
begin
  select
    case when c.user_id_1 = new.sender_id then c.user_id_2 else c.user_id_1 end,
    case when c.user_id_1 = new.sender_id then coalesce(c.user_id_2_active, false)
         else coalesce(c.user_id_1_active, false) end
    into v_receiver_id, v_receiver_active
  from public.chats c
  where c.id = new.chat_id;

  if v_receiver_id is null or v_receiver_active then
    return new;
  end if;

  if new.type = 'system' then
    v_title := new.content;
  else
    select name || '님이 새 메시지를 보냈습니다'
      into v_title from public.users where id = new.sender_id;
  end if;

  update public.common_notifications
     set body = null,
         title = v_title,
         created_at = now(),
         is_read = false
   where receiver_id = v_receiver_id
     and related_type = 'chat'
     and related_id = new.chat_id
     and is_read = false;

  if not found then
    insert into public.common_notifications
      (receiver_id, type, related_type, related_id, title, body, is_read)
    values
      (v_receiver_id, 'chat', 'chat', new.chat_id, v_title, null, false);
  end if;

  return new;
end;
$$;
