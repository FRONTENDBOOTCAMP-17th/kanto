-- 목적(20차 리뷰 [제안] 3): 20260706000000_public_profiles_and_lock_users.sql 이 세운
--   public_profiles 뷰는 security_invoker=on 이라, anon 이 조회할 때 users 원본의
--   anon SELECT 정책(비삭제 행 공개)을 따른다. 그런데 그 RLS enable 구문과 anon SELECT
--   정책이 어느 마이그레이션에도 없고 Supabase 프로젝트 베이스라인에만 있어,
--   완전 백지 상태에서 `supabase db reset` 하면 뷰가 0행을 돌려줘 목록·채팅이 깨질 수 있다.
--   이 마이그레이션으로 "reset 한 방으로 세워진다"를 굳힌다.
--
-- 안전성:
--   - `enable row level security` 는 이미 켜져 있으면 no-op 이라 라이브에 영향 없음.
--   - 정책은 `drop policy if exists` 로 가드해 멱등하며, 조건은 20260706 파일이 전제한
--     "anon 은 비삭제 행의 공개 컬럼만"(deleted_at is null)과 동일 의미다.
--     여러 permissive 정책은 OR 로 합쳐지므로, 베이스라인에 다른 이름의 동일 정책이
--     이미 있어도 접근 범위를 넓히지 않는다.
--
-- ⚠️ 검증 주의: 이 세션에는 Docker(로컬 Supabase) 가 없어 `supabase db reset` 실측을
--    하지 못했다. 머지 전 로컬에서 아래를 실측할 것.
--      supabase db reset
--      curl "$URL/rest/v1/public_profiles?select=id,name&limit=3" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"   -- 이름이 나와야 정상
--      curl "$URL/rest/v1/users?select=email,phone"              -H "apikey: $ANON" -H "Authorization: Bearer $ANON"   -- []가 나와야 정상(PII 차단)

alter table public.users enable row level security;

drop policy if exists "anon 공개행 조회" on public.users;
create policy "anon 공개행 조회" on public.users
  for select to anon
  using (deleted_at is null);
