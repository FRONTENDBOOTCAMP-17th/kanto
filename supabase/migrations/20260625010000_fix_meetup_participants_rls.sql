-- meetup_participants 참여/취소 정책을 auth.uid() 기반 직접 매핑으로 보강한다.
-- 일부 환경에서 my_user_id()가 null을 반환하면 본인 참여도 42501로 막히는 문제가 있어,
-- 서버 액션과 동일한 public.users.auth_id -> users.id 관계를 정책에 명시한다.
DROP POLICY IF EXISTS "meetup_participants - insert" ON meetup_participants;
DROP POLICY IF EXISTS "meetup_participants - update" ON meetup_participants;

CREATE POLICY "meetup_participants - insert" ON meetup_participants
  FOR INSERT WITH CHECK (
    user_id = (
      SELECT u.id
      FROM public.users u
      WHERE u.auth_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "meetup_participants - update" ON meetup_participants
  FOR UPDATE USING (
    user_id = (
      SELECT u.id
      FROM public.users u
      WHERE u.auth_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (
      SELECT u.id
      FROM public.users u
      WHERE u.auth_id = (SELECT auth.uid())
    )
  );
