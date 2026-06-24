-- meetup_participants.meetup_post_id가 posts(id)를 참조해서 PostgREST가
-- meetups <-> meetup_participants 관계를 찾지 못하던 문제 수정.
-- meetups(post_id)를 직접 참조하도록 FK를 교체 (데이터 무결성은 동일 — meetups.post_id는 posts.id의 PK/FK).

ALTER TABLE meetup_participants
  DROP CONSTRAINT meetup_participants_meetup_post_id_fkey;

ALTER TABLE meetup_participants
  ADD CONSTRAINT meetup_participants_meetup_post_id_fkey
  FOREIGN KEY (meetup_post_id) REFERENCES meetups(post_id) ON DELETE CASCADE;
