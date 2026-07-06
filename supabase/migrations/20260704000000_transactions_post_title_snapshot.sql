-- 거래 내역에서 게시글이 삭제돼도 제목을 보여주기 위해 reviews와 동일하게 post_title 스냅샷 추가.
-- 기존 transactions_post_id_fkey(NO ACTION)는 거래가 걸린 글의 하드 삭제(cleanup 크론)를 영구적으로 막고 있었는데,
-- 이제 제목을 스냅샷으로 보존하므로 SET NULL로 바꿔 30일 후 정상적으로 삭제되게 한다.

alter table public.transactions add column post_title text;

update public.transactions t
set post_title = p.title
from public.posts p
where t.post_id = p.id;

alter table public.transactions alter column post_id drop not null;

alter table public.transactions drop constraint transactions_post_id_fkey,
  add constraint transactions_post_id_fkey foreign key (post_id) references public.posts(id) on delete set null;
