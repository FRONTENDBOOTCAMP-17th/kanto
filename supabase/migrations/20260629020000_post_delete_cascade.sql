-- 본인 게시글 삭제 시 409(외래키 위반) 해결.
-- posts 를 참조하는 자식 테이블 중 used_goods/meetups 만 ON DELETE CASCADE 였고
-- jobs/rentals/community_posts/comments/chats/messages 는 NO ACTION 이라
-- 해당 자식 행이 있으면 게시글 삭제가 차단됐다(특히 구인/임대 글).
--
-- 결제/후기 기록 보존을 위해 transactions/reviews 는 건드리지 않는다.
-- (= 에스크로 거래가 있는 글은 의도적으로 삭제 차단 유지. 구인/임대는 거래가 없음)
-- chats 를 지울 때 그 안의 messages 도 함께 지워지도록 messages.chat_id 도 CASCADE.

alter table public.jobs drop constraint jobs_post_id_fkey,
  add constraint jobs_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade;

alter table public.rentals drop constraint rentals_post_id_fkey,
  add constraint rentals_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade;

alter table public.community_posts drop constraint community_posts_post_id_fkey,
  add constraint community_posts_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade;

alter table public.comments drop constraint comments_post_id_fkey,
  add constraint comments_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade;

alter table public.chats drop constraint chats_post_id_fkey,
  add constraint chats_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade;

alter table public.messages drop constraint messages_post_id_fkey,
  add constraint messages_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade;

alter table public.messages drop constraint messages_chat_id_fkey,
  add constraint messages_chat_id_fkey foreign key (chat_id) references public.chats(id) on delete cascade;
