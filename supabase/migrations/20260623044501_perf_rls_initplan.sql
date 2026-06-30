-- 성능(auth_rls_initplan): auth.uid() 를 (select auth.uid()) 로 감싸 행마다 재평가되지 않게 한다.
-- 결과/보안 의미는 동일(스칼라 1회 평가). ALTER POLICY 라 정책 공백 구간 없음.
-- 배경: docs/작업기록/20260623-performance-audit.md (감사 C 항목)

alter policy "유저: 본인 프로필만 수정 가능" on public.users
  using (auth_id = (select auth.uid()))
  with check ((auth_id = (select auth.uid())) and (role = my_role()));

alter policy "reviews_select_admin" on public.reviews
  using ((select users.role from public.users where users.auth_id = (select auth.uid())) = 'admin'::text);

alter policy "reviews_insert_user" on public.reviews
  with check (reviewer_id = (select users.id from public.users where users.auth_id = (select auth.uid())));

alter policy "reviews_update_admin" on public.reviews
  using ((select users.role from public.users where users.auth_id = (select auth.uid())) = 'admin'::text);
