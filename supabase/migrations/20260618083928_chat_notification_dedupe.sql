-- 채팅 알림 중복/누적 버그 수정
-- 1) 열람중(presence) 플래그 컬럼 추가
-- 2) presence 토글 RPC
-- 3) 메시지 INSERT 트리거를 dedupe(채팅당 1개) + presence 기반 미기록으로 교체

-- 1. presence 플래그 컬럼
alter table public.chats
  add column if not exists user_id_1_active boolean not null default false,
  add column if not exists user_id_2_active boolean not null default false;

-- 2. presence 토글 RPC (RLS 우회 없이 본인 슬롯만 갱신)
create or replace function public.set_chat_active(
  p_chat_id bigint, p_user_id bigint, p_active boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chats set user_id_1_active = p_active
    where id = p_chat_id and user_id_1 = p_user_id;
  update public.chats set user_id_2_active = p_active
    where id = p_chat_id and user_id_2 = p_user_id;
end;
$$;

-- 3. 알림 트리거 교체
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receiver_id bigint;
  v_receiver_active boolean;
  v_sender_name text;
begin
  if new.type = 'system' then
    return new;
  end if;

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

  select name into v_sender_name from public.users where id = new.sender_id;

  update public.common_notifications
     set body = null,
         title = v_sender_name || '님이 새 메시지를 보냈습니다',
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
      (v_receiver_id, 'chat', 'chat', new.chat_id,
       v_sender_name || '님이 새 메시지를 보냈습니다', null, false);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_on_new_message on public.messages;

create trigger trg_notify_on_new_message
  after insert on public.messages
  for each row execute function public.notify_on_new_message();

-- 옛 트리거/함수 제거 — 위 트리거로 완전히 대체됨 (presence 미체크로 중복 알림 유발)
drop trigger if exists trg_notify_message on public.messages;
drop function if exists public.notify_on_message();
