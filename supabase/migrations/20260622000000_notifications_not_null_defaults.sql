-- 알림 카운트/정렬/모두읽음 버그의 공통 원인 수정.
-- 관리자 정지/해제 알림 insert 가 created_at, is_read 를 채우지 않아
-- 해당 컬럼이 NULL 로 남았다. 그 결과:
--   * created_at NULL → created_at 정렬이 불안정해 limit 결과/순서가 매번 달라짐
--   * is_read NULL → "모두 읽음"의 .eq("is_read", false) 필터가 NULL 행을 건너뛰어
--                    새로고침 시 미읽음으로 되돌아가고 종 카운트가 0이 되지 않음
-- 기존 NULL 을 정리하고, 기본값/NOT NULL 을 부여해 재발을 막는다.

update public.common_notifications set is_read = false where is_read is null;
update public.common_notifications set created_at = now() where created_at is null;

alter table public.common_notifications alter column is_read    set default false;
alter table public.common_notifications alter column is_read    set not null;
alter table public.common_notifications alter column created_at set default now();
alter table public.common_notifications alter column created_at set not null;
