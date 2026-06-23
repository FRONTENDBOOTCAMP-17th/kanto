-- 성능: 핫패스 조인/필터 FK 커버링 인덱스 + 목록 정렬 복합 인덱스 + 제목 트라이그램.
-- 모두 추가형(additive). 채팅 테이블(chats/messages)은 담당자 작업과 겹쳐 제외.
-- 배경: docs/작업기록/20260623-performance-audit.md (감사 C 항목)

-- 마켓플레이스 조인 FK (posts ↔ 상세 테이블)
create index if not exists idx_used_goods_post on public.used_goods (post_id);
create index if not exists idx_jobs_post on public.jobs (post_id);
create index if not exists idx_rentals_post on public.rentals (post_id);

-- posts FK / 목록 정렬
create index if not exists idx_posts_user on public.posts (user_id);
create index if not exists idx_posts_handled_by on public.posts (handled_by);
create index if not exists idx_posts_type_status_created on public.posts (post_type, status, created_at desc);

-- 좋아요 존재 확인 / 목록
create index if not exists idx_common_likes_user on public.common_likes (user_id);
create index if not exists idx_common_likes_target on public.common_likes (target_id, target_type);

-- 신고 존재 확인 / 집계 / FK
create index if not exists idx_common_reports_user on public.common_reports (user_id);
create index if not exists idx_common_reports_target on public.common_reports (target_id, target_type);
create index if not exists idx_common_reports_handled_by on public.common_reports (handled_by);

-- 제재 (admin 집계 조인)
create index if not exists idx_user_sanctions_user on public.user_sanctions (user_id);
create index if not exists idx_user_sanctions_admin on public.user_sanctions (admin_id);

-- 댓글 / 커뮤니티 FK
create index if not exists idx_comments_post on public.comments (post_id);
create index if not exists idx_comments_user on public.comments (user_id);
create index if not exists idx_community_posts_post on public.community_posts (post_id);

-- 제목 부분검색(ilike '%검색%') 트라이그램 인덱스
create extension if not exists pg_trgm;
create index if not exists idx_posts_title_trgm on public.posts using gin (title gin_trgm_ops);
