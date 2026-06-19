-- 알림 읽음 처리(is_read) 영속화 버그 수정.
-- common_notifications 에 사용자용 RLS UPDATE 정책이 없어서, 클라이언트의
-- "모두 읽음"/단건 읽음 UPDATE 가 RLS 에 막혀 에러 없이 0건만 갱신되고
-- 새로고침 시 미읽음으로 되돌아가던 문제를 해결한다.
-- 사용자는 자신(receiver_id = 내 users.id)에게 온 알림만 변경할 수 있다.

alter table public.common_notifications enable row level security;

drop policy if exists "own notifications - update" on public.common_notifications;

create policy "own notifications - update"
on public.common_notifications
for update
to authenticated
using (
  receiver_id in (
    select id from public.users where auth_id = (select auth.uid())
  )
)
with check (
  receiver_id in (
    select id from public.users where auth_id = (select auth.uid())
  )
);
